# Order Request Payloads and Unlisted-Product Invoice Guide

This guide documents how to create an order request (online) and how to handle listed vs unlisted products, plus practical instructions for rendering unlisted items on invoices.

- Audience: frontend and backend integrators
- Endpoints covered:
  - Online order request (customer/staff): `POST /api/order/create-request`
  - POS (staff) order create (supports unlisted): `POST /api/order/create`
- Auth roles:
  - `create-request`: admin, agent, designer, offline-agent, customer
  - `create`: admin, agent, designer, offline-agent
- Content type: `multipart/form-data`
  - Field `orderItems` must be a JSON string (the array shown below)
  - Optional file field: `designFiles` (0–5 files)

---

## 1) Online Order Request (listed products only)

Endpoint: `POST /api/order/create-request`

Notes:
- Supports only listed products (requires `productId` and often `productVariantId`).
- `orderTotalPrice` is computed server-side as the sum of each item's `price`.
- Payment method is set to `online-payment` with `paymentStatus = "pending"`.

### Request schema (fields)

- customerId: number | null (required)
- customerName: string (required)
- customerPhone: string (required)
- customerEmail?: string (optional)
- staffId: number | null (optional; fair auto-assign may pick an agent if omitted)
- billingAddress: string (required)
- additionalNotes: string (optional)
- deliveryMethod: "shop-pickup" | "courier" (required)
- couponId?: number (optional)
- courierId?: number, courierAddress?: string (optional pair)
- orderItems: Array of items (stringified JSON). Each item supports a pricing breakdown (all optional for backward compatibility):
  - productId: number (required for listed items)
  - productVariantId: number (optional if product has variants; required if variant chosen)
  - quantity: number (required)
  - size: number | null (optional; square feet)
  - widthInch: number | null (optional)
  - heightInch: number | null (optional)
  - unitPrice?: number | null
  - additionalPrice?: number | null
  - discountPercentage?: number | null
  - designCharge?: number | null
  - price: number (required final line total)

### Example payload (listed item)

```json
{
  "customerId": 1,
  "customerName": "Kugelblitz84",
  "customerPhone": "01986311047",
  "customerEmail": "user@example.com",
  "staffId": null,
  "billingAddress": "123 Sample Road, Dhaka",
  "additionalNotes": "Please call on arrival",
  "deliveryMethod": "shop-pickup",
  "couponId": null,
  "courierId": null,
  "courierAddress": null,
  "orderItems": [
    {
      "productId": 45,
      "productVariantId": 190,
      "quantity": 2,
      "size": 0,
      "widthInch": null,
      "heightInch": null,
      "unitPrice": 400,
      "additionalPrice": 50,
      "discountPercentage": 10,
      "designCharge": 0,
      "price": 810
    }
  ]
}
```

Behavior:
- Creates an order with `method = "online"`, `status = "order-request-received"`.
- `orderTotalPrice = sum(item.price)`.
- Response includes the created order and its `orderItems` (with `product`, `productVariant` and their details).

> Important: `create-request` does not currently support unlisted items. If you need unlisted items, use the POS `/api/order/create` flow below.

---

## 2) POS Create (supports unlisted products)

Endpoint: `POST /api/order/create`

Notes:
- Supports either listed or unlisted items.
- `orderTotal` (order-level) must be provided in the request and is saved to `orderTotalPrice`.
- If `amount > 0`, a COD payment row is created with `isPaid = true`.

### Request schema (fields)

- customerName, customerEmail, customerPhone (required)
- staffId: number | null (optional; fair auto-assign may pick an agent if omitted)
- billingAddress (required)
- additionalNotes (optional)
- deliveryMethod: "shop-pickup" | "courier" (required)
- deliveryDate: ISO string | null
- paymentMethod: "cod-payment" | "online-payment" (required)
- paymentStatus: "pending" | "partial" | "paid"
- amount: number (required; upfront paid amount)
- orderTotal: number (required; saved as `orderTotalPrice`)
- couponId?: number
- courierId?: number, courierAddress?: string
- orderItems: Array of items (stringified JSON)

### 2.1 Listed item example (POS)

```json
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
```

### 2.2 Unlisted item example (POS)

The POS flow treats an item as "unlisted" when `unlistedProductId` is truthy and expects a `product` object with the details to persist a new `UnlistedProduct` row.

Required for unlisted:
- `unlistedProductId`: any truthy value (flag)
- `product`: object with:
  - `name`: string (required)
  - `description`: string (required)
  - `basePrice`: number (required)
  - `pricingType`: "flat" | "square-feet" (required)

Other item fields (for invoice):
- `quantity`, `widthInch`, `heightInch`, optional `size`
- `unitPrice`, `additionalPrice`, `discountPercentage`, `designCharge`, `price`

Example:

```json
{
  "unlistedProductId": true,
  "product": {
    "name": "Custom Acrylic Sheet",
    "description": "3mm clear acrylic cut-to-size",
    "basePrice": 500,
    "pricingType": "square-feet"
  },
  "quantity": 2,
  "widthInch": 12,
  "heightInch": 24,
  "size": 2,
  "unitPrice": 500,
  "additionalPrice": 0,
  "discountPercentage": 0,
  "designCharge": 0,
  "price": 2000
}
```

Behavior:
- Backend creates a new `UnlistedProduct` using the provided `product` object.
- Then persists an `OrderItem` linked via `unlistedProductId` and your per-item breakdown + dimensions.

> If the `product` object is missing or incomplete, the server cannot create the unlisted product and will skip persisting the item, resulting in an order with `orderItems: []`.

---

## 3) Where the invoice gets unlisted product info

- For endpoints that include items (recommended):
  - `GET /api/order/:id` (service: `getOrderById`) – includes `orderItems.unlistedProduct`
  - `GET /api/order` (service: `getAllOrders`) – includes `orderItems.unlistedProduct`
- `GET /api/order/customer/:customerId` currently does not include `unlistedProduct` on items.

### Response shape (relevant fragment)

```json
{
  "orderItems": [
    {
      "orderItemId": 123,
      "productId": null,
      "unlistedProductId": 268422,
      "productVariantId": null,
      "quantity": 2,
      "size": 2,
      "widthInch": 12,
      "heightInch": 24,
      "unitPrice": 500,
      "additionalPrice": 0,
      "discountPercentage": 0,
      "designCharge": 0,
      "price": 2000,
      "unlistedProduct": {
        "unlistedProductId": 268422,
        "name": "Custom Acrylic Sheet",
        "description": "3mm clear acrylic cut-to-size",
        "basePrice": 500,
        "pricingType": "square-feet",
        "createdAt": "...",
        "updatedAt": "..."
      }
    }
  ]
}
```

---

## 4) How to render unlisted products on the invoice

Use the same table structure as listed items, but pull name/description from `unlistedProduct` and dimensions/prices from the `OrderItem` itself.

- Description (name):
  - `const name = item.product?.name ?? item.unlistedProduct?.name ?? "Item";`
- Description (long text):
  - Prefer `item.unlistedProduct?.description` for unlisted items.
- Dimensions:
  - Show `(W inch x H inch)` when `widthInch` and `heightInch` are present.
  - Show `(<size> sq.ft)` when `size > 0`. If size is omitted and `pricingType === "square-feet"`, you may compute:
    - `sizeSqFt = (Number(widthInch) * Number(heightInch)) / 144`
- Unit Price (discounted):
  - If breakdown exists: `unitNet = (unitPrice + additionalPrice) * (1 - discountPercentage/100)`
  - Else fallback: `unitNet = price / Math.max(1, quantity)`
- Line Total:
  - Always display `price` (server-persisted final line total)
- Aggregates (right panel):
  - Unit Base: `sum(unitPrice * quantity)`
  - Additional: `sum(additionalPrice * quantity)`
  - Item Discount: `sum((unitPrice + additionalPrice) * quantity * discountPercentage/100)`
  - Design Charge: `sum(designCharge)`

> Frontend should parse numeric fields with `Number(...)` to guard against stringified decimals.

---

## 5) Common pitfalls and validations

- Online `create-request` does NOT support unlisted items. Use POS `/api/order/create` for unlisted.
- For POS unlisted items, the `product` object is required (name, description, basePrice, pricingType). Missing this results in `orderItems: []` for the order.
- Ensure at least one item is present; otherwise, invoices will have no detail rows.
- When using `courierId`, also provide `courierAddress` (and vice versa) or set both to null.
- For COD in POS flow, provide `amount` (paid at creation) and `orderTotal` (total due). `paymentStatus` should reflect paid vs due.

---

## 6) Quick test matrix

- Listed (online): create-request with `productId`/`productVariantId`, includes breakdown and final `price` – expect items in response and invoice renders product name and variant details.
- Unlisted (POS): create with `unlistedProductId: true` and full `product` object + dimensions + pricing – expect `orderItems[].unlistedProduct` populated and invoice renders name/description/dimensions.
- Legacy items (no breakdown): ensure invoice falls back to `price/quantity` for unit and zeroes for aggregates.

---

Last updated: 2025-10-10
