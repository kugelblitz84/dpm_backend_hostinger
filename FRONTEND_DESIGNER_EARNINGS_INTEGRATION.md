# Frontend Integration: Designer Monthly Earnings (Distributed by Orders)

This doc covers the designer-specific earnings model where monthly total orders are equally distributed among active designers. Each designer’s earning for a month is:

earning = (totalOrdersInMonth / activeDesignersInMonth) * designCharge

- active designers for a month: Staff with role='designer', isDeleted=false, and createdAt <= end of that month
- totalOrdersInMonth: Count of Orders created in that month with status != 'order-canceled'

## Endpoint
- GET `/api/earning/monthly?mode=designer-distribution`
- Auth: Bearer token
- Roles: `admin`, `agent`, `designer`

Behavior:
- Admin: returns array of all designers with their monthly histories.
- Staff (agent/designer): returns only the authenticated staff’s entry. For agents, the result will be empty or zeroes since designCharge applies to designers.

## Response
- 200 OK
```
{
  "message": "Monthly earnings fetched successfully.",
  "data": {
    "role": "admin" | "agent" | "designer",
    "mode": "designer-distribution", // only present for staff responses
    "data": [ ... ] | { ... }
  }
}
```

Each designer entry:
```
{
  "staff": {
    "staffId": number,
    "name": string,
    "role": "designer",
    "designCharge": number,
    "joinedAt": string (ISO)
  },
  "ongoingMonth": number,         // current month earning
  "allTimeTotal": number,         // sum of monthly earnings from join month to now
  "history": [
    {
      "month": "YYYY-MM",
      "totalOrders": number,               // total orders created this month (not canceled)
      "activeDesigners": number,           // designers active for this month
      "distributedOrdersPerDesigner": number, // totalOrders / activeDesigners
      "earning": number                    // distributedOrdersPerDesigner * designCharge
    },
    ...
  ]
}
```

## UI Suggestions
- Show top KPIs: current month earning, designCharge, activeDesigners for current month.
- Chart earnings over time using history.month vs earning.
- For Admin: table listing designers with current month earning, allTimeTotal, and an expandable monthly breakdown.

## Notes
- Designers who join midway are counted from their join month onward.
- If a month has zero active designers (unlikely), earnings are zero to avoid divide-by-zero.
- Order counts use Order.createdAt month and exclude status 'order-canceled'.
- This does not mutate balances; it is a reporting model. If you later want to credit balances, we can add a ledger or snapshot logic.

## Examples
Fetch as Admin:
`GET /api/earning/monthly?mode=designer-distribution`

Fetch as Designer:
`GET /api/earning/monthly?mode=designer-distribution`

---
If you need CSV export or a summary endpoint (e.g., only current month), we can add it.