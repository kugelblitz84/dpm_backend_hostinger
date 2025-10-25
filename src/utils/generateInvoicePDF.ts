import puppeteer from "puppeteer";

type OrderItem = any;
type Payment = any;

const formatCurrency = (v: number | string) => {
	const n = Number(v || 0);
	return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const escapeHtml = (str: any) => {
	if (str == null) return "";
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
};

const buildInvoiceHTML = (order: any) => {
	const items: OrderItem[] = order.orderItems || [];
	const payments: Payment[] = order.payments || [];
	const itemsPerPage = 6;
	const totalItemPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

	const company = {
		name: "Dhaka Plastic & Metal",
		phone: "+8801919960198",
		phone2: "+8801858253961",
		email: "info@dpmsign.com",
		address: "Shop No: 94 & 142, Dhaka University Market, Katabon Road, Dhaka-1000",
		logo: process.env.INVOICE_LOGO_URL || "http://localhost:4000/static/static-images/logo.png",
	};

	const invoiceNo = order.orderId;
	const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "";
	const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "";

	const currency = order.currencyCode || order.currency || 'BDT';
	const displayCurrency = /bdt|tk/i.test(String(currency)) ? 'Tk' : String(currency);
	// Financial calculations (mirror frontend logic)
	const toNum = (v: unknown) => {
		const n = Number(v);
		return Number.isFinite(n) ? n : 0;
	};

	const computedSubTotal = items.reduce((s, it) => s + toNum(it.price || 0), 0);
	const subTotal = computedSubTotal > 0 ? computedSubTotal : toNum(order.orderTotalPrice || order.totalAmount || 0);

	// Grand total (prefer coupon-checked price if provided on order)
	const grandTotal = toNum(order.orderTotalCouponCheckedPrice ?? order.grandTotal ?? order.orderTotalPrice ?? order.totalAmount ?? 0);

	const agg = items.reduce(
		(acc, it) => {
			const qty = Math.max(1, toNum(it.quantity));
			const unit = toNum(it.unitPrice);
			const addl = toNum(it.additionalPrice);
			const discPct = toNum(it.discountPercentage);
			const design = toNum(it.designCharge);
			const unitBase = unit * qty;
			const addlBase = addl * qty;
			const discountAmt = (unit + addl) * qty * (discPct / 100);
			return {
				unitBaseTotal: acc.unitBaseTotal + unitBase,
				additionalTotal: acc.additionalTotal + addlBase,
				itemDiscountTotal: acc.itemDiscountTotal + discountAmt,
				designChargeTotal: acc.designChargeTotal + design,
			};
		},
		{ unitBaseTotal: 0, additionalTotal: 0, itemDiscountTotal: 0, designChargeTotal: 0 }
	);

	const discountAmount = Math.ceil(Math.max(0, subTotal - grandTotal));

	const totalPaidAmount = (payments || []).reduce(
		(acc, curr) => acc + ((curr.isPaid || curr.paymentMethod === "cod-payment") ? toNum(curr.amount) : 0),
		0
	);

	const amountDue = Math.max(0, grandTotal - totalPaidAmount);

	const staffName = order.staffName || order.staff?.name || order.agentInfo?.name || "";
	const staffPhone = order.staffPhone || order.staff?.phone || order.agentInfo?.phone || order.agentInfo?.contactNo || "";
	const courierName = order.courierName || order.courier?.name || "";

    const renderHeader = () => {
		return `
			<div class="inv-header">
				<div class="left">
					<img src="${company.logo}" alt="logo" class="logo" />
					<div class="company-block">
						<div class="company-name">${company.name}</div>
						<div class="company-tag">Your Trusted Business Partner for Branding Solutions.</div>
						<div class="email-link">info@dpmsign.com <span class="company-tag"> | </span> www.dpmsign.com </div>
					</div>
				</div>
				<div class="right">
					<div class="invoice-title">INVOICE</div>
					<div class="invoice-no">DPM-${invoiceNo}</div>
					<div class="small">Order Date: ${orderDate || '-'}</div>
					<div class="small">Delivery Date: ${deliveryDate || '-'}</div>
				</div>
			</div>
		`;
	};

	const renderFooter = () => {
		return `
			<div class="inv-footer">
				<div class="footer-top">
					<div class="nb">
						<div><b>NB: Delivery and Installation charges are the customer's responsibility (if applicable).</b></div>
						<div>Thank you for choosing Dhaka Plastic & Metal!</div>
					</div>
					<div class="staff-block">
						<div class="staff-name">${escapeHtml(staffName || '')}</div>
						<div class="staff-phone">${escapeHtml(staffPhone || '')}</div>
						<div class="sig-line"></div>
						<div class="sig-label">Authorized Signature</div>
						<div class="sig-for">For Dhaka Plastic & Metal</div>
					</div>
				</div>
				<div class="footer-divider"></div>
				<div class="contact-row">
					<div class="col left">
						<div>${company.phone}</div>
						<div>${company.phone2}</div>
					</div>
					<div class="col center">${company.email}</div>
					<div class="col right">${company.address}</div>
				</div>
			</div>
		`;
	};

	const renderItemsTable = (pageIndex: number) => {
		const start = pageIndex * itemsPerPage;
		const pageItems = items.slice(start, start + itemsPerPage);
		const rows = pageItems
			.map((it, idx) => {
				const productName = it.unlistedProduct?.name || it.product?.name || "Item";
				const details = (it.productVariant?.variantDetails || []) as any[];
				const detailLabels = details
					.map((detail: any) => {
						const varName = detail?.variationItem?.variation?.name || "";
						const varUnit = detail?.variationItem?.variation?.unit || "";
						const val = detail?.variationItem?.value || "";
						return varName ? `${varName}: ${val} ${varUnit}` : String(val || "");
					})
					.filter(Boolean)
					.join("; ");

				const sizeNum = toNum(it.size);
				const sizeLabel = Number.isFinite(sizeNum) && sizeNum > 0 && it.widthInch != null && it.heightInch != null ? ` (${it.widthInch} inch x ${it.heightInch} inch)` : "";

				const qty = Math.max(1, toNum(it.quantity));
				const unitBase = toNum(it.unitPrice) + toNum(it.additionalPrice);
				const discPct = toNum(it.discountPercentage);
				const hasBreakdown = unitBase > 0 || discPct > 0;
				const fallback = qty ? toNum(it.price) / qty : 0;
				const unitNet = hasBreakdown ? unitBase * (1 - discPct / 100) : fallback;
				const price = toNum(it.price);

				return `<tr>
					<td class="tcenter">${start + idx + 1}</td>
					<td><div class="item-title">${productName}${sizeLabel}</div>${detailLabels ? `<div class="item-variant">${detailLabels}</div>` : ''}${it.unlistedProduct?.description ? `<div class="item-desc">${escapeHtml(it.unlistedProduct.description)}</div>` : ''}</td>
					<td class="tcenter">${qty}${qty > 1 ? ' pcs' : ' pc'}</td>
					<td class="tright">${formatCurrency(unitNet)} ${displayCurrency}</td>
					<td class="tright">${formatCurrency(price)} ${displayCurrency}</td>
				</tr>`;
			})
			.join("\n");

		return `
			<table class="items">
				<thead>
						<tr>
							<th class="col-sn">S/N</th>
							<th class="col-desc">DESCRIPTION</th>
							<th class="col-qty">QTY / SQFT</th>
							<th class="col-unit">UNIT PRICE</th>
							<th class="col-total">TOTAL</th>
						</tr>
				</thead>
				<tbody>
					${rows}
				</tbody>
			</table>
		`;
	};

	const renderPayments = () => {
		if (!payments || payments.length === 0) return "";
		const rows = payments
			.map((p: any, i: number) => {
				const method = p.paymentMethod || p.method || "";
				const status = p.isPaid ? 'paid' : 'pending';
				const amt = toNum(p.amount);
				return `<tr>
					<td class="tcenter">${i + 1}</td>
					<td>${escapeHtml(method)}</td>
					<td class="tcenter status ${status}">${status}</td>
					<td class="tright">${formatCurrency(amt)} ${displayCurrency}</td>
				</tr>`;
			})
			.join('\n');

		return `
			<div class="section-title">Payment Details</div>
			<table class="payments">
				<thead>
					<tr>
						<th class="col-pay-sn">#</th>
						<th class="col-pay-method">Payment Method</th>
						<th class="col-pay-status">Status</th>
						<th class="col-pay-amount">Amount Paid</th>
					</tr>
				</thead>
				<tbody>
					${rows}
				</tbody>
			</table>
		`;
	};

	const renderBillShip = () => {
		return `
			<div class="invoice-meta">
				<div class="bill-left">
					<div class="meta-title">Billing Information:</div>
					<div>${escapeHtml(order.customerName || order.customer?.name || '')}</div>
					<div>${escapeHtml(order.customerPhone || order.customer?.phone || '')}</div>
					<div>${escapeHtml(order.customerEmail || order.customer?.email || '')}</div>
					<div>${escapeHtml(order.billingAddress || order.customer?.billingAddress || '')}</div>
				</div>
				<div class="bill-right">
					<div class="meta-title">Shipping Information:</div>
					<div>${escapeHtml(order.deliveryMethod === 'courier' ? (courierName || 'Courier') : 'Shop Pickup')}</div>
					<div>${escapeHtml(order.courierAddress || '')}</div>
				</div>
			</div>
		`;
	};

	// Figure out last-page layout constraints before building pages
	const lastPageItemCount = items.length === 0 ? 0 : (items.length % itemsPerPage || itemsPerPage);
	const moveSummaryToExtra = lastPageItemCount >= 5; // keep summary off a very full page
	const allowedPaymentsByItems: Record<number, number> = { 0: 10, 1: 8, 2: 7, 3: 5, 4: 3, 5: 1, 6: 0 };
	const allowedPaymentsOnLastWithSummary = Math.max(0, (allowedPaymentsByItems[lastPageItemCount] ?? 0) - 1);
	const allowedPaymentsOnLastNoSummary = (allowedPaymentsByItems[lastPageItemCount] ?? 0);
	const movePaymentsToExtra = payments.length > 0 && (
		(moveSummaryToExtra && payments.length > allowedPaymentsOnLastWithSummary) ||
		(!moveSummaryToExtra && payments.length > allowedPaymentsOnLastNoSummary)
	);

	const pages: string[] = [];

	for (let i = 0; i < totalItemPages; i++) {
		const isLastPage = i === totalItemPages - 1;

		let afterTableBlocks = '';
		if (isLastPage) {
			const totalPaidLabel = `Amount Paid: ${formatCurrency(totalPaidAmount)} ${displayCurrency}`;
			const amountDueLabel = `Amount Due: ${formatCurrency(amountDue)} ${displayCurrency}`;
			const summaryHtml = `
				<div class="summary-wrap">
					<div class="summary-box">
						<div class="row"><span>Sub Total</span><span>${formatCurrency(subTotal - agg.designChargeTotal + discountAmount)} ${displayCurrency}</span></div>
						<div class="row"><span>Design Charge</span><span>${formatCurrency(agg.designChargeTotal)} ${displayCurrency}</span></div>
						<div class="row"><span>Discount</span><span>${formatCurrency(discountAmount)} ${displayCurrency}</span></div>
						<div class="grand-row"><span>GRAND TOTAL</span><span>${formatCurrency(grandTotal)} ${displayCurrency}</span></div>
					</div>
				</div>`;
			const paymentsHtml = payments && payments.length > 0 ? `
				<div class="payments-wrap">
					${renderPayments()}
					<div class="paid-due">
						<div class="paid">${totalPaidLabel}</div>
						<div class="due">${amountDueLabel}</div>
					</div>
				</div>` : `
				<div class="paid-due single">
					<div class="due">${amountDueLabel}</div>
				</div>`;
			const summaryBlock = moveSummaryToExtra ? '' : summaryHtml;
			const paymentsBlock = movePaymentsToExtra ? '' : paymentsHtml;
			afterTableBlocks = `${summaryBlock}${paymentsBlock}`;
		}

		const pageHtml = `
			<div class="page">
				${renderHeader()}
				<div class="content">
					${i === 0 ? renderBillShip() : ''}
					<div class="section-title">Order Details</div>
					${renderItemsTable(i)}
					${afterTableBlocks}
				</div>
				${renderFooter()}
			</div>
		`;

		pages.push(pageHtml);
	}

	// If the last page is too full or payments would clip, move blocks to a new page
	if (moveSummaryToExtra || movePaymentsToExtra) {
		const extraPageInner: string[] = [];
		if (moveSummaryToExtra) {
			extraPageInner.push(`
			<div class="summary-wrap">
				<div class="summary-box">
					<div class="row"><span>Sub Total</span><span>${formatCurrency(subTotal)} ${displayCurrency}</span></div>
					<div class="row"><span>Design Charge</span><span>${formatCurrency(agg.designChargeTotal)} ${displayCurrency}</span></div>
					<div class="row"><span>Discount</span><span>${formatCurrency(discountAmount)} ${displayCurrency}</span></div>
					<div class="grand-row"><span>GRAND TOTAL</span><span>${formatCurrency(grandTotal)} ${displayCurrency}</span></div>
				</div>
			</div>`);
		}
		if (movePaymentsToExtra) {
			extraPageInner.push(`
			<div class="payments-wrap">
				${renderPayments()}
				<div class="paid-due">
					<div class="paid">Amount Paid: ${formatCurrency(totalPaidAmount)} ${displayCurrency}</div>
					<div class="due">Amount Due: ${formatCurrency(amountDue)} ${displayCurrency}</div>
				</div>
			</div>`);
		}
		const extraPage = `
			<div class="page">
				${renderHeader()}
				<div class="content">
					<div class="section-title">Order Details</div>
					${extraPageInner.join('\n')}
				</div>
				${renderFooter()}
			</div>`;
		pages.push(extraPage);
	}

	const html = `
		<html>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<style>
					@page { size: A4; margin: 5mm 7mm; }
					:root{
						--blue:#0b5fa5;
						--blue-dark:#0a4f8a;
						--border:#d8e2ef;
						--text:#1a1a1a;
						--muted:#6b7280;
					}
					body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; margin:0; padding:0; color:var(--text); }
					.page { width: 100%; page-break-after: always; display:flex; flex-direction:column; min-height: calc(100vh ); }
					/* Header */
					.inv-header { display:flex; justify-content:space-between; align-items:center; padding:6px 0 10px; border-bottom:2px solid var(--blue); }
					.inv-header .left { display:flex; align-items:center; gap:12px; }
					.logo { width:70px; height:70px; object-fit:contain; }
					.company-block { line-height:1.15; }
					.company-name { font-weight:800; font-size:18px; color:var(--blue-dark); }
					.company-tag { font-size:12px; color:var(--muted); }
					.company-tag.small { font-size:11px; }
					.inv-header .right { text-align:right; }
					.invoice-title { font-weight:800; color:var(--blue); font-size:16px; letter-spacing:0.5px; }
					.invoice-no { font-weight:700; color:#111; }
					.small { font-size:11px; color:var(--muted); }
					.email-link {color: darkblue; font-size: 12px;}
					.content { padding:10px 0 0; flex:1 0 auto; }
					.section-title { font-weight:700; color:var(--blue); margin:10px 0 8px; font-size:13px; text-transform:uppercase; }

					/* Billing/Shipping */
					.invoice-meta { display:flex; justify-content:space-between; gap:16px; padding:8px 0 6px; }
					.bill-left, .bill-right { width:50%; font-size:12px; border:1px solid var(--border); border-radius:6px; padding:8px 10px; }
					.meta-title { font-weight:700; color:var(--blue-dark); margin-bottom:6px; font-size:12px; }

					/* Table */
					table { width:100%; border-collapse:separate; border-spacing:0; }
					table.items { border:1px solid var(--blue); border-radius:8px; overflow:hidden; }
					table.items thead th { background:var(--blue); color:#fff; font-weight:700; font-size:12px; padding:8px 8px; border-right:1px solid rgba(255,255,255,0.2); }
					table.items thead th:last-child{ border-right:0; }
					table.items tbody td { padding:10px 8px; border-top:1px solid var(--border); font-size:12px; word-break:break-word; }
					.col-sn{ width:44px; text-align:center; }
					.col-desc{ width:auto; }
					.col-qty{ width:100px; text-align:center; }
					.col-unit{ width:150px; text-align:right; }
					.col-total{ width:120px; text-align:right; }
					.muted{ font-weight:400; opacity:.9; }
					.tcenter { text-align:center; }
					.tright { text-align:right; }
					.item-variant { font-size:11px; color:#5f6c7b; margin-top:3px; }
					.item-desc { font-size:11px; color:#4b5563; margin-top:4px; }
					.item-title { font-weight:600; color:#111827; }

					/* Summary */
					.summary-wrap{ display:flex; justify-content:flex-end; margin-top:12px; }
					.summary-box{ width:320px; border:1px solid var(--blue); border-radius:8px; overflow:hidden; font-size:12px; }
					.summary-box .row{ display:flex; justify-content:space-between; padding:8px 10px; border-bottom:1px solid var(--border); }
					.summary-box .grand-row{ display:flex; justify-content:space-between; padding:10px; background:var(--blue); color:#fff; font-weight:800; }

					/* Payments */
					.payments-wrap{ margin-top:12px; }
					table.payments{ border:1px solid var(--blue); border-radius:8px; overflow:hidden; width:100%; border-collapse:separate; border-spacing:0; }
					.payments thead th { background:var(--blue); color:#fff; border-right:1px solid rgba(255,255,255,0.2); padding:8px 10px; font-size:12px; text-align:left; }
					.payments thead th:last-child{ border-right:0; }
					.payments tbody td { padding:9px 10px; border-bottom:1px solid var(--border); font-size:12px; word-break:break-word; }
					.col-pay-sn{ width:60px; text-align:center; }
					.col-pay-method{ width:auto; }
					.col-pay-status{ width:140px; text-align:center; }
					.col-pay-amount{ width:160px; text-align:right; }
					.status.paid{ color:#0a7f2e; font-weight:700; text-transform:capitalize; }
					.status.pending{ color:#b45309; font-weight:700; text-transform:capitalize; }
					.paid-due{ display:flex; justify-content:space-between; margin-top:8px; font-weight:700; }
					.paid-due.single{ justify-content:flex-end; }
					.paid{ color:#0a7f2e; }
					.due{ color:#111; }

					/* Footer */
					.inv-footer { border-top:none; padding-top:10px; margin-top:auto; }
					.footer-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
					.inv-footer .nb{ max-width:65%; font-size:12px; color:#111; display:none; }
					.page:last-child .inv-footer .nb{ display:block; }
					.nb b{ font-weight:800; }
					.staff-block{ text-align:right; min-width:220px; }
					.staff-name{ font-weight:700; }
					.staff-phone{ font-size:12px; color:#374151; margin-bottom:6px; }
					.sig-line{ width:180px; height:1px; background:#999; margin-left:auto; }
					.sig-label{ font-size:11px; color:#333; margin-top:4px; }
					.sig-for{ font-size:11px; color:#555; }
					.footer-divider{ height:1px; background:#9aa4b2; margin:10px 0 6px; opacity:.6; }
					.contact-row{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; font-size:11px; color:#334155; }
					.contact-row .col{ flex:1; }
					.contact-row .center{ text-align:center; }
					.contact-row .right{ text-align:right; }
				</style>
			</head>
			<body>
				${pages.join('\n')}
			</body>
		</html>
	`;

	return html;
};

const generateInvoicePDF = async (order: any) => {
	let browser: any = null;
	try {
		const launchOptions: any = {
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
		};
		if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;

		try {
			browser = await puppeteer.launch(launchOptions);
		} catch (err) {
			// Fallback to default launch
			browser = await puppeteer.launch({ headless: true });
		}

		const page = await browser.newPage();
		await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

		const html = buildInvoiceHTML(order);
		await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
		const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
		await browser.close();
		return pdfBuffer;
	} catch (error) {
		if (browser) try { await browser.close(); } catch {};
		throw error;
	}
};

export { generateInvoicePDF };
