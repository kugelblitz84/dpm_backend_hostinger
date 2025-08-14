import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";
import { Op, Order, WhereOptions } from "sequelize";
import CourierService from "../service/courier.service";
import { CourierAttributes } from "../model/courier.model";

class CourierController {
	private courierService: CourierService;

	constructor() {
		this.courierService = new CourierService();
	}

	addCourier = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const createdCourier = await this.courierService.addCourier(
				(req as any).validatedValue.name,
			);

			if (!createdCourier) {
				return responseSender(
					res,
					500,
					"Failed to add new courier. Please try again.",
				);
			}

			return responseSender(res, 201, "Courier added successfully.", {
				category: createdCourier,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	editCourier = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const isUpdated = await this.courierService.editCourier(
				(req as any).validatedValue.courierId,
				(req as any).validatedValue.name,
			);

			if (!isUpdated) {
				return responseSender(
					res,
					500,
					"Courier update failed. Please try again.",
				);
			}

			return responseSender(res, 200, "Courier updated successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	deleteCourier = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fetchedCourier = await this.courierService.getCourierById(
				Number((req as any).validatedValue.courierId),
			);

			if (!fetchedCourier) {
				return responseSender(res, 400, "Courier couldn't found.");
			}

			const isDeleted = await this.courierService.deleteCourier(
				fetchedCourier.courierId,
			);
			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Couldn't delete courier. Please try again.",
				);
			}

			return responseSender(res, 200, "Courier deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllCourier = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<CourierAttributes> = {};

			if (searchTerm) {
				filter.name = {
					[Op.like]: `%${searchTerm}%`,
				};
			}

			const couriers = await this.courierService.getAllCourier(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!couriers.rows) {
				return responseSender(
					res,
					400,
					"Failed to get couriers. Please try again.",
				);
			}
			return responseSender(res, 200, "Couriers fetched successfully.", {
				couriers: couriers.rows,
				total: couriers.count,
				totalPages: Math.ceil(couriers.count / limitPerPage),
				currentPage,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default CourierController;
