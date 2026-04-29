import type { PendingSheetBonus } from "@clever/game-core";

export function describeBonus(bonus: PendingSheetBonus) {
  switch (bonus.type) {
    case "wild-mark":
      return `万能填写：${formatBonusSource(bonus.source)}`;
    case "extra-die":
      return `额外骰资源：${formatBonusSource(bonus.source)}`;
    case "fox":
      return `狐狸奖励：${formatBonusSource(bonus.source)}`;
    case "reroll":
      return `重投资源：${formatBonusSource(bonus.source)}`;
    case "number-mark":
      return `数字奖励 ${bonus.value}：${formatBonusSource(bonus.source)}`;
    case "orange-number":
      return `橙色数字 ${bonus.value ?? 6}：${formatBonusSource(bonus.source)}`;
    case "purple-number":
      return `紫色数字 ${bonus.value ?? 6}：${formatBonusSource(bonus.source)}`;
    default:
      return "未知奖励";
  }
}

export function isInstantBonus(bonus: PendingSheetBonus) {
  return bonus.type === "extra-die" || bonus.type === "fox" || bonus.type === "reroll";
}

export function formatBonusSource(source: string) {
  if (source === "round-4-black-x") {
    return "第 4 轮黑色 X";
  }

  if (source === "round-4-black-6") {
    return "第 4 轮黑色 6";
  }

  if (source.startsWith("yellow-row-")) {
    return `黄色第 ${source.slice(-1)} 行`;
  }

  if (source === "yellow-diagonal") {
    return "黄色对角线";
  }

  if (source.startsWith("blue-row-")) {
    return `蓝色第 ${source.slice(-1)} 行`;
  }

  if (source.startsWith("blue-column-")) {
    return `蓝色第 ${source.slice(-1)} 列`;
  }

  if (source.startsWith("green-step-")) {
    return `绿色第 ${source.split("-").at(-1)} 格`;
  }

  if (source.startsWith("orange-step-")) {
    return `橙色第 ${source.split("-").at(-1)} 格`;
  }

  if (source.startsWith("purple-step-")) {
    return `紫色第 ${source.split("-").at(-1)} 格`;
  }

  return source;
}
