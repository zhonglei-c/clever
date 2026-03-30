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
      "这份站内规则页面向正在进行中的对局，优先帮助你快速判断当前该怎么走、五个颜色区怎么填、奖励什么时候触发。",
    quickFacts: [
      { label: "目标", value: "通过五个颜色区与狐狸奖励拿到最高总分" },
      { label: "回合结构", value: "主动玩家最多三次选骰，其他玩家各做一次被动选择" },
      { label: "银盘", value: "比主动所选更小的骰子进入银盘" },
      { label: "白骰", value: "可按当前规则当作任意颜色使用" }
    ],
    sections: [
      {
        id: "turn-flow",
        title: "回合流程",
        intro: "一位玩家成为主动玩家时，先完成主动阶段；主动阶段结束后，其他玩家再进入被动阶段。",
        steps: [
          "主动玩家掷出当前仍可用的骰子。",
          "从结果中选择一个骰子，并把它填入允许的颜色区。",
          "所有点数更小的骰子进入银盘；点数更大或相等的骰子保留给下一次重掷。",
          "如果还没选满三次且仍有骰子可掷，继续主动阶段；否则主动阶段结束。",
          "其他玩家各自从银盘中选择一个骰子，或跳过。",
          "所有人完成后，回合推进到下一位主动玩家。"
        ]
      },
      {
        id: "zones",
        title: "五个颜色区",
        bullets: [
          "Yellow：按骰面数字填写到对应数值格子；同一个数字只能占用版面中有限的对应格子。",
          "Blue：看蓝骰与白骰的和数，把这个和数填入蓝区对应的显式格子。",
          "Green：按阈值轨道顺序推进，当前值必须严格大于下一个阈值。",
          "Orange：按顺序记录数值，当前实现里可以沿轨道持续追加。",
          "Purple：必须严格递增，除非上一格已经是 6。"
        ]
      },
      {
        id: "silver",
        title: "银盘与被动选择",
        bullets: [
          "银盘中的骰子来自主动玩家每次选择后被放到一旁的较小骰子。",
          "被动玩家不会消耗银盘，同一个银盘骰子可以被多个玩家同时选择。",
          "如果当前银盘中的骰子都没有合法落点，可以跳过本次被动选择。"
        ]
      },
      {
        id: "bonuses",
        title: "奖励与连锁",
        bullets: [
          "部分黄区行、黄区对角、蓝区行列会立即产出奖励。",
          "奖励可能带来 wild mark、额外数字、额外骰等效果。",
          "如果页面提示进入奖励解析阶段，先处理奖励，再返回原来的主流程阶段。"
        ]
      },
      {
        id: "scoring",
        title: "计分与终局",
        bullets: [
          "每个颜色区有自己的计分方式，游戏结束时统一汇总。",
          "狐狸会根据最弱颜色区形成额外加分，所以平衡发展通常很重要。",
          "最后一轮结束后，系统会自动生成 standings 和总分排名。"
        ]
      },
      {
        id: "tips",
        title: "数字版操作提示",
        bullets: [
          "先在右侧选中骰子或奖励，再回到左侧纸面点击高亮区域落子。",
          "如果页面提示当前对象没有任何合法落点，请改选别的骰子，或在被动阶段直接跳过。",
          "遇到白骰时，多个颜色区可能同时高亮；黄蓝还会进一步高亮可用格子。"
        ]
      }
    ],
    noteTitle: "说明",
    notes: [
      "这份页面是站内速查版，优先覆盖当前已实现的数字规则与操作路径。",
      "如果纸面原规则与当前实现仍有差异，应以原始规则书为准，随后再回到仓库里修正文档与实现。"
    ]
  },
  en: {
    eyebrow: "Rulebook",
    title: "Ganz Schon Clever Quick Reference",
    subtitle:
      "This in-app rule page is optimized for live play. It helps you decide what to do next, how each colored zone works, and when bonuses resolve.",
    quickFacts: [
      { label: "Goal", value: "Score highest across the five colored zones plus fox bonuses" },
      { label: "Turn shape", value: "Up to three active picks, then one passive pick for each other player" },
      { label: "Silver platter", value: "All dice lower than the chosen die move to the silver platter" },
      { label: "White die", value: "Currently treated as a wildcard color in the digital implementation" }
    ],
    sections: [
      {
        id: "turn-flow",
        title: "Turn Flow",
        intro: "When you are the active player, finish the active phase first. Only after that do the other players resolve their passive picks.",
        steps: [
          "Roll every die that is still available this turn.",
          "Choose one die and place it in a legal zone.",
          "Every die with a lower value moves to the silver platter; higher or equal dice stay available for the next reroll.",
          "If you still have rerolls available and dice left, continue the active phase; otherwise the active phase ends.",
          "Every other player takes one die from the silver platter, or skips.",
          "When everyone is done, advance to the next active player."
        ]
      },
      {
        id: "zones",
        title: "The Five Colored Zones",
        bullets: [
          "Yellow: place the die into a matching value cell; each number only has limited matching cells on the sheet.",
          "Blue: use the sum of the blue die and the white die, then fill the matching explicit blue cell.",
          "Green: progress through the threshold track; the current value must be strictly greater than the next threshold.",
          "Orange: continue filling the track in order; the current implementation appends values along the row.",
          "Purple: values must strictly increase, unless the previous purple value is already 6."
        ]
      },
      {
        id: "silver",
        title: "Silver Platter and Passive Picks",
        bullets: [
          "The silver platter holds the lower dice pushed aside by the active player.",
          "Passive picks do not consume platter dice, so multiple players may choose the same die.",
          "If every platter die is illegal for your sheet state, you may skip your passive pick."
        ]
      },
      {
        id: "bonuses",
        title: "Bonuses and Chains",
        bullets: [
          "Some yellow rows, the yellow diagonal, and blue rows or columns trigger immediate bonuses.",
          "Bonuses may grant wild marks, fixed number marks, extra dice, and follow-up effects.",
          "If the UI enters bonus resolution, finish that bonus first, then the game returns to the previous phase."
        ]
      },
      {
        id: "scoring",
        title: "Scoring and Endgame",
        bullets: [
          "Each colored zone scores differently and the totals are merged at the end.",
          "Foxes reward balanced development because they scale with your weakest colored area.",
          "After the final round, the app automatically generates the final standings."
        ]
      },
      {
        id: "tips",
        title: "Digital Play Tips",
        bullets: [
          "Select a die or bonus on the right first, then click a highlighted target on the sheet.",
          "If the page says the selected object has no legal target, pick a different die or skip when allowed.",
          "White-die choices may highlight multiple zones at once, while yellow and blue also highlight specific legal cells."
        ]
      }
    ],
    noteTitle: "Notes",
    notes: [
      "This page is a fast in-app reference focused on the current digital implementation.",
      "If the original printed rules and the current implementation ever disagree, the printed rulebook should win and the repo should be updated afterward."
    ]
  }
};
