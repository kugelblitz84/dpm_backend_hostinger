import CartItem, { CartItemAttributes } from "../model/cart.model";
import Product from "../model/product.model";
import ProductVariant from "../model/product-variant.model";
import ProductVariantDetail from "../model/product-variant-detail.model";
import VariationItem from "../model/variation-item.model";
import Variation from "../model/variation.model";
import { Op } from "sequelize";

class CartService {
	addItemToCart = async (
		customerId: number,
		productId: number,
		productVariantId: number,
		quantity: number,
		size: number | null,
		widthInch: number | null,
		heightInch: number | null,
		price: number,
	): Promise<CartItem | CartItemAttributes | null> => {
		try {
			const newCartItem = await CartItem.create({
				customerId,
				productId,
				productVariantId,
				quantity,
				size,
				widthInch,
				heightInch,
				price,
			});

			const createdCartItem = await this.getCartItemById(
				newCartItem.cartItemId,
			);
			return createdCartItem || null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getCartItemById = async (
		cartItemId: number,
	): Promise<CartItem | CartItemAttributes | null> => {
		try {
			const cartItem = await CartItem.findByPk(cartItemId, {
				subQuery: false,
				include: [
					{
						model: Product,
						as: "product",
						attributes: ["productId", "name", "basePrice"],
					},
					{
						model: ProductVariant,
						as: "productVariant",
						attributes: [
							"productVariantId",
							"productId",
							"additionalPrice",
						],
						include: [
							{
								model: ProductVariantDetail,
								as: "variantDetails",
								attributes: [
									"productVariantDetailId",
									"productVariantId",
									"variationItemId",
								],
								separate: true,
								include: [
									{
										model: VariationItem,
										attributes: ["value"],
										include: [
											{
												model: Variation,
												as: "variation",
												attributes: ["name", "unit"],
											},
										],
									},
								],
							},
						],
					},
				],
			});

			return cartItem ? cartItem.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteCartItem = async (cartItemId: number): Promise<boolean> => {
		try {
			const cartItem = await CartItem.findByPk(cartItemId);

			if (cartItem) {
				await cartItem.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	clearCartItems = async (customerId: number): Promise<boolean> => {
		try {
			// Find all cart items for the given customer
			const cartItems = await CartItem.findAll({
				where: { customerId },
			});

			// If no items found, return false
			if (!cartItems.length) {
				return false;
			}

			// Bulk delete all cart items for the customer
			await CartItem.destroy({
				where: { customerId },
			});

			return true;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllCartItems = async (
		customerId: number,
	): Promise<CartItem[] | CartItemAttributes[] | null> => {
		try {
			const cartItems = await CartItem.findAll({
				where: { customerId },
				subQuery: false,
				include: [
					{
						model: Product,
						as: "product",
						attributes: ["productId", "name", "basePrice"],
					},
					{
						model: ProductVariant,
						as: "productVariant",
						attributes: [
							"productVariantId",
							"productId",
							"additionalPrice",
						],
						include: [
							{
								model: ProductVariantDetail,
								as: "variantDetails",
								attributes: [
									"productVariantDetailId",
									"productVariantId",
									"variationItemId",
								],
								separate: true,
								include: [
									{
										model: VariationItem,
										attributes: ["value"],
										include: [
											{
												model: Variation,
												as: "variation",
												attributes: ["name", "unit"],
											},
										],
									},
								],
							},
						],
					},
				],
			});

			return cartItems.map((order) => order.toJSON());
		} catch (err: any) {
			
			throw err;
		}
	};

	static cleanupCartItems = async () => {
		try {
			await CartItem.destroy({
				where: {
					createdAt: {
						[Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000),
					},
				},
			});
			
		} catch (error) {
			
		}
	};
}

export default CartService;
