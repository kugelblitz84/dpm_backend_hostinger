import { Order, WhereOptions } from "sequelize";
import Media, { MediaAttributes } from "../model/media.model";

class MediaService {
	createMedia = async (
		imageName: string,
	): Promise<Media | MediaAttributes | null> => {
		try {
			const media = await Media.create({ imageName });

			return media ? media.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getMediaById = async (
		mediaId: number,
	): Promise<Media | MediaAttributes | null> => {
		try {
			const media = await Media.findByPk(mediaId);

			return media ? media.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteMedia = async (mediaId: number): Promise<boolean> => {
		try {
			const media = await Media.findByPk(mediaId);

			if (media) {
				await media.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllMedias = async (): Promise<Media[] | MediaAttributes[] | null> => {
		try {
			const medias = await Media.findAll();
			if (medias) {
				return medias.map((media) => media.toJSON());
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default MediaService;
