export type Suit = "S" | "H" | "D" | "C";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export type CardId = `${Rank}${Suit}`;

export type LiteratureSetId =
  | "S_LOW"
  | "S_HIGH"
  | "H_LOW"
  | "H_HIGH"
  | "D_LOW"
  | "D_HIGH"
  | "C_LOW"
  | "C_HIGH"
  | "EIGHTS";

export type PlayerStatus = "connected" | "disconnected";
export type RoomPhase = "lobby" | "playing" | "finished";

export type Player = {
  id: string;
  name: string;
  avatar: string;
  host: boolean;
  ready: boolean;
  status: PlayerStatus;
  hand: CardId[];
  socketIds: string[];
  score: number;
};

export type CompletedSet = {
  setId: LiteratureSetId;
  claimedBy: string;
  cards: CardId[];
  at: number;
};

export type RoomState = {
  code: string;
  phase: RoomPhase;
  players: Player[];
  turnPlayerId: string | null;
  completedSets: CompletedSet[];
  createdAt: number;
  updatedAt: number;
  winnerIds: string[];
};

export type PublicPlayer = Omit<Player, "hand" | "socketIds"> & {
  cardCount: number;
};

export type PublicRoomState = Omit<RoomState, "players"> & {
  players: PublicPlayer[];
  you: {
    id: string;
    hand: CardId[];
    legalSetIds: LiteratureSetId[];
  } | null;
};

export type AskPayload = {
  targetPlayerId: string;
  cardId: CardId;
};

export type DeclarePayload = {
  setId: LiteratureSetId;
};

export type MoveToast = {
  id: string;
  tone: "success" | "miss" | "info" | "win";
  message: string;
};

export const suits: Suit[] = ["S", "H", "D", "C"];
export const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const setDefinitions: Record<LiteratureSetId, { label: string; cards: CardId[] }> = {
  S_LOW: { label: "Spades Low", cards: ["2S", "3S", "4S", "5S", "6S", "7S"] },
  S_HIGH: { label: "Spades High", cards: ["9S", "10S", "JS", "QS", "KS", "AS"] },
  H_LOW: { label: "Hearts Low", cards: ["2H", "3H", "4H", "5H", "6H", "7H"] },
  H_HIGH: { label: "Hearts High", cards: ["9H", "10H", "JH", "QH", "KH", "AH"] },
  D_LOW: { label: "Diamonds Low", cards: ["2D", "3D", "4D", "5D", "6D", "7D"] },
  D_HIGH: { label: "Diamonds High", cards: ["9D", "10D", "JD", "QD", "KD", "AD"] },
  C_LOW: { label: "Clubs Low", cards: ["2C", "3C", "4C", "5C", "6C", "7C"] },
  C_HIGH: { label: "Clubs High", cards: ["9C", "10C", "JC", "QC", "KC", "AC"] },
  EIGHTS: { label: "Eights", cards: ["8S", "8H", "8D", "8C"] }
};

export const literatureSets = Object.entries(setDefinitions).map(([id, value]) => ({
  id: id as LiteratureSetId,
  ...value
}));

export const allCards = ranks.flatMap((rank) => suits.map((suit) => `${rank}${suit}` as CardId));

export function getCardMeta(cardId: CardId) {
  const suit = cardId.slice(-1) as Suit;
  const rank = cardId.slice(0, -1) as Rank;
  return { rank, suit, label: `${rank}${suitSymbol(suit)}`, color: suit === "H" || suit === "D" ? "red" : "black" };
}

export function suitSymbol(suit: Suit) {
  return ({ S: "♠", H: "♥", D: "♦", C: "♣" } as const)[suit];
}

export function getSetForCard(cardId: CardId): LiteratureSetId {
  const found = literatureSets.find((set) => set.cards.includes(cardId));
  if (!found) throw new Error(`Unknown card ${cardId}`);
  return found.id;
}

export function getSetLabel(setId: LiteratureSetId) {
  return setDefinitions[setId].label;
}

export function getSetCards(setId: LiteratureSetId) {
  return [...setDefinitions[setId].cards];
}

export function legalSetIdsForHand(hand: CardId[]) {
  return Array.from(new Set(hand.map(getSetForCard)));
}

export function legalAskCardsForPlayer(room: RoomState, playerId: string) {
  const player = findPlayer(room, playerId);
  const own = new Set(player.hand);
  const completed = new Set(room.completedSets.map((set) => set.setId));
  return legalSetIdsForHand(player.hand)
    .filter((setId) => !completed.has(setId))
    .flatMap((setId) => getSetCards(setId))
    .filter((card) => !own.has(card));
}

export function makeDeck() {
  return [...allCards];
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createRoom(code: string, host: Player): RoomState {
  return {
    code,
    phase: "lobby",
    players: [{ ...host, host: true, ready: true }],
    turnPlayerId: null,
    completedSets: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    winnerIds: []
  };
}

export function startGame(room: RoomState) {
  if (room.phase !== "lobby") throw new Error("Game has already started.");
  if (room.players.length < 2 || room.players.length > 8) throw new Error("Literature Online supports 2 to 8 players.");
  if (room.players.some((player) => !player.ready)) throw new Error("Everyone must be ready.");

  const deck = shuffle(makeDeck());
  const players = room.players.map((player) => ({ ...player, hand: [] as CardId[], score: 0 }));
  deck.forEach((card, index) => {
    players[index % players.length].hand.push(card);
  });

  room.players = players.map((player) => ({ ...player, hand: sortCards(player.hand) }));
  room.turnPlayerId = players[0].id;
  room.phase = "playing";
  touch(room);
}

export function applyAsk(room: RoomState, askerId: string, payload: AskPayload) {
  if (room.phase !== "playing") throw new Error("The game is not active.");
  if (room.turnPlayerId !== askerId) throw new Error("It is not your turn.");
  if (askerId === payload.targetPlayerId) throw new Error("Ask another player.");

  const asker = findPlayer(room, askerId);
  const target = findPlayer(room, payload.targetPlayerId);
  if (!asker.hand.length) throw new Error("You have no cards to ask from.");
  if (!target.hand.length) throw new Error("That player has no cards.");
  if (!legalAskCardsForPlayer(room, askerId).includes(payload.cardId)) {
    throw new Error("You can only ask for cards in literature sets you already hold.");
  }

  const targetIndex = target.hand.indexOf(payload.cardId);
  const success = targetIndex >= 0;
  if (success) {
    target.hand.splice(targetIndex, 1);
    asker.hand.push(payload.cardId);
    asker.hand = sortCards(asker.hand);
  } else {
    room.turnPlayerId = target.id;
  }
  touch(room);

  return {
    success,
    toast: {
      id: `${Date.now()}-${Math.random()}`,
      tone: success ? "success" : "miss",
      message: success
        ? `${asker.name} got ${getCardMeta(payload.cardId).label} from ${target.name}`
        : `${target.name} did not have ${getCardMeta(payload.cardId).label}`
    } satisfies MoveToast
  };
}

export function declareSet(room: RoomState, playerId: string, payload: DeclarePayload) {
  if (room.phase !== "playing") throw new Error("The game is not active.");
  const player = findPlayer(room, playerId);
  if (room.completedSets.some((set) => set.setId === payload.setId)) throw new Error("That set is already complete.");
  const required = getSetCards(payload.setId);
  if (!required.every((card) => player.hand.includes(card))) throw new Error("You must hold every card in the set.");

  player.hand = player.hand.filter((card) => !required.includes(card));
  player.score += 1;
  room.completedSets.push({ setId: payload.setId, claimedBy: player.id, cards: required, at: Date.now() });

  if (room.completedSets.length === literatureSets.length || room.players.every((p) => p.hand.length === 0)) {
    room.phase = "finished";
    const highScore = Math.max(...room.players.map((p) => p.score));
    room.winnerIds = room.players.filter((p) => p.score === highScore).map((p) => p.id);
  } else if (room.turnPlayerId === player.id && player.hand.length === 0) {
    room.turnPlayerId = nextPlayerWithCards(room, player.id);
  }
  touch(room);

  return {
    toast: {
      id: `${Date.now()}-${Math.random()}`,
      tone: room.phase === "finished" ? "win" : "info",
      message: room.phase === "finished"
        ? `${winnerNames(room)} won Literature Online`
        : `${player.name} completed ${getSetLabel(payload.setId)}`
    } satisfies MoveToast
  };
}

export function publicRoomState(room: RoomState, playerId: string | null): PublicRoomState {
  const you = playerId ? room.players.find((player) => player.id === playerId) ?? null : null;
  return {
    ...room,
    players: room.players.map(({ hand, socketIds, ...player }) => ({ ...player, cardCount: hand.length })),
    you: you ? { id: you.id, hand: you.hand, legalSetIds: legalSetIdsForHand(you.hand) } : null
  };
}

export function sanitizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 18) || "Guest";
}

export function avatarForName(name: string) {
  const palette = ["#2de88a", "#e2b85f", "#7dd3fc", "#fda4af", "#c4b5fd", "#fcd34d"];
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

export function makePlayer(id: string, name: string): Player {
  return {
    id,
    name: sanitizeName(name),
    avatar: avatarForName(name),
    host: false,
    ready: false,
    status: "connected",
    hand: [],
    socketIds: [],
    score: 0
  };
}

export function findPlayer(room: RoomState, playerId: string) {
  const player = room.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error("Player not found.");
  return player;
}

export function sortCards(cards: CardId[]) {
  const suitOrder: Suit[] = ["S", "H", "D", "C"];
  return [...cards].sort((a, b) => {
    const am = getCardMeta(a);
    const bm = getCardMeta(b);
    return suitOrder.indexOf(am.suit) - suitOrder.indexOf(bm.suit) || ranks.indexOf(am.rank) - ranks.indexOf(bm.rank);
  });
}

function nextPlayerWithCards(room: RoomState, fromPlayerId: string) {
  const startIndex = room.players.findIndex((player) => player.id === fromPlayerId);
  for (let offset = 1; offset <= room.players.length; offset += 1) {
    const player = room.players[(startIndex + offset) % room.players.length];
    if (player.hand.length > 0) return player.id;
  }
  return null;
}

function winnerNames(room: RoomState) {
  const winners = new Set(room.winnerIds);
  return room.players.filter((player) => winners.has(player.id)).map((player) => player.name).join(" and ");
}

function touch(room: RoomState) {
  room.updatedAt = Date.now();
}
