import express from "express";
import AuthMiddleware from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimiter.middleware";
import JobController from "../controller/job.controller";
import JobMiddleware from "../middleware/job.middleware";

const jobController = new JobController();
const jobMiddleware = new JobMiddleware();
const authMiddleware = new AuthMiddleware();

const jobRouter = express.Router();

jobRouter.get(
	"/",
	jobMiddleware.validateFilteringQueries,
	jobController.getAllJobs,
);

jobRouter.post(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	jobMiddleware.validateJobCreation,
	jobController.createJob,
);

jobRouter.put(
	"/",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	jobMiddleware.validateJobEdit,
	jobController.editJob,
);

jobRouter.delete(
	"/:jobId",
	strictLimiter,
	authMiddleware.authenticate(["admin"]),
	jobController.deleteJob,
);

export default jobRouter;
