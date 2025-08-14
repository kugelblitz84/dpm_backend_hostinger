import Coupon, { CouponAttributes } from "../model/coupon.model";
import { Op, Order, WhereOptions } from "sequelize";

class CouponService {
	// Create a new coupon
	createCoupon = async (
		name: string,
		code: string,
		discountType: "flat" | "percentage",
		amount: number,
		minimumAmount: number,
		endDate: Date,
	): Promise<Coupon | CouponAttributes | null> => {
		try {
			const coupon = await Coupon.create({
				name,
				code,
				discountType,
				amount,
				minimumAmount,
				startDate: new Date(),
				endDate,
				isActive: true,
			});

			return coupon ? coupon.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Get coupon by ID
	getCouponById = async (
		couponId: number,
	): Promise<Coupon | CouponAttributes | null> => {
		try {
			const coupon = await Coupon.findByPk(couponId);
			return coupon ? coupon.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Get coupon by code
	getCouponByCode = async (
		code: string,
	): Promise<Coupon | CouponAttributes | null> => {
		try {
			const coupon = await Coupon.findOne({ where: { code } });
			return coupon ? coupon.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getActiveCouponByCode = async (
		code: string,
	): Promise<Coupon | CouponAttributes | null> => {
		try {
			const coupon = await Coupon.findOne({
				where: {
					code,
					isActive: true,
					endDate: {
						[Op.gte]: new Date(),
					},
				},
			});
			return coupon ? coupon.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getActiveCouponById = async (
		couponId: number,
	): Promise<Coupon | CouponAttributes | null> => {
		try {
			const coupon = await Coupon.findOne({
				where: {
					couponId,
					isActive: true,
					endDate: {
						[Op.gte]: new Date(),
					},
				},
			});
			return coupon ? coupon.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Update coupon
	updateCoupon = async (
		couponId: number,
		name: string,
		discountType: "flat" | "percentage",
		amount: number,
		minimumAmount: number,
		endDate: Date,
		isActive: boolean,
	): Promise<boolean> => {
		try {
			// Update coupon details
			const [updatedRows] = await Coupon.update(
				{
					name,
					discountType,
					amount,
					minimumAmount,
					endDate,
					isActive,
				},
				{ where: { couponId } },
			);

			if (updatedRows === 0) return false; // If no coupon was updated, return false

			return true;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Delete coupon
	deleteCoupon = async (couponId: number): Promise<boolean> => {
		try {
			const coupon = await Coupon.findByPk(couponId);
			if (coupon) {
				await coupon.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	// Get all coupons with optional filtering
	getAllCoupons = async (
		filter: WhereOptions<CouponAttributes> = {},
		limit: number,
		offset: number,
		order: Order,
	): Promise<{ rows: Coupon[] | CouponAttributes[]; count: number }> => {
		try {
			const coupons = await Coupon.findAndCountAll({
				where: filter,
				limit,
				offset,
				order,
			});
			return {
				rows: coupons.rows.map((coupon) => coupon.toJSON()),
				count: coupons.count,
			};
		} catch (err: any) {
			
			throw err;
		}
	};

	static expireCoupons = async () => {
		try {
			const expiredCoupons = await Coupon.update(
				{ isActive: false },
				{
					where: {
						isActive: true,
						endDate: {
							[Op.lt]: new Date(), // Expired coupons
						},
					},
				},
			);

		} catch (err: any) {
			
		}
	};
}

export default CouponService;
