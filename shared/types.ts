/**
 * Clever (Ganz schön clever) Core Game State Definitions
 */

export type DieColor = 'yellow' | 'blue' | 'green' | 'orange' | 'purple' | 'white';

export interface Die {
  id: string;
  color: DieColor;
  value: number;
}

export interface PlayerSheet {
  // 黄色区域: 4x4 网格，勾选数字触发列奖励和行分数
  yellow: {
    marks: boolean[][]; // [row][col]
  };
  // 蓝色区域: 选蓝色骰子时必须加上白色骰子点数
  blue: {
    marks: boolean[]; // 2-12 的标记情况 (index 0-10)
  };
  // 绿色区域: 必须满足 >= X 的条件顺序填入
  green: {
    marks: boolean[]; // 11个格子
  };
  // 橙色区域: 直接填写数字，有倍率格
  orange: {
    values: number[]; // 11个格子
  };
  // 紫色区域: 必须 > 前一个数字 (6 之后可以接任何数)
  purple: {
    values: number[]; // 11个格子
  };
}

export interface BonusPool {
  rerolls: number;
  plusOnes: number;
  foxes: number;
}

export interface PlayerState {
  sessionId: string;
  name: string;
  sheet: PlayerSheet;
  bonuses: BonusPool;
  totalScore: number;
  isReady: boolean;
}

export interface GameState {
  roomID: string;
  round: number;
  maxRounds: number;
  activePlayerIndex: number;
  phase: 'WAITING' | 'ROLLING' | 'SELECTING' | 'PASSIVE_CHOOSING' | 'GAME_OVER';
  
  // 骰子区域
  pool: Die[];           // 当前待选骰子
  selected: Die[];       // 当前选中的（主玩家最多3个）
  silverPlatter: Die[];  // 银盘中的（被动玩家选）
  
  players: Map<string, PlayerState>;
}
