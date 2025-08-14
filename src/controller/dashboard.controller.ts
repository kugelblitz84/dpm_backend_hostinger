import { NextFunction, Request, Response } from "express";
import CustomerService from "../service/customer.service";
import { responseSender } from "../util";
import ProductService from "../service/product.service";
import OrderService from "../service/order.service";
import PaymentService from "../service/payment.service";
import StaffService from "../service/staff.service";

class DashboardController {
	private customerService: CustomerService;
	private productService: ProductService;
	private orderService: OrderService;
	private paymentService: PaymentService;
	private staffService: StaffService;

	constructor() {
		this.customerService = new CustomerService();
		this.productService = new ProductService();
		this.orderService = new OrderService();
		this.paymentService = new PaymentService();
		this.staffService = new StaffService();
	}

	getStats = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const customerStats = await this.customerService.getCustomerStats();
			const productStats = await this.productService.getProductStats();
			const orderStats = await this.orderService.getOrderStats();
			const topSellingProductsStats =
				await this.orderService.getTopSellingProducts();
			const earningStats = await this.paymentService.getEarningStats();
			const recentOrders = await this.orderService.getRecentOrders();
			const staffs = await this.staffService.getAllStaff(
				{ isDeleted: false },
				10,
				0,
				[["createdAt", "DESC"]],
			);

			return responseSender(res, 200, "Stats generated successfully.", {
				stats: {
					customers: customerStats,
					products: productStats,
					orders: orderStats,
					earnings: earningStats,
					topSellingProducts: topSellingProductsStats,
					recentOrders,
					staffs: staffs.rows,
				},
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default DashboardController;
