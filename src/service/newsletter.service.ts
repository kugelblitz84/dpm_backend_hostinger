import Newsletter, { NewsletterAttributes } from "../model/newsletter.model";
import { Order, WhereOptions } from "sequelize";

class NewsletterService {
	subscribe = async (
		email: string,
		verificationToken: string,
	): Promise<Newsletter | NewsletterAttributes | null> => {
		try {
			const newsletter = await Newsletter.create({
				email,
				verified: false,
				verificationToken,
			});
			const createdNewsletter = await Newsletter.findByPk(
				newsletter.newsletterId,
			);
			if (createdNewsletter) {
				return createdNewsletter.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	verifyEmail = async (
		email: string,
		verificationToken: string,
	): Promise<Newsletter | NewsletterAttributes | null> => {
		try {
			const newsletter = await Newsletter.findOne({
				where: { email, verificationToken },
			});
			if (newsletter) {
				newsletter.verified = true;
				await newsletter.save();
				return newsletter.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	unsubscribe = async (
		email: string,
		verificationToken: string,
	): Promise<boolean> => {
		try {
			const newsletter = await Newsletter.findOne({
				where: { email, verificationToken },
			});
			if (newsletter) {
				await newsletter.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	findByEmail = async (
		email: string,
	): Promise<Newsletter | NewsletterAttributes | null> => {
		try {
			const newsletter = await Newsletter.findOne({ where: { email } });
			if (newsletter) {
				return newsletter.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAll = async (
		filter: WhereOptions,
		limit: number,
		offset: number,
		order: Order,
	): Promise<{
		rows: Newsletter[] | NewsletterAttributes[];
		count: number;
	}> => {
		try {
			const newsletters = await Newsletter.findAndCountAll({
				where: filter,
				limit,
				offset,
				order,
			});
			return {
				rows: newsletters.rows.map((newsletter) => newsletter.toJSON()),
				count: newsletters.count,
			};
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteByEmail = async (email: string): Promise<boolean> => {
		try {
			const newsletter = await Newsletter.findOne({
				where: { email },
			});
			if (newsletter) {
				await newsletter.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default NewsletterService;
