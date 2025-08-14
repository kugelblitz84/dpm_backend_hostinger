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

		const mailOptions = {
			from: `"Dhaka Plastic & Metal" <${mailServerUser}>`,
			to,
			subject,
			html: htmlContent,
		};

		try {
			const result = await transporter.sendMail(mailOptions);
			
			return result;
		} catch (err: any) {

			throw err;
		}
	};
}

export default EmailService;
