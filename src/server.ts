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
import { createSshTunnel } from "./config/ssh-tunnel"; // new SSH tunnel module

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
        origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    //allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

const initializeServer = async (): Promise<void> => {
  try {
    // 1️⃣ Start SSH tunnel first (for MySQL)
    await createSshTunnel();

    // 2️⃣ Initialize database connection (now tunnel is active)
    await initializeDatabase();

    // 3️⃣ Socket.io connections
    io.on("connection", (socket) => {
      
      const socketService = new SocketService(socket.id);

      socket.on("login-staff", socketService.loginStaff);

      socket.on("logout-staff", socketService.logoutStaff);

      socket.on("disconnect", () => {
        socketService.disconnectStaff();
      });
    });

    // 4️⃣ Start HTTP server
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`.blue);
    });
  } catch (err: any) {
    console.error("Server initialization error:".red, err);
    process.exit(1); // fail fast on Heroku
  }
};

initializeServer();

export default initializeServer;
