package handlers

import (
	"encoding/json"
	"net/http"

	anthropic "github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"github.com/basseyekpenyong/chiba-tech/api/internal/models"
)

const chibaSystemPrompt = `You are the Chiba-Tech AI customer service assistant, available 24/7 to help customers.

Chiba-Tech is a technology company based in Nigeria offering:

PRODUCTS: Laptops, phones, accessories, and telecom gadgets

SERVICES:
- Hardware Repair — phones, laptops, accessories (from $29.99)
- Software Development — custom websites and apps (from $499.00)
- Network Setup — Wi-Fi configuration and router setup (from $49.99)
- Data Recovery — hard drives, SSDs, phones, USB drives (from $79.99)
- Maintenance & Support — ongoing tech support and updates (from $99.00)

LOCATIONS:
- Head Office: 41 Uncle Joe Avenue, Kubwa, Abuja, Nigeria
- Branch Office: 20 Atimbo Close, Calabar, Cross River State, Nigeria

CONTACT:
- Phone: +234 806 360 7290 or +234 701 234 6604
- Email: globalchibatech@gmail.com
- Website: www.chibatech.com

HOW TO HELP:
- Answer product and service questions
- Help customers book service appointments
- Guide customers to place orders or browse products
- Provide pricing guidance (direct to website for exact current prices)
- Handle complaints and escalate if needed

Keep responses concise and friendly. If you cannot fully resolve something, direct the customer to call or email us. Do not invent prices, availability, or product specs you are not certain about.`

type ChatHandler struct {
	client *anthropic.Client
}

func NewChatHandler(apiKey string) *ChatHandler {
	if apiKey == "" {
		return &ChatHandler{client: nil}
	}
	c := anthropic.NewClient(option.WithAPIKey(apiKey))
	return &ChatHandler{client: &c}
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Message string        `json:"message"`
	History []chatMessage `json:"history"`
}

func (h *ChatHandler) Chat(w http.ResponseWriter, r *http.Request) {
	if h.client == nil {
		models.WriteJSON(w, http.StatusOK, map[string]string{
			"reply": "Our AI assistant is not available right now. Please reach us directly:\n\n📞 +234 806 360 7290\n📧 globalchibatech@gmail.com\n\nWe're happy to help!",
		})
		return
	}

	var req chatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Message == "" {
		models.WriteError(w, http.StatusBadRequest, "message required")
		return
	}

	// Build conversation history
	msgs := make([]anthropic.MessageParam, 0, len(req.History)+1)
	for _, m := range req.History {
		switch m.Role {
		case "user":
			msgs = append(msgs, anthropic.NewUserMessage(anthropic.NewTextBlock(m.Content)))
		case "assistant":
			msgs = append(msgs, anthropic.NewAssistantMessage(anthropic.NewTextBlock(m.Content)))
		}
	}
	msgs = append(msgs, anthropic.NewUserMessage(anthropic.NewTextBlock(req.Message)))

	resp, err := h.client.Messages.New(r.Context(), anthropic.MessageNewParams{
		Model:     anthropic.ModelClaudeHaiku4_5_20251001,
		MaxTokens: 512,
		System: []anthropic.TextBlockParam{{
			Text:         chibaSystemPrompt,
			CacheControl: anthropic.NewCacheControlEphemeralParam(),
		}},
		Messages: msgs,
	})
	if err != nil {
		models.WriteError(w, http.StatusInternalServerError, "agent unavailable")
		return
	}

	var reply string
	for _, block := range resp.Content {
		if t, ok := block.AsAny().(anthropic.TextBlock); ok {
			reply = t.Text
			break
		}
	}

	models.WriteJSON(w, http.StatusOK, map[string]string{"reply": reply})
}
