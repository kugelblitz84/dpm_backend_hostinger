import { responseSender } from "../util";
import { Request, Response, NextFunction } from "express";

const notFoundController = (
	_req: Request,
	res: Response,
	next: NextFunction,
) => {
	next(responseSender(res, 404, "The requested content could not be found."));
};

export default notFoundController;
