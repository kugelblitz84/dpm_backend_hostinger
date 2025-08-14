import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import ImageUploaderMiddleware from "../middleware/imageUploader.middleware";
import ClientController from "../controller/client.controller";
import ClientMiddleware from "../middleware/client.middleware";

const clientController = new ClientController();
const clientMiddleware = new ClientMiddleware();
const authMiddleware = new AuthMiddleware();
const clientImageUploader = new ImageUploaderMiddleware();

const clientRouter = express.Router();

clientRouter.get(
	"/",
	clientMiddleware.validateFilteringQueries,
	clientController.getAllClients,
);

clientRouter.post(
	"/",
	strictLimiter,
	clientMiddleware.validateClientCreation,
	clientController.createClient,
);

clientRouter.put(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	clientImageUploader.uploader("blog-images").single("banner-image"),
	clientImageUploader.compressImages,
	clientMiddleware.validateClientEdit,
	clientController.editClient,
);

clientRouter.delete(
	"/:blogId",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	clientController.deleteClient,
);

export default clientRouter;
