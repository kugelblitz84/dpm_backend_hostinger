import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import ImageUploaderMiddleware from "../middleware/imageUploader.middleware";
import MediaController from "../controller/media.controller";

const mediaController = new MediaController();
const authMiddleware = new AuthMiddleware();
const mediaUploader = new ImageUploaderMiddleware();

const mediaRouter = express.Router();

mediaRouter.get(
	"/",
	authMiddleware.authenticate(["admin"]),
	mediaController.getAllMedias,
);

mediaRouter.post(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	mediaUploader.uploader("media-images").array("media-images", 20),
	mediaUploader.compressImages,
	mediaController.createMedia,
);

mediaRouter.delete(
	"/:mediaId",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	mediaController.deleteMedia,
);

export default mediaRouter;
