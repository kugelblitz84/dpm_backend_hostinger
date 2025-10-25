# Invoice Download (PDF) — Implementation Guide

This document describes the implementation details, deployment notes, and testing steps for the Invoice PDF download feature implemented in the backend. It is intended for developers who will maintain or extend the feature.

Contents
- Overview
- Files changed / new files
- Endpoints and route(s)
- Controller behavior
- PDF generation utility
- Environment & runtime requirements
- Testing and manual verification
- Production considerations and performance
- Error handling and logging
- Follow-ups / optional improvements

---

## Overview

The invoice download feature allows authenticated users (customers, staff, admins) to download a PDF version of an order invoice. The PDF matches the existing invoice layout and supports:

- Multi-page invoices
- Up to 6 products per page in the Order Details table
- Payments table rendering that avoids clipping; if needed payments are placed on their own page
- Header on every page, footer/signature on every page, and last-page NB + thank-you text

The feature renders invoice HTML on the server and uses Puppeteer to produce an A4 PDF which is returned as an attachment.

## Files changed / new files

- `src/utils/generateInvoicePDF.ts` — new/updated utility. Builds the invoice HTML and uses Puppeteer to render a PDF buffer.
- `src/controller/order.controller.ts` — added `downloadInvoice` method to fetch order, verify authorization, use the generator, and send the PDF.
- `src/routes/order.route.ts` — added route: `GET /order/:orderId/invoice` (protected by existing auth middleware and param validation middleware).
- `docs/invoice-download-implementation.md` — this documentation file.

## Endpoint(s)

Route (as added):

- GET /order/:orderId/invoice

Behavior:

- Requires authentication (middleware used in project): `authMiddleware.authenticate([...])`.
- If the requester is a customer, they may download invoices only for orders that belong to them (order.customerId check). Staff and admin may download any invoice.
- Returns `200` with a PDF binary and the `Content-Disposition: attachment; filename=invoice-<orderId>.pdf` header on success.

## Controller behavior (key points)

- Fetch the order by id using existing `orderService.getOrderById(orderId)`.
- Authorization: If request has `(req as any).customer`, verify `customerId` matches order.customerId; otherwise allow staff/admin.
- Lazy import the generator to avoid circular dependencies: the controller dynamically imports `../utils/generateInvoicePDF.js` and calls the default export to get a Buffer.
- Set `Content-Type: application/pdf` and `Content-Disposition` headers and send the buffer.

Code reference (high-level):

```ts
// controller snippet
const order = await this.orderService.getOrderById(orderId);
// auth check for customer
const generateInvoicePDF: any = (await import('../utils/generateInvoicePDF.js')).default;
const pdfBuffer: Buffer = await generateInvoicePDF(order);
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
res.send(pdfBuffer);
```

## PDF generation utility (`src/utils/generateInvoicePDF.ts`)

Responsibilities:

- Build complete HTML that visually corresponds to the React `Invoice` component and the provided screenshots.
- Split the order items into pages with at most 6 items per page.
- Ensure every page includes header and footer/signature markup.
- Add NB + thank-you block on the last page.
- Place payments either appended to the last page or on a dedicated page if the last page is nearly full (heuristic used: if last page has >= 5 items, payments go to a separate page).
- Use Puppeteer to convert HTML to PDF with A4 size and `printBackground: true`.

Key implementation notes:

- The generator constructs HTML by building an array of page blocks and concatenates them into a single HTML document. Each page includes the header and footer HTML.
- CSS includes `@page { size: A4; margin: 20mm; }` and uses `.page { page-break-after: always; }` so Puppeteer will produce multiple PDF pages.
- Images (logo) are referenced by absolute URL (the project uses `http://localhost:4000/static/static-images/logo.png` in development). In production, make sure this resolves publicly or use a CDN path.

Puppeteer launch options:

- The util accepts `process.env.CHROME_PATH` (optional) to set `executablePath` if you use a custom Chrome binary. Otherwise Puppeteer default is used.
- It launches headless Chrome with `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage` flags (safe for most Linux container hosts). Adjust flags per your hosting environment.

## Environment & runtime requirements

- Node.js environment where Puppeteer can run. In production you need Chrome/Chromium available. Options:
  - Install Puppeteer's bundled Chromium (npm i puppeteer). Puppeteer downloads Chromium by default (but check size / policy).
  - Or provide a system Chrome binary and set `CHROME_PATH` environment variable to that executable path. Example: `/var/www/chrome/linux-141.0.7390.122/chrome-linux64/chrome` (used historically in this repo).
- Ensure outbound network access from the server to fetch images used in the HTML if they are remote.

Required dependencies (package.json):

- puppeteer (or puppeteer-core + installed chrome). If not already in `package.json`, add it and install.

## Testing and manual verification

Local build and test:

1. Build project: `npm run build` (this was run successfully during implementation).
2. Start the server (use the same command you use in dev): e.g., `npm run dev` or the project's dev command.
3. Make an authenticated request to the route. Example using PowerShell's curl:

```powershell
curl -H "Authorization: Bearer <TOKEN>" -o invoice.pdf "http://localhost:4000/api/order/123/invoice"
```

Replace URL base and token mechanism with your project's configuration.

Manual checks:

- Open `invoice.pdf` in a PDF viewer (or browser). Verify:
  - Header is present on every page
  - Footer/signature exists on every page
  - Order Details table shows at most 6 items per page
  - Payments table appears either on the last page or on its own page (and not clipped)
  - The last page contains the NB text and the "Thank you for choosing Dhaka Plastic & Metal!" message

Automated sanity test (optional):

- Add a small integration test or script that calls the endpoint using a test order with more than 6 items and verifies the response `Content-Type` and that the returned buffer size is > 0.

## Production considerations and performance

- Puppeteer is CPU and memory intensive. If you expect many concurrent invoice generation requests, consider:
  - Generating invoices asynchronously (queue + worker) and returning a pre-signed URL when ready.
  - Caching generated PDFs (filesystem or object storage like S3) keyed by orderId + orderUpdatedAt, with invalidation when the order changes.
  - Rate-limiting invoice generation endpoints or using a job queue (Bull/Redis, etc.).
- Ensure the server has enough memory and CPU to run headless Chrome; small instances can crash if overloaded.
- If using Docker, ensure the image includes Chrome or that Puppeteer is configured to use installed Chromi