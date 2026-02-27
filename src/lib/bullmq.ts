import IORedis from "ioredis";

const connections: Record<number, IORedis> = {};

export function getRedisConnection(
	instanceId: number,
	host: string,
	port: number,
) {
	if (!connections[instanceId]) {
		connections[instanceId] = new IORedis(port, host, {
			maxRetriesPerRequest: null,
		});
	}
	return connections[instanceId];
}

export function closeRedisConnection(instanceId: number) {
	if (connections[instanceId]) {
		connections[instanceId].disconnect();
		delete connections[instanceId];
	}
}
