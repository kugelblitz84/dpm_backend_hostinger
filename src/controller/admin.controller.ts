import { responseSender, hashedPassword, comparePassword } from "../util";
import { Request, Response, NextFunction } from "express";
import AdminService from "../service/admin.service";
import fs from "fs";
import path from "path";
import { staticDir } from "../config/dotenv.config";

class AdminController {
	private adminService: AdminService;

	constructor() {
		this.adminService = new AdminService();
	}

	uploadAdminAvatar = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			const authorizedAdmin = (req as any).admin;

			const fetchedAdmin = await this.adminService.getAdminByEmail(
				authorizedAdmin.email,
			);

			if (req.file && fetchedAdmin && fetchedAdmin.avatar !== "null") {
				const previousAvatar = path.join(
					req.file.destination,
					fetchedAdmin.avatar,
				);
				fs.unlink(previousAvatar, (unlinkErr) => {
					if (unlinkErr) {
						
						throw unlinkErr;
					}
				});
			}

			const avatarPath = (req.file && req.file.filename) || "null";

			const admin = await this.adminService.uploadAdminAvatar(
				authorizedAdmin?.adminId,
				avatarPath,
			);
			if (!admin) {
				return responseSender(
					res,
					400,
					"Admin avatar upload failed. Please try again.",
				);
			}

			return responseSender(
				res,
				200,
				"Admin avatar uploaded successfully.",
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

	updateAdmin = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			const authorizedAdmin = (req as any).admin;

			const fetchedAdmin = await this.adminService.getAdminByEmail(
				authorizedAdmin?.email,
			);
			if (!fetchedAdmin) {
				return responseSender(
					res,
					400,
					"Admin not found. Please register.",
				);
			}
			const isPasswordValid = await comparePassword(
				(req as any).validatedValue.currentPassword,
				fetchedAdmin.password,
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

			// if the admin has previous avatar then remove it
			if (
				fetchedAdmin.avatar !== "null" &&
				(req as any).validatedValue.keepPreviousAvatar === "false"
			) {
				const filePath = path.join(
					staticDir,
					"avatars",
					fetchedAdmin.avatar,
				);

				fs.unlink(filePath, (unlinkErr) => {
					if (unlinkErr) {
						// Optionally log the error
					}
				});
			}

			const updatedAdminProps = {
				email: fetchedAdmin.email,
				name: (req as any).validatedValue.name,
				phone: (req as any).validatedValue.phone,
				avatar:
					(req as any).validatedValue.keepPreviousAvatar === "true"
						? fetchedAdmin.avatar
						: (req.file && req.file.filename) || "null",
				password:
					(req as any).validatedValue.newPassword.length > 0
						? await hashedPassword(
								(req as any).validatedValue.newPassword,
							)
						: undefined,
			};

			const isUpdated = await this.adminService.updateAdmin(
				updatedAdminProps.email,
				updatedAdminProps.name,
				updatedAdminProps.phone,
				updatedAdminProps.avatar,
				updatedAdminProps.password,
			);
			if (!isUpdated) {
				return responseSender(res, 400, "Admin update failed.");
			}

			return responseSender(res, 200, "Admin updated successfully.");
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
}

export default AdminController;
