// auth.middleware.ts
import AdminService from "../service/admin.service";
import StaffService from "../service/staff.service";
import CustomerService from "../service/customer.service";
import { responseSender, verifyToken } from "../util";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import Joi from "joi";

class AuthMiddleware {
	private schema: {
		name: Joi.StringSchema;
		email: Joi.StringSchema;
		phone: Joi.StringSchema;
		password: Joi.StringSchema;
	};
	private adminService = new AdminService();
	private staffService = new StaffService();
	private customerService = new CustomerService();

	constructor() {
		this.schema = {
			name: Joi.string().trim().min(2).required().messages({
				"string.base": "name must be a string.",
				"string.empty": "name cannot be empty.",
				"string.min": "name must be at least 2 characters long.",
				"any.required": "name is required.",
			}),
			email: Joi.string().trim().email().required().messages({
				"string.base": "email must be a string.",
				"string.email": "invalid email address.",
				"string.empty": "email cannot be empty.",
				"any.required": "email is required.",
			}),
			phone: Joi.string()
				.trim()
				.required()
				.pattern(/^01[3-9][0-9]{8}$/)
				.messages({
					"string.pattern.base":
						"phone number must be a valid Bangladeshi number starting with 01 and 11 digits long.",
					"string.empty": "phone number cannot be empty.",
				}),
			password: Joi.string().trim().min(8).required().messages({
				"string.base": "password must be a string.",
				"string.empty": "password cannot be empty.",
				"string.min": "password must be at least 8 characters long.",
				"any.required": "password is required.",
			}),
		};
	}

	authenticate = (
		roles: Array<"customer" | "admin" | "agent" | "designer">, // Documentation: The roles that can be authenticated
	) => {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const authHeader = req.headers["authorization"];
				if (!authHeader) {
					return responseSender(
						res,
						401,
						"Authorization token is missing.",
					);
				}
				const authToken = authHeader.split(" ")[1];
				if (!authToken) {
					return responseSender(
						res,
						401,
						"Authorization token is missing.",
					);
				}
				try {
					const decodedToken = verifyToken(authToken);
					if (!decodedToken) {
						return responseSender(
							res,
							401,
							"Invalid authorization token.",
						);
					}
					let user;
					for (let role of roles) {
						if (role === "customer") {
							user =
								await this.customerService.getCustomerByEmail(
									decodedToken.email,
								);
							if (user) {
								if (
									decodedToken.tokenVersion !==
									user.tokenVersion
								) {
									return responseSender(
										res,
										401,
										"Invalid authorization token.",
									);
								}
								// Documentation: Assign the decoded token, ensuring it includes the role.
								(req as any).customer = {
									...decodedToken,
									role: "customer",
								};
								break;
							}
						} else if (role === "admin") {
							user = await this.adminService.getAdminByEmail(
								decodedToken.email,
							);
							if (user) {
								if (
									decodedToken.tokenVersion !==
									user.tokenVersion
								) {
									return responseSender(
										res,
										401,
										"Invalid authorization token.",
									);
								}
								// Documentation: Assign the decoded token, ensuring it includes the role.
								(req as any).admin = {
									...decodedToken,
									role: "admin",
								};
								break;
							}
						} else if (role === "agent" || role === "designer") {
							user =
								await this.staffService.getStaffByEmailAndRole(
									decodedToken.email,
									role,
								);
							if (user) {
								if (
									decodedToken.tokenVersion !==
									user.tokenVersion
								) {
									return responseSender(
										res,
										401,
										"Invalid authorization token.",
									);
								}

								(req as any).staff = {
									...decodedToken,
									role: user.role,
									staffId: user.staffId,
								};

								break;
							}
						}
					}
					if (!user) {
						return responseSender(
							res,
							401,
							"Invalid authorization token.",
						);
					}
					next();
				} catch (err: any) {
					if (err instanceof jwt.JsonWebTokenError) {
						return responseSender(
							res,
							401,
							err.message || "Invalid authorization token.",
						);
					}
					next(err);
				}
			} catch (err: any) {
				next(err);
			}
		};
	};

	validateAdminRegistration = (
		req: Request,
		res: Response,
		next: NextFunction,
	): void => {
		try {
			const adminSchema = Joi.object({
				name: this.schema.name,
				email: this.schema.email,
				phone: this.schema.phone,
				password: this.schema.password,
			});

			const validationResult = adminSchema.validate(req.body);
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

	validateLogin = (req: Request, res: Response, next: NextFunction) => {
		try {
			const loginSchema = Joi.object({
				email: this.schema.email,
				password: this.schema.password,
			});

			const validationResult = loginSchema.validate(req.body);
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

export default AuthMiddleware;
