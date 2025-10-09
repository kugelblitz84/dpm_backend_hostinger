# Order API Contract

This document describes the Order creation requests (POS vs Online) and the Order details response, including the pricing breakdown fields required by the UI: Unit Price, Additional Price, Discount, Design Charge, and Total.

## Terminology
- POS order: Created by staff (method: "offline").
- Online order request: Created by customer/frontend (method: "online").
- Order total: Stored as `orderTotalPrice` on Order; for POS it is provided by the request, for Online it is computed as the sum of item prices.
- Pricing breakdown per item: Stored on each OrderItem as:
  - unitPrice: base unit price (nullable for legacy)
  - additionalPrice: extra from variant/add-ons
  - discountPercentage: percentage in [0..100]
  - designCharge: per-item design charge
  - price: final line total for the item after all adjustments (what you charge for that item)

## Create POS Order (staff)
- Endpoint: POST /api/order/create
- Body (validated by `OrderMiddleware.validateOrderCreation`):
  - customerName: string (required)
  - customerEmail: string (required, can be empty string "")
  - customerPhone: string 11-digit BD format (required)
  - staffId: number | null (optional; if absent, fair auto-assign picks an agent)
  - billingAddress: string (required)
  - additionalNotes: string (optional)
  - deliveryMethod: "shop-pickup" | "courier" (required)
  - deliveryDate: ISO date string or "null"
  - paymentMethod: "cod-payment" | "online-payment" (required)
  - amount: number (required) — upfront paid amount, triggers immediate COD payment if > 0
  - orderTotal: number (required) — will be saved into `orderTotalPrice`
  - couponId?: number
  - courierId?: number, courierAddress?: string (must be paired)
  - orderItems: Array of items. Each item supports the pricing breakdown fields.

Example orderItems for POS:
```json
[
  {
    "productId": 12,
    "productVariantId": 88,
    "quantity": 1,
    "size": null,
    "widthInch": null,
    "heightInch": null,
    "unitPrice": 400,
    "additionalPrice": 0,
    "discountPercentage": 0,
    "designCharge": 250,
    "price": 650
  }
]
```

Behavior:
- Creates Order with method="offline", status="advance-payment-received", paymentStatus derived from amount vs orderTotal.
- Immediately creates a COD Payment row with isPaid=true for `amount`.
- Returns `{ order: <Order with includes> }` where the Order includes orderItems (with product, variant details) and payments.

## Create Online Order Request (customer)
- Endpoint: POST /api/order/create-request
- Body (validated by `OrderMiddleware.validateOrderRequestCreation`):
  - customerId: number | null (required)
  - customerName: string (required)
  - customerPhone: string (required)
  - customerEmail?: string (optional; accepted and stored)
  - staffId: number | null (optional; if absent, fair auto-assign picks an agent)
  - billingAddress: string (required)
  - additionalNotes: string (optional)
  - deliveryMethod: "shop-pickup" | "courier" (required)
  - couponId?: number
  - courierId?: number, courierAddress?: string (pair optional)
  - orderItems: Array of items (stringified JSON in multipart); supports pricing breakdown.

Example orderItems for Online:
```json
[
  {
    "productId": 45,
    "productVariantId": 190,
    "quantity": 1,
    "size": null,
    "widthInch": null,
    "heightInch": null,
    "unitPrice": 400,
    "additionalPrice": 0,
    "discountPercentage": 0,
    "designCharge": 250,
    "price": 650
  }
]
```

Behavior:
- Creates Order with method="online", status="order-request-received", paymentMethod="online-payment", paymentStatus="pending".
- `orderTotalPrice` is computed by summing item `price`.
- Returns `{ order: <Order with includes> }`.

## Order details response (common)
- Returned by:
  - POST /api/order/create
  - POST /api/order/create-request
  - GET /api/order/:id (via service `getOrderById`)
  - GET /api/order (list, via service `getAllOrders`)
- Shape (top-level Order):
  - orderId, customerId, customerName, customerEmail, customerPhone
  - staffId, billingAddress, additionalNotes
  - method ("online" | "offline"), status
  - deliveryMethod, deliveryDate
  - paymentMethod, paymentStatus
  - couponId, courierId, courierAddress
  - orderTotalPrice, staffUpdateCount
  - createdAt, updatedAt
  - orderItems: Array with the following fields:
    - orderItemId, orderId, productId, productVariantId, unlistedProductId (if any)
    - quantity, size, widthInch, heightInch
    - unitPrice, additionalPrice, discountPercentage, designCharge
    - price (final line total)
    - product: { productId, name, basePrice, sku }
    - productVariant: { productVariantId, productId, additionalPrice, variantDetails: [ { variationItem.value, variation.{name,unit} } ] }
    - In list endpoints (`getAllOrders`), `unlistedProduct` details are also included for POS unlisted items.
  - images: [ { imageId, imageName, ... } ]
  - payments: [ { paymentId, transactionId, paymentMethod, amount, paymentLink, isPaid, createdAt } ]

## Notes and Compatibility
- The new pricing breakdown fields on OrderItem are optional and nullable; legacy orders will continue to work without them.
- The UI can compute and display:
  - Unit Price
  - Additional Price (from variant or custom)
  - Discount (%)
  - Design Charge
  - Total (already persisted as `price` per line and `orderTotalPrice` at order level)
- Auto-assign logic continues to assign only agents when staffId is missing.
- For invoices/receipts: currently rendered by frontend using order + payment data (no server-side invoice generation).

## Validation
- The current `OrderMiddleware` does not validate the new pricing fields; they are accepted as part of `orderItems` payload (which is typed Any for creation and request creation). If you want strict validation, extend `orderItemsSchema` accordingly.

---
Last updated: 2025-10-09
