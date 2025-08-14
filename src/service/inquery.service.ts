import InqueryImage from "../model/inquery-image.model";
import Inquery, { InqueryAttributes } from "../model/inquery.model";
import { Order, WhereOptions } from "sequelize";

class InqueryService {
	createInquery = async (
		name: string,
		email: string,
		phone: string,
		company: string,
		inqueryType: string,
		message: string,
		status: "open" | "closed" = "open",
	): Promise<Inquery | InqueryAttributes | null> => {
		try {
			const inquery = await Inquery.create({
				name,
				email,
				phone,
				company,
				inqueryType,
				message,
				status,
			});

			return inquery ? inquery.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	addInqueryImage = async (
		imageName: string,
		inqueryId: number,
	): Promise<boolean> => {
		try {
			await InqueryImage.create({ imageName, inqueryId });
			return true;
		} catch (err: any) {
			
			throw err;
		}
	};

	closeInquery = async (
		inqueryId: number,
	): Promise<Inquery | InqueryAttributes | null> => {
		try {
			const inquery = await Inquery.findOne({
				where: { inqueryId },
			});
			if (inquery) {
				inquery.status = "closed";
				await inquery.save();
				return inquery.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	openInquery = async (
		inqueryId: number,
	): Promise<Inquery | InqueryAttributes | null> => {
		try {
			const inquery = await Inquery.findOne({
				where: { inqueryId },
			});
			if (inquery) {
				inquery.status = "open";
				await inquery.save();
				return inquery.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteInquery = async (inqueryId: number): Promise<boolean> => {
		try {
			const inquery = await Inquery.findOne({ where: { inqueryId } });

			if (!inquery) return false;

			await InqueryImage.destroy({ where: { inqueryId } });
			await inquery.destroy();

			return true;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllInqueries = async (
		filter: WhereOptions<InqueryAttributes>,
		limit: number,
		offset: number,
		order: Order,
	): Promise<{ rows: Inquery[] | InqueryAttributes[]; count: number }> => {
		try {
			const inqueries = await Inquery.findAndCountAll({
				where: filter,
				limit,
				offset,
				order,
				distinct: true,
				include: [
					{ model: InqueryImage, as: "images", separate: true },
				],
			});
			return {
				rows: inqueries.rows.map((inquery) => inquery.toJSON()),
				count: inqueries.count,
			};
		} catch (err: any) {
			
			throw err;
		}
	};

	getInqueryById = async (
		inqueryId: number,
	): Promise<Inquery | InqueryAttributes | null> => {
		try {
			const inquery = await Inquery.findOne({
				where: { inqueryId },
				include: [
					{ model: InqueryImage, as: "images", separate: true },
				],
			});
			if (inquery) {
				return inquery.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default InqueryService;
