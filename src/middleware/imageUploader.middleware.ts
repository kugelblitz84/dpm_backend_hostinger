import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import sizeof from "image-size";
import { v4 as uuid } from "uuid";
import { Request, Response, NextFunction } from "express";
import { staticDir } from "../config/dotenv.config";

class ImageUploaderMiddleware {
	uploader = (folderName: string) => {
		// const uploadDir = path.join(__dirname, `../../public/${folderName}/`);
		const uploadDir = path.join(staticDir, folderName);

		// Set up storage
		const storage = multer.diskStorage({
			destination: async (req, file, cb: any) => {
				try {
					const isUploadDirExists = fs.existsSync(uploadDir);
					if (!isUploadDirExists) {
						fs.mkdirSync(uploadDir, { recursive: true });
					}
					cb(null, uploadDir);
				} catch (err: any) {
					
					(req as any).fileValidationError =
						"Could not create the uploads directory!";
					cb(null, false);
				}
			},
			filename: (req, file, cb: any) => {
				try {
					const uniqueSuffix = uuid().toString().replace(/-/gi, "");
					cb(null, uniqueSuffix + path.extname(file.originalname)); // Append unique timestamp
				} catch (err: any) {
					
					(req as any).fileValidationError = err.message;
					cb(null, false);
				}
			},
		});

		// File filter to allow only image files
		const fileFilter = (req: any, file: any, cb: any) => {
			if (file.mimetype.startsWith("image/")) {
				cb(null, true);
			} else {
				(req as any).fileValidationError =
					"Only image files are allowed.";
				cb(null, false);
			}
		};

		return multer({
			storage,
			fileFilter,
			limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max file size
		});
	};

	compressImage = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.file || (req as any).fileValidationError) {
				return next();
			}

			const filePath = req.file.path;
			const imageDimension = sizeof(filePath);
			const { width: originalWidth, height: originalHeight } =
				imageDimension;

			// Define maximum dimensions (e.g., 1000px for width or height)
			const MAX_DIMENSION = 1000;

			if (!originalHeight || !originalWidth) {
				return;
			}

			// Calculate new dimensions while maintaining aspect ratio
			let targetWidth, targetHeight;
			if (originalWidth > originalHeight) {
				targetWidth = MAX_DIMENSION;
				targetHeight = Math.round(
					(originalHeight / originalWidth) * MAX_DIMENSION,
				);
			} else {
				targetHeight = MAX_DIMENSION;
				targetWidth = Math.round(
					(originalWidth / originalHeight) * MAX_DIMENSION,
				);
			}

			const compressedPath = filePath.replace(
				/(\.\w+)$/,
				`-${Math.ceil(Math.random() * 100000)}$1`,
			);

			try {
				await sharp(filePath)
					.resize(targetWidth, targetHeight, {
						fit: "inside", // Maintain aspect ratio without cropping
						withoutEnlargement: true, // Prevent enlarging images smaller than MAX_DIMENSION
					})
					.jpeg({ quality: 95 }) // Adjust quality as needed
					.toFile(compressedPath);

				// Replace the original file path with the compressed file path
				fs.unlinkSync(filePath); // Remove uncompressed file
				req.file.path = compressedPath;
				req.file.filename = path.basename(compressedPath);
			} catch (err: any) {
				
			}
			next();
		} catch (err) {
			next(err);
		}
	};

	compressImages = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			if (!req.files || (req as any).fileValidationError) {
				return next();
			}

			const files = req.files as Express.Multer.File[];

			await Promise.all(
				files.map(async (file) => {
					const filePath = file.path;
					const imageDimension = sizeof(filePath);
					const { width: originalWidth, height: originalHeight } =
						imageDimension;

					// Define maximum dimensions (e.g., 1000px for width or height)
					const MAX_DIMENSION = 1000;

					if (!originalHeight || !originalWidth) {
						return;
					}

					// Calculate new dimensions while maintaining aspect ratio
					let targetWidth, targetHeight;
					if (originalWidth > originalHeight) {
						targetWidth = MAX_DIMENSION;
						targetHeight = Math.round(
							(originalHeight / originalWidth) * MAX_DIMENSION,
						);
					} else {
						targetHeight = MAX_DIMENSION;
						targetWidth = Math.round(
							(originalWidth / originalHeight) * MAX_DIMENSION,
						);
					}

					const compressedPath = filePath.replace(
						/(\.\w+)$/,
						`-${Math.ceil(Math.random() * 100000)}$1`,
					);

					try {
						await sharp(filePath)
							.resize(targetWidth, targetHeight, {
								fit: "inside", // Maintain aspect ratio without cropping
								withoutEnlargement: true, // Prevent enlarging images smaller than MAX_DIMENSION
							})
							.jpeg({ quality: 95 }) // Adjust quality as needed
							.toFile(compressedPath);

						// Replace the original file path with the compressed file path
						fs.unlinkSync(filePath); // Remove uncompressed file
						file.path = compressedPath;
						file.filename = path.basename(compressedPath);
					} catch (err: any) {
						
					}
				}),
			);

			next();
		} catch (err) {
			next(err);
		}
	};
}

export default ImageUploaderMiddleware;
