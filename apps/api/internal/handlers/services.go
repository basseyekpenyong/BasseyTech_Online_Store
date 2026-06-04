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

type ServiceHandler struct {
	db *pgxpool.Pool
}

func NewServiceHandler(db *pgxpool.Pool) *ServiceHandler {
	return &ServiceHandler{db: db}
}

type serviceRow struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Slug        string   `json:"slug"`
	Description *string  `json:"description"`
	BasePrice   *float64 `json:"base_price"`
	IsActive    bool     `json:"is_active"`
}

func (h *ServiceHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(),
		`SELECT id, name, slug, description, base_price::float8, is_active
		 FROM services WHERE is_active = true ORDER BY name ASC`)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	svcs := []serviceRow{}
	for rows.Next() {
		var s serviceRow
		if rows.Scan(&s.ID, &s.Name, &s.Slug, &s.Description, &s.BasePrice, &s.IsActive) == nil {
			svcs = append(svcs, s)
		}
	}
	models.WriteJSON(w, http.StatusOK, svcs)
}

// AppointmentHandler

type AppointmentHandler struct {
	db *pgxpool.Pool
}

func NewAppointmentHandler(db *pgxpool.Pool) *AppointmentHandler {
	return &AppointmentHandler{db: db}
}

type appointmentRow struct {
	ID            string    `json:"id"`
	ServiceID     string    `json:"service_id"`
	ServiceName   string    `json:"service_name"`
	StaffID       *string   `json:"staff_id"`
	StaffName     *string   `json:"staff_name"`
	ScheduledDate string    `json:"scheduled_date"`
	ScheduledTime string    `json:"scheduled_time"`
	Status        string    `json:"status"`
	Notes         *string   `json:"notes"`
	CreatedAt     time.Time `json:"created_at"`
}

func (h *AppointmentHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	var body struct {
		ServiceID     string  `json:"service_id"`
		StaffID       *string `json:"staff_id"`
		ScheduledDate string  `json:"scheduled_date"`
		ScheduledTime string  `json:"scheduled_time"`
		Notes         string  `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		models.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if body.ServiceID == "" || body.ScheduledDate == "" || body.ScheduledTime == "" {
		models.WriteError(w, http.StatusBadRequest, "service_id, scheduled_date, and scheduled_time are required")
		return
	}

	var apptID string
	err := h.db.QueryRow(r.Context(), `
		INSERT INTO appointments (user_id, service_id, staff_id, scheduled_date, scheduled_time, notes)
		VALUES ($1, $2, $3, $4::date, $5::time, NULLIF($6, ''))
		RETURNING id`,
		userID, body.ServiceID, body.StaffID, body.ScheduledDate, body.ScheduledTime, body.Notes,
	).Scan(&apptID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	models.WriteJSON(w, http.StatusCreated, map[string]string{"appointment_id": apptID})
}

func (h *AppointmentHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	rows, err := h.db.Query(r.Context(), `
		SELECT a.id, a.service_id, s.name, a.staff_id,
		       CASE WHEN sp.id IS NOT NULL THEN u.first_name || ' ' || u.last_name END,
		       a.scheduled_date::text, a.scheduled_time::text, a.status, a.notes, a.created_at
		FROM appointments a
		JOIN services s ON s.id = a.service_id
		LEFT JOIN staff_profiles sp ON sp.id = a.staff_id
		LEFT JOIN users u ON u.id = sp.user_id
		WHERE a.user_id = $1
		ORDER BY a.scheduled_date DESC, a.scheduled_time DESC`, userID)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()
	appts := []appointmentRow{}
	for rows.Next() {
		var a appointmentRow
		if rows.Scan(&a.ID, &a.ServiceID, &a.ServiceName, &a.StaffID, &a.StaffName,
			&a.ScheduledDate, &a.ScheduledTime, &a.Status, &a.Notes, &a.CreatedAt) == nil {
			appts = append(appts, a)
		}
	}
	models.WriteJSON(w, http.StatusOK, appts)
}

func (h *AppointmentHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	apptID := chi.URLParam(r, "id")
	var a appointmentRow
	err := h.db.QueryRow(r.Context(), `
		SELECT a.id, a.service_id, s.name, a.staff_id,
		       CASE WHEN sp.id IS NOT NULL THEN u.first_name || ' ' || u.last_name END,
		       a.scheduled_date::text, a.scheduled_time::text, a.status, a.notes, a.created_at
		FROM appointments a
		JOIN services s ON s.id = a.service_id
		LEFT JOIN staff_profiles sp ON sp.id = a.staff_id
		LEFT JOIN users u ON u.id = sp.user_id
		WHERE a.id = $1 AND a.user_id = $2`, apptID, userID,
	).Scan(&a.ID, &a.ServiceID, &a.ServiceName, &a.StaffID, &a.StaffName,
		&a.ScheduledDate, &a.ScheduledTime, &a.Status, &a.Notes, &a.CreatedAt)
	if err != nil {
		models.WriteError(w, http.StatusNotFound, "appointment not found")
		return
	}
	models.WriteJSON(w, http.StatusOK, a)
}

func (h *AppointmentHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	userID := middleware.ClaimsFrom(r.Context()).UserID
	apptID := chi.URLParam(r, "id")
	tag, err := h.db.Exec(r.Context(),
		`UPDATE appointments SET status = 'cancelled', updated_at = now()
		 WHERE id = $1 AND user_id = $2 AND status = 'pending'`, apptID, userID)
	if err != nil || tag.RowsAffected() == 0 {
		models.WriteError(w, http.StatusBadRequest, "appointment cannot be cancelled")
		return
	}
	models.WriteJSON(w, http.StatusOK, models.MessageResponse{Message: "appointment cancelled"})
}
