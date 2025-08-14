import express from "express";
import TransactionMiddleware from "../middleware/transaction.middleware";
import AuthMiddleware from "../middleware/auth.middleware";
import TransactionController from "../controller/transaction.controller";

const transactionMiddleware = new TransactionMiddleware();
const authMiddleware = new AuthMiddleware();
const transactionController = new TransactionController();

const transactionRouter = express.Router();

transactionRouter.get(
	"/",
	// authMiddleware.authenticate(["admin", "agent", "customer"]),
	transactionMiddleware.validateFilteringQueries,
	transactionController.getAllTransactions,
);

export default transactionRouter;
