package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/basseyekpenyong/chiba-tech/api/internal/middleware"
	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CartHandler struct {
	db *pgxpool.Pool
}

func NewCartHandler(db *pgxpool.Pool) *CartHandler {
	return &CartHandler{db: db}
}

type cartItemRow struct {
	ID          string    `json:"id"`
	ProductID   string    `json:"product_id"`
	ProductName string    `json:"product_name"`
	ProductSlug string    `json:"product_slug"`
	Price       float64   `json:"price"`
	ImageURL    *string   `json:"image_url"`
	Quantity    int       `json:"quantity"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (h *CartHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	rows, err := h.db.Query(r.Context(), `
		SELECT ci.id, ci.product_id, p.name, p.slug, p.price::float8,
		       (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
		       ci.quantity, ci.updated_at
		FROM cart_items ci
		JOIN products p ON p.id = ci.product_id
		WHERE ci.user_id = $1
		ORDER BY ci.created_at ASC`, userID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	items := []cartItemRow{}
	for rows.Next() {
		var item cartItemRow
		if rows.Scan(&item.ID, &item.ProductID, &item.ProductName, &item.ProductSlug,
			&item.Price, &item.ImageURL, &item.Quantity, &item.UpdatedAt) == nil {
			items = append(items, item)
		}
	}
	models.WriteJSON(w, http.StatusOK, items)
}

func (h *CartHandler) AddItem(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	var body struct {
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.ProductID == "" {
		models.WriteError(w, http.StatusBadRequest, "product_id required")
		return
	}
	if body.Quantity < 1 {
		body.Quantity = 1
	}

	// Verify product exists and has stock
	var stock int
	if err := h.db.QueryRow(r.Context(),
		`SELECT stock_qty FROM products WHERE id = $1 AND is_active = true`, body.ProductID,
	).Scan(&stock); err != nil {
		models.WriteError(w, http.StatusNotFound, "product not found")
		return
	}
	if stock < body.Quantity {
		models.WriteError(w, http.StatusBadRequest, "insufficient stock")
		return
	}

	// Upsert cart item
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO cart_items (user_id, product_id, quantity)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, product_id)
		DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = now()`,
		userID, body.ProductID, body.Quantity)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "item added to cart"})
}

func (h *CartHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	itemID := chi.URLParam(r, "id")
	var body struct {
		Quantity int `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Quantity < 1 {
		models.WriteError(w, http.StatusBadRequest, "quantity must be >= 1")
		return
	}
	tag, err := h.db.Exec(r.Context(),
		`UPDATE cart_items SET quantity = $1, updated_at = now()
		 WHERE id = $2 AND user_id = $3`, body.Quantity, itemID, userID)
	if err != nil || tag.RowsAffected() == 0 {
		models.WriteError(w, http.StatusNotFound, "cart item not found")
		return
	}
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "cart item updated"})
}

func (h *CartHandler) RemoveItem(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	itemID := chi.URLParam(r, "id")
	h.db.Exec(r.Context(),
		`DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, itemID, userID)
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "item removed"})
}

func (h *CartHandler) Clear(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	h.db.Exec(r.Context(), `DELETE FROM cart_items WHERE user_id = $1`, userID)
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "cart cleared"})
}
