package config

import (
	"os"
	"time"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	JWTAccessExpiry    time.Duration
	JWTRefreshExpiry   time.Duration
	StripeSecretKey    string
	StripeWebhookSecret string
	PayPalClientID     string
	PayPalClientSecret string
	PayPalBaseURL      string
	AllowedOrigins     string
	AnthropicAPIKey    string
}

func Load() *Config {
	accessExpiry, _ := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	refreshExpiry, _ := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))

	return &Config{
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         mustEnv("DATABASE_URL"),
		JWTSecret:           mustEnv("JWT_SECRET"),
		JWTAccessExpiry:     accessExpiry,
		JWTRefreshExpiry:    refreshExpiry,
		StripeSecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
		PayPalClientID:      getEnv("PAYPAL_CLIENT_ID", ""),
		PayPalClientSecret:  getEnv("PAYPAL_CLIENT_SECRET", ""),
		PayPalBaseURL:       getEnv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com"),
		AllowedOrigins:      getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),
		AnthropicAPIKey:     getEnv("ANTHROPIC_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("required environment variable not set: " + key)
	}
	return v
}
