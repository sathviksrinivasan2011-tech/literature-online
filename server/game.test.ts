import assert from "node:assert/strict";
import { applyAsk, createRoom, declareSet, getSetCards, makePlayer, startGame, type RoomState } from "../lib/game";

const host = makePlayer("p1", "Rahul");
host.host = true;
host.ready = true;
const guest = makePlayer("p2", "Sneha");
guest.ready = true;

const room = createRoom("TEST1", host);
room.players.push(guest);
startGame(room);
assert.equal(room.phase, "playing");
assert.equal(room.players.reduce((sum, player) => sum + player.hand.length, 0), 52);

const controlled: RoomState = createRoom("TEST2", host);
controlled.players.push(guest);
controlled.phase = "playing";
controlled.turnPlayerId = "p1";
controlled.players[0].hand = ["2S", "3S"];
controlled.players[1].hand = ["4S", "AH"];

const hit = applyAsk(controlled, "p1", { targetPlayerId: "p2", cardId: "4S" });
assert.equal(hit.success, true);
assert.equal(controlled.turnPlayerId, "p1");
assert.ok(controlled.players[0].hand.includes("4S"));

const miss = applyAsk(controlled, "p1", { targetPlayerId: "p2", cardId: "5S" });
assert.equal(miss.success, false);
assert.equal(controlled.turnPlayerId, "p2");

const declareRoom: RoomState = createRoom("TEST3", host);
declareRoom.players.push(guest);
declareRoom.phase = "playing";
declareRoom.turnPlayerId = "p1";
declareRoom.players[0].hand = getSetCards("S_LOW");
declareSet(declareRoom, "p1", { setId: "S_LOW" });
assert.equal(declareRoom.completedSets.length, 1);
assert.equal(declareRoom.players[0].score, 1);
assert.equal(declareRoom.players[0].hand.length, 0);

console.log("Game logic tests passed.");
