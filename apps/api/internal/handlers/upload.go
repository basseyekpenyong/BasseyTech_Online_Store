package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UploadHandler struct {
	db        *pgxpool.Pool
	uploadDir string
	baseURL   string
}

func NewUploadHandler(db *pgxpool.Pool, uploadDir, baseURL string) *UploadHandler {
	os.MkdirAll(uploadDir, 0755)
	return &UploadHandler{db: db, uploadDir: uploadDir, baseURL: baseURL}
}

// POST /api/admin/products/{id}/images
func (h *UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	productID := chi.URLParam(r, "id")

	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		models.WriteError(w, http.StatusBadRequest, "file too large (max 10 MB)")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		models.WriteError(w, http.StatusBadRequest, "image field required")
		return
	}
	defer file.Close()

	// Validate content type
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]string{".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
	if _, ok := allowed[ext]; !ok {
		models.WriteError(w, http.StatusBadRequest, "only jpg, png, webp images are allowed")
		return
	}

	filename := uuid.New().String() + ext
	dst := filepath.Join(h.uploadDir, filename)

	out, err := os.Create(dst)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "failed to save image")
		return
	}
	defer out.Close()
	if _, err = io.Copy(out, file); err != nil {
		models.WriteError(w, http.StatusInternalServerError, "failed to write image")
		return
	}

	url := fmt.Sprintf("%s/uploads/%s", h.baseURL, filename)

	// Check if this is the first image → make it primary
	var count int
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM product_images WHERE product_id = $1`, productID).Scan(&count)
	isPrimary := count == 0

	var imageID string
	err = h.db.QueryRow(r.Context(),
		`INSERT INTO product_images (product_id, url, is_primary, sort_order)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		productID, url, isPrimary, count+1,
	).Scan(&imageID)
	if err != nil {
		os.Remove(dst)
		models.WriteError(w, http.StatusInternalServerError, "failed to save image record")
		return
	}

	models.WriteJSON(w, http.StatusCreated, map[string]any{
		"id": imageID, "url": url, "is_primary": isPrimary,
	})
}

// DELETE /api/admin/products/{id}/images/{image_id}
func (h *UploadHandler) DeleteImage(w http.ResponseWriter, r *http.Request) {
	imageID := chi.URLParam(r, "image_id")

	var url string
	var isPrimary bool
	var productID string
	err := h.db.QueryRow(r.Context(),
		`DELETE FROM product_images WHERE id = $1 RETURNING url, is_primary, product_id`, imageID,
	).Scan(&url, &isPrimary, &productID)
	if err != nil {
		models.WriteError(w, http.StatusNotFound, "image not found")
		return
	}

	// Delete file if it was uploaded locally
	if strings.Contains(url, "/uploads/") {
		filename := filepath.Base(url)
		os.Remove(filepath.Join(h.uploadDir, filename))
	}

	// If deleted image was primary, promote the next one
	if isPrimary {
		h.db.Exec(r.Context(),
			`UPDATE product_images SET is_primary = true
			 WHERE id = (SELECT id FROM product_images WHERE product_id = $1 ORDER BY sort_order LIMIT 1)`,
			productID)
	}

	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "image deleted"})
}

// PUT /api/admin/products/{id}/images/{image_id}/primary
func (h *UploadHandler) SetPrimary(w http.ResponseWriter, r *http.Request) {
	productID := chi.URLParam(r, "id")
	imageID := chi.URLParam(r, "image_id")

	h.db.Exec(r.Context(), `UPDATE product_images SET is_primary = false WHERE product_id = $1`, productID)
	tag, err := h.db.Exec(r.Context(), `UPDATE product_images SET is_primary = true WHERE id = $1`, imageID)
	if err != nil || tag.RowsAffected() == 0 {
		models.WriteError(w, http.StatusNotFound, "image not found")
		return
	}
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "primary image updated"})
}

// GET /api/admin/products/{id}/images
func (h *UploadHandler) ListImages(w http.ResponseWriter, r *http.Request) {
	productID := chi.URLParam(r, "id")
	rows, err := h.db.Query(r.Context(),
		`SELECT id, url, is_primary, sort_order FROM product_images
		 WHERE product_id = $1 ORDER BY sort_order`, productID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	type imgRow struct {
		ID        string `json:"id"`
		URL       string `json:"url"`
		IsPrimary bool   `json:"is_primary"`
		SortOrder int    `json:"sort_order"`
	}
	imgs := []imgRow{}
	for rows.Next() {
		var i imgRow
		if rows.Scan(&i.ID, &i.URL, &i.IsPrimary, &i.SortOrder) == nil {
			imgs = append(imgs, i)
		}
	}
	models.WriteJSON(w, http.StatusOK, imgs)
}
