import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";
import path from "path";
import fs from "fs";
import { Op, Order, WhereOptions } from "sequelize";
import ClientService from "../service/client.service";
import { ClientAttributes } from "../model/client.model";
import { staticDir } from "../config/dotenv.config";

class ClientController {
	private clientService: ClientService;

	constructor() {
		this.clientService = new ClientService();
	}

	createClient = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const newClient = {
				type: (req as any).validatedValue.type,
				clientLogos: (req as any).validatedValue.clientLogos,
			};
			const createdClient = await this.clientService.addClient(
				newClient.type,
				newClient.clientLogos,
			);

			if (!createdClient) {
				return responseSender(res, 400, "Client could not be created");
			}

			return responseSender(res, 201, "Client created successfully.", {
				client: createdClient,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	editClient = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const editedClient = {
				clientId: (req as any).validatedValue.clientId,
				type: (req as any).validatedValue.type,
				clientLogos: (req as any).validatedValue.clientLogos,
			};

			const isClientExist = await this.clientService.getClientById(
				editedClient.clientId,
			);
			if (!isClientExist) {
				return responseSender(res, 400, "Client does not exist");
			}

			const isEditedClient = await this.clientService.editClient(
				editedClient.clientId,
				editedClient.type,
				editedClient.clientLogos,
			);

			if (!isEditedClient) {
				return responseSender(res, 400, "Client could not be edited");
			}

			return responseSender(res, 200, "Client edited successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	deleteClient = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const clientId = (req as any).params.clientId;

			const isClientExist =
				await this.clientService.getClientById(clientId);

			if (!isClientExist) {
				return responseSender(res, 404, "Client not found.");
			}

			if (isClientExist.clientLogos.length > 0) {
				for (const logo of isClientExist.clientLogos) {
					const filePath = path.join(staticDir, "media-images", logo);

					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							// Optionally log the error
						}
					});
				}
			}

			const isDeleted = await this.clientService.deleteClient(clientId);

			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Client deletion failed. Please try again.",
				);
			}

			return responseSender(res, 200, "Client deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllClients = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<ClientAttributes> = {};

			if (searchTerm) {
				filter.type = {
					[Op.like]: `%${searchTerm}%`,
				};
			}

			const clients = await this.clientService.getAllClients(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!clients) {
				return responseSender(
					res,
					400,
					"Failed to get clients. Please try again.",
				);
			}
			return responseSender(res, 200, "Clients fetched successfully.", {
				clients,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default ClientController;
