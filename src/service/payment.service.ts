import axios from "axios";
import {
	sslCommerzSandbox,
	sslCommerzStoreId,
	sslCommerzStorePassword,
} from "../config/dotenv.config";
import Payment, { PaymentAttributes } from "../model/payment.model";
import { generateTransactionId } from "../util";
import { Op, Sequelize } from "sequelize";

class PaymentService {
	private SSLCommerzConfig: {
		store_id: string;
		store_passwd: string;
		sandbox: boolean;
	};

	private BASE_URL: string;

	constructor() {
		this.SSLCommerzConfig = {
			store_id: sslCommerzStoreId,
			store_passwd: sslCommerzStorePassword,
			sandbox: sslCommerzSandbox === "true",
		};

		this.BASE_URL = this.SSLCommerzConfig.sandbox
			? "https://sandbox.sslcommerz.com"
			: "https://securepay.sslcommerz.com";
	}

	createCashPayment = async (
		orderId: number,
		amount: number,
	): Promise<Payment | PaymentAttributes | null> => {
		try {
			const transactionId = await this.generateUniqueTransactionId();

			const createdPayment = await Payment.create({
				transactionId,
				orderId,
				paymentMethod: "cod-payment",
				amount,
				isPaid: true,
				paymentLink: null,
			});

			return createdPayment.toJSON();
		} catch (err: any) {
			
			throw err;
		}
	};

	createOnlinePayment = async (
		orderId: number,
		amount: number,
		customerName: string,
		customerEmail: string,
		customerPhone: string,
	): Promise<Payment | PaymentAttributes | null> => {
		try {
			const transactionId = await this.generateUniqueTransactionId();

			const expireInHours = 24;

			const expireDate = new Date();
			expireDate.setHours(expireDate.getHours() + expireInHours);
			const expireDateStr = expireDate
				.toISOString()
				.replace("T", " ")
				.substring(0, 19); // Format: YYYY-MM-DD HH:MM:SS

			const paymentData = {
				store_id: this.SSLCommerzConfig.store_id,
				store_passwd: this.SSLCommerzConfig.store_passwd,
				total_amount: amount.toString(),
				currency: "BDT",
				tran_id: transactionId,
				success_url: "http://localhost:4000/api/order/payment/success",
				fail_url: "http://localhost:4000/api/order/payment/fail",
				cancel_url: "http://localhost:4000/api/order/payment/cancel",
				cus_name: customerName,
				cus_email: customerEmail,
				cus_phone: customerPhone,
				cus_add1: "N/A", // Optional
				cus_city: "N/A", // Optional
				cus_country: "N/A", // Optional
				shipping_method: "NO", // Optional
				product_name: "N/A", // Optional
				product_category: "N/A", // Optional
				product_profile: "general", // Optional
				expire_date: expireDateStr,
			};

			const response = await axios.post(
				`${this.BASE_URL}/gwprocess/v4/api.php`,
				paymentData,
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				},
			);

			if (response.data.status === "SUCCESS") {
				const createdPayment = await Payment.create({
					transactionId,
					orderId,
					paymentMethod: "online-payment",
					amount,
					isPaid: false,
					paymentLink: response.data.GatewayPageURL,
				});

				return createdPayment.toJSON();
			}

			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getPaymentByTransactionId = async (
		transactionId: string,
	): Promise<Payment | null> => {
		try {
			const payment = await Payment.findOne({ where: { transactionId } });
			return payment;
		} catch (err: any) {
			
			throw err;
		}
	};

	getPaymentByOrderId = async (
		orderId: number,
	): Promise<Payment[] | PaymentAttributes[] | []> => {
		try {
			const payments = await Payment.findAll({ where: { orderId } });

			return payments ? payments.map((payment) => payment.toJSON()) : [];
		} catch (err: any) {
			
			throw err;
		}
	};

	updatePaymentStatus = async (
		transactionId: number,
		isPaid: boolean,
	): Promise<boolean> => {
		try {
			const payment = await Payment.update(
				{ isPaid },
				{ where: { transactionId } },
			);

			if (!payment) {
				return false;
			}

			return true;
		} catch (err: any) {
			
			throw err;
		}
	};

	getEarningStats = async () => {
		try {
			const monthlyEarnings = await Payment.findAll({
				attributes: [
					[
						Sequelize.fn(
							"DATE_FORMAT",
							Sequelize.col("createdAt"),
							"%m-%Y",
						),
						"month",
					],
					[Sequelize.fn("SUM", Sequelize.col("amount")), "total"],
				],
				where: {
					isPaid: true,
					createdAt: {
						[Op.gte]: Sequelize.literal(
							"DATE_SUB(CURDATE(), INTERVAL 12 MONTH)",
						), // Last 12 months
					},
				},
				group: ["month"],
				order: [["month", "ASC"]],
			});

			const formattedData = monthlyEarnings.map((item: any) => ({
				month: item.get("month"),
				total: parseFloat(item.get("total")),
			}));

			return formattedData;
		} catch (err: any) {
			
			throw err;
		}
	};

	generateUniqueTransactionId = async (): Promise<string> => {
		let transactionId: string;
		let exists: Payment | null;

		do {
			transactionId = generateTransactionId(true);
			exists = await Payment.findOne({ where: { transactionId } });
		} while (exists);

		return transactionId;
	};

	static cleanupUnpaidPayments = async () => {
		try {
			await Payment.destroy({
				where: {
					createdAt: {
						[Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000),
					},
					isPaid: false,
				},
			});
			
		} catch (error) {
			
		}
	};
}

export default PaymentService;
