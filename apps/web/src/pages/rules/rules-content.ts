export type RulesLanguage = "zh" | "en";

export interface RulesSection {
  id: string;
  title: string;
  intro?: string;
  bullets?: string[];
  steps?: string[];
}

export interface RulesContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  quickFacts: Array<{ label: string; value: string }>;
  sections: RulesSection[];
  noteTitle: string;
  notes: string[];
}

export const rulesCopy: Record<RulesLanguage, RulesContent> = {
  zh: {
    eyebrow: "Rulebook",
    title: "《快可聪明》规则速查",
    subtitle:
      "这份站内规则页面按你提供的规则书整理，覆盖开局、主动与被动流程、五个颜色区、奖励、动作、终局与单人模式。",
    quickFacts: [
      { label: "目标", value: "通过五个颜色区与狐狸奖励拿到最高总分" },
      { label: "回合结构", value: "主动玩家最多进行三次常规选骰，其他玩家各做一次被动选择" },
      { label: "银盘", value: "比主动所选更小的骰子进入银盘" },
      { label: "白骰", value: "可当黄、绿、橙、紫使用；蓝区时与蓝骰相加" }
    ],
    sections: [
      {
        id: "setup",
        title: "开局",
        bullets: [
          "每位玩家拿一张计分纸和一支笔，随机决定起始玩家，由他拿起 6 颗骰子。",
          "游戏轮数取决于人数：4 人 4 轮，3 人 5 轮，1-2 人 6 轮。",
          "前四轮开始时，每位玩家都要拿 1 个开局奖励；第 4 轮要在两种黑色奖励中二选一。"
        ]
      },
      {
        id: "turn-flow",
        title: "回合流程",
        intro: "一位玩家成为主动玩家时，先完成自己的三次常规选骰；只有主动部分结束后，其他玩家才进入被动选择。",
        steps: [
          "主动玩家先掷出 6 颗骰子，从中选 1 颗，原样放到自己左上角 3 个骰位中的一个，不能改点数。",
          "然后按这颗骰子的颜色和点数，在自己计分纸对应颜色区里填写或勾掉一个位置。白骰是颜色万能。",
          "所有点数严格小于所选骰子的骰子立刻进入银盘；点数更大或相等的骰子留给下一次重掷。",
          "主动玩家用剩下的骰子再掷第二次，重复同样流程；然后再掷第三次，再做最后一次常规选择。",
          "如果第一掷或第二掷时选了较大的骰子，导致已经没有骰子可再掷，本回合就会提前结束，少于三次常规选择也是合法的。",
          "第三次常规选择后，或已经没有骰子可再掷时，把所有剩余未放上自己骰位的骰子全部放进银盘。",
          "只有这时其他玩家才开始被动选择。全部完成后，左手边玩家成为新的主动玩家。每位玩家都当过一次主动玩家后，本轮结束。"
        ]
      },
      {
        id: "zones",
        title: "五个颜色区",
        bullets: [
          "Yellow：把黄骰点数对应的格子划掉。格子可以任意顺序划，但每用一次骰子只能划掉一个格。某一列划满后，立刻圈出该列底部星号分数；行尾奖励稍后结算。",
          "Blue：使用蓝骰时，必须把当前蓝骰与白骰点数相加；反过来若用白骰当蓝色，也必须把白骰与当前蓝骰相加。无论另一颗骰子此刻在骰位、银盘还是别处，这个和数都照算。蓝区可任意顺序填写。",
          "Green：从最左边开始按顺序推进，不能跳格。每次只要达到下一格要求的最低点数，就能填入下一格。",
          "Orange：从最左边开始按顺序推进，不能跳格。把所选橙骰的点数写入对应位置；若该格带倍率，就把点数乘以倍率后再写入。",
          "Purple：从最左边开始按顺序推进，不能跳格。新写入的数字必须严格大于前一个数字；但如果前一个数字是 6，下一格可以写任意数字。"
        ]
      },
      {
        id: "silver",
        title: "银盘与被动选择",
        bullets: [
          "银盘中的骰子来自主动玩家每次选择后被放到一旁的较小骰子。",
          "被动玩家不会消耗银盘，同一个银盘骰子可以被多个玩家同时选择。",
          "所有被动玩家是同时选择的，每人最多从银盘拿 1 颗来在自己的纸上标记。",
          "如果某位被动玩家无法使用银盘中的任何一颗骰子，他必须改从主动玩家左上角的 3 个已选骰子里拿 1 颗；不能主动放弃银盘来这么做。"
        ]
      },
      {
        id: "bonuses",
        title: "奖励与连锁",
        bullets: [
          "奖励可能出现在单个格子下方，或某一整行、整列的末端。单格奖励在填入该格时立刻执行；行列奖励在整行或整列全部完成时执行。",
          "X 奖励会立刻让你在黄、蓝、绿其中一个对应区域再做一次额外标记；其中绿区永远是填写下一个可用格。",
          "彩色底的数字奖励会立刻把这个数字填到对应颜色区的下一个合法位置，不能留到以后再用。第 4 轮黑色 `X` 奖励只能填黄、蓝、绿；黑色 `6` 奖励只能填橙或紫。",
          "狐狸不会立刻给分，而是在终局时按你五个颜色区里最低的那个分区计分。若某个颜色区是 0 分，狐狸就不值分。",
          "如果一个奖励又触发了下一个奖励，要立刻继续结算，所以允许形成连锁。"
        ]
      },
      {
        id: "actions",
        title: "动作条",
        bullets: [
          "游戏中会逐步解锁两条动作：`Reroll` 与 `Extra die`。动作和奖励不同，可以立刻用，也可以存到之后回合再用。",
          "当你解锁一个动作时，要先把该动作条上的下一个空格圈起来；真正使用时，再把最左边尚未划掉的已圈格划掉。",
          "`Reroll action` 只能由主动玩家使用。它会把这一次刚掷出的、仍在手上的所有骰子一起重掷；不能只留一部分。",
          "`Extra die action` 只能在一次回合结束时进行：主动玩家做完常规选择后，或被动玩家做完自己的那一次选择后，才能额外再选 1 颗骰子。",
          "`Extra die action` 可以从本回合全部 6 颗骰子里任选 1 颗，包括主动玩家已经拿走的骰子，甚至可以再次选到自己刚刚常规选过的那颗；但同一颗骰子在同一回合里不能靠这个动作被额外选择超过一次。"
        ]
      },
      {
        id: "scoring",
        title: "计分与终局",
        bullets: [
          "黄区按完成的列计分，蓝区按填掉的格子数量查分数表，绿区按最右已填位置上方的星号计分，橙区与紫区都把该区写入的数字相加。",
          "狐狸分数等于“狐狸数量 × 你五个颜色区里的最低分区得分”。",
          "最后一轮最后一位主动玩家结束后，所有被动玩家先完成这回合的被动选择；这时仍可使用 `Extra die action`，但没用掉的 `Reroll action` 会直接失效。",
          "合计总分后，最高分获胜；若平分，就比较单一区域中的最高分；若仍无法分出胜负，则共享胜利。"
        ]
      },
      {
        id: "solo",
        title: "单人模式",
        bullets: [
          "单人模式共进行 6 轮，玩家会交替扮演主动与被动角色，各进行 6 次。",
          "当你处于被动角色时，要掷出 6 颗骰子，并把其中点数最低的 3 颗放上银盘；若出现并列，按骰子与银盘的印刷位置远近决定哪颗进入银盘。",
          "单人模式下，作为被动玩家时不能使用普通多人模式里的骰子动作。"
        ]
      },
      {
        id: "tips",
        title: "数字版操作提示",
        bullets: [
          "规则页按纸面规则整理；如果当前数字版某些交互还没完全追上纸规，应以后续实现修正为目标。",
          "对局中仍然建议先在右侧选中骰子或奖励，再回到左侧纸面点击高亮区域落子。",
          "遇到白骰时，多个颜色区可能同时高亮；蓝区还需要同时参考蓝骰与白骰的和数。"
        ]
      }
    ],
    noteTitle: "说明",
    notes: [
      "这份页面现在优先按你提供的规则书内容整理，不再把当前数字实现的临时解释混写进规则本体。",
      "如果当前实现与这份规则页仍有出入，应以规则书为准，并继续修正仓库实现。"
    ]
  },
  en: {
    eyebrow: "Rulebook",
    title: "Ganz Schon Clever Quick Reference",
    subtitle:
      "This in-app rule page is organized from the rulebook text you provided, covering setup, active and passive play, the five colored areas, bonuses, actions, endgame, and solo play.",
    quickFacts: [
      { label: "Goal", value: "Score highest across the five colored zones plus fox bonuses" },
      { label: "Turn shape", value: "Up to three regular active picks, then one passive pick for each other player" },
      { label: "Silver platter", value: "All dice lower than the chosen die move to the silver platter" },
      { label: "White die", value: "Wild for yellow, green, orange, and purple; summed with blue in the blue area" }
    ],
    sections: [
      {
        id: "setup",
        title: "Setup",
        bullets: [
          "Each player gets a score sheet and a pen. Randomly choose a start player, and that player takes all 6 dice.",
          "Round count depends on player count: 4 players play 4 rounds, 3 players play 5 rounds, and 1-2 players play 6 rounds.",
          "At the start of each of the first four rounds, every player gains one round bonus from the tracker; in round 4, each player chooses between the two black bonuses."
        ]
      },
      {
        id: "turn-flow",
        title: "Turn Flow",
        intro: "When you are the active player, you complete your regular three-pick sequence first. Only after the active portion ends do the other players resolve passive picks.",
        steps: [
          "The active player rolls all 6 dice, chooses 1 die, and places it onto one of the 3 die fields on the sheet without changing its number.",
          "That die's color and value are then used to mark the matching colored area on the score sheet. The white die is a wild color.",
          "All dice showing a lower value than the chosen die move to the silver platter. Dice showing an equal or higher value stay available for the next roll.",
          "The active player rolls the remaining available dice a second time and repeats the same process, then rolls a third time and does it once more.",
          "If a high pick in the first or second roll leaves no dice available to reroll, the turn simply ends early with fewer than three regular picks.",
          "After the third regular pick, or whenever no further reroll is possible, every remaining die not placed on the active player's die fields is moved to the silver platter.",
          "Only then do passive players act. Once all passive players are done, the player to the left becomes active. A round ends after every player has been active once."
        ]
      },
      {
        id: "zones",
        title: "The Five Colored Zones",
        bullets: [
          "Yellow: cross out the chosen value in the yellow area. Spaces may be crossed in any order, but each chosen die only marks one space. When a column is completed, circle the starred value at its bottom for points.",
          "Blue: when using a blue die, add the current white die to it. When using the white die as blue, add the current blue die to it. The second die still counts no matter where it is, and blue spaces may be filled in any order.",
          "Green: always work from left to right without skipping spaces. You may mark the next green space as soon as you meet its minimum required value.",
          "Orange: always work from left to right without skipping spaces. Write the chosen orange value into the next space; if that space has a multiplier, multiply before writing it.",
          "Purple: always work from left to right without skipping spaces. Each new number must be higher than the previous one, unless the previous number is 6."
        ]
      },
      {
        id: "silver",
        title: "Silver Platter and Passive Picks",
        bullets: [
          "The silver platter holds the lower dice pushed aside by the active player.",
          "Passive picks do not consume platter dice, so multiple players may choose the same die.",
          "All passive players choose simultaneously, and each passive player may use at most one die.",
          "If a passive player cannot use any die from the silver platter, that player must instead use one die from the active player's die fields. A player may not voluntarily ignore a usable platter die to do this."
        ]
      },
      {
        id: "bonuses",
        title: "Bonuses and Chains",
        bullets: [
          "Bonuses can appear under individual spaces or at the end of completed rows or columns. A bonus under a single space resolves as soon as that space is filled; a row or column bonus resolves only once the entire row or column is completed.",
          "An X bonus immediately grants one extra mark in yellow, blue, or green. In green, it always fills the next available space.",
          "A colored number bonus immediately places that number into the next legal space of the matching area and cannot be saved. The black X from round 4 may only be used in yellow, blue, or green, and the black 6 from round 4 may only be used in orange or purple.",
          "Foxes do not score immediately. At game end, each fox is worth as many points as that player's lowest-scoring colored area. If any colored area scores 0, foxes are worth 0.",
          "If a bonus grants another bonus, resolve the new bonus immediately. Bonus chains are allowed."
        ]
      },
      {
        id: "actions",
        title: "Action Bars",
        bullets: [
          "The two action bars unlock during the game: `Reroll` and `Extra die`. Unlike bonuses, actions may be used immediately or saved for a later turn.",
          "When an action is unlocked, circle the next open space in that action row. When the action is actually used, cross out the first still-circled unused space.",
          "`Reroll action` may only be used by the active player. It rerolls all dice that were just thrown and are still in hand; you cannot keep some and reroll others.",
          "`Extra die action` may only be used at the end of a turn: after the active player has finished regular assignments or after a passive player has made that player's regular pick.",
          "`Extra die action` lets the player choose any of the six dice, including a die already taken by the active player or even the die just taken with the regular action. Multiple extra-die actions may be used in the same turn, but each individual die may be chosen this way only once per turn."
        ]
      },
      {
        id: "scoring",
        title: "Scoring and Endgame",
        bullets: [
          "Yellow scores by completed columns, blue scores by how many blue spaces are marked, green scores from the starred value above the last filled green space, and orange and purple each score the sum of their written numbers.",
          "Fox score equals the number of foxes multiplied by the player's lowest-scoring colored area.",
          "After the last active player finishes the final turn, passive players still resolve that turn, and players may still spend `Extra die actions`. Any unused `Reroll actions` expire.",
          "Highest total score wins. Ties are broken by the highest single-area score. If a winner still cannot be determined, the tied players share the victory."
        ]
      },
      {
        id: "solo",
        title: "Solo Game",
        bullets: [
          "Solo play lasts 6 rounds. The player alternates between being active and passive, taking each role 6 times.",
          "When acting as the passive player in solo mode, roll all 6 dice and place the three lowest dice onto the silver platter. Ties are still broken so that exactly three dice are placed there.",
          "In solo mode, the passive player may not use die actions."
        ]
      },
      {
        id: "tips",
        title: "Digital Play Tips",
        bullets: [
          "This page now follows the printed rules first. If the current digital implementation still behaves differently in some edge cases, the implementation should be fixed toward the rulebook.",
          "During play, it is still easiest to select a die or bonus on the right first and then click a highlighted target on the sheet.",
          "White-die choices may highlight multiple zones at once, and blue still depends on the combined blue-plus-white total."
        ]
      }
    ],
    noteTitle: "Notes",
    notes: [
      "This page now prioritizes the rulebook text you provided instead of mixing implementation shortcuts into the rules themselves.",
      "If the current implementation still disagrees with this page, the printed rulebook should win and the codebase should be corrected afterward."
    ]
  }
};
