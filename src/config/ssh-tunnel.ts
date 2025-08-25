// SSH tunneling is disabled; database connects directly to Hostinger MySQL.
export async function createSshTunnel(): Promise<void> {
  console.log("SSH tunnel disabled; using direct DB connection.");
}
