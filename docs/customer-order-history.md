# Customer Order History API

This endpoint lets a logged-in customer fetch their own order history.

## Endpoint

- Method: GET
- URL: `/api/order/my`
- Auth: Bearer token (customer JWT)
- Headers:
  - `Authorization: Bearer <token>`
  - `X-API-Key: <your_api_key>`

## Request

No body is needed.

Example (HTTP):

GET /api/order/my
Authorization: Bearer <customer_jwt>
X-API-Key: <your_api_key>

## Response

- 200 OK
  {
    "status": 200,
    "message": "Orders fetched successfully.",
    "data": {
      "orders": [
        {
          "orderId": 123,
          "customerId": 45,
          "orderTotalPrice": 1500,
          "status": "advance-payment-received",
          "paymentStatus": "partial",
          "orderItems": [ ... ],
          "images": [ ... ],
          "payments": [ ... ],
          // ... other order fields
        }
      ]
    }
  }

- 200 OK (no orders)
  {
    "status": 200,
    "message": "No orders found.",
    "data": { "orders": [] }
  }

- 401 Unauthorized
  {
    "status": 401,
    "message": "Unauthorized."
  }

## Notes

- The server enforces API key globally. Include `X-API-Key` on all requests.
- The JWT must be a customer token issued by `/api/customer/login` or during registration/verification flows.
- This route is protected by `authenticate(["customer"])` and returns only the authenticated customer's orders.
