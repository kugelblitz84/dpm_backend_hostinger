import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";
import CartService from "../service/cart.service";

class CartController {
	private cartService: CartService;

	constructor() {
		this.cartService = new CartService();
	}

	addItemToCart = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const newCartItem = {
				customerId: (req as any).validatedValue.customerId,
				productId: (req as any).validatedValue.productId,
				productVariantId: (req as any).validatedValue.productVariantId,
				quantity: (req as any).validatedValue.quantity,
				size: (req as any).validatedValue.size,
				widthInch: (req as any).validatedValue.widthInch,
				heightInch: (req as any).validatedValue.heightInch,
				price: (req as any).validatedValue.price,
			};
			const createdCartItem = await this.cartService.addItemToCart(
				newCartItem.customerId,
				newCartItem.productId,
				newCartItem.productVariantId,
				newCartItem.quantity,
				newCartItem.size,
				newCartItem.widthInch,
				newCartItem.heightInch,
				newCartItem.price,
			);

			if (!createdCartItem) {
				return responseSender(
					res,
					400,
					"Product failed to add cart. Please try again.",
				);
			}

			return responseSender(
				res,
				201,
				"Product successfully added to the cart.",
				{
					cartItem: createdCartItem,
				},
			);
		} catch (err: any) {
			
			next(err);
		}
	};

	deleteCartItem = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const cartItemId = (req as any).params.cartItemId;

			const isCartItemExist =
				await this.cartService.getCartItemById(cartItemId);

			if (!isCartItemExist) {
				return responseSender(res, 404, "Cart item cannot found.");
			}

			const isDeleted = await this.cartService.deleteCartItem(cartItemId);

			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Cart item deletion failed. Please try again.",
				);
			}

			return responseSender(res, 200, "Cart item deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllCartItems = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const customerId = (req as any).params.customerId;

			const cartItems =
				await this.cartService.getAllCartItems(customerId);

			return responseSender(res, 200, "Cart item fetched successfully.", {
				cartItems: cartItems || [],
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default CartController;
