"""Read-only raster inventory and decoded frame uniqueness check."""
import json, hashlib
from pathlib import Path
from PIL import Image
root=Path('artifacts/animation-inventory')
catalog=json.loads((root/'catalog.json').read_text(encoding='utf-8'))
errors=[]; dimensions={}; native=[]; duplicates=[]
for path in catalog['images']:
    try:
        with Image.open(path) as image:
            image.load(); dimensions[path]=list(image.size)
            if getattr(image,'n_frames',1)>1: native.append(path)
    except Exception as error: errors.append({'path':path,'error':str(error)})
def pixel_hash(path):
    with Image.open(path) as image:
        return hashlib.sha256(image.convert('RGBA').tobytes()).hexdigest()
for hero in catalog['heroes']:
    for state,paths in hero['groups'].items():
        paths=['public/assets/'+p for p in paths]
        if all(Path(p).exists() for p in paths):
            hashes=[pixel_hash(p) for p in paths]
            if len(set(hashes))<len(hashes): duplicates.append({'hero':hero['id'],'state':state,'frames':len(hashes),'unique':len(set(hashes))})
result={'decoded':len(dimensions),'errors':errors,'nativeAnimatedFiles':native,'heroSequenceDuplicateFrames':duplicates}
(root/'pixels.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# 애니메이션 전체 파일·코드 점검 (2026-10-01)','',f"래스터 이미지 {len(catalog['images'])}개 중 {len(dimensions)}개 디코딩 성공. 오류 {len(errors)}개.",'','이 보고서는 현재 소스와 파일 기준입니다. 모든 캐릭터의 실제 브라우저 전투 재생 검증을 수행했다는 뜻은 아닙니다. 정지 PNG/WebP여도 연속 프레임이나 스프라이트 시트라면 애니메이션 자산입니다.','', '## 영웅 44명','', '대기 전용 고정 프레임은 의도된 정상 동작입니다. 평타 8장, 스킬 몸동작 6장, 상승 6장, 사망 3장, 평타 탄환·명중 각 3장의 로더 경로를 확인했습니다.','',f"누락된 영웅 프레임 파일: {sum(len(h['missing']) for h in catalog['heroes'])}개. 레이드 idle/attack/skill 시트 누락: {sum(len(h['raidMissing']) for h in catalog['heroes'])}개.",'', '### 전용 스킬 명중 연속 프레임이 없는 26명','', '몸동작이 없는 것이 아닙니다. 시전/명중에 단일 effects/{id}/skill.png를 사용하고 확대·투명도로 연출합니다.','']
lines += ['- '+h['name']+' (`'+h['id']+'`)' for h in catalog['heroes'] if h['staticSkillImpact']]
lines += ['', '### 피격 및 레이드 사망','', '영웅 44명 모두 전용 피격 연속 프레임 연결이 없습니다. 레이드 hit/death는 idle 시트에 밝기 변화/페이드만 적용합니다. 캠페인 사망 3프레임과 별개입니다.','', '## 캠페인 적 93개 정의','', '전부 이동 프레임 경로가 존재합니다. 공격은 근접 attack 또는 원거리 fire를 구분했습니다. brute의 전용 attack은 4지역에서만 연결됩니다. 별도 특수 패턴/페이즈 전환 시퀀스는 일반 캠페인 로더에 없습니다.','', '### 공격/발사 프레임이 없는 33개 정의','']
lines += ['- '+e['name']+' (`'+e['id']+'`, 시각 ID `'+e['visual']+'`)' for e in catalog['enemies'] if not e['attack'] and not e['fire']]
lines += ['', '### 피격 자세도 없는 77개 정의','', ', '.join(e['name']+' (`'+e['id']+'`)' for e in catalog['enemies'] if not e['hitPose']), '', '나머지 16개도 피격은 1장 고정 자세입니다. 즉 93개 모두 다중 프레임 피격 시퀀스가 없습니다.','', '### 지역 사망 시퀀스가 발견되지 않은 18개 정의','', ', '.join(e['name']+' (`'+e['id']+'`)' for e in catalog['enemies'] if not e['death']), '', '기존 보스/엘리트 등은 고정 이미지 페이드로 대체됩니다. 지역별 재사용과 visualId 별칭 때문에 위 숫자는 고유 디자인 수가 아닌 적 정의 수입니다.','', '## 레이드','', '- 태양의 스핑크스 / 영겁의 군주: 준비·패턴은 attack 재사용, 사망은 idle 재사용. 전용 보스 탄환 lifecycle 발사 코드도 연결되지 않았습니다.', '- 질풍의 거신 / 공허의 천안 / 기계도시의 신핵: idle·prepare·attack·pattern·hit·phase·death 시트 선택 코드가 있습니다.', '- 소환체 5종: 단일 WebP 이미지. 전용 이동·공격·피격·사망 프레임 재생이 없습니다.', '- 영웅 평타 명중 impact.webp: 파일은 있지만 fly()의 명중 구간은 backgroundImage 교체와 페이드만 실행하고 명중 프레임 순서를 재생하지 않습니다.', '', '## 기타 정지 효과','', '- 드론 body/projectile/impact/overcharge, 상태 burn/bleed/slow/armor-break, enemy-effects rage/frost/storm/void/disrupt, generated/vfx 7종은 단일 이미지 기반입니다. 이동·회전·확대가 있어도 새 그림을 순서대로 재생하는 애니메이션과는 다릅니다.', '- 지속 버프 오라는 BattleScene의 그래픽 원·입자 기반이며, 모든 영웅 전용 이미지 프레임을 갖춘 상태가 아닙니다.', '- 캠페인 적 탄환/명중은 지역별 공유 프레임을 사용합니다. 적마다 개별 자산이라는 요구는 충족하지 않습니다.', '', '## 정상적으로 정지여야 하는 이미지','', '영웅 대기, 초상화, 전신 일러스트, 맵 배경, 장비/메뉴/지휘관 아이콘, 체력·지속시간 게이지는 애니메이션 누락으로 분류하지 않습니다.', '', '## 별도 확인된 모집 연출','', '등장·뒤집기·SR 충전·SSR 균열·SR 공개·SSR 공개의 6종 × 8프레임 파일이 있으며, RecruitSpritePlayer에서 순서대로 재생합니다.', '', '## 픽셀 검사','', f'영웅 연속 프레임 내 동일 픽셀 중복 발견: {len(duplicates)}개 그룹. 이 검사는 프레임 존재/디코딩/중복을 확인하며 동작의 미술적 자연스러움이나 실제 화면 잘림을 보증하지 않습니다.']
if duplicates: lines += ['```json',json.dumps(duplicates,ensure_ascii=False,indent=2),'```']
if errors: lines += ['```json',json.dumps(errors,ensure_ascii=False,indent=2),'```']
Path('docs/animation-inventory-2026-10-01.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
