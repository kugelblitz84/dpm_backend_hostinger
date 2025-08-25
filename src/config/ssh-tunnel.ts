// SSH tunneling is disabled; database connects directly to Hostinger MySQL.
// SSH tunnel is no longer used. Provide a no-op for backward compatibility.
export async function createSshTunnel(): Promise<void> {
  return Promise.resolve();
}
