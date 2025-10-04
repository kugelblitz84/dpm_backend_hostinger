# Frontend Integration: Offline Agent Role

The new staff role `offline-agent` has the same privileges and earnings system as `agent`, with one difference: offline-agents are excluded from the automatic order assignment system. They can still be explicitly assigned to orders.

## Summary
- Role key: `offline-agent`
- Privileges: identical to `agent` throughout the API (order management, updates, etc.)
- Auto-assign: excluded (system only auto-assigns `agent` role)
- Earnings: identical to `agent` in the existing commission-based model
- Authentication: Bearer JWT, accepted wherever `agent` was accepted

## Endpoints impacted

- Authentication/Authorization
  - All endpoints that previously authorized `agent` now also accept `offline-agent`.
  - Example: Orders and Earnings endpoints include offline-agent in allowed roles.

- Orders
  - Creating/updating/listing orders: same as `agent`.
  - Auto-assignment (when `staffId` is not provided): still selects role = `agent` only.
  - RBAC filtering in list endpoints: offline-agent sees only their own orders, same as agent.

- Earnings
  - Commission-based earnings: treated as an agent.
  - Designer-distribution earnings mode: applies to designers only; offline-agent will see zeroes by design.

## UI Considerations
- Wherever role filters are present, include `offline-agent` as a selectable role.
- In staff creation/edit forms, add the new role option.
- On order creation pages, if auto-assignment is used, inform that the system selects from online `agent` only; offline-agents can be assigned manually.

## Request/Response Adjustments
- Staff objects will now have `role` possibly equal to `offline-agent`.
- Validation: Ensure frontend sends `role: "offline-agent"` when creating/updating such staff.
- No schema changes required on the frontend.

## Example
- Create staff (admin panel):
```
POST /api/staff/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "017XXXXXXXX",
  "password": "********",
  "role": "offline-agent",
  "commissionPercentage": 2
}
```

- List staff with role filter:
```
GET /api/staff?role=offline-agent
```

- Earnings (commission model):
```
GET /api/earning/monthly
# Same as agent; role accepted: admin, agent, designer, offline-agent
```

Notes:
- No automatic exclusion from order visibility: offline-agents see only their own orders like agents.
- Auto-assignment excludes offline-agents and designers by design.