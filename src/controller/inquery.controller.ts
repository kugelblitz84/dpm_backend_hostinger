import InqueryService from "../service/inquery.service";
import EmailService from "../service/email.service";
import { responseSender } from "../util";
import { InqueryAttributes } from "../model/inquery.model";
import { Op, Order, WhereOptions } from "sequelize";
import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { io } from "../server";
import { staticDir } from "../config/dotenv.config";

class InqueryController {
	private inqueryService: InqueryService;
	private emailService: EmailService;

	constructor() {
		this.inqueryService = new InqueryService();
		this.emailService = new EmailService();
	}

	createInquery = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			const newInquery = (req as any).validatedValue;
			if (req.files && (req.files as Express.Multer.File[]).length > 0) {
				newInquery.images = req.files;
			}
			const inquery = await this.inqueryService.createInquery(
				newInquery.name,
				newInquery.email,
				newInquery.phone,
				newInquery.company,
				newInquery.inqueryType,
				newInquery.message,
			);

			if (!inquery) {
				return responseSender(
					res,
					400,
					"Failed to create inquery. Please try again.",
				);
			}

			// if inquery images exist then store them
			if (newInquery.images.length > 0) {
				for (const image of newInquery.images) {
					await this.inqueryService.addInqueryImage(
						image.filename,
						inquery?.inqueryId,
					);
				}
			}

			// emit the create inquery event
			io.emit("create-inquery", { inquery });

			try {
				// send inquery submission email
				await this.emailService.sendEmail(
					inquery.email,
					"Inquiry Received - Dhaka Plastic & Metal",
					"inquery-submission",
					{
						customerName: inquery.name,
						customerEmail: inquery.email,
						customerPhone: inquery.phone,
						customerMessage: inquery.message,
					},
				);

				return responseSender(
					res,
					200,
					"Inquery created successfully.",
					{
						inquery,
					},
				);
			} catch (err: any) {
				
			}
		} catch (err: any) {
			// cleanup process if database operation failed
			if (req.files && Array.isArray(req.files)) {
				req.files.forEach((file) => {
					const filePath = path.join(file.destination, file.filename);

					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							
						}
					});
				});
			}

			next(err);
		}
	};

	getAllInqueries = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const searchBy = (req as any).validatedValue.searchBy;
			const inqueryType = (req as any).validatedValue.inqueryType;
			const status = (req as any).validatedValue.status;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<InqueryAttributes> = {};

			if (inqueryType) {
				filter.inqueryType = inqueryType;
			}

			if (status) {
				filter.status = status;
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

			const inqueries = await this.inqueryService.getAllInqueries(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!inqueries.rows) {
				return responseSender(
					res,
					400,
					"Failed to get inqueries. Please try again.",
				);
			}
			return responseSender(res, 200, "Inqueries fetched successfully.", {
				inqueries: inqueries.rows,
				total: inqueries.count,
				totalPages: Math.ceil(inqueries.count / limitPerPage),
				currentPage,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	closeInquery = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const inquery = await this.inqueryService.closeInquery(
				(req as any).validatedValue.inqueryId,
			);

			if (!inquery) {
				return responseSender(
					res,
					400,
					"Failed to close inquery. Please try again.",
				);
			}
			return responseSender(res, 200, "Inquery closed successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	openInquery = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const inquery = await this.inqueryService.openInquery(
				(req as any).validatedValue.inqueryId,
			);

			if (!inquery) {
				return responseSender(
					res,
					400,
					"Failed to open inquery. Please try again.",
				);
			}
			return responseSender(res, 200, "Inquery opened successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	deleteInquery = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fetchedInquery = await this.inqueryService.getInqueryById(
				(req as any).validatedValue.inqueryId,
			);

			if (!fetchedInquery) {
				return responseSender(res, 400, "Couldn't found inquery.");
			}

			if (fetchedInquery.images?.length > 0) {
				// remove the images
				for (const image of fetchedInquery.images) {
					const filePath = path.join(
						staticDir,
						"inqueries",
						image.imageName,
					);
					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							// Optionally log the error
						}
					});
				}
			}

			const inqueryDeleted = await this.inqueryService.deleteInquery(
				(req as any).validatedValue.inqueryId,
			);

			if (!inqueryDeleted) {
				return responseSender(
					res,
					400,
					"Failed to delete inquery. Please try again.",
				);
			}
			return responseSender(res, 200, "Inquery deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default InqueryController;
