import Transaction, { TransactionAttributes } from "../model/transaction.model";

class TransactionService {
	constructor() {}

	createTransaction = async (
		transactionId: string,
		orderId: number,
		valId: string,
		amount: string,
		storeAmount: string,
		cardType: string,
		bankTransactionId: string,
		status: string,
		transactionDate: Date,
		currency: string,
		cardIssuer: string,
		cardBrand: string,
	): Promise<Transaction | TransactionAttributes | null> => {
		try {
			const transaction = await Transaction.create({
				transactionId,
				orderId,
				valId,
				amount,
				storeAmount,
				cardType,
				bankTransactionId,
				status,
				transactionDate,
				currency,
				cardIssuer,
				cardBrand,
			});
			return transaction.toJSON();
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllTransactions = async (
		filter: any,
		limit: number,
		offset: number,
		order: any,
	): Promise<{
		rows: Transaction[] | TransactionAttributes[];
		count: number;
	}> => {
		try {
			const transactions = await Transaction.findAll({
				where: filter,
				limit,
				offset,
				order,
			});
			return {
				rows: transactions.map((transaction) => transaction.toJSON()),
				count: transactions.length,
			};
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default TransactionService;
