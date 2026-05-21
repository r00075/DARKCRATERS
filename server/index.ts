import { createServer } from "node:http";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { RaidRoom } from "./rooms/RaidRoom";

const port = Number(process.env.COLYSEUS_PORT ?? 2567);
const server = createServer();
const gameServer = new Server({
  transport: new WebSocketTransport({ server }),
});

gameServer.define("raid_room", RaidRoom);

server.listen(port, () => {
  console.log(`Colyseus raid server listening on ws://localhost:${port}`);
});
