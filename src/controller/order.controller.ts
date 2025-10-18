// order.controller.ts
import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";
import { Op, Order, WhereOptions } from "sequelize";
import OrderService from "../service/order.service";
import OrderModel, { OrderAttributes } from "../model/order.model"; // Documentation: Corrected import for Order model class
import OrderItem from "../model/order-item.model"; // Documentation: Imported OrderItem model class
import CartService from "../service/cart.service";
import path from "path";
import fs from "fs";
import { io } from "../server";
import PaymentService from "../service/payment.service";
import TransactionService from "../service/transaction.service";
import { frontendLandingPageUrl } from "../config/dotenv.config";
import StaffService from "../service/staff.service";
import CustomerService from "../service/customer.service"; // Documentation: Re-added working CustomerService import
import EmailService from "../service/email.service";

class OrderController {
	private orderService: OrderService;
	private paymentService: PaymentService;
	private transactionService: TransactionService;
	private cartService: CartService;
	private staffService: StaffService;
	private customerService: CustomerService; // Documentation: Declared customerService property
	private emailService: EmailService;
	constructor() {
		this.orderService = new OrderService();
		this.paymentService = new PaymentService();
		this.transactionService = new TransactionService();
		this.cartService = new CartService();
		this.staffService = new StaffService();
		this.customerService = new CustomerService(); // Documentation: Initialized customerService
		this.emailService = new EmailService();
	}

	createOrder = async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Debug: log incoming request staffId and validated payload
			console.log(
				"[OrderController.createOrder] incoming validated staffId:",
				(req as any).validatedValue?.staffId,
			);
			console.log(
				"[OrderController.createOrder] validated payload:",
				(req as any).validatedValue,
			);
			if ((req as any).fileValidationError) {
				return responseSender(
					res,
					400,
					(req as any).fileValidationError,
				);
			}

			// Accept orderItems as array (not string) for JSON requests, and parse if string (multipart)
			let orderItems = (req as any).validatedValue.orderItems;
			if (typeof orderItems === "string") {
				try {
					orderItems = JSON.parse(orderItems);
				} catch (e) {
					return responseSender(
						res,
						400,
						"Invalid orderItems format",
					);
				}
			}
			// Accept deliveryDate as ISO string or null
			let deliveryDate = (req as any).validatedValue.deliveryDate;
			if (typeof deliveryDate === "string" && deliveryDate !== "null") {
				deliveryDate = new Date(deliveryDate);
			} else if (deliveryDate === "null" || deliveryDate === null) {
				deliveryDate = null;
			}
			const newOrder = {
				customerName: (req as any).validatedValue.customerName,
				customerEmail: (req as any).validatedValue.customerEmail,
				customerPhone: (req as any).validatedValue.customerPhone,
				staffId: (req as any).validatedValue.staffId ?? null,
				billingAddress: (req as any).validatedValue.billingAddress,
				additionalNotes: (req as any).validatedValue.additionalNotes,
				deliveryMethod: (req as any).validatedValue.deliveryMethod,
				deliveryDate,
				paymentMethod: (req as any).validatedValue.paymentMethod,
				amount: (req as any).validatedValue.amount,
				orderTotal: (req as any).validatedValue.orderTotal,
				orderItems,
			};

			// Documentation: Override staffId with authenticated staff only when the request
			// did not explicitly provide a staffId. This preserves frontend-supplied staffId.
			if (
				(req as any).staff?.staffId &&
				(req as any).validatedValue.staffId == null
			) {
				// Prevent designers from being auto-assigned to new orders
				if ((req as any).staff?.role === "designer") {
					// Leave staffId as null so the order can be assigned to an agent later
					newOrder.staffId = null;
				} else {
					newOrder.staffId = (req as any).staff.staffId;
				}
			}

			if (req.files && (req.files as Express.Multer.File[]).length > 0) {
				(newOrder as any).images = req.files;
			}

			if (
				(req as any).validatedValue.courierId &&
				!(req as any).validatedValue.courierAddress
			) {
				return responseSender(res, 400, "Courier address is required");
			} else if (
				!(req as any).validatedValue.courierId &&
				(req as any).validatedValue.courierAddress
			) {
				return responseSender(res, 400, "Courier id is required");
			}

			if ((req as any).validatedValue.couponId) {
				(newOrder as any).couponId = (
					req as any
				).validatedValue.couponId;
			}
			if (
				(req as any).validatedValue.courierId &&
				(req as any).validatedValue.courierAddress
			) {
				(newOrder as any).courierId = (
					req as any
				).validatedValue.courierId;
				(newOrder as any).courierAddress = (
					req as any
				).validatedValue.courierAddress;
			}

			const paymentStatus =
				newOrder.amount === newOrder.orderTotal
					? "paid"
					: newOrder.amount === 0
						? "pending"
						: "partial";

			// If the client explicitly provided a staffId, allow designer or agent.
			// (Automated random assignment still excludes designers; see OrderService logic.)

			const createdOrder = await this.orderService.createOrder(
				newOrder.customerName,
				newOrder.customerEmail,
				newOrder.customerPhone,
				newOrder.staffId,
				newOrder.billingAddress,
				newOrder.additionalNotes,
				newOrder.deliveryMethod,
				newOrder.deliveryDate || null,
				newOrder.paymentMethod,
				paymentStatus,
				(newOrder as any)?.couponId || null,
				(newOrder as any)?.courierId || null,
				(newOrder as any)?.courierAddress || null,
				newOrder.orderTotal,
				newOrder.orderItems,
			);

			if (!createdOrder) {
				console.log("failed in create order");
				return responseSender(
					res,
					500,
					"Order creation failed. Please try again.",
				);
			}

			if ((newOrder as any).images?.length > 0) {
				for (const image of (newOrder as any).images) {
					await this.orderService.addOrderImage(
						image.filename,
						createdOrder.orderId,
					);
				}
			}

			// order payment functionality
			const createdPayment = await this.paymentService.createCashPayment(
				createdOrder.orderId,
				newOrder.amount,
			);

			if (!createdPayment) {
				console.log("failed in create payment");
				return responseSender(
					res,
					500,
					"Order creation failed in payment section. Please try again.",
				);
			}

			const isOrderStatusUpdated =
				await this.orderService.updateOrderPaymentStatus(
					createdOrder.orderId,
					paymentStatus,
				);

			if (!isOrderStatusUpdated) {
				console.log("failed in update order status");
				return responseSender(
					res,
					500,
					"Order creation failed in status update. Please try again.",
				);
			}

			// emit the create order event
			io.emit("create-order", { order: createdOrder });

			return responseSender(res, 201, "Order created successfully.", {
				order: createdOrder,
			});
		} catch (err: any) {
			console.error("[OrderController.createOrder] ERROR:", err);
			// cleanup process if database operation failed
			if (req.files && Array.isArray(req.files)) {
				req.files.forEach((file) => {
					const filePath = path.join(file.destination, file.filename);
					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							console.error(
								"[OrderController.createOrder] File cleanup error:",
								unlinkErr,
							);
						}
					});
				});
			}
			next(err);
		}
	};

	createOrderRequest = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			// Debug: log incoming staffId for order request
			console.log(
				"[OrderController.createOrderRequest] incoming validated staffId:",
				(req as any).validatedValue?.staffId,
			);
			console.log(
				"[OrderController.createOrderRequest] validated payload:",
				(req as any).validatedValue,
			);
			if ((req as any).fileValidationError) {
				console.warn(
					"[OrderController.createOrderRequest] 400 due to fileValidationError:",
					(req as any).fileValidationError,
					{
						filesCount: Array.isArray(req.files)
							? (req.files as Express.Multer.File[]).length
							: 0,
						contentType: req.headers["content-type"],
					},
				);
				return responseSender(
					res,
					400,
					(req as any).fileValidationError,
				);
			}

			const newOrder = {
				customerId: (req as any).validatedValue.customerId,
				customerName: (req as any).validatedValue.customerName,
				customerPhone: (req as any).validatedValue.customerPhone,
				customerEmail: (req as any).validatedValue.customerEmail,
				// Documentation: Use staffId from the validated value if provided, otherwise default to null.
				// This allows for explicit staff assignment or an unassigned order initially.
				staffId: (req as any).validatedValue.staffId ?? null,
				billingAddress: (req as any).validatedValue.billingAddress,
				additionalNotes: (req as any).validatedValue.additionalNotes,
				deliveryMethod: (req as any).validatedValue.deliveryMethod,
				// paymentMethod: (req as any).validatedValue.paymentMethod,
				orderItems: JSON.parse((req as any).validatedValue.orderItems),
			};

			// Documentation: Override staffId with authenticated staff only when the request
			// did not explicitly provide a staffId. This preserves frontend-supplied staffId.
			if (
				(req as any).staff?.staffId &&
				(req as any).validatedValue.staffId == null
			) {
				// Prevent designers from being auto-assigned to new orders
				if ((req as any).staff?.role === "designer") {
					newOrder.staffId = null;
				} else {
					newOrder.staffId = (req as any).staff.staffId;
				}
			}

			// If the client explicitly provided a staffId, allow designer or agent.
			// (Automated random assignment still excludes designers; see OrderService logic.)

			if (req.files && (req.files as Express.Multer.File[]).length > 0) {
				(newOrder as any).images = req.files;
			}

			// Remove strict cross-field checks for courier fields to align with frontend contract.

			if ((req as any).validatedValue.couponId) {
				(newOrder as any).couponId = (
					req as any
				).validatedValue.couponId;
			}
			if (
				(req as any).validatedValue.courierId &&
				(req as any).validatedValue.courierAddress
			) {
				(newOrder as any).courierId = (
					req as any
				).validatedValue.courierId;
				(newOrder as any).courierAddress = (
					req as any
				).validatedValue.courierAddress;
			}

			// No additional customer lookups required here; the email comes from the request.

			const createdOrder = await this.orderService.createOrderRequest(
				newOrder.customerId,
				newOrder.customerName,
				newOrder.customerPhone,
				(newOrder as any).customerEmail,
				newOrder.staffId,
				newOrder.billingAddress,
				newOrder.additionalNotes,
				newOrder.deliveryMethod,
				// newOrder.paymentMethod,
				(newOrder as any)?.couponId || null,
				(newOrder as any)?.courierId || null,
				(newOrder as any)?.courierAddress || null,
				newOrder.orderItems,
				// newOrder.payments,
			);

			if (!createdOrder) {
				console.log("failed in create order request");
				return responseSender(
					res,
					500,
					"Order request creation failed. Please try again.",
				);
			}

			if ((newOrder as any).images?.length > 0) {
				for (const image of (newOrder as any).images) {
					await this.orderService.addOrderImage(
						image.filename,
						createdOrder.orderId,
					);
				}
			}

			await this.cartService.clearCartItems(newOrder.customerId);

			// emit the create order request event
			io.emit("create-order-request", { order: createdOrder });

			return responseSender(
				res,
				201,
				"Order request created successfully.",
				{
					order: createdOrder,
				},
			);
		} catch (err: any) {
			console.error("[OrderController.createOrderRequest] ERROR:", err);
			// cleanup process if database operation failed
			if (req.files && Array.isArray(req.files)) {
				req.files.forEach((file) => {
					const filePath = path.join(file.destination, file.filename);
					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							console.error(
								"[OrderController.createOrderRequest] File cleanup error:",
								unlinkErr,
							);
						}
					});
				});
			}
			next(err);
		}
	};

	updateOrder = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const email = (req as any).validatedValue.email;
			console.log("[OrderController.updateOrder] ENTER", {
				path: req.path,
				method: req.method,
				user: {
					admin: Boolean((req as any).admin),
					staffRole: (req as any).staff?.role,
					staffId: (req as any).staff?.staffId,
				},
				payload: (req as any).validatedValue,
			});

			const newOrder = {
				orderId: (req as any).validatedValue.orderId,
				deliveryDate: (req as any).validatedValue.deliveryDate,
				status: (req as any).validatedValue.status,
				courierAddress: (req as any).validatedValue.courierAddress,
				additionalNotes: (req as any).validatedValue.additionalNotes,
			};

			const fetchedOrder = await this.orderService.getOrderById(
				newOrder.orderId,
			);
			console.log("[OrderController.updateOrder] fetchedOrder", {
				orderId: fetchedOrder?.orderId,
				status: fetchedOrder?.status,
				orderTotalPrice: fetchedOrder?.orderTotalPrice,
				paymentsCount: Array.isArray(fetchedOrder?.payments)
					? fetchedOrder.payments.length
					: 0,
			});
			if (!fetchedOrder) {
				return responseSender(res, 404, "Order not found");
			}

			// Extract requester role. Allow admin/agent/designer to update without restrictions.
			const requesterRole =
				(req as any).staff?.role || (req as any).admin?.role;
			if (
				!requesterRole ||
				!["admin", "agent", "designer", "offline-agent"].includes(
					requesterRole,
				)
			) {
				return responseSender(
					res,
					403,
					"You do not have permission to update this order.",
				);
			}

			// Turned OFF: staff one-time update restriction. We no longer modify or check staffUpdateCount.
			let newStaffUpdateCount: number | undefined = undefined;

			// TODO: If the payment fully completed then only update the order status as completed
			// TODO: if the order complete then add the commission on staff balance

			if (newOrder.status === "order-completed") {
				const payments = await this.paymentService.getPaymentByOrderId(
					newOrder.orderId,
				);
				let totalPaidAmount = 0;
				payments.forEach((payment) => {
					if (payment.isPaid) {
						totalPaidAmount += payment.amount;
					}
				});
				console.log(
					"[OrderController.updateOrder] totalPaidAmount computed",
					{
						orderId: newOrder.orderId,
						totalPaidAmount,
						orderTotalPrice: fetchedOrder.orderTotalPrice,
						payments,
					},
				);

				if (totalPaidAmount !== fetchedOrder.orderTotalPrice) {
					console.warn(
						"[OrderController.updateOrder] cannot complete order - payment mismatch",
						{
							orderId: newOrder.orderId,
							totalPaidAmount,
							orderTotalPrice: fetchedOrder.orderTotalPrice,
						},
					);
					return responseSender(
						res,
						400,
						"The order payment is not fully completed.",
					);
				}
			}

			// Documentation: Pass the newStaffUpdateCount to the service layer.
			console.log(
				"[OrderController.updateOrder] calling orderService.updateOrder",
				{
					orderId: newOrder.orderId,
					status: newOrder.status,
					deliveryDate: newOrder.deliveryDate,
					courierAddress: newOrder.courierAddress,
					additionalNotes: newOrder.additionalNotes,
					newStaffUpdateCount,
				},
			);

			const updatedOrder = await this.orderService.updateOrder(
				newOrder.orderId,
				newOrder.deliveryDate,
				newOrder.status,
				newOrder.courierAddress,
				newOrder.additionalNotes,
				newStaffUpdateCount, // remains undefined now that restriction is disabled
			);

			console.log(
				"[OrderController.updateOrder] orderService.updateOrder result",
				{ orderId: newOrder.orderId, updatedOrder },
			);

			if (!updatedOrder) {
				return responseSender(
					res,
					500,
					"Order update failed. Please try again.",
				);
			}

			if (newOrder.status === "order-completed") {
				const staff = await this.staffService.getStaffById(
					fetchedOrder.staffId,
				);
				if (staff) {
					const commission =
						(fetchedOrder.orderTotalPrice *
							staff.commissionPercentage) /
						100;
					console.log(
						"[OrderController.updateOrder] commission calculation",
						{
							orderId: newOrder.orderId,
							staffId: staff.staffId,
							commission,
							requesterRole,
						},
					);
					console.log(
						"[OrderController.updateOrder] commission crediting is currently disabled (skipped)",
					);
				}
			}
			try {
				// OrderService.updateOrder returns boolean. Retrieve the order to get fresh data.
				const afterUpdate = await this.orderService.getOrderById(
					newOrder.orderId as any,
				);

				const orderIdForEmail =
					afterUpdate?.orderId ?? newOrder.orderId;
				const statusForEmail = afterUpdate?.status ?? newOrder.status;
				const customerNameForEmail =
					fetchedOrder.customerName ||
					fetchedOrder.customerEmail ||
					"";

				const orderUrl = frontendLandingPageUrl
					? `${frontendLandingPageUrl}/orders/${orderIdForEmail}`
					: undefined;

				const recipientEmail =
					email || afterUpdate?.customerEmail || fetchedOrder?.customerEmail;
				if (recipientEmail) {
					await this.emailService.sendEmail(
						recipientEmail,
						`Order #${orderIdForEmail} status updated`,
						"order-update-notification",
						{
							customerName: customerNameForEmail,
							orderId: orderIdForEmail,
							status: statusForEmail,
							orderUrl,
						},
					);
					console.log("[OrderController.updateOrder] email sent successfully to ", recipientEmail);
				} else {
					console.warn('[OrderController.updateOrder] no recipient email available; skipping order update email', { orderId: orderIdForEmail });
				}
			} catch (mailErr) {
				// don't fail the request if email sending fails; log for operators
				console.error(
					"[OrderController.updateOrder] failed to send order update email",
					mailErr,
				);
			}
			return responseSender(res, 200, "Order updated successfully.");
		} catch (err: any) {
			console.error("[OrderController.updateOrder] ERROR:", err);
			next(err);
		}
	};

	createOrderPayment = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			console.log("[OrderController.createOrderPayment] ENTER", {
				path: req.path,
				method: req.method,
				user: {
					admin: Boolean((req as any).admin),
					staffRole: (req as any).staff?.role,
					staffId: (req as any).staff?.staffId,
				},
				bodyKeys: Object.keys(req.body || {}),
			});

			const newPayment = {
				orderId: (req as any).validatedValue.orderId,
				amount: (req as any).validatedValue.amount,
				paymentMethod: (req as any).validatedValue.paymentMethod,
				customerName: (req as any).validatedValue.customerName,
				customerEmail: (req as any).validatedValue.customerEmail,
				customerPhone: (req as any).validatedValue.customerPhone,
			};

			console.log(
				"[OrderController.createOrderPayment] Payload",
				newPayment,
			);

			if (newPayment.paymentMethod === "cod-payment") {
				const createdPayment =
					await this.paymentService.createCashPayment(
						newPayment.orderId,
						newPayment.amount,
					);

				if (!createdPayment) {
					console.warn(
						"[OrderController.createOrderPayment] 500 - Failed to create COD payment",
						newPayment,
					);
					return responseSender(
						res,
						500,
						"Order payment request creation failed. Please try again.",
					);
				}

				// update the order status
				const order = await this.orderService.getOrderById(
					newPayment.orderId,
				);
				if (!order) {
					console.warn(
						"[OrderController.createOrderPayment] 500 - Order not found for status update",
						{
							orderId: newPayment.orderId,
						},
					);
					return responseSender(
						res,
						500,
						"Order not found. Please try again.",
					);
				}

				const totalPaidAmount = order.payments.reduce((acc, curr) => {
					if (curr.isPaid) return acc + curr.amount;
					return acc;
				}, 0);

				const isOrderStatusUpdated =
					await this.orderService.updateOrderPaymentStatus(
						newPayment.orderId,
						totalPaidAmount === order.orderTotalPrice
							? "paid"
							: "partial",
					);

				if (!isOrderStatusUpdated) {
					console.warn(
						"[OrderController.createOrderPayment] 500 - Failed to update order status",
						{
							orderId: newPayment.orderId,
							totalPaidAmount,
							orderTotal: order.orderTotalPrice,
						},
					);
					return responseSender(
						res,
						500,
						"Order status update failed. Please try again.",
					);
				}

				// Move requested orders into active list after any non-zero payment
				try {
					const requestedStatuses = new Set<
						| "order-request-received"
						| "consultation-in-progress"
						| "awaiting-advance-payment"
					>([
						"order-request-received",
						"consultation-in-progress",
						"awaiting-advance-payment",
					]);
					if (
						totalPaidAmount > 0 &&
						requestedStatuses.has(order.status as any)
					) {
						console.log(
							"[OrderController.createOrderPayment] Moving order to active after COD payment",
							{
								orderId: order.orderId,
								fromStatus: order.status,
								totalPaidAmount,
								orderTotal: order.orderTotalPrice,
							},
						);
						const moved = await this.orderService.updateOrder(
							order.orderId,
							order.deliveryDate,
							"advance-payment-received",
							order.courierAddress,
							order.additionalNotes,
						);

						if (!moved) {
							console.warn(
								"[OrderController.createOrderPayment] 500 - Failed to move order to active after payment",
								{
									orderId: order.orderId,
									fromStatus: order.status,
								},
							);
							return responseSender(
								res,
								500,
								"Order update failed. Please try again.",
							);
						}

						// notify clients of status change
						io.emit("order-status-updated", {
							orderId: order.orderId,
							from: order.status,
							to: "advance-payment-received",
						});
					}
				} catch (moveErr) {
					console.error(
						"[OrderController.createOrderPayment] ERROR moving order to active:",
						moveErr,
					);
					return responseSender(
						res,
						500,
						"Order update failed. Please try again.",
					);
				}

				return responseSender(
					res,
					201,
					"Order payment request created successfully.",
					{
						...createdPayment,
					},
				);
			}

			// Online payment flow
			if (newPayment.paymentMethod === "online-payment") {
				const createdPayment =
					await this.paymentService.createOnlinePayment(
						newPayment.orderId,
						newPayment.amount,
						newPayment.customerName,
						newPayment.customerEmail,
						newPayment.customerPhone,
					);

				if (!createdPayment) {
					console.warn(
						"[OrderController.createOrderPayment] 500 - Failed to create Online payment",
						newPayment,
					);
					return responseSender(
						res,
						500,
						"Order payment request creation failed. Please try again.",
					);
				}

				return responseSender(
					res,
					201,
					"Order payment request created successfully.",
					{
						...createdPayment,
					},
				);
			}
		} catch (err: any) {
			console.error("[OrderController.createOrderPayment] ERROR:", err);
			// Map known validation/service errors to HTTP 400 so frontend gets a proper client error
			const msg = err?.message || "";
			if (
				msg.includes("exceeds remaining due") ||
				msg.includes("already fully paid") ||
				msg.includes("Invalid payment amount")
			) {
				return responseSender(res, 400, msg);
			}
			// unknown error: pass to global error handler
			next(err);
		}
	};

	// Re-enabled: Online payment webhook handlers
	paymentSuccess = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const transactionId = req.body.tran_id;
			const payment =
				await this.paymentService.getPaymentByTransactionId(
					transactionId,
				);

			if (!payment) {
				return responseSender(
					res,
					500,
					"Payment not found. Please try again.",
				);
			}
			const orderId = payment.orderId;
			const valId = req.body.val_id;
			const amount = req.body.amount;
			const storeAmount = req.body.store_amount;
			const cardType = req.body.card_type;
			const bankTransactionId = req.body.bank_tran_id;
			const status = req.body.status;
			const transactionDate = req.body.tran_date;
			const currency = req.body.currency;
			const cardIssuer = req.body.card_issuer;
			const cardBrand = req.body.card_brand;

			// create a transaction
			const transaction = await this.transactionService.createTransaction(
				transactionId,
				orderId,
				valId,
				amount,
				storeAmount,
				cardType,
				bankTransactionId,
				status,
				transactionDate,
				currency,
				cardIssuer,
				cardBrand,
			);

			// update the order payment status
			const isPaymentStatusUpdated =
				await this.paymentService.updatePaymentStatus(
					transactionId,
					true,
				);

			if (!isPaymentStatusUpdated) {
				return responseSender(
					res,
					500,
					"Payment status update failed. Please try again.",
				);
			}

			// update the order status
			const order = await this.orderService.getOrderById(orderId);
			if (!order) {
				return responseSender(
					res,
					500,
					"Order not found. Please try again.",
				);
			}

			const totalPaidAmount = order.payments.reduce((acc, curr) => {
				if (curr.isPaid) return acc + curr.amount;
				return acc;
			}, 0);

			const isOrderStatusUpdated =
				await this.orderService.updateOrderPaymentStatus(
					orderId,
					totalPaidAmount === order.orderTotalPrice
						? "paid"
						: "partial",
				);

			if (!isOrderStatusUpdated) {
				return responseSender(
					res,
					500,
					"Order status update failed. Please try again.",
				);
			}

			// Move requested orders into active list after first successful online payment
			try {
				const requestedStatuses = new Set<
					| "order-request-received"
					| "consultation-in-progress"
					| "awaiting-advance-payment"
				>([
					"order-request-received",
					"consultation-in-progress",
					"awaiting-advance-payment",
				]);
				if (
					totalPaidAmount > 0 &&
					requestedStatuses.has(order.status as any)
				) {
					const moved = await this.orderService.updateOrder(
						order.orderId,
						order.deliveryDate,
						"advance-payment-received",
						order.courierAddress,
						order.additionalNotes,
					);
					if (moved) {
						io.emit("order-status-updated", {
							orderId: order.orderId,
							from: order.status,
							to: "advance-payment-received",
						});
					}
				}
			} catch (moveErr) {
				console.error(
					"[OrderController.paymentSuccess] ERROR moving order to active:",
					moveErr,
				);
			}

			if (!transaction) {
				return res.redirect(`${frontendLandingPageUrl}/failed-payment`);
			}

			return res.redirect(
				`${frontendLandingPageUrl}/success-payment?transaction=${JSON.stringify(transaction)}`,
			);
		} catch (err: any) {
			console.error("[OrderController.paymentSuccess] ERROR:", err);
			next(err);
		}
	};

	paymentFail = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const transactionId = req.body.tran_id;
			const order =
				await this.paymentService.getPaymentByTransactionId(
					transactionId,
				);

			if (!order) {
				return responseSender(
					res,
					500,
					"Order not found. Please try again.",
				);
			}

			// update the order payment status
			const isPaymentStatusUpdated =
				await this.paymentService.updatePaymentStatus(
					transactionId,
					false,
				);

			if (!isPaymentStatusUpdated) {
				return res.redirect(`${frontendLandingPageUrl}/failed-payment`);
			}

			return res.redirect(`${frontendLandingPageUrl}/failed-payment`);
		} catch (err: any) {
			console.error("[OrderController.paymentFail] ERROR:", err);
			next(err);
		}
	};

	paymentCancel = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const transactionId = req.body.tran_id;
			const order =
				await this.paymentService.getPaymentByTransactionId(
					transactionId,
				);

			if (!order) {
				return responseSender(
					res,
					500,
					"Order not found. Please try again.",
				);
			}

			// update the order payment status
			const isPaymentStatusUpdated =
				await this.paymentService.updatePaymentStatus(
					transactionId,
					false,
				);

			if (!isPaymentStatusUpdated) {
				return res.redirect(`${frontendLandingPageUrl}/failed-payment`);
			}

			return res.redirect(`${frontendLandingPageUrl}/failed-payment`);
		} catch (err: any) {
			console.error("[OrderController.paymentCancel] ERROR:", err);
			next(err);
		}
	};

	getOrdersByCustomer = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerId = (req as any).validatedValue.customerId;
			// const searchTerm = (req as any).validatedValue.searchTerm;
			// const currentPage = parseInt((req as any).validatedValue.page || 1);
			// const limitPerPage = parseInt(
			// 	(req as any).validatedValue.limit || 20,
			// );
			// const offset = (currentPage - 1) * limitPerPage;
			// const order: Order = [["createdAt", "DESC"]];
			// const filter: WhereOptions<OrderAttributes> = {};
			if (!customerId) {
				return responseSender(res, 500, "Please provide customerId.");
			}

			const orders =
				await this.orderService.getOrdersByCustomer(customerId);
			if (!orders) {
				return responseSender(
					res,
					400,
					"Failed to get orders. Please try again.",
				);
			}
			return responseSender(res, 200, "Orders fetched successfully.", {
				orders,
			});
		} catch (err: any) {
			console.error("[OrderController.getOrdersByCustomer] ERROR:", err);
			next(err);
		}
	};

	// New: Customer can fetch own order history
	getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const customer = (req as any).customer;
			if (!customer?.customerId) {
				return responseSender(res, 401, "Unauthorized.");
			}
			const orders = await this.orderService.getOrdersByCustomer(
				customer.customerId,
			);
			if (!orders) {
				return responseSender(res, 200, "No orders found.", {
					orders: [],
				});
			}
			return responseSender(res, 200, "Orders fetched successfully.", {
				orders,
			});
		} catch (err: any) {
			console.error("[OrderController.getMyOrders] ERROR:", err);
			next(err);
		}
	};

	deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fetchedOrder = await this.orderService.getOrderById(
				Number((req as any).validatedValue.orderId),
			);

			if (!fetchedOrder) {
				return responseSender(res, 400, "Order couldn't found.");
			}

			const isDeleted = await this.orderService.deleteOrder(
				fetchedOrder.orderId,
			);
			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Couldn't delete order. Please try again.",
				);
			}

			return responseSender(res, 200, "Order deleted successfully.");
		} catch (err: any) {
			console.error("[OrderController.deleteOrder] ERROR:", err);
			next(err);
		}
	};

	getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const searchBy = (req as any).validatedValue.searchBy || "order-id";
			let filteredBy = (req as any).validatedValue.filteredBy; // Use 'let' to allow reassignment
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<OrderAttributes> = {};

			// Documentation: Extracting the requester's role and staffId from the authenticated user.
			const requesterRole =
				(req as any).staff?.role || (req as any).admin?.role;
			const staffId = (req as any).staff?.staffId;
			// RBAC Implementation:
			// - Admin & Designer: See all orders
			// - Agent: See only their own orders (filtered by staffId)
			if (!filteredBy) {
				filteredBy = "all";
			}

			// Apply staffId filter ONLY for agents
			if (
				(requesterRole === "agent" ||
					requesterRole === "offline-agent") &&
				staffId
			) {
				// Agents see only their assigned orders
				filter.staffId = staffId; // 🔧 FIX: Actually add the staffId to the filter
			}

			// Documentation: Apply status filter based on the (potentially updated) filteredBy value.
			if (filteredBy === "active") {
				filter.status = [
					"advance-payment-received",
					"design-in-progress",
					"awaiting-design-approval",
					"production-started",
					"production-in-progress",
					"ready-for-delivery",
					"out-for-delivery",
				];
			} else if (filteredBy === "requested") {
				filter.status = [
					"consultation-in-progress",
					"awaiting-advance-payment",
					"order-request-received",
					// "order-request-received", // Removed duplicate status
				];
			} else if (filteredBy === "completed") {
				filter.status = "order-completed";
			} else if (filteredBy === "cancelled") {
				filter.status = "order-canceled";
			} else if (filteredBy === "all") {
				// Documentation: If filteredBy is explicitly "all", ensure no status filter is applied.
				// This is crucial for "all orders" view.
				delete filter.status; // Remove any status filter that might have been implicitly set
			}

			if (searchTerm && searchBy) {
				switch (searchBy) {
					case "order-id":
						filter.orderId = {
							[Op.like]: searchTerm,
						};
						break;
					case "customer-name":
						filter.customerName = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					case "customer-phone":
						filter.customerPhone = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					case "customer-email":
						filter.customerEmail = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					default:
						break;
				}
			}

			// 🎯 FINAL FILTER DEBUG - Capture exact parameters going to service
			// 🎯 RBAC IMPLEMENTATION: Apply staffId filter only for agents
			if (
				(requesterRole === "agent" ||
					requesterRole === "offline-agent") &&
				staffId
			) {
				filter.staffId = staffId;
			} else {
				// Remove any existing staffId filter for admin/designer
				if ((filter as any).staffId) {
					delete (filter as any).staffId;
				}
			}

			// Documentation: Pass the requesterRole to the service layer for final filtering adjustments.
			const orders = await this.orderService.getAllOrders(
				filter,
				limitPerPage,
				offset,
				order,
				requesterRole, // Pass the requester's role
			);
			if (!orders.rows) {
				return responseSender(
					res,
					400,
					"Failed to get orders. Please try again.",
				);
			}

			// 🔍 Add debug headers to verify code deployment and RBAC
			res.setHeader(
				"X-Debug-Code-Version",
				"2025-01-27-rbac-implemented",
			);
			res.setHeader("X-Debug-User-Role", requesterRole || "unknown");
			res.setHeader("X-Debug-Order-Count", orders.count.toString());
			res.setHeader(
				"X-Debug-RBAC-Applied",
				requesterRole === "agent"
					? "agent-own-orders-only"
					: "admin-designer-all-orders",
			);

			return responseSender(res, 200, "Orders fetched successfully.", {
				orders: orders.rows,
				total: orders.count,
				totalPages: Math.ceil(orders.count / limitPerPage),
				currentPage,
				// 🔍 Debug info in response
				debug: {
					userRole: requesterRole,
					codeVersion: "2025-01-27-rbac-implemented",
					rbacApplied:
						requesterRole === "agent"
							? "Agent sees only own orders"
							: requesterRole === "designer"
								? "Designer sees all orders (for design work)"
								: requesterRole === "offline-agent"
									? "Offline-agent sees only own orders"
									: "Admin sees all orders",
					hasStaffIdFilter:
						(requesterRole === "agent" ||
							requesterRole === "offline-agent") &&
						Boolean(staffId),
					timestamp: new Date().toISOString(),
				},
			});
		} catch (err: any) {
			console.error("[OrderController.getAllOrders] ERROR:", err);
			next(err);
		}
	};
}

export default OrderController;
