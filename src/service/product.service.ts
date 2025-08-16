import Product, { ProductModelAttributes } from "../model/product.model";
import ProductAttribute, {
	ProductAttributeCreationProps,
} from "../model/product-attribute.model";
import ProductImage from "../model/product-image.model";
import { WhereOptions, Order, Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { createSlug } from "../util";
import Variation from "../model/variation.model";
import VariationItem from "../model/variation-item.model";
import ProductVariant from "../model/product-variant.model";
import ProductVariantDetail from "../model/product-variant-detail.model";
import crypto from "crypto";
import ProductTag from "../model/product-tags.model";
import ProductReview from "../model/product-review.model";
import Customer from "../model/customer.model";

interface VariationItemProps {
	value: string;
}
interface VariationProps {
	name: string;
	unit: string;
	variationItems: VariationItemProps[];
}

interface VariantDetailProps {
	variationName: string;
	variationItemValue: string;
}

interface VariantProps {
	additionalPrice: number;
	variantDetails: VariantDetailProps[];
}

class ProductService {
	createProduct = async (
		name: string,
		description: string,
		basePrice: number,
		minOrderQuantity: number,
		discountStart: number | null,
		discountEnd: number | null,
		discountPercentage: number | null,
		pricingType: "flat" | "square-feet",
		categoryId: number | null,
		isActive: boolean = true,
		attributes: ProductAttributeCreationProps[],
		tags: string[],
		variations: VariationProps[],
		variants: VariantProps[],
	): Promise<Product | ProductModelAttributes | null> => {
		try {
			const product = await Product.create({
				name,
				description,
				slug: createSlug(name),
				sku: await this.generateUniqueSKU(),
				basePrice,
				minOrderQuantity,
				discountStart,
				discountEnd,
				discountPercentage,
				pricingType,
				isActive,
				categoryId,
			});

			// Step 2: Create variations and their items
			if (variations.length > 0) {
				for (const variation of variations) {
					const createdVariation = await Variation.create({
						name: variation.name,
						unit: variation.unit,
						productId: product.productId,
					});

					// Create variation items
					if (variation?.variationItems?.length > 0) {
						await VariationItem.bulkCreate(
							variation.variationItems.map((item) => ({
								value: item.value,
								variationId: createdVariation.variationId,
							})),
						);
					}
				}
			}

			// Step 3: Create product variants (provided by the frontend)
			if (variants.length > 0) {
				for (const variant of variants) {
					const createdVariant = await ProductVariant.create({
						additionalPrice: variant.additionalPrice,
						productId: product.productId,
					});

					// Create product variant details
					for (const detail of variant.variantDetails) {
						const possibleVariation = await Variation.findOne({
							where: {
								productId: product.productId,
								name: detail.variationName,
							},
							include: [
								{ model: VariationItem, as: "variationItems" },
							],
						});

						if (possibleVariation) {
							const possibleVariationItem = possibleVariation
								.toJSON()
								.variationItems.find(
									(variationItem: VariationItem) =>
										variationItem.value ===
										detail.variationItemValue,
								);

							if (possibleVariationItem) {
								await ProductVariantDetail.create({
									variationItemId:
										possibleVariationItem.variationItemId,
									productVariantId:
										createdVariant.productVariantId,
								});
							} else {
								console.warn(
									`⚠️ No variation item found for ${detail.variationName} = ${detail.variationItemValue}`,
								);
							}
						}
					}
				}
			}


			if (tags.length > 0) {
				await ProductTag.bulkCreate(
					tags.map((tag) => ({
						tag: tag,
						productId: product.productId,
					})),
				);
			}

			if (attributes.length > 0) {
				await ProductAttribute.bulkCreate(
					attributes.map((attribute) => ({
						property: attribute.property,
						description: attribute.description,
						productId: product.productId,
					})),
				);
			}

			const createdProduct = await this.getProductById(product.productId);

			return createdProduct ? createdProduct : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	createProductImage = async (
		imageName: string,
		productId: number,
	): Promise<boolean> => {
		try {
			await ProductImage.create({ imageName, productId });
			return true;
		} catch (err: any) {
			
			throw err;
		}
	};

	getProductById = async (
		productId: number,
	): Promise<Product | ProductModelAttributes | null> => {
		try {
			const product = await Product.findByPk(productId, {
				include: [
					{
						model: ProductAttribute,
						as: "attributes",
						separate: true,
					},
					{ model: ProductTag, as: "tags", separate: true },
					{ model: ProductImage, as: "images", separate: true },
					{
						model: ProductReview,
						as: "reviews",
						separate: true,
						include: [
							{
								model: Product,
								as: "product",
								attributes: ["productId", "name"],
							},
							{
								model: Customer,
								as: "customer",
								attributes: ["customerId", "name", "email"],
							},
						],
					},
					{
						model: Variation,
						as: "variations",
						separate: true,
						include: [
							{
								model: VariationItem,
								as: "variationItems",
								separate: true,
							},
						],
					},
					{
						model: ProductVariant,
						as: "variants",
						separate: true,
						include: [
							{
								model: ProductVariantDetail,
								as: "variantDetails",
								separate: true,
								include: [
									{
										model: VariationItem,
										attributes: ["value"],
									},
								],
							},
						],
					},
				],
			});

			if (!product) return null;

			return {
				...product.toJSON(),
			};
		} catch (err: any) {
			
			throw err;
		}
	};

	getRandomProducts = async (
		limit: number,
		excludeProductId?: number,
	): Promise<Product[] | ProductModelAttributes[]> => {
		try {
			const products = await Product.findAll({
				order: Sequelize.literal("RAND()"),
				limit,
				where: {
					productId: {
						[Op.ne]: excludeProductId,
					},
				},
				include: [
					{
						model: ProductAttribute,
						as: "attributes",
						separate: true,
					},
					{ model: ProductTag, as: "tags", separate: true },
					{ model: ProductImage, as: "images", separate: true },
					{
						model: ProductReview,
						as: "reviews",
						separate: true,
						include: [
							{
								model: Product,
								as: "product",
								attributes: ["productId", "name"],
							},
							{
								model: Customer,
								as: "customer",
								attributes: ["customerId", "name", "email"],
							},
						],
					},
					{
						model: Variation,
						as: "variations",
						separate: true,
						include: [
							{
								model: VariationItem,
								as: "variationItems",
								separate: true,
							},
						],
					},
					{
						model: ProductVariant,
						as: "variants",
						separate: true,
						include: [
							{
								model: ProductVariantDetail,
								as: "variantDetails",
								separate: true,
								include: [
									{
										model: VariationItem,
										attributes: ["value"],
									},
								],
							},
						],
					},
				],
			});

			if (products.length === 0) {
				return [];
			}
			return products.map((product) => product.toJSON());
		} catch (err: any) {
			
			throw err;
		}
	};

	updateProduct = async (
		productId: number,
		name: string,
		description: string,
		basePrice: number,
		minOrderQuantity: number,
		discountStart: number | null,
		discountEnd: number | null,
		discountPercentage: number | null,
		pricingType: "flat" | "square-feet",
		categoryId: number | null,
		isActive: boolean = true,
		attributes: ProductAttributeCreationProps[],
		tags: string[],
		variations: VariationProps[],
		variants: VariantProps[],
	): Promise<Product | ProductModelAttributes | null> => {
		try {
			// Fetch the existing product with all associations
			const product = await Product.findByPk(productId, {
				include: [
					{ model: ProductAttribute, as: "attributes" },
					{ model: ProductTag, as: "tags" },
					{ model: ProductImage, as: "images" },
					{ model: ProductReview, as: "reviews" },
					{
						model: Variation,
						as: "variations",
						include: [
							{ model: VariationItem, as: "variationItems" },
						],
					},
					{
						model: ProductVariant,
						as: "variants",
						include: [
							{
								model: ProductVariantDetail,
								as: "variantDetails",
								include: [
									{
										model: VariationItem,
										attributes: ["value"],
									},
								],
							},
						],
					},
				],
			});

			if (!product) return null;

			// Step 1: Update basic product information
			await product.update({
				name,
				description,
				slug: createSlug(name),
				basePrice,
				minOrderQuantity,
				discountStart,
				discountEnd,
				discountPercentage,
				pricingType,
				categoryId,
				isActive,
			});

			/*** Step 2: Handle Variations ***/
			const newVariationNames = variations.map((v) => v.name);

			// Delete removed variations
			for (const variation of product.variations ?? []) {
				if (!newVariationNames.includes(variation.name)) {
					// Remove related variant details
					await ProductVariantDetail.destroy({
						where: {
							variationItemId:
								variation.variationItems?.map(
									(vi) => vi.variationItemId,
								) ?? [],
						},
					});
					// Remove variation items
					await VariationItem.destroy({
						where: { variationId: variation.variationId },
					});
					// Remove the variation itself
					await Variation.destroy({
						where: { variationId: variation.variationId },
					});
				}
			}

			// Add or update variations and their items
			for (const variationInput of variations) {
				let existingVariation = await Variation.findOne({
					where: { productId, name: variationInput.name },
					include: [{ model: VariationItem, as: "variationItems" }],
				});

				if (!existingVariation) {
					existingVariation = await Variation.create({
						name: variationInput.name,
						unit: variationInput.unit,
						productId,
					});
				} else {
					await existingVariation.update({
						name: variationInput.name,
						unit: variationInput.unit,
					});
				}

				// Safely get existing items array
				const items = existingVariation.variationItems ?? [];
				const existingValues = items.map((item) => item.value);
				const newValues = variationInput.variationItems.map(
					(item) => item.value,
				);

				// Delete removed items
				for (const item of items) {
					if (!newValues.includes(item.value)) {
						await ProductVariantDetail.destroy({
							where: { variationItemId: item.variationItemId },
						});
						await VariationItem.destroy({
							where: { variationItemId: item.variationItemId },
						});
					}
				}

				// Add new items
				for (const itemInput of variationInput.variationItems) {
					if (!existingValues.includes(itemInput.value)) {
						await VariationItem.create({
							variationId: existingVariation.variationId,
							value: itemInput.value,
						});
					}
				}
			}

			/*** Step 3: Handle Variants ***/
			const existingVariants = (product.variants ?? []).map((v) => ({
				productVariantId: v.productVariantId,
				variantDetails: v.variantDetails.map((d) => ({
					variationName:
						product.variations?.find((variation) =>
							variation.variationItems?.some(
								(item) =>
									item.variationItemId === d.variationItemId,
							),
						)?.name ?? "",
					variationItemValue: d.variationItem?.value,
				})),
			}));

			const existingHashes = new Set(
				existingVariants.map((v) => JSON.stringify(v.variantDetails)),
			);
			const newHashes = new Set(
				variants.map((v) => JSON.stringify(v.variantDetails)),
			);

			// Delete removed variants
			for (const variant of existingVariants) {
				const hash = JSON.stringify(variant.variantDetails);
				if (!newHashes.has(hash)) {
					await ProductVariantDetail.destroy({
						where: { productVariantId: variant.productVariantId },
					});
					await ProductVariant.destroy({
						where: { productVariantId: variant.productVariantId },
					});
				} else {
					// Update existing variant additionalPrice
					const variantToUpdate = variants.find(
						(v) => JSON.stringify(v.variantDetails) === hash,
					);
					if (variantToUpdate) {
						await ProductVariant.update(
							{
								additionalPrice:
									variantToUpdate.additionalPrice,
							},
							{
								where: {
									productVariantId: variant.productVariantId,
								},
							},
						);
					}
				}
			}

			// Add new variants
			for (const variantInput of variants) {
				const hash = JSON.stringify(variantInput.variantDetails);
				if (!existingHashes.has(hash)) {
					const created = await ProductVariant.create({
						additionalPrice: variantInput.additionalPrice,
						productId,
					});
					// Link variant details
					for (const detail of variantInput.variantDetails) {
						const variation = await Variation.findOne({
							where: { productId, name: detail.variationName },
							include: [
								{ model: VariationItem, as: "variationItems" },
							],
						});
						const variationItem = variation?.variationItems?.find(
							(v) => v.value === detail.variationItemValue,
						);
						if (variationItem) {
							await ProductVariantDetail.create({
								productVariantId: created.productVariantId,
								variationItemId: variationItem.variationItemId,
							});
						}
					}
				}
			}

			/*** Step 4: Handle Tags ***/
			const existingTags = (product.tags ?? []).map((t) => t.tag);
			const newTagsSet = new Set(tags);
			for (const tag of existingTags) {
				if (!newTagsSet.has(tag)) {
					await ProductTag.destroy({ where: { productId, tag } });
				}
			}
			for (const tag of tags) {
				if (!existingTags.includes(tag)) {
					await ProductTag.create({ productId, tag });
				}
			}

			/*** Step 5: Handle Attributes ***/
			const existingAttrs = (product.attributes ?? []).map(
				(a) => a.property,
			);
			const newAttrsSet = new Set(attributes.map((a) => a.property));
			for (const prop of existingAttrs) {
				if (!newAttrsSet.has(prop)) {
					await ProductAttribute.destroy({
						where: { productId, property: prop },
					});
				}
			}
			for (const attrInput of attributes) {
				if (!existingAttrs.includes(attrInput.property)) {
					await ProductAttribute.create({
						productId,
						property: attrInput.property,
						description: attrInput.description,
					});
				} else {
					await ProductAttribute.update(
						{ description: attrInput.description },
						{ where: { productId, property: attrInput.property } },
					);
				}
			}

			// Return the updated product
			const updatedProduct = await this.getProductById(productId);
			return updatedProduct ? updatedProduct : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getProductImagesByProductId = async (
		productId: number,
	): Promise<ProductImage[] | null> => {
		try {
			const images = await ProductImage.findAll({
				where: { productId },
			});

			if (images.length === 0) {
				return null;
			}

			return images;
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteProductImage = async (imageId: number): Promise<boolean> => {
		try {
			const image = await ProductImage.findByPk(imageId);
			if (!image) {
				return false;
			}
			await ProductImage.destroy({ where: { imageId } });
			return true;
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteProduct = async (productId: number): Promise<boolean> => {
		try {
			const product = await Product.findByPk(productId, {
				include: [
					{ model: ProductAttribute, as: "attributes" },
					{ model: ProductTag, as: "tags" },
					{ model: ProductImage, as: "images" },
					{ model: ProductReview, as: "reviews" },
					{
						model: Variation,
						as: "variations",
						include: [
							{ model: VariationItem, as: "variationItems" },
						],
					},
					{
						model: ProductVariant,
						as: "variants",
						include: [
							{
								model: ProductVariantDetail,
								as: "variantDetails",
							},
						],
					},
				],
			});

			if (!product) {
				return false;
			}

			// Deleting ProductVariants first (to prevent foreign key issues)
			if (product.variants.length > 0) {
				await Promise.all(
					product.variants.map(async (variant) => {
						await Promise.all(
							variant.variantDetails.map(async (detail) =>
								ProductVariantDetail.destroy({
									where: {
										productVariantDetailId:
											detail.productVariantDetailId,
									},
								}),
							),
						);

						await ProductVariant.destroy({
							where: {
								productVariantId: variant.productVariantId,
							},
						});
					}),
				);
			}

			// Deleting Variations and their Items
			if (product.variations.length > 0) {
				await Promise.all(
					product.variations.map(async (variation) => {
						await Promise.all(
							variation.variationItems.map(async (item) =>
								VariationItem.destroy({
									where: {
										variationItemId: item.variationItemId,
									},
								}),
							),
						);

						await Variation.destroy({
							where: { variationId: variation.variationId },
						});
					}),
				);
			}

			// Deleting Attributes, Tags, Images, Reviews
			await Promise.all([
				ProductAttribute.destroy({ where: { productId } }),
				ProductTag.destroy({ where: { productId } }),
				ProductImage.destroy({ where: { productId } }),
				ProductReview.destroy({ where: { productId } }),
			]);

			// Finally, delete the Product
			await product.destroy();

			return true;
		} catch (err: any) {
			
			throw err;
		}
	};

	activeProduct = async (
		productId: number,
	): Promise<Product | ProductModelAttributes | null> => {
		try {
			const product = await Product.findOne({
				where: { productId },
			});
			if (product) {
				product.isActive = true;
				await product.save();
				return product.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	inactiveProduct = async (
		productId: number,
	): Promise<Product | ProductModelAttributes | null> => {
		try {
			const product = await Product.findOne({
				where: { productId },
			});
			if (product) {
				product.isActive = false;
				await product.save();
				return product.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getProductStats = async () => {
		try {
			const monthlyProducts = await Product.findAll({
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
						Sequelize.fn("COUNT", Sequelize.col("productId")),
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

			const formattedData = monthlyProducts.map((item: any) => ({
				month: item.get("month"),
				count: parseInt(item.get("count")),
			}));

			return formattedData;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllProducts = async (
		filter: WhereOptions<ProductModelAttributes>,
		limit: number,
		offset: number,
		order: Order,
	): Promise<{
		rows: Product[] | ProductModelAttributes[];
		count: number;
	}> => {
		try {
			const products = await Product.findAll({
				where: filter,
				limit,
				offset,
				order,
				subQuery: false,
				include: [
					{
						model: ProductAttribute,
						as: "attributes",
						separate: true,
					},
					{
						model: ProductTag,
						as: "tags",
						separate: true,
					},
					{
						model: ProductImage,
						as: "images",
						separate: true,
					},
					{
						model: ProductReview,
						as: "reviews",
						separate: true,
						include: [
							{
								model: Product,
								as: "product",
								attributes: ["productId", "name"],
							},
							{
								model: Customer,
								as: "customer",
								attributes: ["customerId", "name", "email"],
							},
						],
					},
					{
						model: Variation,
						as: "variations",
						separate: true,
						include: [
							{
								model: VariationItem,
								as: "variationItems",
								separate: true,
							},
						],
					},
					{
						model: ProductVariant,
						as: "variants",
						separate: true,
						include: [
							{
								model: ProductVariantDetail,
								as: "variantDetails",
								separate: true,
								include: [
									{
										model: VariationItem,
									},
								],
							},
						],
					},
				],
			});

			// Get total count separately
			const count = await Product.count({ where: filter });

			return {
				rows: products.map((product) => product.toJSON()),
				count,
			};
		} catch (err: any) {
			
			throw err;
		}
	};

	addProductImage = async (
		imageName: string,
		productId: number,
	): Promise<boolean> => {
		try {
			await ProductImage.create({ imageName, productId });
			return true;
		} catch (err: any) {
			
			throw err;
		}
	};

	removeProductImage = async (imageId: number): Promise<boolean> => {
		try {
			const image = await ProductImage.findByPk(imageId);
			if (image) {
				await image.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	generateUniqueSKU = async (): Promise<string> => {
		let sku: string;
		let exists: Product | null;

		do {
			const randomString = crypto
				.randomBytes(3)
				.toString("hex")
				.toUpperCase()
				.slice(0, 6);
			sku = `DPM-${randomString}`;
			exists = await Product.findOne({ where: { sku } });
		} while (exists);

		return sku;
	};
}

export default ProductService;
