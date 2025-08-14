import { FaqAttributes } from "../model/faq.model";
import FaqService from "../service/faq.service";
import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";
import { Op, WhereOptions } from "sequelize";

class FaqController {
	private faqService: FaqService;

	constructor() {
		this.faqService = new FaqService();
	}

	createNewFaq = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const createdFaq = await this.faqService.createNewFaq(
				(req as any).validatedValue.faqTitle,
			);

			if (!createdFaq) {
				return responseSender(
					res,
					500,
					"Something went wrong. Please try again.",
				);
			}

			try {
				for (const faqItem of (req as any).validatedValue.faqItems) {
					await this.faqService.createNewFaqItem(
						createdFaq.faqId,
						faqItem.question,
						faqItem.answer,
					);
				}

				const newFaq = await this.faqService.getFaqById(
					createdFaq.faqId,
				);

				return responseSender(res, 200, "Faq created successfully.", {
					faq: newFaq,
				});
			} catch (err: any) {
				
				next(err);
			}
		} catch (err: any) {
			
			next(err);
		}
	};

	updateFaq = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { faqId, faqTitle, faqItems } = (req as any).validatedValue;

			// Update the faq
			const isUpdated = await this.faqService.updateFaq(
				faqId,
				faqTitle,
				faqItems,
			);

			if (!isUpdated) {
				return responseSender(
					res,
					500,
					"Failed to update faq. Please try again.",
				);
			}

			return responseSender(res, 200, "FAQ updated successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllFaq = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const filter: WhereOptions<FaqAttributes> = {};

			if (searchTerm) {
				filter.faqTitle = {
					[Op.like]: `%${searchTerm}%`,
				};
			}

			const faqs = await this.faqService.getAllFaq(
				filter,
				limitPerPage,
				offset,
			);

			if (!faqs.rows) {
				return responseSender(
					res,
					400,
					"Cannot find faqs. Please try again.",
				);
			}

			return responseSender(res, 200, "Faq fetched successfully.", {
				faqs: faqs.rows,
				total: faqs.count,
				totalPages: Math.ceil(faqs.count / limitPerPage),
				currentPage,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default FaqController;
