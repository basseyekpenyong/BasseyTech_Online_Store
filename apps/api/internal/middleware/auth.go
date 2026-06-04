package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
	"github.com/basseyekpenyong/chiba-tech/api/pkg/auth"
)

type contextKey string

const claimsKey contextKey = "claims"

func Authenticate(jwtManager *auth.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				models.WriteError(w, http.StatusUnauthorized, "missing or invalid authorization header")
				return
			}
			claims, err := jwtManager.Verify(strings.TrimPrefix(header, "Bearer "))
			if err != nil {
				models.WriteError(w, http.StatusUnauthorized, "invalid token")
				return
			}
			if claims.Type != auth.AccessToken {
				models.WriteError(w, http.StatusUnauthorized, "wrong token type")
				return
			}
			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := ClaimsFrom(r.Context())
		if claims == nil || claims.Role != "admin" {
			models.WriteError(w, http.StatusForbidden, "admin access required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func ClaimsFrom(ctx context.Context) *auth.Claims {
	v, _ := ctx.Value(claimsKey).(*auth.Claims)
	return v
}
