import { Order, WhereOptions } from "sequelize";
import Client, { ClientAttributes } from "../model/client.model";

class ClientService {
	addClient = async (
		type: string,
		clientLogos: string[],
	): Promise<Client | ClientAttributes | null> => {
		try {
			const createdClient = await Client.create({
				type,
				clientLogos,
			});

			return createdClient ? createdClient.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	editClient = async (
		clientId: number,
		type: string,
		clientLogos: string[],
	): Promise<Client | ClientAttributes | null> => {
		try {
			const client = await Client.findByPk(clientId);

			if (client) {
				client.type = type;
				client.clientLogos = clientLogos;
				await client.save();
				return client.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getClientById = async (
		clientId: number,
	): Promise<Client | ClientAttributes | null> => {
		try {
			const client = await Client.findByPk(clientId);

			return client ? client.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteClient = async (clientId: number): Promise<boolean> => {
		try {
			const client = await Client.findByPk(clientId);

			if (client) {
				await client.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllClients = async (
		filter: WhereOptions<ClientAttributes>,
		limit: number,
		offset: number,
		order: Order,
	): Promise<Client[] | ClientAttributes[] | null> => {
		try {
			const clients = await Client.findAll({
				where: filter,
				limit,
				offset,
				order,
			});
			if (clients) {
				return clients.map((client) => client.toJSON());
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default ClientService;
