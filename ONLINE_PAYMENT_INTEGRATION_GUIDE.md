# Online Payment Integration (SSLCommerz)

This guide reflects the intended workflow: the customer places an order request with method "online"; a staff member reviews and initiates the payment session; the customer completes payment via the generated link. It covers request/response formats, redirects, and robust error handling (including common SSLCommerz errors).


## Prerequisites

Backend must be running with these env variables configured:
- SSL_COMMERZ_STORE_ID
- SSL_COMMERZ_STORE_PASSWORD
- SSL_COMMERZ_SANDBOX=true | false (true = sandbox)
- SSL_COMMERZ_SUCCESS_URL (default: <backend>/api/order/payment/success)
- SSL_COMMERZ_FAIL_URL (default: <backend>/api/order/payment/fail)
- SSL_COMMERZ_CANCEL_URL (default: <backend>/api/order/payment/cancel)
- FRONTEND_LANDING_PAGE_URL (used for post-payment redirects to your UI)

Notes
- Credentials are backend-only. Frontend never sees the store ID/password.
- Strict rate limiter is applied on payment endpoints.


## 1) Customer creates an order request (online method)

Endpoint
- POST /api/order/create-request
- Auth: customer (also allowed for staff to assist)
- Body includes order items and the platform records `method: "online"` on the order request. No payment is created at this point.

Result
- Order is created with status `order-request-received`, method `online`, paymentStatus `pending`, and paymentMethod set to `online-payment` for intent tracking. Staff will follow up to initiate the actual payment link.

## 2) Staff starts an Online Payment Session

Endpoint
- POST /api/order/add-payment
- Auth: Admin/Agent/Designer token + X-API-Key (if your app uses one)
- Content-Type: application/json

Body
- orderId: number
- amount: number (> 0)
- paymentMethod: "online-payment"
- customerName: string (>= 2 chars)
- customerEmail: string (valid email)
- customerPhone: string (BD format: 01XXXXXXXXX)

Example (fetch)
```js
const res = await fetch(`${API_BASE}/api/order/add-payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-API-Key': apiKey,
  },
  body: JSON.stringify({
    orderId: 123,
    amount: 500,
    paymentMethod: 'online-payment',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '01700000000',
  }),
});
const json = await res.json();
```

Success (201)
```json
{
  "success": true,
  "status": 201,
  "message": "Order payment request created successfully.",
  "data": {
    "paymentId": 456,
    "orderId": 123,
    "paymentMethod": "online-payment",
    "transactionId": "TRX-20250913-abc123...",
    "paymentLink": "https://sandbox.sslcommerz.com/EasyCheckOut/test-xyz...",
    "isPaid": false,
    "amount": 500,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Staff UI flow
- Copy or send `data.paymentLink` to the customer (or open in a new tab if assisting live).
- Keep `data.transactionId` for reconciliation/debug.


## 3) Customer pays via SSLCommerz (Gateway Callbacks handled by backend)

SSLCommerz will POST to the backend callback URLs (success/fail/cancel). Backend behavior:
- On success:
  - Validates the transaction (server-side integration).
  - Marks Payment.isPaid = true for the matching transaction.
  - Recomputes the Order paymentStatus: paid | partial | pending.
  - If the order was in a requested state (order-request-received, consultation-in-progress, awaiting-advance-payment) and totalPaid > 0, the backend moves it to `advance-payment-received` (active).
  - Redirects the browser to `${FRONTEND_LANDING_PAGE_URL}/success-payment?transaction=...` (transaction summary JSON-encoded in query).
- On fail/cancel:
  - Keeps isPaid = false (or ensures it’s false).
  - Redirects to `${FRONTEND_LANDING_PAGE_URL}/failed-payment`.

Frontend pages to implement
- /success-payment
  - Parse the `transaction` query param (JSON string) if present and render a receipt-like view.
  - Show the associated order; refresh the order detail from your API.
- /failed-payment
  - Show a clear failure message and link back to the order details; optionally allow retry.

Fallback (optional polling)
- After the user returns, refresh the order detail/list to reflect updated paymentStatus and, for request orders, the automatic move to active.
- Mixed payment is supported (COD + Online); only payments with isPaid=true count towards the paid total.


## 3) Error Handling (Frontend)

Typical backend validation errors
- 400 missing/invalid fields (amount <= 0, invalid email/phone, etc)
- 401/403 auth issues
- 429 rate limited

SSLCommerz session-init errors (normalized)
Backend will throw an error with a message like:
```
[SSLCommerz] <reason from gateway>
```
Common reasons you should reflect in the UI:
- Store ID/Password Mismatch → Credentials incorrect or wrong environment (sandbox vs live)
- Merchant is Blocked / Suspended / Under Review → Account status issue; contact SSLCommerz
- Invalid Currency or Amount → Check request payload (BDT, positive amount)
- Invalid Callback URLs → Ensure the backend URLs are reachable and correct
- Too Many Attempts / Rate Limited → Advise waiting and retry later
- Network/Timeout → Suggest retry; if persistent, show “Gateway unavailable”

Recommended UX
- Show a friendly toast like: “Couldn’t start online payment.”
- Provide a “Details” expander with the raw message (e.g., “Store ID/Password Mismatch”).
- Offer a Retry button for transient issues; for merchant/account issues, suggest contacting admin.
- Always leave a COD option available if business allows.

Example error envelope
```json
{
  "success": false,
  "status": 400,
  "message": "SSLCommerz session init failed",
  "details": "Store ID/Password Mismatch"
}
```


## 4) Mixed Payments (COD + Online)

- Each payment creates a row in `Payments` with a unique `transactionId`.
- Only `isPaid = true` amounts contribute to the order’s paid total.
- paymentStatus rules:
  - paid: totalPaid >= orderTotalPrice
  - partial: 0 < totalPaid < orderTotalPrice
  - pending: totalPaid = 0

Note on status moves
- COD: requested orders are moved to an active status after any non-zero confirmed payment.
- Online success: same behavior now applies—requested orders transition to `advance-payment-received` after the first successful online payment.


## 5) Sandbox vs Live

- Sandbox endpoint: https://sandbox.sslcommerz.com/gwprocess/v4/api.php
- Live endpoint: https://securepay.sslcommerz.com/gwprocess/v4/api.php
- Backend selects based on `SSL_COMMERZ_SANDBOX`.
- You can include environment banners in the UI (e.g., “Sandbox Mode”) to avoid confusion.


## 6) Admin UI Reference Implementation (React-like pseudocode)

```jsx
function OnlinePaymentButton({ order }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const startOnlinePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/order/add-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          orderId: order.orderId,
          amount: order.dueAmount || 100,
          paymentMethod: 'online-payment',
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.data?.paymentLink) {
        throw new Error(json?.message || 'SSLCommerz session init failed');
      }
      // open payment page
      window.open(json.data.paymentLink, '_blank');
    } catch (e) {
      setError(e.message || 'Failed to start online payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={startOnlinePayment} disabled={loading}>
        {loading ? 'Starting…' : 'Pay Online'}
      </button>
      {error && (
        <div role="alert" style={{ color: 'crimson' }}>
          Couldn’t start online payment.
          <details><summary>Details</summary>{error}</details>
        </div>
      )}
    </div>
  );
}
```


## 7) Troubleshooting Checklist

- Does `/api/order/add-payment` return a `paymentLink`?
  - If not, check the returned message (it often contains the SSLCommerz reason).
- Do success/fail/cancel URLs respond with 200 on your backend (POST)?
  - If blocked, whitelist them in the WAF/CDN and ensure HTTPS certificates are valid.
- Does the frontend receive redirects to `/success-payment` or `/failed-payment`?
  - Ensure `FRONTEND_LANDING_PAGE_URL` is set to your correct frontend origin.
- Are `Payments` rows created with `transactionId` and, after success, `isPaid=true`?
  - If not, inspect server logs for webhook payloads and validation issues.

---
Questions or changes? Reach the backend team before altering payloads or callback handling.