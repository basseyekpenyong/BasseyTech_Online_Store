.PHONY: dev migrate migrate-down migrate-status generate build

# Load .env if present
ifneq (,$(wildcard .env))
  include .env
  export
endif

MIGRATION_DIR=internal/database/migrations
BINARY=bin/server

dev:
	go run ./cmd/server

build:
	go build -o $(BINARY) ./cmd/server

migrate:
	goose -dir $(MIGRATION_DIR) postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir $(MIGRATION_DIR) postgres "$(DATABASE_URL)" down

migrate-status:
	goose -dir $(MIGRATION_DIR) postgres "$(DATABASE_URL)" status

migrate-reset:
	goose -dir $(MIGRATION_DIR) postgres "$(DATABASE_URL)" reset

generate:
	sqlc generate

test:
	go test ./...
