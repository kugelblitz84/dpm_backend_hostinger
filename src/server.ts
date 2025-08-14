import "colors";
import "./util/cron-job";
import http from "http";
import { Server } from "socket.io";
import app, { corsOptions } from "./app/app";
import urlJoin from "url-join";
import {
	port,
	apiDocsUrl,
	serverBaseUrl,
	nodeEnv,
} from "./config/dotenv.config";
import { initializeDatabase } from "./config/database.config";
import SocketService from "./service/socket.service";

const server = http.createServer(app);

export const io = new Server(server, {
	cors: corsOptions,
});

const initializeServer = async (): Promise<void> => {
	try {
		io.on("connection", (socket) => {
			
			const socketService = new SocketService(socket.id);

			socket.on("login-staff", socketService.loginStaff);

			socket.on("logout-staff", socketService.logoutStaff);

			socket.on("disconnect", () => {

				socketService.disconnectStaff();
			});
		});

		await initializeDatabase();
		try {
			server.listen(port, () => {
				console.log(`Server is running on port ${port}`.blue);
			});
		} catch (err: any) {
			
		}
	} catch (err: any) {
		
	}
};

initializeServer();

export default initializeServer;
