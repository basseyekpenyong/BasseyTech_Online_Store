package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/basseyekpenyong/chiba-tech/api/internal/middleware"
	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
	"github.com/basseyekpenyong/chiba-tech/api/pkg/payment"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/webhook"
)

type PaymentHandler struct {
	db             *pgxpool.Pool
	stripeProvider *payment.StripeProvider
	paypalProvider *payment.PayPalProvider
	webhookSecret  string
}

func NewPaymentHandler(db *pgxpool.Pool, stripe *payment.StripeProvider, paypal *payment.PayPalProvider, webhookSecret string) *PaymentHandler {
	return &PaymentHandler{db: db, stripeProvider: stripe, paypalProvider: paypal, webhookSecret: webhookSecret}
}

// Stripe: create PaymentIntent
func (h *PaymentHandler) StripeIntent(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	var body struct {
		OrderID string `json:"order_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.OrderID == "" {
		models.WriteError(w, http.StatusBadRequest, "order_id required")
		return
	}

	var total float64
	var payMethod string
	err := h.db.QueryRow(r.Context(),
		`SELECT total::float8, payment_method FROM orders WHERE id = $1 AND user_id = $2`,
		body.OrderID, userID,
	).Scan(&total, &payMethod)
	if err != nil {
		models.WriteError(w, http.StatusNotFound, "order not found")
		return
	}
	if payMethod != "stripe" {
		models.WriteError(w, http.StatusBadRequest, "order payment method is not stripe")
		return
	}

	clientSecret, err := h.stripeProvider.CreateIntent(int64(total*100), "usd", body.OrderID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "failed to create payment intent")
		return
	}
	models.WriteJSON(w, http.StatusOK, map[string]string{"client_secret": clientSecret})
}

// Stripe: webhook to confirm payment
func (h *PaymentHandler) StripeWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		models.WriteError(w, http.StatusBadRequest, "bad request")
		return
	}
	event, err := webhook.ConstructEvent(body, r.Header.Get("Stripe-Signature"), h.webhookSecret)
	if err != nil {
		models.WriteError(w, http.StatusBadRequest, "invalid signature")
		return
	}

	if event.Type == "payment_intent.succeeded" {
		var pi stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &pi); err == nil {
			orderID := pi.Metadata["order_id"]
			h.db.Exec(r.Context(),
				`UPDATE orders SET payment_status = 'paid', payment_ref = $1, status = 'confirmed', updated_at = now()
				 WHERE id = $2`, pi.ID, orderID)
		}
	}
	w.WriteHeader(http.StatusOK)
}

// PayPal: create order
func (h *PaymentHandler) PayPalOrder(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	var body struct {
		OrderID string `json:"order_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.OrderID == "" {
		models.WriteError(w, http.StatusBadRequest, "order_id required")
		return
	}

	var total float64
	err := h.db.QueryRow(r.Context(),
		`SELECT total::float8 FROM orders WHERE id = $1 AND user_id = $2 AND payment_method = 'paypal'`,
		body.OrderID, userID,
	).Scan(&total)
	if err != nil {
		models.WriteError(w, http.StatusNotFound, "order not found")
		return
	}

	paypalOrderID, approveURL, err := h.paypalProvider.CreateOrder(r.Context(), total, "USD", body.OrderID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "failed to create paypal order")
		return
	}
	models.WriteJSON(w, http.StatusOK, map[string]string{
		"paypal_order_id": paypalOrderID,
		"approve_url":     approveURL,
	})
}

// PayPal: capture approved payment
func (h *PaymentHandler) PayPalCapture(w http.ResponseWriter, r *http.Request) {
	paypalOrderID := chi.URLParam(r, "paypal_order_id")

	captureID, err := h.paypalProvider.CaptureOrder(r.Context(), paypalOrderID)
	if err != nil {
		models.WriteError(w, http.StatusBadRequest, fmt.Sprintf("paypal capture failed: %s", err))
		return
	}

	// Find the order by payment_ref or metadata (stored when creating paypal order)
	h.db.Exec(r.Context(),
		`UPDATE orders SET payment_status = 'paid', payment_ref = $1, status = 'confirmed', updated_at = now()
		 WHERE payment_ref = $2`, captureID, paypalOrderID)

	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "payment captured"})
}
