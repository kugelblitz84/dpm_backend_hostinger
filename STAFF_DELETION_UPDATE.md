# Deleted-Staff Update — Backend Behavior & Frontend Handling

Summary

- Deleting a staff now performs a soft-delete only (sets `isDeleted = true`) — no hard deletes.
- When a staff is deleted, all *incomplete* orders assigned to them (new requests and active orders) are automatically reassigned to another agent using the existing fair-random selector (`getFairRandomStaff`).
- Completed orders (status `order-completed`) are left unchanged.
- Earnings for reassigned orders are transferred implicitly by reassigning `order.staffId` — earnings are computed from `order.orderTotalPrice` × commissionPercentage of the (current) assigned staff. No immediate balance mutation is performed at deletion time.
- The staff listing endpoint supports showing deleted staff using the query param `includeDeleted=true`.

Why this change

- Prevents orphaned orders and preserves order data while ensuring live work continues without manual re-assignment.
- Keeps historical completed orders intact for audit/finance.
- Keeps the `Staff` table as the authoritative record (soft-delete) to support auditing and show deleted users in admin UI.

---

Backend behavior (what changed)

1. Soft-delete only
- The `DELETE /api/staff/:staffId` operation no longer removes the row from the `Staff` table. It updates `Staff.isDeleted = true` and returns a success response indicating a soft-delete.
- Deleted staff rows remain queryable and can be returned by calling the staff list with `?includeDeleted=true`.

2. Reassign incomplete orders
- After marking `isDeleted = true`, the backend finds all orders assigned to that staff that are in "incomplete" statuses (requested + active):
  - `order-request-received`, `consultation-in-progress`, `awaiting-advance-payment`, `advance-payment-received`, `design-in-progress`, `awaiting-design-approval`, `production-started`, `production-in-progress`, `ready-for-delivery`, `out-for-delivery`
- For each order, the service selects a replacement agent using the existing fair-random logic and updates `Order.staffId = <replacementStaffId>`.
- If a replacement cannot be found, the order is left unchanged (unassigned). Backend logs a warning in this case; you may want to add a fallback strategy.

3. Earnings
- Earnings are calculated as: `order.orderTotalPrice × (staff.commissionPercentage / 100)`, grouped by the month of the order's `createdAt`.
- Because reassignment changes `order.staffId`, future earnings reports will attribute the order to the new assignee (the earnings are effectively transferred to the new staff by reassignment).
- No immediate balance adjustments (e.g., moving money from deleted staff to new staff) are performed in the backend on deletion. If you need immediate balance transfers, ask and we can add explicit balance updates during reassignment.

4. Listing deleted staff
- `GET /api/staff?page=1&limit=20` (default) will exclude deleted staff (old behavior).
- To include deleted staff in the results, pass `includeDeleted=true`:
  - `GET /api/staff?page=1&limit=20&includeDeleted=true`
- Each staff object returned includes `isDeleted: true` for soft-deleted rows.

---

APIs and example requests/responses

1) Delete staff

Request

```
DELETE /api/staff/123
Authorization: Bearer <admin-token>
```

Success response (200)

```json
{
  "success": true,
  "message": "Staff soft-deleted successfully."
}
```

2) List staff (including deleted)

Request

```
GET /api/staff?page=1&limit=20&includeDeleted=true
Authorization: Bearer <admin-token>
```

Response fragment (important fields)

```json
{
  "success": true,
  "message": "Staff fetched successfully.",
  "staff": [
    {
      "staffId": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "agent",
      "commissionPercentage": 5,
      "isDeleted": true,
      "createdAt": "2024-06-01T12:00:00.000Z",
      "updatedAt": "2025-10-17T09:00:00.000Z"
    },
    ...
  ]
}
```

3) Order reassignment

- After deletion, incomplete orders previously assigned to the deleted staff will have their `order.staffId` updated to the new agent.
- The `Order` object format stays the same — only `staffId` changes for affected orders. Completed orders remain unchanged.

Example: Order before

```json
{
  "orderId": 555,
  "staffId": 123, // to be reassigned
  "status": "advance-payment-received",
  "orderTotalPrice": 2000,
  ...
}
```

Example: Order after deletion and reassignment

```json
{
  "orderId": 555,
  "staffId": 789, // replacement agent
  "status": "advance-payment-received",
  "orderTotalPrice": 2000,
  ...
}
```

---

Frontend responsibilities and recommended UI changes

1. Staff deletion flow (admin UX)

- Confirmation modal: When an admin deletes a staff, show an explicit confirmation modal that explains:
  - "This will deactivate the staff (`isDeleted = true`) and reassign all active and requested orders to other agents. Completed orders will remain assigned to this staff."
  - Provide a checkbox or extra confirmation step for critical roles.
- After successful deletion (200), the frontend should:
  - Refresh the staff list (call `GET /api/staff?page=...&includeDeleted=true` if showing deleted rows) and show the staff with `isDeleted=true` (some UI apps show a deleted badge or gray them out).
  - Refresh the orders list (or relevant agent’s orders) so the UI reflects reassignments.
  - Notify affected agents (if available) via in-app notifications or WebSocket messages (see Socket notes below).

2. Orders UI

- When showing orders lists or order detail, the frontend should always rely on the `staffId` returned by the API as the canonical assignee.
- If your UI caches order/assignee relationships, invalidate cache after deletion or subscribe to order-change events.
- Display a small audit hint in order details when the order was reassigned (optional):
  - "Previously assigned to John Doe — reassigned to Jane Smith on 2025-10-17". This requires extra audit metadata to be stored by the backend; if you want it, we can add a simple `OrderHistory` row when reassignment occurs.

3. Earnings UI (for staff/manager dashboards)

- Earnings calculations will now reflect the reassignment automatically because earnings are recomputed based on `order.staffId` and `order.orderTotalPrice`.
- Implication: If orders are reassigned, the earnings pages for both the deleted staff (if you still display their row) and the replacement staff will change accordingly. Make sure the frontend does not cache earnings data for long without refresh.
- Recommended: After staff deletion, refresh earnings dashboard for affected agents and for admin.

4. Staff list and deleted staff UI

- Use `includeDeleted=true` to show deleted staff when the admin navigates to a ‘Deleted staff’ or ‘All staff’ view.
- In the staff list, show `isDeleted` status, deactivated badge, and prevent actions that require an active staff (e.g., selecting as assignee in UI pickers). Treat `isDeleted === true` as not-selectable.

5. Reassignment edge cases

- No replacement agent available:
  - If the backend could not find a replacement (rare), orders may remain assigned to the deleted staff (if the code skips) or unassigned. The frontend should handle `staffId` = `null` or staff not found:
    - Display `Unassigned` in assignee column and surface an admin action to assign a staff manually.
- UI fallback: show `Unassigned` and a prominent `Assign agent` button that opens a staff picker (exclude `isDeleted=true` rows).

6. Real-time notifications (optional but recommended)

- The backend currently does not emit specific socket events for staff deletion or order reassignment. To make UX snappier, consider adding these events:
  - `staff-deleted` — carries `{ staffId, name }` to update staff lists in real time.
  - `order-reassigned` — carries `{ orderId, oldStaffId, newStaffId }` so the frontend can update order rows and notify affected agents.

7. Testing checklist for frontend

- Delete a staff with several incompleted orders:
  - Confirm staff shows `isDeleted=true` in `GET /api/staff?includeDeleted=true`.
  - Confirm incomplete orders are reassigned to other agents (`order.staffId` changes).
  - Confirm completed orders still show the pre-deletion staff in order details.
- If no replacement agent exists, confirm orders show `Unassigned` and the UI provides an assign action.
- Confirm earnings pages update after deletion/reassignment.

---

Developer notes & future enhancements

- Add `OrderHistory` audit table or a lightweight `orderReassignment` record so the UI can display previous assignee and reassignment timestamp.
- Add socket events (`staff-deleted`, `order-reassigned`) to notify clients in real time.
- Optionally implement immediate balance transfer for reassignments (if business requires moving already-paid commissions).
- Consider a manual override admin endpoint to bulk reassign or to reassign to a fallback staff if auto-selection fails.

---

Contact

If you want, I can also:
- Add the order reassignment audit records so the frontend can show "previous assignee" and a timestamp.
- Emit real-time socket events for staff deletion and order reassignment.
- Implement a fallback reassignment strategy (e.g., assign to a designated admin agent) when no replacement is found.

Last updated: 2025-10-17
