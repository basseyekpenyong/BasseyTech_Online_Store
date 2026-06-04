package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/basseyekpenyong/chiba-tech/api/internal/middleware"
	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OrderHandler struct {
	db *pgxpool.Pool
}

func NewOrderHandler(db *pgxpool.Pool) *OrderHandler {
	return &OrderHandler{db: db}
}

type createOrderRequest struct {
	AddressID     string `json:"address_id"`
	PaymentMethod string `json:"payment_method"`
	Notes         string `json:"notes"`
}

type orderRow struct {
	ID            string      `json:"id"`
	Status        string      `json:"status"`
	PaymentMethod string      `json:"payment_method"`
	PaymentStatus string      `json:"payment_status"`
	Subtotal      float64     `json:"subtotal"`
	ShippingFee   float64     `json:"shipping_fee"`
	Total         float64     `json:"total"`
	Notes         *string     `json:"notes"`
	CreatedAt     time.Time   `json:"created_at"`
	Items         []orderItem `json:"items,omitempty"`
}

type orderItem struct {
	ID          string  `json:"id"`
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	UnitPrice   float64 `json:"unit_price"`
	Quantity    int     `json:"quantity"`
}

func (h *OrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	var req createOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.AddressID == "" {
		models.WriteError(w, http.StatusBadRequest, "address_id required")
		return
	}
	if req.PaymentMethod != "stripe" && req.PaymentMethod != "paypal" && req.PaymentMethod != "cod" {
		models.WriteError(w, http.StatusBadRequest, "payment_method must be stripe, paypal, or cod")
		return
	}

	// Load cart
	rows, err := h.db.Query(r.Context(), `
		SELECT ci.product_id, p.name, p.price::float8, p.stock_qty, ci.quantity
		FROM cart_items ci
		JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = $1`, userID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()

	type cartLine struct {
		ProductID   string
		ProductName string
		Price       float64
		Stock       int
		Qty         int
	}
	var lines []cartLine
	for rows.Next() {
		var l cartLine
		if rows.Scan(&l.ProductID, &l.ProductName, &l.Price, &l.Stock, &l.Qty) == nil {
			lines = append(lines, l)
		}
	}
	if len(lines) == 0 {
		models.WriteError(w, http.StatusBadRequest, "cart is empty")
		return
	}

	// Validate stock
	for _, l := range lines {
		if l.Stock < l.Qty {
			models.WriteError(w, http.StatusBadRequest, "insufficient stock for: "+l.ProductName)
			return
		}
	}

	var subtotal float64
	for _, l := range lines {
		subtotal += l.Price * float64(l.Qty)
	}
	shippingFee := 0.0
	if subtotal < 100 {
		shippingFee = 9.99
	}
	total := subtotal + shippingFee

	// Transactional: create order + items + deduct stock + clear cart
	tx, err := h.db.BeginTx(r.Context(), pgx.TxOptions{})
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer tx.Rollback(r.Context())

	var orderID string
	err = tx.QueryRow(r.Context(), `
		INSERT INTO orders (user_id, address_id, payment_method, subtotal, shipping_fee, total, notes)
		VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''))
		RETURNING id`,
		userID, req.AddressID, req.PaymentMethod, subtotal, shippingFee, total, req.Notes,
	).Scan(&orderID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}

	for _, l := range lines {
		tx.Exec(r.Context(), `
			INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
			VALUES ($1, $2, $3, $4, $5)`,
			orderID, l.ProductID, l.ProductName, l.Price, l.Qty)
		tx.Exec(r.Context(),
			`UPDATE products SET stock_qty = stock_qty - $1 WHERE id = $2`, l.Qty, l.ProductID)
	}
	tx.Exec(r.Context(), `DELETE FROM cart_items WHERE user_id = $1`, userID)

	if err := tx.Commit(r.Context()); err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}

	models.WriteJSON(w, http.StatusCreated, map[string]any{
		"order_id": orderID,
		"total":    total,
		"message":  "order created",
	})
}

func (h *OrderHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	rows, err := h.db.Query(r.Context(), `
		SELECT id, status, payment_method, payment_status,
		       subtotal::float8, shipping_fee::float8, total::float8, notes, created_at
		FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	orders := []orderRow{}
	for rows.Next() {
		var o orderRow
		if rows.Scan(&o.ID, &o.Status, &o.PaymentMethod, &o.PaymentStatus,
			&o.Subtotal, &o.ShippingFee, &o.Total, &o.Notes, &o.CreatedAt) == nil {
			orders = append(orders, o)
		}
	}
	models.WriteJSON(w, http.StatusOK, orders)
}

func (h *OrderHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	orderID := chi.URLParam(r, "id")

	var o orderRow
	err := h.db.QueryRow(r.Context(), `
		SELECT id, status, payment_method, payment_status,
		       subtotal::float8, shipping_fee::float8, total::float8, notes, created_at
		FROM orders WHERE id = $1 AND user_id = $2`, orderID, userID,
	).Scan(&o.ID, &o.Status, &o.PaymentMethod, &o.PaymentStatus,
		&o.Subtotal, &o.ShippingFee, &o.Total, &o.Notes, &o.CreatedAt)
	if err != nil {
		models.WriteError(w, http.StatusNotFound, "order not found")
		return
	}

	itemRows, _ := h.db.Query(r.Context(),
		`SELECT id, product_id, product_name, unit_price::float8, quantity
		 FROM order_items WHERE order_id = $1`, orderID)
	defer itemRows.Close()
	o.Items = []orderItem{}
	for itemRows.Next() {
		var i orderItem
		if itemRows.Scan(&i.ID, &i.ProductID, &i.ProductName, &i.UnitPrice, &i.Quantity) == nil {
			o.Items = append(o.Items, i)
		}
	}
	models.WriteJSON(w, http.StatusOK, o)
}
