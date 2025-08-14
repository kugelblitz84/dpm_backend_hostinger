import Otp, { OtpAttributes } from "../model/otp.model";
import { Op } from "sequelize";

class OtpService {
	public config: {
		expiresInMinutes: number;
		otpLength: number;
	};
	constructor() {
		this.config = {
			expiresInMinutes: 2,
			otpLength: 6,
		};
	}

	createOtp = async (
		requestId: number,
		otp: string,
	): Promise<Otp | OtpAttributes | null> => {
		try {
			const expiresAt = new Date(
				Date.now() + this.config.expiresInMinutes * 60 * 1000,
			);
			const newOTP = await Otp.create({
				requestId,
				code: otp,
				expiresAt,
				used: false,
			});
			const createdOTP = await Otp.findByPk(newOTP.OtpId);
			if (createdOTP) {
				return createdOTP.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	verifyOtp = async (requestId: number, otp: string): Promise<boolean> => {
		try {
			const otpRecord = await Otp.findOne({
				where: { requestId, code: otp, used: false },
			});
			if (otpRecord) {
				otpRecord.used = true;
				await otpRecord.save();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	static cleanupExpiredOtps = async () => {
		try {
			const now = new Date();
			await Otp.destroy({
				where: {
					expiresAt: {
						[Op.lt]: now,
					},
				},
			});
			
		} catch (error) {
			
		}
	};
}

export default OtpService;
