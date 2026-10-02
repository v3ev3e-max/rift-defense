# 애니메이션 전체 파일·코드 점검 (2026-10-01)

래스터 이미지 4112개 중 4112개 디코딩 성공. 오류 0개.

이 보고서는 현재 소스와 파일 기준입니다. 모든 캐릭터의 실제 브라우저 전투 재생 검증을 수행했다는 뜻은 아닙니다. 정지 PNG/WebP여도 연속 프레임이나 스프라이트 시트라면 애니메이션 자산입니다.

## 영웅 44명

대기 전용 고정 프레임은 의도된 정상 동작입니다. 평타 8장, 스킬 몸동작 6장, 상승 6장, 사망 3장, 평타 탄환·명중 각 3장의 로더 경로를 확인했습니다.

누락된 영웅 프레임 파일: 0개. 레이드 idle/attack/skill 시트 누락: 0개.

### 전용 스킬 명중 연속 프레임이 없는 26명

몸동작이 없는 것이 아닙니다. 시전/명중에 단일 effects/{id}/skill.png를 사용하고 확대·투명도로 연출합니다.

- 레이나 (`reina`)
- 아린 (`arin`)
- 카린 (`karin`)
- 세라 (`sera`)
- 노엘 (`noel`)
- 루나 (`luna`)
- 이안 (`ian`)
- 아델라 (`adela`)
- 벨카 (`belka`)
- 세린 (`serin`)
- 카일 (`kyle`)
- 카이론 (`kairon`)
- 테리아 (`theria`)
- 녹시아 (`noxia`)
- 오로라 (`aurora`)
- 아르덴 (`arden`)
- 시온 (`zion`)
- 엘리스 (`elise`)
- 베라 (`vera`)
- 솔라라 (`solara`)
- 셀레스티아 (`celestia`)
- 아이리스 (`iris`)
- 루크 (`rook`)
- 닉스 (`nyx`)
- 시엘 (`ciel`)
- 라온 (`raon`)

### 피격 및 레이드 사망

영웅 44명 모두 전용 피격 연속 프레임 연결이 없습니다. 레이드 hit/death는 idle 시트에 밝기 변화/페이드만 적용합니다. 캠페인 사망 3프레임과 별개입니다.

## 캠페인 적 93개 정의

전부 이동 프레임 경로가 존재합니다. 공격은 근접 attack 또는 원거리 fire를 구분했습니다. brute의 전용 attack은 4지역에서만 연결됩니다. 별도 특수 패턴/페이즈 전환 시퀀스는 일반 캠페인 로더에 없습니다.

### 공격/발사 프레임이 없는 33개 정의

- 균열 보행자 (`crawler`, 시각 ID `crawler`)
- 섬광 추적자 (`runner`, 시각 ID `runner`)
- 중장 방벽체 (`bulwark`, 시각 ID `bulwark`)
- 과속 침식체 (`sprinter`, 시각 ID `sprinter`)
- 균열 집행자 (`elite`, 시각 ID `elite`)
- 초원의 돌진대장 (`named_meadow`, 시각 ID `elite`)
- 해안의 재생체 (`named_coast`, 시각 ID `elite`)
- 수림의 구속자 (`named_autumn`, 시각 ID `elite`)
- 설원의 동상기사 (`named_snow`, 시각 ID `elite`)
- 연구동 포격체 (`named_lab`, 시각 ID `elite`)
- 극저온 교란체 (`named_cold`, 시각 ID `elite`)
- 심연의 흡수자 (`named_abyss`, 시각 ID `elite`)
- 균열 붕괴자 (`named_rift`, 시각 ID `elite`)
- 경계 파괴자 (`ravager`, 시각 ID `ravager`)
- 영하의 군주 (`sovereign`, 시각 ID `sovereign`)
- 폭풍의 심장 (`tempest`, 시각 ID `tempest`)
- 심연의 관측자 (`abyssal`, 시각 ID `abyssal`)
- 녹음의 추적왕 (`verdant_stalker`, 시각 ID `verdant_stalker`)
- 질풍의 거신 (`gale_colossus`, 시각 ID `gale_colossus`)
- 산호 파쇄자 (`coral_mauler`, 시각 ID `coral_mauler`)
- 청해의 레비아탄 (`leviathan`, 시각 ID `leviathan`)
- 가시 여왕 (`thorn_matriarch`, 시각 ID `thorn_matriarch`)
- 고목의 수호신 (`ancient_treant`, 시각 ID `ancient_treant`)
- 빙설 포효수 (`frost_howler`, 시각 ID `frost_howler`)
- 빙하의 폭군 (`glacial_tyrant`, 시각 ID `glacial_tyrant`)
- 보안 집행기 (`security_exarch`, 시각 ID `security_exarch`)
- 반응로 베히모스 (`reactor_behemoth`, 시각 ID `reactor_behemoth`)
- 극저온 사냥기 (`cryo_hunter`, 시각 ID `cryo_hunter`)
- 절대영도 파수체 (`absolute_zero`, 시각 ID `absolute_zero`)
- 위상 수확자 (`phase_reaper`, 시각 ID `phase_reaper`)
- 공허의 천안 (`void_observer`, 시각 ID `void_observer`)
- 균열 처형자 (`rift_executioner`, 시각 ID `rift_executioner`)
- 종말의 균열군주 (`rift_sovereign`, 시각 ID `rift_sovereign`)

### 피격 자세도 없는 77개 정의

균열 보행자 (`crawler`), 섬광 추적자 (`runner`), 공허 거체 (`brute`), 철갑 감시자 (`armored`), 신호 교란자 (`jammer`), 중장 방벽체 (`bulwark`), 과속 침식체 (`sprinter`), 위상 망령 (`phantom`), 균열 집행자 (`elite`), 초원의 돌진대장 (`named_meadow`), 해안의 재생체 (`named_coast`), 수림의 구속자 (`named_autumn`), 설원의 동상기사 (`named_snow`), 연구동 포격체 (`named_lab`), 극저온 교란체 (`named_cold`), 심연의 흡수자 (`named_abyss`), 균열 붕괴자 (`named_rift`), 경계 파괴자 (`ravager`), 영하의 군주 (`sovereign`), 폭풍의 심장 (`tempest`), 심연의 관측자 (`abyssal`), 녹음의 추적왕 (`verdant_stalker`), 질풍의 거신 (`gale_colossus`), 산호 파쇄자 (`coral_mauler`), 청해의 레비아탄 (`leviathan`), 가시 여왕 (`thorn_matriarch`), 고목의 수호신 (`ancient_treant`), 빙설 포효수 (`frost_howler`), 빙하의 폭군 (`glacial_tyrant`), 보안 집행기 (`security_exarch`), 반응로 베히모스 (`reactor_behemoth`), 극저온 사냥기 (`cryo_hunter`), 절대영도 파수체 (`absolute_zero`), 위상 수확자 (`phase_reaper`), 공허의 천안 (`void_observer`), 균열 처형자 (`rift_executioner`), 종말의 균열군주 (`rift_sovereign`), 천공 방위체 (`sky_guard`), 천공 창기수 (`sky_lancer`), 운해 포격기 (`cloud_gunner`), 에테르 치유익 (`aether_mender`), 폭풍의 백인대장 (`named_sky`), 뇌운 와이번 (`storm_wyvern`), 천공의 지배자 (`sky_dominion`), 태양 유적 골렘 (`relic_golem`), 사구 갈퀴수 (`dune_ripper`), 태양궁 사수 (`sun_archer`), 신기루 예언자 (`mirage_oracle`), 황혼의 전쟁사제 (`named_dune`), 사막의 거신 (`sand_colossus`), 태양의 스핑크스 (`solar_sphinx`), 합금 수호체 (`alloy_guard`), 기어 사냥개 (`gear_hound`), 맥동 포탑 (`pulse_turret`), 수복 직조기 (`repair_weaver`), 제철소 백인대장 (`named_machine`), 용광로 감독관 (`forge_overseer`), 기계도시의 신핵 (`machine_god`), 역설 방각체 (`paradox_shell`), 시간 추적자 (`chrono_stalker`), 시대 투사체 (`epoch_caster`), 시간 복원자 (`time_mender`), 시간선 처형자 (`named_time`), 시간 수확자 (`chrono_reaper`), 영겁의 군주 (`aeon_sovereign`), 수정해의 파수장 (`named_crystal`), 수정해 레비아탄 (`crystal_leviathan`), 프리즘 여제 (`prismatic_empress`), 월식의 정원사 (`named_lunar`), 월핵 포식자 (`lunar_devourer`), 월식의 심장 (`eclipse_heart`), 항성 제련장 (`named_stellar`), 별벼림 거신 (`starforged_titan`), 초신성 제련핵 (`supernova_foundry`), 최초 좌표 집행자 (`named_origin`), 인과 수확자 (`causal_reaper`), 원초 균열의 군주 (`origin_sovereign`)

나머지 16개도 피격은 1장 고정 자세입니다. 즉 93개 모두 다중 프레임 피격 시퀀스가 없습니다.

### 지역 사망 시퀀스가 발견되지 않은 18개 정의

영하의 군주 (`sovereign`), 폭풍의 심장 (`tempest`), 녹음의 추적왕 (`verdant_stalker`), 질풍의 거신 (`gale_colossus`), 산호 파쇄자 (`coral_mauler`), 청해의 레비아탄 (`leviathan`), 가시 여왕 (`thorn_matriarch`), 고목의 수호신 (`ancient_treant`), 빙설 포효수 (`frost_howler`), 빙하의 폭군 (`glacial_tyrant`), 보안 집행기 (`security_exarch`), 반응로 베히모스 (`reactor_behemoth`), 극저온 사냥기 (`cryo_hunter`), 절대영도 파수체 (`absolute_zero`), 위상 수확자 (`phase_reaper`), 공허의 천안 (`void_observer`), 균열 처형자 (`rift_executioner`), 종말의 균열군주 (`rift_sovereign`)

기존 보스/엘리트 등은 고정 이미지 페이드로 대체됩니다. 지역별 재사용과 visualId 별칭 때문에 위 숫자는 고유 디자인 수가 아닌 적 정의 수입니다.

## 레이드

- 태양의 스핑크스 / 영겁의 군주: 준비·패턴은 attack 재사용, 사망은 idle 재사용. 전용 보스 탄환 lifecycle 발사 코드도 연결되지 않았습니다.
- 질풍의 거신 / 공허의 천안 / 기계도시의 신핵: idle·prepare·attack·pattern·hit·phase·death 시트 선택 코드가 있습니다.
- 소환체 5종: 단일 WebP 이미지. 전용 이동·공격·피격·사망 프레임 재생이 없습니다.
- 영웅 평타 명중 impact.webp: 파일은 있지만 fly()의 명중 구간은 backgroundImage 교체와 페이드만 실행하고 명중 프레임 순서를 재생하지 않습니다.

## 기타 정지 효과

- 드론 body/projectile/impact/overcharge, 상태 burn/bleed/slow/armor-break, enemy-effects rage/frost/storm/void/disrupt, generated/vfx 7종은 단일 이미지 기반입니다. 이동·회전·확대가 있어도 새 그림을 순서대로 재생하는 애니메이션과는 다릅니다.
- 지속 버프 오라는 BattleScene의 그래픽 원·입자 기반이며, 모든 영웅 전용 이미지 프레임을 갖춘 상태가 아닙니다.
- 캠페인 적 탄환/명중은 지역별 공유 프레임을 사용합니다. 적마다 개별 자산이라는 요구는 충족하지 않습니다.

## 정상적으로 정지여야 하는 이미지

영웅 대기, 초상화, 전신 일러스트, 맵 배경, 장비/메뉴/지휘관 아이콘, 체력·지속시간 게이지는 애니메이션 누락으로 분류하지 않습니다.

## 별도 확인된 모집 연출

등장·뒤집기·SR 충전·SSR 균열·SR 공개·SSR 공개의 6종 × 8프레임 파일이 있으며, RecruitSpritePlayer에서 순서대로 재생합니다.

## 픽셀 검사

영웅 연속 프레임 내 동일 픽셀 중복 발견: 46개 그룹. 이 검사는 프레임 존재/디코딩/중복을 확인하며 동작의 미술적 자연스러움이나 실제 화면 잘림을 보증하지 않습니다.
```json
[
  {
    "hero": "yuria",
    "state": "up",
    "frames": 6,
    "unique": 4
  },
  {
    "hero": "reina",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "arin",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "karin",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "sera",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "noel",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "luna",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "mia",
    "state": "up",
    "frames": 6,
    "unique": 4
  },
  {
    "hero": "ian",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "leon",
    "state": "up",
    "frames": 6,
    "unique": 4
  },
  {
    "hero": "adela",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "neris",
    "state": "up",
    "frames": 6,
    "unique": 4
  },
  {
    "hero": "belka",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "serin",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "kyle",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "livia",
    "state": "up",
    "frames": 6,
    "unique": 4
  },
  {
    "hero": "kairon",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "theria",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "noxia",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "aurora",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "arden",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "hana",
    "state": "up",
    "frames": 6,
    "unique": 4
  },
  {
    "hero": "gaia",
    "state": "up",
    "frames": 6,
    "unique": 4
  },
  {
    "hero": "elise",
    "state": "skill",
    "frames": 6,
    "unique": 5
  },
  {
    "hero": "astra",
    "state": "up",
    "frames": 6,
    "unique": 4
  },
  {
    "hero": "celestia",
    "state": "skill",
    "frames": 6,
    "unique": 5
  },
  {
    "hero": "rhea",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "rhea",
    "state": "up",
    "frames": 6,
    "unique": 5
  },
  {
    "hero": "echo",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "echo",
    "state": "up",
    "frames": 6,
    "unique": 5
  },
  {
    "hero": "meriel",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "meriel",
    "state": "up",
    "frames": 6,
    "unique": 5
  },
  {
    "hero": "selene",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "selene",
    "state": "up",
    "frames": 6,
    "unique": 5
  },
  {
    "hero": "ophilia",
    "state": "attack",
    "frames": 8,
    "unique": 7
  },
  {
    "hero": "ophilia",
    "state": "up",
    "frames": 6,
    "unique": 5
  },
  {
    "hero": "minseo",
    "state": "idle",
    "frames": 3,
    "unique": 1
  },
  {
    "hero": "daeun",
    "state": "idle",
    "frames": 3,
    "unique": 1
  },
  {
    "hero": "iris",
    "state": "idle",
    "frames": 3,
    "unique": 1
  },
  {
    "hero": "rook",
    "state": "idle",
    "frames": 3,
    "unique": 1
  },
  {
    "hero": "freya",
    "state": "idle",
    "frames": 3,
    "unique": 1
  },
  {
    "hero": "valen",
    "state": "idle",
    "frames": 3,
    "unique": 1
  },
  {
    "hero": "nyx",
    "state": "idle",
    "frames": 3,
    "unique": 1
  },
  {
    "hero": "ciel",
    "state": "idle",
    "frames": 3,
    "unique": 1
  },
  {
    "hero": "eir",
    "state": "idle",
    "frames": 3,
    "unique": 1
  },
  {
    "hero": "raon",
    "state": "idle",
    "frames": 3,
    "unique": 1
  }
]
```
