import { FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import { WebSocket } from "ws";

export async function websocketPlugin(app: FastifyInstance) {
    await app.register(websocket);

    app.get("/ws", { websocket: true }, (socket, request) => {
        request.log.info("WebSocket client connected");

        socket.on("message", (data) => {
            const msg = data.toString();
            let parsed: unknown;
            try {
                parsed = JSON.parse(msg);
            } catch {
                request.log.warn({ raw: msg.slice(0, 200) }, "Received malformed WebSocket message");
                return;
            }

            request.log.debug({ type: (parsed as Record<string, unknown>).t }, "WebSocket message");

            for (const client of app.websocketServer.clients) {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(msg);
                }
            }
        });

        socket.on("close", () => {
            request.log.info("WebSocket client disconnected");
        });

        socket.on("error", (err) => {
            request.log.error({ message: err.message }, "WebSocket client error");
        });
    });
}
