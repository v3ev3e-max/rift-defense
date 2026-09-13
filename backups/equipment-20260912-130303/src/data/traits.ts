import type { Choice, Build, Tier } from "./types";
import { buildNames } from "./heroes";
const descriptions: Record<Build, string[]> = {
  burn: [
    "불 속성의 연소 중첩과 화염 반응 피해가 강화됩니다.",
    "연소 피해 +65%. 과부하·증발·흑염 반응 피해 추가 증가.",
    "불 속성 반응 범위와 지속 피해가 크게 강화됩니다.",
  ],
  water: [
    "물 속성의 젖음 감속이 강화되고 상태 지속시간이 증가합니다.",
    "전도·증발·침식 반응의 감속과 약화 효과가 강화됩니다.",
    "물 표식 지속시간과 반응 제어력이 크게 증가합니다.",
  ],
  shock: [
    "전기 속성의 감전 축적과 연쇄 타격이 강화됩니다.",
    "전도·과부하·공허 감전의 전이 수와 피해가 증가합니다.",
    "전기 반응 피해와 연쇄 범위가 크게 강화됩니다.",
  ],
  bleed: [
    "어둠 속성의 저주가 강화되어 받는 피해 증가량이 상승합니다.",
    "흑염·침식·공허 감전의 약화 효과가 강화됩니다.",
    "어둠 표식과 저주 피해 증폭이 크게 증가합니다.",
  ],
  crit: [
    "치명 확률 +15%, 치명 피해 +25%.",
    "치명타 시 주변 적에게 추가탄 발사.",
    "치명 확률 +20%, 추가탄 피해 +60%.",
  ],
  blast: [
    "모든 속성 반응 피해와 폭발 반경이 소폭 증가합니다.",
    "반응 폭발 시 파편 2개가 주변 적 타격.",
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
    id: "ranged-overclock",
    name: "원거리 오버클럭",
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
    description: "모든 영웅 공격력 +30%, 사거리 +15% (합산 최대 +1칸).",
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
