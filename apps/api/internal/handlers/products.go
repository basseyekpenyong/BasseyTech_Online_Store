package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductHandler struct {
	db *pgxpool.Pool
}

func NewProductHandler(db *pgxpool.Pool) *ProductHandler {
	return &ProductHandler{db: db}
}

type productRow struct {
	ID           string          `json:"id"`
	CategoryID   string          `json:"category_id"`
	CategoryName string          `json:"category_name"`
	Name         string          `json:"name"`
	Slug         string          `json:"slug"`
	Description  *string         `json:"description"`
	Price        float64         `json:"price"`
	ComparePrice *float64        `json:"compare_price"`
	StockQty     int             `json:"stock_qty"`
	SKU          *string         `json:"sku"`
	Specs        json.RawMessage `json:"specs"`
	IsActive     bool            `json:"is_active"`
	CreatedAt    time.Time       `json:"created_at"`
	Images       []productImage  `json:"images"`
}

type productImage struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	IsPrimary bool   `json:"is_primary"`
	SortOrder int    `json:"sort_order"`
}

func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	category := q.Get("category")
	search := q.Get("search")
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := `
		SELECT p.id, p.category_id, c.name, p.name, p.slug, p.description,
		       p.price::float8, p.compare_price::float8, p.stock_qty, p.sku,
		       p.specs, p.is_active, p.created_at
		FROM products p
		JOIN categories c ON c.id = p.category_id
		WHERE p.is_active = true
		  AND ($1::text = '' OR c.slug = $1)
		  AND ($2::text = '' OR p.name ILIKE '%' || $2 || '%')
		ORDER BY p.created_at DESC
		LIMIT $3 OFFSET $4`

	rows, err := h.db.Query(r.Context(), query, category, search, limit, offset)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()

	products := []productRow{}
	for rows.Next() {
		var p productRow
		if err := rows.Scan(&p.ID, &p.CategoryID, &p.CategoryName, &p.Name, &p.Slug,
			&p.Description, &p.Price, &p.ComparePrice, &p.StockQty, &p.SKU,
			&p.Specs, &p.IsActive, &p.CreatedAt); err != nil {
			continue
		}
		p.Images = h.imagesFor(r, p.ID)
		products = append(products, p)
	}

	models.WriteJSON(w, http.StatusOK, map[string]any{
		"data": products,
		"meta": map[string]any{"page": page, "limit": limit},
	})
}

func (h *ProductHandler) Get(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	var p productRow
	err := h.db.QueryRow(r.Context(), `
		SELECT p.id, p.category_id, c.name, p.name, p.slug, p.description,
		       p.price::float8, p.compare_price::float8, p.stock_qty, p.sku,
		       p.specs, p.is_active, p.created_at
		FROM products p
		JOIN categories c ON c.id = p.category_id
		WHERE p.slug = $1 AND p.is_active = true`, slug,
	).Scan(&p.ID, &p.CategoryID, &p.CategoryName, &p.Name, &p.Slug,
		&p.Description, &p.Price, &p.ComparePrice, &p.StockQty, &p.SKU,
		&p.Specs, &p.IsActive, &p.CreatedAt)
	if err != nil {
		models.WriteError(w, http.StatusNotFound, "product not found")
		return
	}
	p.Images = h.imagesFor(r, p.ID)
	models.WriteJSON(w, http.StatusOK, p)
}

func (h *ProductHandler) imagesFor(r *http.Request, productID string) []productImage {
	rows, err := h.db.Query(r.Context(),
		`SELECT id, url, is_primary, sort_order FROM product_images
		 WHERE product_id = $1 ORDER BY is_primary DESC, sort_order ASC`, productID)
	if err != nil {
		return []productImage{}
	}
	defer rows.Close()
	imgs := []productImage{}
	for rows.Next() {
		var img productImage
		if rows.Scan(&img.ID, &img.URL, &img.IsPrimary, &img.SortOrder) == nil {
			imgs = append(imgs, img)
		}
	}
	return imgs
}

// CategoryHandler

type CategoryHandler struct {
	db *pgxpool.Pool
}

func NewCategoryHandler(db *pgxpool.Pool) *CategoryHandler {
	return &CategoryHandler{db: db}
}

type categoryRow struct {
	ID          string   `json:"id"`
	ParentID    *string  `json:"parent_id"`
	Name        string   `json:"name"`
	Slug        string   `json:"slug"`
	Description *string  `json:"description"`
	ImageURL    *string  `json:"image_url"`
	SortOrder   int      `json:"sort_order"`
}

func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(),
		`SELECT id, parent_id, name, slug, description, image_url, sort_order
		 FROM categories ORDER BY sort_order ASC, name ASC`)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	cats := []categoryRow{}
	for rows.Next() {
		var c categoryRow
		if rows.Scan(&c.ID, &c.ParentID, &c.Name, &c.Slug, &c.Description, &c.ImageURL, &c.SortOrder) == nil {
			cats = append(cats, c)
		}
	}
	models.WriteJSON(w, http.StatusOK, cats)
}
