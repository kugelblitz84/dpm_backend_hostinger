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
		console.log("[EmailService.sendEmail] Preparing transporter", {
			host: mailServerHost,
			port: mailServerPort,
			secure: true,
			user: mailServerUser ? "<set>" : "<missing>",
		});

		const transporter = nodemailer.createTransport({
			host: mailServerHost,
			port: mailServerPort,
			secure: true,
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
