package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/basseyekpenyong/chiba-tech/api/internal/middleware"
	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AddressHandler struct {
	db *pgxpool.Pool
}

func NewAddressHandler(db *pgxpool.Pool) *AddressHandler {
	return &AddressHandler{db: db}
}

func (h *AddressHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	var body struct {
		Street     string `json:"street"`
		City       string `json:"city"`
		State      string `json:"state"`
		Country    string `json:"country"`
		ZipCode    string `json:"zip_code"`
		IsDefault  bool   `json:"is_default"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Street == "" || body.City == "" || body.Country == "" {
		models.WriteError(w, http.StatusBadRequest, "street, city, and country are required")
		return
	}

	// Clear existing default if needed
	if body.IsDefault {
		h.db.Exec(r.Context(), `UPDATE addresses SET is_default = false WHERE user_id = $1`, userID)
	}

	var id string
	err := h.db.QueryRow(r.Context(), `
		INSERT INTO addresses (user_id, street, city, state, country, zip_code, is_default)
		VALUES ($1, $2, $3, NULLIF($4,''), $5, NULLIF($6,''), $7)
		RETURNING id`,
		userID, body.Street, body.City, body.State, body.Country, body.ZipCode, body.IsDefault,
	).Scan(&id)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	models.WriteJSON(w, http.StatusCreated, map[string]string{"id": id})
}

func (h *AddressHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	rows, err := h.db.Query(r.Context(),
		`SELECT id, street, city, state, country, zip_code, is_default FROM addresses WHERE user_id = $1 ORDER BY is_default DESC`, userID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	type row struct {
		ID        string  `json:"id"`
		Street    string  `json:"street"`
		City      string  `json:"city"`
		State     *string `json:"state"`
		Country   string  `json:"country"`
		ZipCode   *string `json:"zip_code"`
		IsDefault bool    `json:"is_default"`
	}
	addrs := []row{}
	for rows.Next() {
		var a row
		if rows.Scan(&a.ID, &a.Street, &a.City, &a.State, &a.Country, &a.ZipCode, &a.IsDefault) == nil {
			addrs = append(addrs, a)
		}
	}
	models.WriteJSON(w, http.StatusOK, addrs)
}
