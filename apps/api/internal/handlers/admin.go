package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminHandler struct {
	db *pgxpool.Pool
}

func NewAdminHandler(db *pgxpool.Pool) *AdminHandler {
	return &AdminHandler{db: db}
}

// Dashboard stats
func (h *AdminHandler) Stats(w http.ResponseWriter, r *http.Request) {
	var totalRevenue, pendingRevenue float64
	var totalOrders, pendingOrders, confirmedOrders int
	var totalAppointments, pendingAppointments int
	var totalUsers, totalProducts int

	h.db.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(total),0)::float8, COUNT(*) FROM orders WHERE payment_status = 'paid'`,
	).Scan(&totalRevenue, &totalOrders)

	h.db.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(total),0)::float8, COUNT(*) FROM orders WHERE status = 'pending'`,
	).Scan(&pendingRevenue, &pendingOrders)

	h.db.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM orders WHERE status = 'confirmed'`).Scan(&confirmedOrders)
	h.db.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM appointments`).Scan(&totalAppointments)
	h.db.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM appointments WHERE status = 'pending'`).Scan(&pendingAppointments)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM users`).Scan(&totalUsers)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM products`).Scan(&totalProducts)

	models.WriteJSON(w, http.StatusOK, map[string]any{
		"revenue": map[string]any{
			"total":   totalRevenue,
			"pending": pendingRevenue,
		},
		"orders": map[string]any{
			"total":     totalOrders,
			"pending":   pendingOrders,
			"confirmed": confirmedOrders,
		},
		"appointments": map[string]any{
			"total":   totalAppointments,
			"pending": pendingAppointments,
		},
		"users":    totalUsers,
		"products": totalProducts,
	})
}

// --- Admin Orders ---

func (h *AdminHandler) ListOrders(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	rows, err := h.db.Query(r.Context(), `
		SELECT o.id, o.status, o.payment_method, o.payment_status,
		       o.total::float8, o.created_at, u.email, u.first_name || ' ' || u.last_name
		FROM orders o
		JOIN users u ON u.id = o.user_id
		WHERE $1 = '' OR o.status = $1
		ORDER BY o.created_at DESC LIMIT 200`, status)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	type row struct {
		ID            string  `json:"id"`
		Status        string  `json:"status"`
		PaymentMethod string  `json:"payment_method"`
		PaymentStatus string  `json:"payment_status"`
		Total         float64 `json:"total"`
		CreatedAt     string  `json:"created_at"`
		UserEmail     string  `json:"user_email"`
		UserName      string  `json:"user_name"`
	}
	orders := []row{}
	for rows.Next() {
		var o row
		if rows.Scan(&o.ID, &o.Status, &o.PaymentMethod, &o.PaymentStatus,
			&o.Total, &o.CreatedAt, &o.UserEmail, &o.UserName) == nil {
			orders = append(orders, o)
		}
	}
	models.WriteJSON(w, http.StatusOK, orders)
}

func (h *AdminHandler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "id")
	var body struct {
		Status        string `json:"status"`
		PaymentStatus string `json:"payment_status"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	h.db.Exec(r.Context(),
		`UPDATE orders SET status = COALESCE(NULLIF($1,''), status),
		 payment_status = COALESCE(NULLIF($2,''), payment_status), updated_at = now()
		 WHERE id = $3`, body.Status, body.PaymentStatus, orderID)
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "order updated"})
}

// --- Admin Products ---

func (h *AdminHandler) ListProducts(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT p.id, p.name, p.slug, p.price::float8, p.stock_qty, p.is_active, c.name
		FROM products p JOIN categories c ON c.id = p.category_id
		ORDER BY p.created_at DESC`)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	type row struct {
		ID           string  `json:"id"`
		Name         string  `json:"name"`
		Slug         string  `json:"slug"`
		Price        float64 `json:"price"`
		StockQty     int     `json:"stock_qty"`
		IsActive     bool    `json:"is_active"`
		CategoryName string  `json:"category_name"`
	}
	products := []row{}
	for rows.Next() {
		var p row
		if rows.Scan(&p.ID, &p.Name, &p.Slug, &p.Price, &p.StockQty, &p.IsActive, &p.CategoryName) == nil {
			products = append(products, p)
		}
	}
	models.WriteJSON(w, http.StatusOK, products)
}

func (h *AdminHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var body struct {
		CategoryID   string          `json:"category_id"`
		Name         string          `json:"name"`
		Slug         string          `json:"slug"`
		Description  string          `json:"description"`
		Price        float64         `json:"price"`
		ComparePrice *float64        `json:"compare_price"`
		StockQty     int             `json:"stock_qty"`
		SKU          string          `json:"sku"`
		Specs        json.RawMessage `json:"specs"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" || body.Slug == "" {
		models.WriteError(w, http.StatusBadRequest, "name and slug are required")
		return
	}
	if body.Specs == nil {
		body.Specs = json.RawMessage("{}")
	}
	var id string
	err := h.db.QueryRow(r.Context(), `
		INSERT INTO products (category_id, name, slug, description, price, compare_price, stock_qty, sku, specs)
		VALUES ($1, $2, $3, NULLIF($4,''), $5, $6, $7, NULLIF($8,''), $9)
		RETURNING id`,
		body.CategoryID, body.Name, body.Slug, body.Description, body.Price,
		body.ComparePrice, body.StockQty, body.SKU, body.Specs,
	).Scan(&id)
	if err != nil {
		models.WriteError(w, http.StatusBadRequest, "could not create product: "+err.Error())
		return
	}
	models.WriteJSON(w, http.StatusCreated, map[string]string{"id": id})
}

func (h *AdminHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Name         string          `json:"name"`
		Description  string          `json:"description"`
		Price        float64         `json:"price"`
		ComparePrice *float64        `json:"compare_price"`
		StockQty     int             `json:"stock_qty"`
		IsActive     bool            `json:"is_active"`
		Specs        json.RawMessage `json:"specs"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	h.db.Exec(r.Context(), `
		UPDATE products SET name=$1, description=NULLIF($2,''), price=$3, compare_price=$4,
		stock_qty=$5, is_active=$6, specs=COALESCE($7, specs), updated_at=now()
		WHERE id=$8`,
		body.Name, body.Description, body.Price, body.ComparePrice,
		body.StockQty, body.IsActive, body.Specs, id)
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "product updated"})
}

func (h *AdminHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.db.Exec(r.Context(), `DELETE FROM products WHERE id = $1`, id)
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "product deleted"})
}

// --- Admin Appointments ---

func (h *AdminHandler) ListAppointments(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT a.id, a.status, a.scheduled_date::text, a.scheduled_time::text,
		       s.name, u.email, u.first_name || ' ' || u.last_name
		FROM appointments a
		JOIN services s ON s.id = a.service_id
		JOIN users u ON u.id = a.user_id
		ORDER BY a.scheduled_date DESC, a.scheduled_time DESC LIMIT 200`)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	type row struct {
		ID            string `json:"id"`
		Status        string `json:"status"`
		ScheduledDate string `json:"scheduled_date"`
		ScheduledTime string `json:"scheduled_time"`
		ServiceName   string `json:"service_name"`
		UserEmail     string `json:"user_email"`
		UserName      string `json:"user_name"`
	}
	appts := []row{}
	for rows.Next() {
		var a row
		if rows.Scan(&a.ID, &a.Status, &a.ScheduledDate, &a.ScheduledTime,
			&a.ServiceName, &a.UserEmail, &a.UserName) == nil {
			appts = append(appts, a)
		}
	}
	models.WriteJSON(w, http.StatusOK, appts)
}

func (h *AdminHandler) UpdateAppointment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Status  string  `json:"status"`
		StaffID *string `json:"staff_id"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	h.db.Exec(r.Context(),
		`UPDATE appointments SET status = COALESCE(NULLIF($1,''), status),
		 staff_id = COALESCE($2, staff_id), updated_at = now() WHERE id = $3`,
		body.Status, body.StaffID, id)
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "appointment updated"})
}

// --- Admin Services ---

func (h *AdminHandler) CreateService(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name        string   `json:"name"`
		Slug        string   `json:"slug"`
		Description string   `json:"description"`
		BasePrice   *float64 `json:"base_price"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" || body.Slug == "" {
		models.WriteError(w, http.StatusBadRequest, "name and slug required")
		return
	}
	var id string
	h.db.QueryRow(r.Context(),
		`INSERT INTO services (name, slug, description, base_price) VALUES ($1,$2,NULLIF($3,''),$4) RETURNING id`,
		body.Name, body.Slug, body.Description, body.BasePrice,
	).Scan(&id)
	models.WriteJSON(w, http.StatusCreated, map[string]string{"id": id})
}

func (h *AdminHandler) UpdateService(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		BasePrice   *float64 `json:"base_price"`
		IsActive    bool     `json:"is_active"`
	}
	json.NewDecoder(r.Body).Decode(&body)
	h.db.Exec(r.Context(),
		`UPDATE services SET name=$1, description=NULLIF($2,''), base_price=$3, is_active=$4 WHERE id=$5`,
		body.Name, body.Description, body.BasePrice, body.IsActive, id)
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "service updated"})
}

func (h *AdminHandler) DeleteService(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.db.Exec(r.Context(), `DELETE FROM services WHERE id = $1`, id)
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "service deleted"})
}

// --- Admin Users ---

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(),
		`SELECT id, email, first_name, last_name, phone, role, created_at FROM users ORDER BY created_at DESC`)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	type row struct {
		ID        string  `json:"id"`
		Email     string  `json:"email"`
		FirstName string  `json:"first_name"`
		LastName  string  `json:"last_name"`
		Phone     *string `json:"phone"`
		Role      string  `json:"role"`
		CreatedAt string  `json:"created_at"`
	}
	users := []row{}
	for rows.Next() {
		var u row
		if rows.Scan(&u.ID, &u.Email, &u.FirstName, &u.LastName, &u.Phone, &u.Role, &u.CreatedAt) == nil {
			users = append(users, u)
		}
	}
	models.WriteJSON(w, http.StatusOK, users)
}
