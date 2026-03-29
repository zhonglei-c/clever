import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class Die extends Schema {
  @type("string") id: string;
  @type("string") color: string;
  @type("number") value: number;

  constructor(id: string, color: string, value: number) {
    super();
    this.id = id;
    this.color = color;
    this.value = value;
  }
}

export class BonusPool extends Schema {
  @type("number") rerolls: number = 0;
  @type("number") plusOnes: number = 0;
  @type("number") foxes: number = 0;
}

export class YellowArea extends Schema {
  @type([ "boolean" ]) row0 = new ArraySchema<boolean>(false, false, false, false);
  @type([ "boolean" ]) row1 = new ArraySchema<boolean>(false, false, false, false);
  @type([ "boolean" ]) row2 = new ArraySchema<boolean>(false, false, false, false);
  @type([ "boolean" ]) row3 = new ArraySchema<boolean>(false, false, false, false);
}

export class BlueArea extends Schema {
  @type([ "boolean" ]) marks = new ArraySchema<boolean>();
  constructor() {
    super();
    for(let i=0; i<11; i++) this.marks.push(false);
  }
}

export class GreenArea extends Schema {
  @type([ "boolean" ]) marks = new ArraySchema<boolean>();
  constructor() {
    super();
    for(let i=0; i<11; i++) this.marks.push(false);
  }
}

export class NumberTrackArea extends Schema {
  @type([ "number" ]) values = new ArraySchema<number>();
  constructor() {
    super();
    for(let i=0; i<11; i++) this.values.push(0);
  }
}

export class PlayerSheet extends Schema {
  @type(YellowArea) yellow = new YellowArea();
  @type(BlueArea) blue = new BlueArea();
  @type(GreenArea) green = new GreenArea();
  @type(NumberTrackArea) orange = new NumberTrackArea();
  @type(NumberTrackArea) purple = new NumberTrackArea();
}

export class PendingBonus extends Schema {
  @type("string") type: string;
  @type("number") quantity: number = 1;

  constructor(type: string) {
    super();
    this.type = type;
  }
}

export class PlayerState extends Schema {
  @type("string") sessionId: string;
  @type("string") name: string;
  @type("boolean") isReady: boolean = false;
  @type("number") totalScore: number = 0;
  @type(BonusPool) bonuses = new BonusPool();
  @type(PlayerSheet) sheet = new PlayerSheet();
  @type([ PendingBonus ]) pendingBonuses = new ArraySchema<PendingBonus>();
  // 已触发的 bonus 标志，替代 _y_c0 等 as-any hack，确保断线重连后不丢失
  @type([ "string" ]) earnedBonuses = new ArraySchema<string>();
  // 被动玩家本轮是否已完成选择
  @type("boolean") passiveDone: boolean = false;
  // 断线重连状态
  @type("boolean") isConnected: boolean = true;
  // 被动玩家已选定的骰子 ID（两步操作：先选骰子，再标记格子）
  @type("string") pendingPassiveDieId: string = "";

  constructor(sessionId: string, name: string) {
    super();
    this.sessionId = sessionId;
    this.name = name;
  }
}

export class GameStateSchema extends Schema {
  @type("string") roomID: string = "";
  @type("number") round: number = 1;
  @type("number") maxRounds: number = 4;
  @type("number") activePlayerIndex: number = 0;
  @type("string") phase: string = "WAITING";
  @type("number") remainingRolls: number = 3;

  @type([ Die ]) pool = new ArraySchema<Die>();
  @type([ Die ]) selected = new ArraySchema<Die>();
  @type([ Die ]) silverPlatter = new ArraySchema<Die>();
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
