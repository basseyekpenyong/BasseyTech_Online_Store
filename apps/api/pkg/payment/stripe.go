package payment

import (
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/paymentintent"
)

type StripeProvider struct{}

func NewStripeProvider(secretKey string) *StripeProvider {
	stripe.Key = secretKey
	return &StripeProvider{}
}

func (s *StripeProvider) CreateIntent(amountCents int64, currency, orderID string) (string, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amountCents),
		Currency: stripe.String(currency),
		Metadata: map[string]string{"order_id": orderID},
	}
	pi, err := paymentintent.New(params)
	if err != nil {
		return "", err
	}
	return pi.ClientSecret, nil
}
