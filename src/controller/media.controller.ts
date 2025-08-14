import { Request, Response, NextFunction } from "express";
import MediaService from "../service/media.service";
import { responseSender } from "../util";
import path from "path";
import fs from "fs";
import { staticDir } from "../config/dotenv.config";

class MediaController {
	private mediaService: MediaService;

	constructor() {
		this.mediaService = new MediaService();
	}

	createMedia = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const fileValidationError = (req as any).fileValidationError;
			if (fileValidationError) {
				return responseSender(res, 400, fileValidationError);
			}

			if ((req as any).files.length > 0) {
				for (const image of (req as any).files) {
					await this.mediaService.createMedia(image.filename);
				}
			}

			return responseSender(res, 200, "Media uploaded successfully.");
		} catch (err: any) {
			// cleanup process if database operation failed
			if (req.files && Array.isArray(req.files)) {
				req.files.forEach((file) => {
					const filePath = path.join(file.destination, file.filename);

					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							
						}
					});
				});
			}

			next(err);
		}
	};

	deleteMedia = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const mediaId = (req as any).params.mediaId;

			const isMediaExist = await this.mediaService.getMediaById(mediaId);

			if (!isMediaExist) {
				return responseSender(res, 404, "Media not found.");
			}

			const isDeleted = await this.mediaService.deleteMedia(mediaId);

			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Media deletion failed. Please try again.",
				);
			}

			const filePath = path.join(
				staticDir,
				"media-images",
				isMediaExist.imageName,
			);

			fs.unlink(filePath, (unlinkErr) => {
				if (unlinkErr) {
					
				}
			});

			return responseSender(res, 200, "Media deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllMedias = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const medias = await this.mediaService.getAllMedias();
			if (!medias) {
				return responseSender(
					res,
					400,
					"Failed to get medias. Please try again.",
				);
			}
			return responseSender(res, 200, "Medias fetched successfully.", {
				medias,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default MediaController;
