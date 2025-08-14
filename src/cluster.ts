import "colors";
import cluster from "cluster";
import os from "os";
import initializeServer from "./server";

if (cluster.isMaster) {
	const numCPUs = os.cpus().length;

	// Fork workers
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	// Log worker events
	cluster.on("exit", (worker, _code, _signal) => {
		
		cluster.fork();
	});

	cluster.on("online", (worker) => {
		
	});
} else {
	// Start worker logic
	initializeServer();
}
