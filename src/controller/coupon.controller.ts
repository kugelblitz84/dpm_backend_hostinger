import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";
import { Op, Order, WhereOptions } from "sequelize";
import CouponService from "../service/coupon.service";
import { CouponAttributes } from "../model/coupon.model";

class CouponController {
	private couponService: CouponService;

	constructor() {
		this.couponService = new CouponService();
	}

	createCoupon = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const newCoupon = {
				name: (req as any).validatedValue.name,
				code: (req as any).validatedValue.code,
				discountType: (req as any).validatedValue.discountType,
				amount: (req as any).validatedValue.amount,
				minimumAmount: (req as any).validatedValue.minimumAmount,
				endDate: (req as any).validatedValue.endDate,
			};

			const isCouponExist =
				await this.couponService.getActiveCouponByCode(newCoupon.code);

			if (isCouponExist) {
				return responseSender(
					res,
					400,
					"An active coupon is already exist associated with this code. Plese use another code to create.",
				);
			}

			const createdCoupon = await this.couponService.createCoupon(
				newCoupon.name,
				newCoupon.code,
				newCoupon.discountType,
				newCoupon.amount,
				newCoupon.minimumAmount,
				newCoupon.endDate,
			);

			if (!createdCoupon) {
				return responseSender(
					res,
					500,
					"Coupon creation failed. Please try again.",
				);
			}

			return responseSender(res, 201, "Coupon created successfully.", {
				coupon: createdCoupon,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	editCoupon = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const editedCoupon = {
				couponId: (req as any).validatedValue.couponId,
				name: (req as any).validatedValue.name,
				discountType: (req as any).validatedValue.discountType,
				amount: (req as any).validatedValue.amount,
				minimumAmount: (req as any).validatedValue.minimumAmount,
				endDate: (req as any).validatedValue.endDate,
				isActive: (req as any).validatedValue.isActive,
			};

			const fetchedCoupon = await this.couponService.getCouponById(
				editedCoupon.couponId,
			);

			if (fetchedCoupon && !(fetchedCoupon?.endDate >= new Date())) {
				return responseSender(
					res,
					400,
					"The coupon is already expired.",
				);
			}

			const isUpdated = await this.couponService.updateCoupon(
				editedCoupon.couponId,
				editedCoupon.name,
				editedCoupon.discountType,
				editedCoupon.amount,
				editedCoupon.minimumAmount,
				editedCoupon.endDate,
				editedCoupon.isActive,
			);

			if (!isUpdated) {
				return responseSender(
					res,
					500,
					"Coupon update failed. Please try again.",
				);
			}

			return responseSender(res, 200, "Coupon updated successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fetchedCoupon = await this.couponService.getCouponById(
				Number((req as any).validatedValue.couponId),
			);

			if (!fetchedCoupon) {
				return responseSender(res, 400, "Coupon couldn't found.");
			}

			const isDeleted = await this.couponService.deleteCoupon(
				fetchedCoupon.couponId,
			);
			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Couldn't delete coupon. Please try again.",
				);
			}

			return responseSender(res, 200, "Coupon deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	checkCoupon = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fetchedCoupon = (req as any).validatedValue.code.length
				? await this.couponService.getActiveCouponByCode(
						(req as any).validatedValue.code,
					)
				: await this.couponService.getActiveCouponByCode(
						(req as any).validatedValue.couponId,
					);

			if (!fetchedCoupon) {
				return responseSender(res, 400, "Invalid coupon.", {
					valid: false,
				});
			}

			const totalPrice = (req as any).validatedValue.totalPrice;
			let discountedPrice = totalPrice;

			if (
				fetchedCoupon.isActive &&
				totalPrice >= fetchedCoupon.minimumAmount
			) {
				discountedPrice =
					fetchedCoupon.discountType === "flat"
						? totalPrice - fetchedCoupon.amount
						: totalPrice -
							totalPrice * (fetchedCoupon.amount / 100);
			}

			return responseSender(
				res,
				200,
				"Successfully checked coupon status.",
				{
					totalPrice,
					discountedPrice: Math.floor(discountedPrice),
					coupon: fetchedCoupon,
					valid: true,
				},
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllCoupons = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const searchBy = (req as any).validatedValue.searchBy;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<CouponAttributes> = {};

			if (searchTerm && searchBy) {
				switch (searchBy) {
					case "name":
						filter.name = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					case "code":
						filter.code = {
							[Op.like]: `%${searchTerm}%`,
						};
						break;
					default:
						break;
				}
			}

			const coupons = await this.couponService.getAllCoupons(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!coupons.rows) {
				return responseSender(
					res,
					400,
					"Failed to get coupons. Please try again.",
				);
			}
			return responseSender(res, 200, "Coupons fetched successfully.", {
				coupons: coupons.rows,
				total: coupons.count,
				totalPages: Math.ceil(coupons.count / limitPerPage),
				currentPage,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default CouponController;
