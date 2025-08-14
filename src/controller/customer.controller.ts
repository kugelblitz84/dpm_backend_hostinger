import { serverBaseUrl, serverUrlPrefix } from "../config/dotenv.config";
import {
	responseSender,
	hashedPassword,
	generateJWTToken,
	generateVerificationToken,
	comparePassword,
	generateOTP,
} from "../util";
import urlJoin from "url-join";
import CustomerService from "../service/customer.service";
import EmailService from "../service/email.service";
import OtpService from "../service/otp.service";
import { Request, Response, NextFunction } from "express";
import { Op, Order, WhereOptions } from "sequelize";
import { CustomerAttributes } from "../model/customer.model";
import { io } from "../server";

class CustomerController {
	private customerService: CustomerService;
	private emailService: EmailService;
	private otpService: OtpService;

	constructor() {
		this.customerService = new CustomerService();
		this.emailService = new EmailService();
		this.otpService = new OtpService();
	}

	registerCustomer = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customer = {
				name: (req as any).validatedValue.name,
				email: (req as any).validatedValue.email,
				password: await hashedPassword(
					(req as any).validatedValue.password,
				),
				phone: (req as any).validatedValue.phone,
				verificationToken: generateVerificationToken(),
			};

			const isEmailExists = await this.customerService.getCustomerByEmail(
				customer.email,
			);

			if (isEmailExists) {
				return responseSender(
					res,
					400,
					"Customer already registered. Please login.",
				);
			}

			const createdCustomer = await this.customerService.registerCustomer(
				customer.name,
				customer.email,
				customer.password,
				customer.phone,
				customer.verificationToken,
			);
			if (!createdCustomer) {
				return responseSender(
					res,
					400,
					"Customer registration failed. Please try again.",
				);
			}
			// create jwt token
			const { password, ...authTokenPayload } = createdCustomer;
			const authToken = generateJWTToken(authTokenPayload);

			try {
				// send welcome email
				const verificationUrl = urlJoin(
					serverBaseUrl,
					serverUrlPrefix,
					`/customer/verify?email=${customer.email}&token=${customer.verificationToken}`,
				);
				await this.emailService.sendEmail(
					customer.email,
					"Welcome to Dhaka Plastic & Metal",
					"welcome-email",
					{ name: customer.name, verificationUrl },
				);

				// emit the new customer join event
				io.emit("register-customer", { customer: authTokenPayload });

				return responseSender(
					res,
					201,
					"Customer registered successfully.",
					{
						customer: authTokenPayload,
						authToken,
					},
				);
			} catch (err: any) {
				
				// clean up the database
				await this.customerService.deleteCustomer(customer.email);

				next(err);
			}
		} catch (err: any) {
			
			next(err);
		}
	};

	loginCustomer = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fetchedCustomer =
				await this.customerService.getCustomerByEmail(
					(req as any).validatedValue.email,
				);

			if (!fetchedCustomer) {
				return responseSender(
					res,
					400,
					"Customer account not found. Please register.",
				);
			}

			const isPasswordValid = await comparePassword(
				(req as any).validatedValue.password,
				fetchedCustomer.password,
			);

			if (!isPasswordValid) {
				return responseSender(
					res,
					400,
					"Invalid password. Please try again.",
				);
			}

			// create jwt token
			const { password, ...authTokenPayload } = fetchedCustomer;
			const authToken = generateJWTToken(authTokenPayload);

			return responseSender(
				res,
				200,
				"Customer logged in successfully.",
				{
					customer: authTokenPayload,
					authToken,
				},
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	updateCustomer = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const authorizedCustomer = (req as any).customer;

			const fetchedCustomer =
				await this.customerService.getCustomerByEmail(
					authorizedCustomer.email,
				);
			if (!fetchedCustomer) {
				return responseSender(
					res,
					400,
					"Customer not found. Please register.",
				);
			}
			const isPasswordValid = await comparePassword(
				(req as any).validatedValue.currentPassword,
				fetchedCustomer.password,
			);
			if (!isPasswordValid) {
				return responseSender(
					res,
					400,
					"Invalid password. Please try again.",
				);
			}

			const updatedCustomerProps = {
				email: fetchedCustomer.email,
				name: (req as any).validatedValue.name,
				phone: (req as any).validatedValue.phone,
				billingAddress: (req as any).validatedValue.billingAddress,
				shippingAddress: (req as any).validatedValue.shippingAddress,
				password:
					(req as any).validatedValue.newPassword.length > 0
						? await hashedPassword(
								(req as any).validatedValue.newPassword,
							)
						: undefined,
			};

			const isUpdated = await this.customerService.updateCustomer(
				updatedCustomerProps.name,
				updatedCustomerProps.email,
				updatedCustomerProps.phone,
				updatedCustomerProps.billingAddress,
				updatedCustomerProps.shippingAddress,
				updatedCustomerProps.password,
			);
			if (!isUpdated) {
				return responseSender(
					res,
					400,
					"Customer update failed. Please try again.",
				);
			}
			return responseSender(res, 200, "Customer updated successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	verifyCustomerAccount = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customer = await this.customerService.getCustomerByEmail(
				(req as any).validatedValue.email,
			);

			if (!customer) {
				return responseSender(
					res,
					400,
					"Account not found. Please register.",
				);
			}

			if (customer.verified) {
				return responseSender(
					res,
					400,
					"Your account already verified.",
				);
			}

			if (
				customer.verificationToken !== (req as any).validatedValue.token
			) {
				return responseSender(res, 400, "Invalid verification token.");
			}

			const isVerified = await this.customerService.verifyCustomerAccount(
				(req as any).validatedValue.email,
			);

			if (isVerified) {
				// redirect to the login page
				// * TODO: Redirect to the home page with a toast message [your account is verified successfully]

				return responseSender(
					res,
					200,
					"Your account verified successfully.",
				);
			}

			return responseSender(
				res,
				400,
				"Customer account verification failed. Please try again.",
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	sendPasswordResetRequest = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customer = await this.customerService.getCustomerByEmail(
				(req as any).validatedValue.email,
			);

			if (!customer) {
				return responseSender(
					res,
					400,
					"Customer acocunt not found. Please register.",
				);
			}
			const otp = generateOTP(this.otpService.config.otpLength);

			const createdOtp = await this.otpService.createOtp(
				customer.customerId,
				otp,
			);

			if (!createdOtp) {
				return responseSender(
					res,
					400,
					"Password reset request failed. Please try again.",
				);
			}

			try {
				await this.emailService.sendEmail(
					customer.email,
					"Password Reset Request",
					"reset-password",
					{
						otp,
						expiresInMinutes:
							this.otpService.config.expiresInMinutes,
					},
				);
				return responseSender(
					res,
					200,
					"Password reset request sent successfully.",
				);
			} catch (err: any) {
				
				next(err);
			}
		} catch (err: any) {
			
			next(err);
		}
	};

	verifyResetPassword = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const fetchedCustomer =
				await this.customerService.getCustomerByEmail(
					(req as any).validatedValue.email,
				);
			if (!fetchedCustomer) {
				return responseSender(
					res,
					400,
					"Customer account not found. Please register.",
				);
			}
			const isOtpValid = await this.otpService.verifyOtp(
				fetchedCustomer.customerId,
				(req as any).validatedValue.otp,
			);

			if (!isOtpValid) {
				return responseSender(
					res,
					400,
					"Invalid otp. Please try again.",
				);
			}

			const { password, ...authTokenPayload } = fetchedCustomer;
			const authToken = generateJWTToken(authTokenPayload);

			return responseSender(res, 200, "Otp verified successfully.", {
				customer: authTokenPayload,
				authToken,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	resetPassword = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fetchedCustomer =
				await this.customerService.getCustomerByEmail(
					(req as any).validatedValue.email,
				);
			if (!fetchedCustomer) {
				return responseSender(
					res,
					400,
					"Customer account not found. Please register.",
				);
			}

			const isUpdated = await this.customerService.resetPassword(
				(req as any).validatedValue.email,
				await hashedPassword((req as any).validatedValue.password),
			);

			if (!isUpdated) {
				return responseSender(
					res,
					400,
					"Password update failed. Please try again.",
				);
			}

			const { password, ...authTokenPayload } = fetchedCustomer;
			const authToken = generateJWTToken(authTokenPayload);

			return responseSender(res, 200, "Password updated successfully.", {
				customer: authTokenPayload,
				authToken,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllCustomers = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const searchBy = (req as any).validatedValue.searchBy;
			const verified = (req as any).validatedValue.verified;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<CustomerAttributes> = {};

			if (verified) {
				filter.verified = verified;
			}

			if (searchTerm && searchBy) {
				switch (searchBy) {
					case "name":
						filter.name = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					case "email":
						filter.email = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					case "phone":
						filter.phone = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					default:
						break;
				}
			}

			const customers = await this.customerService.getAllCustomers(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!customers.rows) {
				return responseSender(
					res,
					400,
					"Failed to get customers. Please try again.",
				);
			}
			return responseSender(res, 200, "Customers fetched successfully.", {
				customers: customers.rows,
				total: customers.count,
				totalPages: Math.ceil(customers.count / limitPerPage),
				currentPage,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default CustomerController;
