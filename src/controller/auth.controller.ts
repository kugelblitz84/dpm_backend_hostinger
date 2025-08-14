import {
	responseSender,
	hashedPassword,
	comparePassword,
	generateJWTToken,
} from "../util";
import { Request, Response, NextFunction } from "express";
import AdminService from "../service/admin.service";
import StaffService from "../service/staff.service";

class AuthController {
	private adminService: AdminService;
	private staffService: StaffService;

	constructor() {
		this.adminService = new AdminService();
		this.staffService = new StaffService();
	}

	canRegisterAdmin = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const isAdminExists = await this.adminService.getAllAdmin();
			if (isAdminExists && isAdminExists.length > 0) {
				return responseSender(
					res,
					200,
					"Admin already exists. Please login.",
					{ canRegisterAdmin: false },
				);
			}
			return responseSender(res, 200, "Register Admin.", {
				canRegisterAdmin: true,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const admin = {
				name: (req as any).validatedValue.name,
				email: (req as any).validatedValue.email,
				phone: (req as any).validatedValue.phone,
				password: await hashedPassword(
					(req as any).validatedValue.password,
				),
			};

			// check if there is already an admin registered
			const isAdminExists = await this.adminService.getAllAdmin();
			if (isAdminExists && isAdminExists.length > 0) {
				return responseSender(
					res,
					400,
					"Admin already exists. Please login.",
				);
			}

			// check if the email is not in the admin/staff record.
			const isEmailExists = await this.staffService.getStaffByEmail(
				admin.email,
			);

			if (isEmailExists) {
				return responseSender(
					res,
					400,
					"A staff already associated with this email. Please login or use another email.",
				);
			}

			const createdAdmin = await this.adminService.registerAdmin(
				admin.name,
				admin.email,
				admin.phone,
				admin.password,
			);
			if (!createdAdmin) {
				return responseSender(
					res,
					400,
					"Admin registration failed. Please try again.",
				);
			}
			// create jwt token
			const { password, ...authTokenPayload } = createdAdmin;
			const authToken = generateJWTToken(authTokenPayload);

			return responseSender(res, 201, "Admin registered successfully.", {
				admin: authTokenPayload,
				authToken,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	login = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fetchedAdmin = await this.adminService.getAdminByEmail(
				(req as any).validatedValue.email,
			);

			if (fetchedAdmin) {
				// login as admin
				const isPasswordValid = await comparePassword(
					(req as any).validatedValue.password,
					fetchedAdmin.password,
				);

				if (!isPasswordValid) {
					return responseSender(
						res,
						400,
						"Invalid password. Please try again.",
					);
				}
				// create jwt token
				const { password, ...authTokenPayload } = fetchedAdmin;
				const authToken = generateJWTToken(authTokenPayload);

				return responseSender(
					res,
					200,
					"Admin logged in successfully.",
					{
						admin: authTokenPayload,
						authToken,
					},
				);
			} else {
				// login as staff
				const fetchedStaff = await this.staffService.getStaffByEmail(
					(req as any).validatedValue.email,
				);

				if (!fetchedStaff) {
					return responseSender(res, 400, "You are not registered.");
				}
				const isPasswordValid = await comparePassword(
					(req as any).validatedValue.password,
					fetchedStaff.password,
				);
				if (!isPasswordValid) {
					return responseSender(
						res,
						400,
						"Invalid password. Please try again.",
					);
				}

				// create jwt token
				const { password, ...authTokenPayload } = fetchedStaff;
				const authToken = generateJWTToken(authTokenPayload);

				return responseSender(
					res,
					200,
					"Staff logged in successfully.",
					{
						staff: authTokenPayload,
						authToken,
					},
				);
			}
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default AuthController;
