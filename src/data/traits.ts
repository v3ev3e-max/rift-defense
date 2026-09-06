import type { Choice, Build, Tier } from "./types";
import { buildNames } from "./heroes";
const descriptions: Record<Build, string[]> = {
  burn: [
    "공격 시 25% 확률로 화상. 4초간 중첩 지속 피해.",
    "화상 피해 +65%. 4중첩 시 화염 폭발.",
    "화염 폭발 반경 확대, 피해 +80%.",
  ],
  shock: [
    "공격 시 25% 확률로 연쇄 번개. 주변 적 2명 전이.",
    "전이 +2회. 감전된 적 25% 감속.",
    "번개 피해 +80%, 감전 지속시간 증가.",
  ],
  bleed: [
    "공격 시 출혈 중첩. 5초간 지속 피해.",
    "출혈 대상 피해 +25%. 치명타 시 2중첩 추가.",
    "출혈 최대 12중첩, 지속 피해 +100%.",
  ],
  crit: [
    "치명 확률 +15%, 치명 피해 +25%.",
    "치명타 시 주변 적에게 추가탄 발사.",
    "치명 확률 +20%, 추가탄 피해 +60%.",
  ],
  blast: [
    "공격 시 20% 확률로 반경 65 폭발.",
    "폭발 시 파편 2개가 주변 적 타격.",
    "처치 시 30% 확률로 연쇄 폭발.",
  ],
  drone: [
    "모든 요원에 지원 드론 1기. 독립 사격.",
    "드론 공속 +35%, 피해 +30%.",
    "드론 4회 사격마다 자폭 공격 후 재출격.",
  ],
};
export const traits: Choice[] = (Object.keys(buildNames) as Build[]).flatMap(
  (build) =>
    descriptions[build].map((description, i) => ({
      id: `${build}-${i + 1}`,
      name: `${buildNames[build]} 프로토콜 ${["I", "II", "III"][i]}`,
      description,
      tier: (["NORMAL", "RARE", "EPIC"] as Tier[])[i],
      build,
      effect: "build",
      value: i + 1,
    })),
);
traits.push(
  {
    id: "supply",
    name: "긴급 보급",
    description: "즉시 GOLD +100. 다음 투자를 준비하세요.",
    tier: "NORMAL",
    effect: "gold",
    value: 100,
  },
  {
    id: "overload",
    name: "과부하",
    description: "모든 원거리 영웅 공격력 +15%.",
    tier: "RARE",
    effect: "ranged",
    value: 0.15,
  },
  {
    id: "repair",
    name: "코어 재구성",
    description: "CORE HP 30 회복.",
    tier: "NORMAL",
    effect: "repair",
    value: 30,
  },
  {
    id: "berserk",
    name: "광전사 프로토콜",
    description: "HP 50% 이하 영웅 공격속도 +30%.",
    tier: "EPIC",
    effect: "berserk",
    value: 0.3,
  },
  {
    id: "ascend",
    name: "차원 초월",
    description: "모든 영웅 공격력 +30%, 사거리 +15%.",
    tier: "LEGENDARY",
    effect: "ascend",
    value: 0.3,
  },
  {
    id: "jackpot",
    name: "JACKPOT",
    description: "이번 전투 공격력 +25%, 공속 +20%, 소환 비용 -15%.",
    tier: "JACKPOT",
    effect: "jackpot",
    value: 1,
  },
);
