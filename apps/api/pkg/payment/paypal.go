package payment

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

type PayPalProvider struct {
	clientID     string
	clientSecret string
	baseURL      string
	httpClient   *http.Client
}

func NewPayPalProvider(clientID, clientSecret, baseURL string) *PayPalProvider {
	return &PayPalProvider{
		clientID:     clientID,
		clientSecret: clientSecret,
		baseURL:      baseURL,
		httpClient:   &http.Client{},
	}
}

func (p *PayPalProvider) accessToken(ctx context.Context) (string, error) {
	data := url.Values{"grant_type": {"client_credentials"}}
	req, _ := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/v1/oauth2/token",
		strings.NewReader(data.Encode()))
	req.SetBasicAuth(p.clientID, p.clientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		AccessToken string `json:"access_token"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	return result.AccessToken, nil
}

func (p *PayPalProvider) CreateOrder(ctx context.Context, amount float64, currency, internalOrderID string) (string, string, error) {
	token, err := p.accessToken(ctx)
	if err != nil {
		return "", "", fmt.Errorf("get access token: %w", err)
	}

	body := map[string]any{
		"intent": "CAPTURE",
		"purchase_units": []map[string]any{{
			"reference_id": internalOrderID,
			"amount": map[string]any{
				"currency_code": currency,
				"value":         fmt.Sprintf("%.2f", amount),
			},
		}},
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/v2/checkout/orders",
		bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)

	var result struct {
		ID    string `json:"id"`
		Links []struct {
			Rel  string `json:"rel"`
			Href string `json:"href"`
		} `json:"links"`
	}
	json.Unmarshal(raw, &result)

	var approveURL string
	for _, l := range result.Links {
		if l.Rel == "approve" {
			approveURL = l.Href
			break
		}
	}
	return result.ID, approveURL, nil
}

func (p *PayPalProvider) CaptureOrder(ctx context.Context, paypalOrderID string) (string, error) {
	token, err := p.accessToken(ctx)
	if err != nil {
		return "", err
	}

	req, _ := http.NewRequestWithContext(ctx, "POST",
		fmt.Sprintf("%s/v2/checkout/orders/%s/capture", p.baseURL, paypalOrderID),
		bytes.NewReader([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result struct {
		PurchaseUnits []struct {
			Payments struct {
				Captures []struct {
					ID string `json:"id"`
				} `json:"captures"`
			} `json:"payments"`
		} `json:"purchase_units"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	if len(result.PurchaseUnits) > 0 && len(result.PurchaseUnits[0].Payments.Captures) > 0 {
		return result.PurchaseUnits[0].Payments.Captures[0].ID, nil
	}
	return "", fmt.Errorf("capture failed")
}
