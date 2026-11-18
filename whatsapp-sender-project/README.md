# WhatsApp Sender (React + Node.js)

A starter admin app for consent-based WhatsApp Business Cloud API campaigns.

## Requirements
- Node.js 20+
- MongoDB
- Redis
- Meta WhatsApp Business Platform app, phone number ID, access token, approved message template
- Public HTTPS URL for production webhooks

## Setup
1. Copy `.env.example` to `server/.env` and fill in the values. Replace all example credentials, especially `JWT_SECRET`, `ADMIN_PASSWORD`, and `WEBHOOK_VERIFY_TOKEN`.
2. Start MongoDB and Redis.
3. In `server/`: `npm install`, then `npm run dev`.
4. In `client/`: `npm install`, then `npm run dev`.
5. Open http://localhost:5173 and sign in using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from server `.env`.

In development, the client sends API requests through Vite's `/api` proxy, which targets the backend port in `server/.env` (or port 4000 if unset). Set `VITE_API_PROXY_TARGET` to override the proxy target. For deployments where the API is on another origin, set `VITE_API_URL` to its `/api` URL. Sign-in and protected pages verify the session with the backend; contact and campaign requests send the same bearer token.

For production, set `CLIENT_ORIGIN`, use HTTPS, use a strong random JWT secret, protect the server and Redis, and run the worker as a separate process (`npm run worker`).

## Meta setup
In Meta for Developers, create a Business app, add WhatsApp, connect a WhatsApp Business Account and sender phone number, and obtain:
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_API_VERSION` (use a currently supported Graph API version)
- `META_APP_SECRET`
- `WEBHOOK_VERIFY_TOKEN`
Subscribe the WhatsApp Business Account to the app's webhook and configure callback URL:
`https://YOUR_DOMAIN/api/webhooks/whatsapp`
Subscribe to the `messages` webhook field.

## Sample contacts API
The app provides:
- `GET /api/contacts` — returns stored contacts, including opt-in state
- `POST /api/contacts` — add a contact
- `POST /api/contacts/import` — import a JSON array of contacts

Example import (requires admin JWT):
```json
{
  "contacts": [
    {
      "name": "Asha",
      "phone": "919876543210",
      "optedIn": true,
      "consentSource": "Website signup",
      "consentedAt": "2026-11-13T08:00:00.000Z"
    }
  ]
}
```
Phone numbers must be in international format without `+`, spaces or punctuation. Only add people who explicitly agreed to receive WhatsApp messages.

## Create a campaign
Create a campaign with a WhatsApp-approved template name and language code. This starter sends template messages only, which is appropriate for business-initiated messaging outside the 24-hour customer service window. Add approved template components/variables if your template needs them.

## Important
- A successful Graph API response means accepted by Meta, not delivered. Delivery/read/failure states are updated through webhooks.
- Do not use this app for unsolicited bulk messaging. Respect opt-outs, applicable law, Meta policies, quality limits and messaging limits.
- Add your privacy notice, retention controls, audit logging, stronger role-based access, CSRF protection if using cookies, and production monitoring before deployment.
