import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import path from "path";
import ejs from "ejs";
import { jwtSecret, jwtExpiresIn } from "../config/dotenv.config";
import { Response } from "express";
import slugify from "slugify";

export const responseSender = (
	res: Response,
	status: number,
	message: string,
	data?: {},
): void => {
	const responseData = {
		status: status,
		message: message,
		data,
	};

	// Centralized debug logging for error responses
	if (status >= 400) {
		try {
			const req: any = (res as any).req; // Express exposes the request on response
			const path = req?.path;
			const method = req?.method;
			const user = {
				admin: Boolean(req?.admin),
				staffRole: req?.staff?.role,
				staffId: req?.staff?.staffId,
				customer: Boolean(req?.customer),
			};
			const context = { path, method, status, message, user };
			if (status === 401) {
				console.warn("[responseSender] 401 Unauthorized", context);
			} else if (status >= 500) {
				console.error("[responseSender] 5xx Error", context);
			} else {
				console.warn("[responseSender] 4xx Client Error", context);
			}
		} catch {}
	}

	res.header("Content-Type", "application/json");
	res.status(status).json(responseData);
};

export const hashedPassword = async (password: string): Promise<string> => {
	const saltRound = 10;
	try {
		return await bcrypt.hash(password, saltRound);
	} catch (err: any) {
		
		throw err;
	}
};

export const comparePassword = async (
	password: string,
	hashedPassword: string,
): Promise<boolean> => {
	try {
		return await bcrypt.compare(password, hashedPassword);
	} catch (err: any) {
		
		throw err;
	}
};

export const generateJWTToken = (payload: {}): string => {
	try {
		return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn as any });
	} catch (err: any) {
		
		throw err;
	}
};

export const verifyToken = (token: string): any => {
	try {
		return jwt.verify(token, jwtSecret);
	} catch (err: any) {
		
		throw err;
	}
};

export const generateOTP = (length: number = 6): string => {
	if (length < 6) length = 6;

	const digits = "0123456789";
	let otp = "";

	for (let i = 0; i < length; i++) {
		const randomIndex = crypto.randomInt(0, digits.length); // Get a random index
		otp += digits[randomIndex]; // Append the digit to the OTP
	}

	return otp;
};

export const generateVerificationToken = (): string => {
	return uuid().toString().replace(/-/gi, "");
};

export const loadTemplate = async (templateName: string, variables: {}) => {
	try {
		const templatePath = path.join(
			__dirname,
			`../template/${templateName}.ejs`,
		);
		return await ejs.renderFile(templatePath, variables);
	} catch (err: any) {

	}
};

export const createSlug = (str: string) => {
	return slugify(str, { lower: true });
};

export function generateTransactionId(withTimestamp = false): string {
	const raw = uuid().replace(/-/g, ""); // e.g. "3f1c2b7e8c4a4f9e9d6f2a1b3c4d5e6f"
	return withTimestamp
		? Date.now().toString() + raw // e.g. "16855678901233f1c2b7e8c4a4f9e9d6f2a1b3c4d5e6f"
		: raw;
}
