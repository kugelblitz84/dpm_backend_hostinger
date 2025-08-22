import { responseSender } from "../util";
import multer from "multer";
import { Request, Response, NextFunction } from "express";

const errorController = (
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	
	if (err instanceof multer.MulterError) {
		// Handle multer-specific errors
		switch (err.code) {
			case "LIMIT_FILE_SIZE":
				return responseSender(res, 400, "File size too large!");
			case "LIMIT_UNEXPECTED_FILE":
				return responseSender(res, 400, "Unexpected file format!");
			default:
				return responseSender(res, 400, err.message);
		}
	}
	try {
		const req: any = (res as any).req;
		console.error("[GlobalErrorHandler] 500", {
			path: req?.path,
			method: req?.method,
			message: err?.message,
			stack: err?.stack,
		});
	} catch {}
	responseSender(res, 500, "Internal server error occured.");
};

export default errorController;
