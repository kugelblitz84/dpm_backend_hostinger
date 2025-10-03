import StaffService from "../service/staff.service";
import fs from "fs";
import path from "path";
import {
	responseSender,
	hashedPassword,
	comparePassword,
	generateJWTToken,
} from "../util";
import { Request, Response, NextFunction } from "express-serve-static-core";
import AdminService from "../service/admin.service";
import { Op, Order, WhereOptions } from "sequelize";
import { StaffAttributes } from "../model/staff.model";
import { staticDir } from "../config/dotenv.config";

class StaffController {
	private staffService: StaffService;
	private adminService: AdminService;

	constructor() {
		this.staffService = new StaffService();
		this.adminService = new AdminService();
	}

	registerStaff = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const staff = {
				name: (req as any).validatedValue.name,
				email: (req as any).validatedValue.email,
				phone: (req as any).validatedValue.phone,
				password: await hashedPassword(
					(req as any).validatedValue.password,
				),
				role: (req as any).validatedValue.role,
				commissionPercentage: (req as any).validatedValue
					.commissionPercentage,
				designCharge: (req as any).validatedValue?.designCharge || null,
			};

			// check if the email is already registered
			const isEmailExistsAsStaff =
				await this.staffService.getStaffByEmail(staff.email);
			if (isEmailExistsAsStaff) {
				return responseSender(
					res,
					400,
					`${staff.email} is already registered as ${isEmailExistsAsStaff.role}. Please login.`,
				);
			}

			const isEmailExistsAsAdmin =
				await this.adminService.getAdminByEmail(staff.email);
			if (isEmailExistsAsAdmin) {
				return responseSender(
					res,
					400,
					`An admin already associated with this email. Please login or use another email.`,
				);
			}

			if (
				(req as any).validatedValue.role === "designer" &&
				!(req as any).validatedValue.designCharge
			) {
				return responseSender(
					res,
					400,
					"Design charge is required for designer.",
				);
			}

			const createdStaff = await this.staffService.registerStaff(
				staff.name,
				staff.email,
				staff.phone,
				staff.password,
				staff.role,
				staff.commissionPercentage,
				staff.designCharge,
			);
			if (!createdStaff) {
				return responseSender(
					res,
					400,
					"Staff registration failed. Please try again.",
				);
			}
			// create jwt token
			const { password, ...authTokenPayload } = createdStaff;
			const authToken = generateJWTToken(authTokenPayload);

			return responseSender(res, 201, "Staff registered successfully.", {
				staff: authTokenPayload,
				authToken,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	uploadStaffAvatar = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			const authorizedStaff = (req as any).staff;

			const fetchedStaff = await this.staffService.getStaffByEmail(
				authorizedStaff.email,
			);

			if (!fetchedStaff) {
				return responseSender(
					res,
					400,
					"Staff not found. Please register.",
				);
			}

			if (fetchedStaff.avatar !== "null" && req.file?.destination) {
				const previousAvatar = path.join(
					req.file?.destination,
					fetchedStaff.avatar,
				);
				fs.unlink(previousAvatar, (unlinkErr) => {
					if (unlinkErr) {
						
						throw unlinkErr;
					}
				});
			}

			const avatarPath =
				(req.file?.filename && req.file.filename) || "null";

			const isAvatarUploaded = await this.staffService.uploadStaffAvatar(
				authorizedStaff.staffId,
				avatarPath,
			);

			if (!isAvatarUploaded) {
				return responseSender(
					res,
					400,
					"Staff avatar upload failed. Please try again.",
				);
			}

			return responseSender(
				res,
				200,
				"Staff avatar uploaded successfully.",
			);
		} catch (err: any) {
			// If database operation fails, delete the uploaded file
			if (req.file) {
				const filePath = path.join(
					req.file.destination,
					req.file.filename,
				);

				fs.unlink(filePath, (unlinkErr) => {
					if (unlinkErr) {
						// Optionally log the error
					}
				});
			}

			next(err);
		}
	};

	updateStaff = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			const authorizedStaff = (req as any).staff;

			const fetchedStaff = await this.staffService.getStaffByEmail(
				authorizedStaff.email,
			);
			if (!fetchedStaff) {
				return responseSender(
					res,
					400,
					"Staff not found. Please register.",
				);
			}
			const isPasswordValid = await comparePassword(
				(req as any).validatedValue.currentPassword,
				fetchedStaff.password,
			);
			if (!isPasswordValid) {
				// since password didn't match so delete the uploaded file
				if (req.file) {
					const filePath = path.join(
						req.file.destination,
						req.file.filename,
					);

					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							// Optionally log the error
						}
					});
				}

				return responseSender(
					res,
					400,
					"Invalid password. Please try again.",
				);
			}

			// if the staff has previous avatar then remove it
			if (
				fetchedStaff.avatar !== "null" &&
				(req as any).validatedValue.keepPreviousAvatar === "false"
			) {
				const filePath = path.join(
					staticDir,
					"avatars",
					fetchedStaff.avatar,
				);

				fs.unlink(filePath, (unlinkErr) => {
					if (unlinkErr) {
						// Optionally log the error
					}
				});
			}

			const updatedStaffProps = {
				email: fetchedStaff.email,
				name: (req as any).validatedValue.name,
				phone: (req as any).validatedValue.phone,
				avatar:
					(req as any).validatedValue.keepPreviousAvatar === "true"
						? fetchedStaff.avatar
						: (req.file && req.file.filename) || "null",
				password:
					(req as any).validatedValue.newPassword.length > 0
						? await hashedPassword(
								(req as any).validatedValue.newPassword,
							)
						: undefined,
			};

			const isUpdated = await this.staffService.updateStaff(
				updatedStaffProps.email,
				updatedStaffProps.name,
				updatedStaffProps.phone,
				updatedStaffProps.avatar,
				updatedStaffProps.password,
			);
			if (!isUpdated) {
				return responseSender(
					res,
					400,
					"Staff update failed. Please try again.",
				);
			}
			return responseSender(res, 200, "Staff updated successfully.");
		} catch (err: any) {
			// If database operation fails, delete the uploaded file
			if (req.file) {
				const filePath = path.join(
					req.file.destination,
					req.file.filename,
				);

				fs.unlink(filePath, (unlinkErr) => {
					if (unlinkErr) {
						// Optionally log the error
					}
				});
			}

			next(err);
		}
	};

	updateStaffProtected = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const authorizedAdmin = (req as any).admin;

			const fetchedAdmin = await this.adminService.getAdminByEmail(
				authorizedAdmin?.email,
			);
			if (!fetchedAdmin) {
				return responseSender(
					res,
					400,
					"Your are not authorized to perform this action.",
				);
			}

			const fetchedStaff = await this.staffService.getStaffByEmail(
				(req as any).validatedValue.email,
			);
			if (!fetchedStaff) {
				return responseSender(res, 400, "Staff not found.");
			}

			if (
				(req as any).validatedValue.role === "designer" &&
				!(req as any).validatedValue.designCharge
			) {
				return responseSender(
					res,
					400,
					"Design charge is required for designer.",
				);
			}

			const staff = await this.staffService.updateStaffProtected(
				(req as any).validatedValue.name,
				(req as any).validatedValue.email,
				(req as any).validatedValue.phone,
				(req as any).validatedValue.role,
				(req as any).validatedValue.commissionPercentage,
				(req as any).validatedValue.designCharge || null,
			);
			if (!staff) {
				return responseSender(
					res,
					400,
					"Staff update failed. Please try again.",
				);
			}
			return responseSender(res, 200, "Staff updated successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	clearStaffBalance = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const staffId = (req as any).validatedValue.staffId;

			const isCleared =
				await this.staffService.clearStaffBalance(staffId);
			if (!isCleared) {
				return responseSender(
					res,
					500,
					"Staff balance clearation failed.",
				);
			}

			return responseSender(
				res,
				200,
				"Staff balance cleared successfully.",
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	deleteStaff = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const staffId = (req as any).validatedValue.staffId;

			const isDeleted = await this.staffService.deleteStaff(staffId);
			if (!isDeleted) {
				return responseSender(res, 500, "Staff deletion failed.");
			}

			return responseSender(res, 200, "Staff deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllStaff = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const searchBy = (req as any).validatedValue.searchBy;
			const role = (req as any).validatedValue.role;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<StaffAttributes> = {};

			if (role) {
				filter.role = role;
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

			const staff = await this.staffService.getAllStaff(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!staff.rows) {
				return responseSender(
					res,
					400,
					"Failed to get staff. Please try again.",
				);
			}

			return responseSender(res, 200, "Staff fetched successfully.", {
				staff: staff.rows.map((staffItem) => {
					const { password, ...rest } = staffItem;
					return rest;
				}),
				total: staff.count,
				totalPages: Math.ceil(staff.count / limitPerPage),
				currentPage,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default StaffController;
