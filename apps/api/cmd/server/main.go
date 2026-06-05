package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/basseyekpenyong/chiba-tech/api/internal/config"
	"github.com/basseyekpenyong/chiba-tech/api/internal/database"
	"github.com/basseyekpenyong/chiba-tech/api/internal/handlers"
	appMiddleware "github.com/basseyekpenyong/chiba-tech/api/internal/middleware"
	"github.com/basseyekpenyong/chiba-tech/api/pkg/auth"
	"github.com/basseyekpenyong/chiba-tech/api/pkg/payment"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("connected to database")

	jwtManager := auth.NewManager(cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)
	stripeProvider := payment.NewStripeProvider(cfg.StripeSecretKey)
	paypalProvider := payment.NewPayPalProvider(cfg.PayPalClientID, cfg.PayPalClientSecret, cfg.PayPalBaseURL)

	// Handlers
	authH := handlers.NewAuthHandler(pool, jwtManager)
	productH := handlers.NewProductHandler(pool)
	categoryH := handlers.NewCategoryHandler(pool)
	cartH := handlers.NewCartHandler(pool)
	orderH := handlers.NewOrderHandler(pool)
	paymentH := handlers.NewPaymentHandler(pool, stripeProvider, paypalProvider, cfg.StripeWebhookSecret)
	serviceH := handlers.NewServiceHandler(pool)
	appointmentH := handlers.NewAppointmentHandler(pool)
	adminH := handlers.NewAdminHandler(pool)
	addressH := handlers.NewAddressHandler(pool)
	chatH := handlers.NewChatHandler(cfg.AnthropicAPIKey)
	uploadH := handlers.NewUploadHandler(pool, "./uploads", "http://localhost:8080")

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(appMiddleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.AllowedOrigins},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// Serve uploaded product images
	r.Handle("/uploads/*", http.StripPrefix("/uploads", http.FileServer(http.Dir("./uploads"))))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"status":"ok"}`)
	})

	r.Route("/api", func(r chi.Router) {
		// Auth
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authH.Register)
			r.Post("/login", authH.Login)
			r.Post("/refresh", authH.Refresh)
			r.With(appMiddleware.Authenticate(jwtManager)).Get("/me", authH.Me)
		})

		// Public
		r.Get("/categories", categoryH.List)
		r.Get("/products", productH.List)
		r.Get("/products/{slug}", productH.Get)
		r.Get("/services", serviceH.List)

		// AI chat -- public, no auth required
		r.Post("/chat", chatH.Chat)

		// Stripe webhook (no auth — verified by signature)
		r.Post("/payments/stripe/webhook", paymentH.StripeWebhook)

		// Authenticated customer routes
		r.Group(func(r chi.Router) {
			r.Use(appMiddleware.Authenticate(jwtManager))

			// Cart
			r.Get("/cart", cartH.Get)
			r.Post("/cart/items", cartH.AddItem)
			r.Put("/cart/items/{id}", cartH.UpdateItem)
			r.Delete("/cart/items/{id}", cartH.RemoveItem)
			r.Delete("/cart", cartH.Clear)

			// Orders
			r.Post("/orders", orderH.Create)
			r.Get("/orders", orderH.List)
			r.Get("/orders/{id}", orderH.Get)

			// Payments
			r.Post("/payments/stripe/intent", paymentH.StripeIntent)
			r.Post("/payments/paypal/order", paymentH.PayPalOrder)
			r.Post("/payments/paypal/capture/{paypal_order_id}", paymentH.PayPalCapture)

			// Addresses
			r.Get("/addresses", addressH.List)
			r.Post("/addresses", addressH.Create)

			// Appointments
			r.Post("/appointments", appointmentH.Create)
			r.Get("/appointments", appointmentH.List)
			r.Get("/appointments/{id}", appointmentH.Get)
			r.Put("/appointments/{id}/cancel", appointmentH.Cancel)
		})

		// Admin routes
		r.Group(func(r chi.Router) {
			r.Use(appMiddleware.Authenticate(jwtManager))
			r.Use(appMiddleware.RequireAdmin)

			r.Get("/admin/dashboard/stats", adminH.Stats)

			r.Get("/admin/orders", adminH.ListOrders)
			r.Put("/admin/orders/{id}", adminH.UpdateOrder)

			r.Get("/admin/products", adminH.ListProducts)
			r.Post("/admin/products", adminH.CreateProduct)
			r.Put("/admin/products/{id}", adminH.UpdateProduct)
			r.Delete("/admin/products/{id}", adminH.DeleteProduct)

			r.Get("/admin/categories", categoryH.List)

			r.Get("/admin/appointments", adminH.ListAppointments)
			r.Put("/admin/appointments/{id}", adminH.UpdateAppointment)

			r.Get("/admin/services", serviceH.List)
			r.Post("/admin/services", adminH.CreateService)
			r.Put("/admin/services/{id}", adminH.UpdateService)
			r.Delete("/admin/services/{id}", adminH.DeleteService)

			r.Get("/admin/users", adminH.ListUsers)

						// Product image management
						r.Get("/admin/products/{id}/images", uploadH.ListImages)
						r.Post("/admin/products/{id}/images", uploadH.UploadImage)
						r.Delete("/admin/products/{id}/images/{image_id}", uploadH.DeleteImage)
						r.Put("/admin/products/{id}/images/{image_id}/primary", uploadH.SetPrimary)
		})
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		slog.Info("server starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-quit
	slog.Info("shutting down...")
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutCancel()
	srv.Shutdown(shutCtx)
}
