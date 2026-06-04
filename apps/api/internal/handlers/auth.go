package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/basseyekpenyong/chiba-tech/api/internal/middleware"
	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
	"github.com/basseyekpenyong/chiba-tech/api/pkg/auth"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db         *pgxpool.Pool
	jwtManager *auth.Manager
}

func NewAuthHandler(db *pgxpool.Pool, jwtManager *auth.Manager) *AuthHandler {
	return &AuthHandler{db: db, jwtManager: jwtManager}
}

type registerRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	User         userBrief `json:"user"`
}

type userBrief struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		models.WriteError(w, http.StatusBadRequest, "email, password, first_name, and last_name are required")
		return
	}
	if len(req.Password) < 8 {
		models.WriteError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}

	var user userBrief
	err = h.db.QueryRow(r.Context(),
		`INSERT INTO users (email, password_hash, first_name, last_name, phone)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, email, first_name, last_name, role, created_at`,
		req.Email, string(hash), req.FirstName, req.LastName, req.Phone,
	).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Role, &user.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			models.WriteError(w, http.StatusConflict, "email already registered")
			return
		}
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}

	access, _ := h.jwtManager.IssueAccess(user.ID, user.Role)
	refresh, _ := h.jwtManager.IssueRefresh(user.ID, user.Role)
	models.WriteJSON(w, http.StatusCreated, authResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		User:         user,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		models.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var user userBrief
	var hash string
	err := h.db.QueryRow(r.Context(),
		`SELECT id, email, first_name, last_name, role, created_at, password_hash
		 FROM users WHERE email = $1`,
		strings.ToLower(req.Email),
	).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Role, &user.CreatedAt, &hash)
	if err == pgx.ErrNoRows {
		models.WriteError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
		models.WriteError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	access, _ := h.jwtManager.IssueAccess(user.ID, user.Role)
	refresh, _ := h.jwtManager.IssueRefresh(user.ID, user.Role)
	models.WriteJSON(w, http.StatusOK, authResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		User:         user,
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		models.WriteError(w, http.StatusBadRequest, "refresh_token required")
		return
	}
	claims, err := h.jwtManager.Verify(body.RefreshToken)
	if err != nil || claims.Type != auth.RefreshToken {
		models.WriteError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}
	access, _ := h.jwtManager.IssueAccess(claims.UserID, claims.Role)
	refresh, _ := h.jwtManager.IssueRefresh(claims.UserID, claims.Role)
	models.WriteJSON(w, http.StatusOK, map[string]string{
		"access_token":  access,
		"refresh_token": refresh,
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFrom(r.Context())
	var user userBrief
	err := h.db.QueryRow(r.Context(),
		`SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1`,
		claims.UserID,
	).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Role, &user.CreatedAt)
	if err != nil {
		models.WriteError(w, http.StatusNotFound, "user not found")
		return
	}
	models.WriteJSON(w, http.StatusOK, user)
}
