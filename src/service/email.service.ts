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

			// Provide a clearer hint for common network errors so PM2 logs are actionable
			if (err?.code === "ECONNREFUSED") {
				console.error(
					"[EmailService.sendEmail] ECONNREFUSED: Connection refused when connecting to SMTP host.\n" +
					`Host: ${mailServerHost}, Port: ${portNum}.\n` +
					"Possible causes: firewall blocking the port, no SMTP server listening at that host/port, or incorrect host/port credentials.\n" +
					"Suggested actions: (1) open the SMTP port on the server firewall (e.g. ufw/iptables), (2) verify the mail server is running and accepting connections, or (3) switch to a third-party SMTP provider and update MAIL_SERVER_* env vars."
				);
				// augment error message for upstream visibility
				err.message = `${err.message} — Connection refused to ${mailServerHost}:${portNum}. Check firewall/SMTP server or use a different SMTP provider.`;
			}

			throw err;
		}
	};
}

export default EmailService;
