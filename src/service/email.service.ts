import nodemailer from "nodemailer";
import { loadTemplate } from "../util";
import {
	mailServerHost,
	mailServerPort,
	mailServerUser,
	mailServerPassword,
} from "../config/dotenv.config";

class EmailService {
	sendEmail = async (
		to: string,
		subject: string,
		templateName: string,
		variables: Record<string, any>,
	) => {
		// Debug: log mail transport config (sanitized)
		const portNum = Number(mailServerPort);
		const secure = portNum === 465; // SSL on 465, STARTTLS on 587
		console.log("[EmailService.sendEmail] Preparing transporter", {
			host: mailServerHost,
			port: portNum,
			secure,
			user: mailServerUser ? "<set>" : "<missing>",
		});

		if (!mailServerHost || !portNum || !mailServerUser || !mailServerPassword) {
			const msg = "Email credentials missing (host/port/user/password).";
			console.error("[EmailService.sendEmail] ERROR", { message: msg });
			throw new Error(msg);
		}

		const transporter = nodemailer.createTransport({
			host: mailServerHost,
			port: portNum,
			secure,
			auth: {
				user: mailServerUser,
				pass: mailServerPassword,
			},
		} as nodemailer.TransportOptions);

		const htmlContent = await loadTemplate(templateName, variables);
		console.log("[EmailService.sendEmail] Template rendered", {
			template: templateName,
			hasHtml: Boolean(htmlContent),
		});

		const mailOptions = {
			from: `"Dhaka Plastic & Metal" <${mailServerUser}>`,
			to,
			subject,
			html: htmlContent,
		};

		try {
			console.log("[EmailService.sendEmail] Sending mail", {
				to,
				subject,
			});
			const result = await transporter.sendMail(mailOptions);
			console.log("[EmailService.sendEmail] Mail sent", {
				messageId: (result as any)?.messageId,
				response: (result as any)?.response,
			});
			
			return result;
		} catch (err: any) {
			console.error("[EmailService.sendEmail] ERROR", {
				name: err?.name,
				code: err?.code,
				message: err?.message,
				command: err?.command,
				response: err?.response,
			});
			throw err;
		}
	};
}

export default EmailService;
