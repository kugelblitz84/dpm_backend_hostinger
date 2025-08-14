import { Client } from "ssh2";
import net from "net";

const {
  SSH_HOST,
  SSH_PORT = "22",
  SSH_USERNAME,
  SSH_PRIVATE_KEY_B64,
  SSH_PRIVATE_KEY_PASSPHRASE,
  DB_REMOTE_HOST = "127.0.0.1",
  DB_REMOTE_PORT = "3306",
  TUNNEL_LOCAL_PORT = "3307",
} = process.env;

if (!SSH_HOST || !SSH_USERNAME || !SSH_PRIVATE_KEY_B64) {
  throw new Error("Missing SSH configuration in environment variables");
}

const privateKey = Buffer.from(SSH_PRIVATE_KEY_B64, "base64").toString("utf8");

export async function createSshTunnel(): Promise<void> {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    const localServer = net.createServer((socket) => {
      conn.forwardOut(
        socket.remoteAddress || "127.0.0.1",
        socket.remotePort || 0,
        DB_REMOTE_HOST,
        parseInt(DB_REMOTE_PORT, 10),
        (err, stream) => {
          if (err) {
            socket.destroy();
            return;
          }
          socket.pipe(stream).pipe(socket);
        }
      );
    });

    localServer.listen(parseInt(TUNNEL_LOCAL_PORT, 10), "127.0.0.1", () => {
      console.log(`SSH Tunnel ready: 127.0.0.1:${TUNNEL_LOCAL_PORT} → ${DB_REMOTE_HOST}:${DB_REMOTE_PORT}`);
    });

    conn.on("ready", () => resolve());
    conn.on("error", reject);

    conn.connect({
      host: SSH_HOST,
      port: parseInt(SSH_PORT, 10),
      username: SSH_USERNAME,
      privateKey,
      passphrase: SSH_PRIVATE_KEY_PASSPHRASE, // <<< Add this
    });
  });
}
