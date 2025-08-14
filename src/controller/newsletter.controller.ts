import NewsletterService from "../service/newsletter.service";
import EmailService from "../service/email.service";
import { responseSender, generateVerificationToken } from "../util";
import urlJoin from "url-join";
import { Op, Order, WhereOptions } from "sequelize";
import { serverBaseUrl, serverUrlPrefix } from "../config/dotenv.config";
import { Request, Response, NextFunction } from "express";
import { NewsletterAttributes } from "../model/newsletter.model";
import { io } from "../server";

class NewsletterController {
	private newsletterService: NewsletterService;
	private emailService: EmailService;
	constructor() {
		this.newsletterService = new NewsletterService();
		this.emailService = new EmailService();
	}

	subscribe = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const email = (req as any).validatedValue.email;

			const isEmailExists =
				await this.newsletterService.findByEmail(email);
			if (isEmailExists) {
				return responseSender(res, 400, "You have already subscribed.");
			}

			const verificationToken = generateVerificationToken();
			const newsletter = await this.newsletterService.subscribe(
				email,
				verificationToken,
			);
			if (!newsletter) {
				return responseSender(
					res,
					500,
					"Something went wrong. Please try again.",
				);
			}

			try {
				const verificationUrl = urlJoin(
					serverBaseUrl,
					serverUrlPrefix,
					`/newsletter/verify?email=${email}&token=${verificationToken}`,
				);
				const unsubscribeUrl = urlJoin(
					serverBaseUrl,
					serverUrlPrefix,
					`/newsletter/unsubscribe?email=${email}&token=${verificationToken}`,
				);
				// send welcome email
				await this.emailService.sendEmail(
					email,
					"Welcome to Dhaka Plastic & Metal Newsletter",
					"newsletter-subscribe",
					{ email, verificationUrl, unsubscribeUrl },
				);

				// emit the subscribe newsletter event
				io.emit("subscribe-newsletter");

				return responseSender(
					res,
					200,
					"You have subscribed successfully.",
				);
			} catch (err: any) {
				
				// clean up the database
				await this.newsletterService.deleteByEmail(email);

				next(err);
			}
		} catch (err: any) {
			
			next(err);
		}
	};

	verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const email = (req as any).validatedValue.email;
			const verificationToken = (req as any).validatedValue.token;

			const isEmailExists =
				await this.newsletterService.findByEmail(email);
			if (!isEmailExists) {
				return responseSender(res, 400, "You have not subscribed.");
			}

			const isVerified = await this.newsletterService.verifyEmail(
				email,
				verificationToken,
			);
			if (isVerified) {
				return responseSender(res, 200, "You have verified email.");
			}
			return responseSender(res, 400, "Invalid token. Please try again.");
		} catch (err: any) {
			
			next(err);
		}
	};

	unsubscribe = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const email = (req as any).validatedValue.email;
			const verificationToken = (req as any).validatedValue.token;

			const isEmailExists =
				await this.newsletterService.findByEmail(email);
			if (!isEmailExists) {
				return responseSender(res, 400, "You have not subscribed.");
			}

			const isUnsubscribed = await this.newsletterService.unsubscribe(
				email,
				verificationToken,
			);
			if (!isUnsubscribed) {
				return responseSender(
					res,
					400,
					"Invalid token. Please try again.",
				);
			}
			return responseSender(
				res,
				200,
				"You have unsubscribed successfully.",
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllSubscriber = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const searchTerm = (req as any).validatedValue?.searchTerm;
			const verified = (req as any).validatedValue?.verified;
			const currentPage = parseInt(
				(req as any).validatedValue?.page || 1,
			);
			const limitPerPage = parseInt(
				(req as any).validatedValue?.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<NewsletterAttributes> = {};

			if (verified) {
				filter.verified = verified;
			}
			if (searchTerm) {
				filter.email = {
					[Op.like]: `%${searchTerm}%`,
				};
			}

			const subscribers = await this.newsletterService.getAll(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!subscribers.rows) {
				return responseSender(res, 400, "No subscribers found.");
			}

			subscribers.rows.forEach((subscriber) => {
				(subscriber as any).verificationUrl = urlJoin(
					serverBaseUrl,
					serverUrlPrefix,
					`/newsletter/verify?email=${subscriber.email}&token=${subscriber.verificationToken}`,
				);
				(subscriber as any).unsubscribeUrl = urlJoin(
					serverBaseUrl,
					serverUrlPrefix,
					`/newsletter/unsubscribe?email=${subscriber.email}&token=${subscriber.verificationToken}`,
				);
			});

			return responseSender(
				res,
				200,
				"Subscribers fetched successfully.",
				{
					subscribers: subscribers.rows,
					total: subscribers.count,
					totalPages: Math.ceil(subscribers.count / limitPerPage),
					currentPage,
				},
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	deleteByEmail = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const email = (req as any).validatedValue.email;

			const isEmailExists =
				await this.newsletterService.findByEmail(email);
			if (!isEmailExists) {
				return responseSender(
					res,
					400,
					"Email record could not found.",
				);
			}

			const isDeleted = await this.newsletterService.deleteByEmail(email);
			if (!isDeleted) {
				return responseSender(
					res,
					400,
					"Someting went wrong. Please try again.",
				);
			}
			return responseSender(
				res,
				200,
				"Email record deleted successfully.",
			);
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default NewsletterController;
