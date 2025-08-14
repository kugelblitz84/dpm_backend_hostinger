import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";
import { Op, Order, WhereOptions } from "sequelize";
import TransactionService from "../service/transaction.service";
import { TransactionAttributes } from "../model/transaction.model";

class TransactionController {
	private transactionService: TransactionService;

	constructor() {
		this.transactionService = new TransactionService();
	}

	getAllTransactions = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<TransactionAttributes> = {};

			if (searchTerm) {
				filter.orderId = {
					[Op.like]: searchTerm,
				};
			}

			const transactions =
				await this.transactionService.getAllTransactions(
					filter,
					limitPerPage,
					offset,
					order,
				);
			if (!transactions.rows) {
				return responseSender(
					res,
					400,
					"Failed to get transactions. Please try again.",
				);
			}
			return responseSender(
				res,
				200,
				"Transactions fetched successfully.",
				{
					transactions: transactions.rows,
					total: transactions.count,
					totalPages: Math.ceil(transactions.count / limitPerPage),
					currentPage,
				},
			);
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default TransactionController;
