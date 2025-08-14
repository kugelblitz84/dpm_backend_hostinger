import Customer, { CustomerAttributes } from "../model/customer.model";
import { Op, Order, Sequelize, WhereOptions } from "sequelize";

class CustomerService {
	registerCustomer = async (
		name: string,
		email: string,
		password: string,
		phone: string,
		verificationToken: string,
	): Promise<Customer | CustomerAttributes | null> => {
		try {
			const customer = await Customer.create({
				name,
				email,
				password,
				phone,
				billingAddress: "",
				shippingAddress: "",
				verified: false,
				verificationToken,
			});
			const createdCustomer = await Customer.findByPk(
				customer.customerId,
			);
			if (createdCustomer) {
				return createdCustomer.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	updateCustomer = async (
		name: string,
		email: string,
		phone: string,
		billingAddress: string,
		shippingAddress: string,
		password?: string,
	): Promise<boolean> => {
		try {
			const prevTokenVersion = (await Customer.findOne({
				where: { email },
				attributes: ["tokenVersion"],
			})) || { tokenVersion: 0 };
			const isUpdated = await Customer.update(
				{
					name,
					password,
					phone,
					billingAddress,
					shippingAddress,
					tokenVersion: prevTokenVersion.tokenVersion + 1,
				},
				{
					where: { email },
				},
			);
			if (isUpdated) {
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	getCustomerByEmail = async (
		email: string,
	): Promise<Customer | CustomerAttributes | null> => {
		try {
			const customer = await Customer.findOne({ where: { email } });
			if (customer) {
				return customer.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getCustomerById = async (
		customerId: number,
	): Promise<Customer | CustomerAttributes | null> => {
		try {
			const customer = await Customer.findByPk(customerId);
			if (customer) {
				return customer.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	verifyCustomerAccount = async (email: string): Promise<boolean> => {
		try {
			const customer = await Customer.update(
				{ verified: true },
				{ where: { email } },
			);
			if (customer) {
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteCustomer = async (email: string): Promise<boolean> => {
		try {
			const customer = await Customer.findOne({ where: { email } });
			if (customer) {
				await customer.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	resetPassword = async (
		email: string,
		password: string,
	): Promise<boolean> => {
		try {
			const prevTokenVersion = (await Customer.findOne({
				where: { email },
				attributes: ["tokenVersion"],
			})) || { tokenVersion: 0 };
			const isUpdated = await Customer.update(
				{
					password,
					tokenVersion: prevTokenVersion.tokenVersion + 1,
				},
				{
					where: { email },
				},
			);
			if (isUpdated) {
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	getCustomerStats = async () => {
		try {
			const monthlyCustomers = await Customer.findAll({
				attributes: [
					[
						Sequelize.fn(
							"DATE_FORMAT",
							Sequelize.col("createdAt"),
							"%m-%Y",
						),
						"month",
					],
					[
						Sequelize.fn("COUNT", Sequelize.col("customerId")),
						"count",
					],
				],
				where: {
					createdAt: {
						[Op.gte]: Sequelize.literal(
							"DATE_SUB(CURDATE(), INTERVAL 12 MONTH)",
						), // Last 12 months
					},
				},
				group: ["month"],
				order: [["month", "ASC"]],
			});

			const formattedData = monthlyCustomers.map((item: any) => ({
				month: item.get("month"),
				count: parseInt(item.get("count")),
			}));

			return formattedData;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllCustomers = async (
		filter: WhereOptions<CustomerAttributes>,
		limit: number,
		offset: number,
		order: Order,
	): Promise<{ rows: Customer[] | CustomerAttributes[]; count: number }> => {
		try {
			const customers = await Customer.findAll({
				where: filter,
				limit,
				offset,
				order,
			});
			const count = await Customer.count({ where: filter });
			return {
				rows: customers.map((customer) => customer.toJSON()),
				count,
			};
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default CustomerService;
