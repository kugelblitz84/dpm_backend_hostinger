# Frontend Integration: Staff Monthly Earnings

This document explains how to integrate the new Monthly Earnings feature for Admins and Staff.

## Base URL
- All routes are prefixed with your server URL prefix from `dotenv.config.ts` (typically `/api`).
- Endpoint path: `/api/earning/monthly`

## Auth
- Uses existing Bearer JWT auth.
- Allowed roles: `admin`, `agent`, `designer`.
- Behavior:
  - Admin gets monthly earnings for all staff.
  - Agent/Designer gets only their own monthly earnings.

## Request
- Method: GET
- URL: `/api/earning/monthly`
- Headers: `Authorization: Bearer <token>`

## Response
- Success (200):
```
{
  "message": "Monthly earnings fetched successfully.",
  "data": {
    "role": "admin" | "agent" | "designer",
    "data": [ ... ] | { ... }
  }
}
```

### When role = admin
- `data` is an array with one entry per staff:
```
[
  {
    "staff": {
      "staffId": number,
      "name": string,
      "role": "agent" | "designer",
      "commissionPercentage": number,
      "designCharge": number | null,
      "joinedAt": string (ISO date)
    },
    "ongoingMonth": number,        // Commission for current month
    "allTimeTotal": number,        // Sum of all months (commission)
    "history": [                   // Chronological by month from joinedAt to current month
      { "month": "YYYY-MM", "total": number },
      ...
    ]
  },
  ...
]
```

### When role = agent/designer
- `data` is a single object with the same shape as each array item above.

## UI Suggestions
- Show a header with current month commission (`ongoingMonth`).
- Render a line/bar chart from `history`.
- Display a summary card: `allTimeTotal` and `commissionPercentage`.
- For Admin, provide a staff switcher or table view. Each row shows:
  - Staff name, role
  - Current month commission
  - All-time total
  - Expand to view monthly history

## Notes & Assumptions
- Commission uses current `commissionPercentage` from the Staff profile for all historical payments (schema has no snapshot at payment time).
- Only `isPaid = true` payments are counted.
- Monthly grouping is based on `Payment.createdAt` month.
- Staff joining month = `Staff.createdAt`. If the first payment occurred later, range starts from the first payment month.

## Error Responses
- 401 Unauthorized (missing/invalid token)
- 404 For staff self-view when staff record is not found

## Example Usage (Pseudo)
```ts
const res = await fetch(`/api/earning/monthly`, {
  headers: { Authorization: `Bearer ${token}` }
});
const body = await res.json();
if (res.ok) {
  if (body.data.role === 'admin') {
    const list = body.data.data; // array
    // render table
  } else {
    const me = body.data.data; // object
    // render single dashboard
  }
} else {
  // show body.message
}
```

---
If you need CSV export or a specific chart-ready format, let us know and we can add a dedicated endpoint.