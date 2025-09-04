import Joi from "joi";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

class OrderMiddleware {
	private schema: {
		customerId: Joi.NumberSchema;
		customerName: Joi.StringSchema;
		customerEmail: Joi.StringSchema;
		customerPhone: Joi.StringSchema;
		staffId: Joi.NumberSchema;
		billingAddress: Joi.StringSchema;
		additionalNotes: Joi.StringSchema;
		method: Joi.StringSchema;
		status: Joi.StringSchema;
		currentStatus: Joi.StringSchema;
		deliveryMethod: Joi.StringSchema;
		deliveryDate: Joi.DateSchema;
		paymentMethod: Joi.StringSchema;
		paymentStatus: Joi.StringSchema;
		couponId: Joi.NumberSchema;
		courierId: Joi.NumberSchema;
		courierAddress: Joi.StringSchema;
		orderItems: Joi.AnySchema;
		payments: Joi.ArraySchema;
	};

	private orderItemsSchema: Joi.ObjectSchema;

	private paymentsSchema: Joi.ObjectSchema;

	constructor() {
		this.orderItemsSchema = Joi.object({
			productId: Joi.number().required().messages({
				"number.base": "productId must be a number.",
				"number.empty": "productId cannot be empty.",
				"any.required": "productId is required.",
			}),

			quantity: Joi.number().required().messages({
				"number.base": "quantity must be a number.",
				"number.empty": "quantity cannot be empty.",
				"any.required": "quantity is required.",
			}),

			size: Joi.number().required().allow(null).messages({
				"number.base": "size must be a number.",
				"number.empty": "size cannot be empty.",
				"any.required": "size is required.",
			}),

			widthInch: Joi.number().required().allow(null).messages({
				"number.base": "widthInch must be a number.",
				"number.empty": "widthInch cannot be empty.",
				"any.required": "widthInch is required.",
			}),

			price: Joi.number().required().messages({
				"number.base": "price must be a number.",
				"number.empty": "price cannot be empty.",
				"any.required": "price is required.",
			}),

			productVariantId: Joi.number().required().messages({
				"number.base": "productVariantId must be a number.",
				"number.empty": "productVariantId cannot be empty.",
				"any.required": "productVariantId is required.",
			}),
		});

		this.paymentsSchema = Joi.object({
			orderId: Joi.number().required().messages({
				"number.base": "orderId must be a number.",
				"number.empty": "orderId cannot be empty.",
				"any.required": "orderId is required.",
			}),

			amount: Joi.number().required().messages({
				"number.base": "amount must be a number.",
				"number.empty": "amount cannot be empty.",
				"any.required": "amount is required.",
			}),

			// COMMENTED OUT: Online payment validation temporarily disabled
			// TODO: Re-enable after fixing online payment issues
			/*
			paymentMethod: Joi.string()
				.valid("cod-payment", "online-payment")
				.required()
				.messages({
					"string.base": "paymentMethod must be a string.",
					"string.empty": "paymentMethod cannot be empty.",
					"any.required":
						"paymentMethod is required. It should be either cod-payment or online-payment.",
				}),
			*/

			// TEMPORARY: Only allow COD payments until online payments are re-enabled
			paymentMethod: Joi.string()
				.valid("cod-payment")
				.required()
				.messages({
					"string.base": "paymentMethod must be a string.",
					"string.empty": "paymentMethod cannot be empty.",
					"any.required": "paymentMethod is required.",
					"any.only": "Only COD (cash on delivery) payments are currently available. Online payments are temporarily disabled.",
				}),

			customerName: Joi.string().trim().min(2).required().messages({
				"string.base": "Customer name must be a string.",
				"string.empty": "Customer name cannot be empty.",
				"string.min":
					"Customer name must be at least 2 characters long.",
				"any.required": "Customer name is required.",
			}),

			customerEmail: Joi.string()
				.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
				.message("Invalid email address.")
				.required()
				.messages({
					"string.base": "Customer email must be a string.",
					"string.email": "Invalid email address.",
					"string.empty": "Customer email cannot be empty.",
					"any.required": "Customer email is required.",
				}),

			customerPhone: Joi.string()
				.trim()
				.required()
				.pattern(/^01[3-9][0-9]{8}$/)
				.messages({
					"string.pattern.base":
						"Customer phone number must be a valid Bangladeshi number starting with 01 and 11 digits long.",
					"string.empty": "Customer phone number cannot be empty.",
				}),
		});

		this.schema = {
			customerId: Joi.number().required().allow(null).messages({
				"number.base": "customerId must be a number.",
				"number.empty": "customerId cannot be empty.",
				"any.required": "customerId is required.",
			}),

			customerName: Joi.string().trim().min(2).required().messages({
				"string.base": "Customer name must be a string.",
				"string.empty": "Customer name cannot be empty.",
				"string.min":
					"Customer name must be at least 2 characters long.",
				"any.required": "Customer name is required.",
			}),
			customerEmail: Joi.string()
				.trim()
				.email()
				.required()
				.allow("")
				.messages({
					"string.base": "Customer email must be a string.",
					"string.email": "Invalid email address.",
					"string.empty": "Customer email cannot be empty.",
					"any.required": "Customer email is required.",
				}),
			customerPhone: Joi.string()
				.trim()
				.required()
				.pattern(/^01[3-9][0-9]{8}$/)
				.messages({
					"string.pattern.base":
						"Customer phone number must be a valid Bangladeshi number starting with 01 and 11 digits long.",
				}),

			staffId: Joi.number().optional().allow(null).messages({
				"number.base": "staffId must be a number.",
				"number.empty": "staffId cannot be empty.",
			}),

			method: Joi.string()
				.valid("online", "offline")
				.required()
				.messages({
					"string.base": "method must be a string.",
					"string.empty": "method cannot be empty.",
					"string.valid":
						"method should be either 'online' or 'offline'",
					"any.required": "method is required.",
				}),

			status: Joi.string()
				.valid(
					"order-request-received",
					"consultation-in-progress",
					"order-canceled",
					"awaiting-advance-payment",
					"advance-payment-received",
					"design-in-progress",
					"awaiting-design-approval",
					"production-started",
					"production-in-progress",
					"ready-for-delivery",
					"out-for-delivery",
					"order-completed",
				)
				.required()
				.messages({
					"string.base": "status must be a string.",
					"string.empty": "status cannot be empty.",
					"string.valid":
						"status should be one of 'order-request-received', 'consultation-in-progress', 'order-canceled', 'awaiting-advance-payment', 'advance-payment-received', 'design-in-progress', 'awaiting-design-approval', 'production-started', 'production-in-progress', 'ready-for-delivery', 'out-for-delivery', 'order-completed'",
					"any.required": "status is required.",
				}),

			currentStatus: Joi.string().required().allow("").messages({
				"string.base": "currentStatus must be a string.",
				"string.empty": "currentStatus cannot be empty.",
				"any.required": "currentStatus is required.",
			}),

			billingAddress: Joi.string().required().messages({
				"string.base": "billingAddress must be a string.",
				"string.empty": "billingAddress cannot be empty.",
				"any.required": "billingAddress is required.",
			}),

			additionalNotes: Joi.string().optional().allow("").messages({
				"string.base": "additionalNotes must be a string.",
			}),

			deliveryDate: Joi.date().iso().required().allow("null").messages({
				"date.base": "deliveryDate must be a valid date.",
				"date.format":
					"deliveryDate must be in ISO 8601 format (YYYY-MM-DD).",
				"any.required": "deliveryDate is required.",
			}),

			deliveryMethod: Joi.string()
				.trim()
				.required()
				.valid("shop-pickup", "courier")
				.messages({
					"string.base": "deliveryMethod must be a string.",
					"string.empty": "deliveryMethod is required.",
					"string.valid":
						"invalid deliveryMethod. deliveryMethod must be 'shop-pickup' or 'courier'.",
					"any.required": "deliveryMethod is required.",
				}),

			// COMMENTED OUT: Online payment validation temporarily disabled
			// TODO: Re-enable after fixing online payment issues
			/*
			paymentMethod: Joi.string()
				.valid("cod-payment", "online-payment")
				.required()
				.messages({
					"string.base": "paymentMethod must be a string.",
					"string.empty": "paymentMethod cannot be empty.",
					"any.required":
						"paymentMethod is required. It should be either cod-payment or online-payment.",
				}),
			*/

			// TEMPORARY: Only allow COD payments until online payments are re-enabled
			paymentMethod: Joi.string()
				.valid("cod-payment")
				.required()
				.messages({
					"string.base": "paymentMethod must be a string.",
					"string.empty": "paymentMethod cannot be empty.",
					"any.required": "paymentMethod is required.",
					"any.only": "Only COD (cash on delivery) payments are currently available. Online payments are temporarily disabled.",
				}),

			paymentStatus: Joi.string()
				.trim()
				.required()
				.valid("pending", "partial", "paid")
				.messages({
					"string.base": "paymentStatus must be a string.",
					"string.empty": "paymentStatus is required.",
					"string.valid":
						"invalid paymentStatus. paymentStatus must be 'pending', 'partial' or 'paid'.",
					"any.required": "paymentStatus is required.",
				}),

			couponId: Joi.number().optional().messages({
				"number.base": "couponId must be a number.",
				"number.empty": "couponId cannot be empty.",
			}),

			courierId: Joi.number().optional().messages({
				"number.base": "courierId must be a number.",
				"number.empty": "courierId cannot be empty.",
			}),

			courierAddress: Joi.string().trim().optional().messages({
				"string.base": "courierAddress must be a string.",
				"string.empty": "courierAddress cannot be empty.",
			}),

			orderItems: Joi.any(),

			payments: Joi.array()
				.items(this.paymentsSchema)
				.required()
				.min(1)
				.messages({
					"array.min": "At least one payment is required.",
				}),
		};
	}

	validateOrderCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const orderSchema = Joi.object({
				customerName: this.schema.customerName,
				customerEmail: this.schema.customerEmail,
				customerPhone: this.schema.customerPhone,
				staffId: this.schema.staffId,
				billingAddress: this.schema.billingAddress,
				additionalNotes: this.schema.additionalNotes,
				deliveryMethod: this.schema.deliveryMethod,
				deliveryDate: this.schema.deliveryDate,
				paymentMethod: this.schema.paymentMethod,
				amount: Joi.number().required().messages({
					"number.base": "amount must be a number.",
					"number.empty": "amount cannot be empty.",
					"any.required": "amount is required.",
				}),
				orderTotal: Joi.number().required().messages({
					"number.base": "orderTotal must be a number.",
					"number.empty": "orderTotal cannot be empty.",
					"any.required": "orderTotal is required.",
				}),
				couponId: this.schema.couponId,
				courierId: this.schema.courierId,
				courierAddress: this.schema.courierAddress,
				orderItems: this.schema.orderItems,
			});

			const validationResult = orderSchema.validate(req.body);

			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateOrderRequestCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const orderSchema = Joi.object({
				customerId: this.schema.customerId,
				customerName: this.schema.customerName,
				customerPhone: this.schema.customerPhone,
				customerEmail: this.schema.customerEmail.optional(),
				staffId: this.schema.staffId,
				billingAddress: this.schema.billingAddress,
				additionalNotes: this.schema.additionalNotes,
				deliveryMethod: this.schema.deliveryMethod,
				// paymentMethod: this.schema.paymentMethod,
				couponId: this.schema.couponId,
				courierId: this.schema.courierId,
				courierAddress: this.schema.courierAddress,
				orderItems: this.schema.orderItems,
				// payments: this.paymentsSchema,
			}).unknown(true); // Allow extra fields like customerEmail or future additions without 400

			const validationResult = orderSchema.validate(req.body);

			if (validationResult.error) {
				// Debug: surface validation error context for 400s
				console.warn(
					"[OrderMiddleware.validateOrderRequestCreation] 400 Validation Error",
					{
						message: validationResult.error.message,
						details: (validationResult.error as any).details?.map((d: any) => d.message) || [],
						bodyKeys: Object.keys(req.body || {}),
					}
				);
				// Optional: log a compact snapshot of body (avoid huge payloads)
				try {
					const snapshot: any = { ...req.body } as any;
					if (snapshot.orderItems && typeof snapshot.orderItems === "string" && (snapshot.orderItems as string).length > 200) {
						snapshot.orderItems = (snapshot.orderItems as string).slice(0, 200) + "...";
					}
					console.warn("[OrderMiddleware.validateOrderRequestCreation] Body snapshot:", snapshot);
				} catch {}
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateOrderPaymentCreation = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const orderSchema = Joi.object({
				orderId: Joi.number().required().messages({
					"number.base": "orderId must be a number.",
					"number.empty": "orderId cannot be empty.",
					"any.required": "orderId is required.",
				}),

				amount: Joi.number().required().messages({
					"number.base": "amount must be a number.",
					"number.empty": "amount cannot be empty.",
					"any.required": "amount is required.",
				}),

				// COMMENTED OUT: Online payment validation temporarily disabled
				// TODO: Re-enable after fixing online payment issues
				/*
				paymentMethod: Joi.string()
					.valid("cod-payment", "online-payment")
					.required()
					.messages({
						"string.base": "paymentMethod must be a string.",
						"string.empty": "paymentMethod cannot be empty.",
						"any.required":
							"paymentMethod is required. It should be either cod-payment or online-payment.",
					}),
				*/

				// TEMPORARY: Only allow COD payments until online payments are re-enabled
				paymentMethod: Joi.string()
					.valid("cod-payment")
					.required()
					.messages({
						"string.base": "paymentMethod must be a string.",
						"string.empty": "paymentMethod cannot be empty.",
						"any.required": "paymentMethod is required.",
						"any.only": "Only COD (cash on delivery) payments are currently available. Online payments are temporarily disabled.",
					}),

				customerName: Joi.string().trim().min(2).required().messages({
					"string.base": "Customer name must be a string.",
					"string.empty": "Customer name cannot be empty.",
					"string.min":
						"Customer name must be at least 2 characters long.",
					"any.required": "Customer name is required.",
				}),

				customerEmail: Joi.string()
					.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
					.message("Invalid email address.")
					.required()
					.messages({
						"string.base": "Customer email must be a string.",
						"string.email": "Invalid email address.",
						"string.empty": "Customer email cannot be empty.",
						"any.required": "Customer email is required.",
					}),

				customerPhone: Joi.string()
					.trim()
					.required()
					.pattern(/^01[3-9][0-9]{8}$/)
					.messages({
						"string.pattern.base":
							"Customer phone number must be a valid Bangladeshi number starting with 01 and 11 digits long.",
						"string.empty": "Customer phone number cannot be empty.",
					}),
			});

			const validationResult = orderSchema.validate(req.body);

			if (validationResult.error) {
				console.warn(
					"[OrderMiddleware.validateOrderPaymentCreation] 400 Validation Error",
					{
						message: validationResult.error.message,
						details: (validationResult.error as any).details?.map((d: any) => d.message) || [],
						bodyKeys: Object.keys(req.body || {}),
					}
				);
				try {
					const snapshot: any = { ...req.body } as any;
					Object.keys(snapshot || {}).forEach((k) => {
						const v = snapshot[k];
						if (typeof v === "string" && v.length > 200) snapshot[k] = v.slice(0, 200) + "...";
					});
					console.warn("[OrderMiddleware.validateOrderPaymentCreation] Body snapshot:", snapshot);
				} catch {}
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateOrderUpdate = (req: Request, res: Response, next: NextFunction) => {
		try {
			const orderSchema = Joi.object({
				orderId: Joi.number().required().messages({
					"number.base": "orderId must be a number.",
					"number.empty": "orderId cannot be empty.",
					"any.required": "orderId is required.",
				}),
				status: this.schema.status,
				deliveryDate: this.schema.deliveryDate,
				courierAddress: this.schema.courierAddress.allow(null),
				additionalNotes: this.schema.additionalNotes,
			});
			const validationResult = orderSchema.validate(req.body);
			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}
			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateOrderByCustomer = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const orderSchema = Joi.object({
				customerId: this.schema.customerId,
			});

			const validationResult = orderSchema.validate(req.params);

			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateOrderDeletion = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const orderSchema = Joi.object({
				orderId: Joi.number().required().messages({
					"number.base": "orderId must be a number.",
					"number.empty": "orderId cannot be empty.",
					"number.required": "orderId is required.",
				}),
			});

			const validationResult = orderSchema.validate(req.params);

			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};

	validateFilteringQueries = (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const orderSchema = Joi.object({
				searchTerm: Joi.string().trim().optional().messages({
					"string.base": "searchTerm must be a string.",
					"string.empty": "searchTerm cannot be empty.",
				}),
				searchBy: Joi.string()
					.trim()
					.optional()
					.valid(
						"order-id",
						"customer-name",
						"customer-phone",
						"customer-email",
					)
					.messages({
						"string.base": "searchBy must be a string.",
						"string.empty": "searchBy cannot be empty.",
						"any.valid":
							"searchBy should be 'order-id', 'customer-name', 'customer-phone' or 'customer-email'.",
					}),
				filteredBy: Joi.string()
					.trim()
					.optional()
					.valid(
						"all",
						"active",
						"requested",
						"completed",
						"cancelled",
					)
					.default("all")
					.messages({
						"string.base": "filteredBy must be a string.",
						"string.empty": "filteredBy cannot be empty.",
						"any.valid":
							"filteredBy should be 'all', 'active', 'requested', 'completed' or 'cancelled'.",
					}),
				page: Joi.number().optional().default(1).messages({
					"number.base": "page must be a integer.",
				}),
				limit: Joi.number().optional().default(20).messages({
					"number.base": "limit must be a integer.",
				}),
			});

			const validationResult = orderSchema.validate(req.query);

			if (validationResult.error) {
				
				return responseSender(res, 400, validationResult.error.message);
			}

			// everything is fine
			(req as any).validatedValue = validationResult.value;
			next();
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default OrderMiddleware;
