# Stripe Webhook Setup

This directory contains the webhook handler for Stripe events, focusing on Connected Accounts.

## Getting Started

### 1. Set up your webhook in the Stripe Dashboard

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhooks`
4. Select events to listen for (at minimum, select the following):
   - `account.updated`
   - `account.application.authorized`
   - `account.application.deauthorized`
   - `account.external_account.created`
   - `account.external_account.updated`
   - `account.external_account.deleted`

### 2. Get your webhook signing secret

After creating the webhook, Stripe will provide a signing secret. Add this to your `.env` and `.env.local` files:

```
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_signing_secret"
```

### 3. Testing locally with the Stripe CLI

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login with your Stripe account:
   ```
   stripe login
   ```
3. Forward events to your local server:
   ```
   stripe listen --forward-to http://localhost:3000/api/stripe/webhooks
   ```
4. In a new terminal, trigger a test event:
   ```
   stripe trigger account.updated
   ```

## Handled Events

This webhook endpoint currently handles the following Stripe events:

- `account.updated` - When a Connected Account is updated
- `account.application.authorized` - When your application is authorized by a Connected Account
- `account.application.deauthorized` - When your application is deauthorized by a Connected Account
- `account.external_account.created` - When a bank account or card is added to a Connected Account
- `account.external_account.updated` - When a bank account or card is updated on a Connected Account
- `account.external_account.deleted` - When a bank account or card is removed from a Connected Account

## Webhook Security

This implementation uses Stripe's webhook signature verification to ensure that webhook events are actually coming from Stripe. Make sure to keep your webhook secret secure and never commit it to version control. 