import Admin, { AdminAttributes } from "../model/admin.model";

class AdminService {
	registerAdmin = async (
		name: string,
		email: string,
		phone: string,
		password: string,
	): Promise<Admin | AdminAttributes | null> => {
		try {
			const admin = await Admin.create(
				{
					name,
					email,
					phone,
					password,
				},
				{ returning: true },
			);
			const createdAdmin = await Admin.findByPk(admin.adminId);
			if (createdAdmin) {
				return createdAdmin.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	uploadAdminAvatar = async (
		adminId: number,
		avatarPath: string,
	): Promise<Admin | AdminAttributes | null> => {
		try {
			const admin = await Admin.findOne({ where: { adminId } });
			if (admin) {
				admin.avatar = avatarPath;
				await admin.save();
				return admin.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAdminByEmail = async (
		email: string,
	): Promise<Admin | AdminAttributes | null> => {
		try {
			const admin = await Admin.findOne({ where: { email } });
			if (admin) {
				return admin.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllAdmin = async (): Promise<Admin[] | AdminAttributes[] | null> => {
		try {
			const admins = await Admin.findAll();
			if (admins) {
				return admins.map((admin) => admin.toJSON());
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	updateAdmin = async (
		email: string,
		name: string,
		phone: string,
		avatar: string,
		password?: string,
	): Promise<boolean> => {
		try {
			const prevTokenVersion = (await Admin.findOne({
				where: { email },
				attributes: ["tokenVersion"],
			})) || { tokenVersion: 0 };
			const isUpdated = await Admin.update(
				{
					name,
					password,
					phone,
					avatar,
					tokenVersion: prevTokenVersion.tokenVersion + 1,
				},
				{
					where: { email },
				},
			);
			if (isUpdated) {
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default AdminService;
