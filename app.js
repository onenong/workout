// WORKOUT 앱 코드 — index.html에서 분리 (CSP로 인라인 스크립트 실행을 막기 위해)
(() => {
'use strict';

/* ── 기본 값과 도구 ───────────────────────────── */
const CLIENT = 'c' + Math.random().toString(36).slice(2, 10);
const LS_KEY = 'overload-log:v1';
const DEFAULT_SETTINGS = { rest: 90, sound: true };
const REST_OPTS = [0, 60, 90, 120, 180];
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const TABS = ['workout', 'routines', 'protein', 'log', 'progress', 'coach'];

const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const norm = s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
const r1 = n => Math.round(n * 10) / 10;
const r2 = n => Math.round(n * 100) / 100;
const num = v => { if (v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const clampInt = (v, lo, hi, d) => { const n = num(v); return n == null ? d : Math.min(hi, Math.max(lo, Math.round(n))); };
const fmtN = n => String(r2(n));
const fmtK = n => Math.round(n).toLocaleString('ko-KR');
const signed = (n, unit) => (n > 0 ? '+' : n < 0 ? '−' : '±') + fmtN(Math.abs(n)) + (unit || '');
const dcls = n => n > 0 ? 'pos' : n < 0 ? 'neg' : '';
const roundStep = (x, step) => step > 0 ? r2(Math.round(x / step) * step) : r2(Math.round(x * 2) / 2);
const e1rm = (w, r) => (!w || !r) ? 0 : (r === 1 ? w : w * (1 + r / 30));
const pad2 = n => String(n).padStart(2, '0');
const monthKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad2(d.getMonth() + 1); };
const md = ts => { const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); };
const dayLabel = ts => { const d = new Date(ts); return (d.getMonth() + 1) + '.' + pad2(d.getDate()) + ' ' + DOW[d.getDay()]; };
const dayDiff = ts => { const a = new Date(); a.setHours(0, 0, 0, 0); const b = new Date(ts); b.setHours(0, 0, 0, 0); return Math.round((a - b) / 864e5); };
const ago = ts => { const d = dayDiff(ts); return d <= 0 ? '오늘' : d === 1 ? '어제' : d + '일 전'; };
const clock = sec => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return h ? h + ':' + pad2(m) + ':' + pad2(s) : m + ':' + pad2(s); };
const hm = ts => { const d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
const fmtX = x => x === 0.5 ? '½' : x === 1.5 ? '1½' : x === 2.5 ? '2½' : fmtN(x);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const focusLater = id => setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 0);
const isField = el => !!(el && el.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

const ic = d => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
const dot = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="1.3" fill="currentColor" stroke="none"/>';
const ICON = {
  workout: ic('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>'),
  routines: ic('<path d="M9 6.5h11M9 12h11M9 17.5h11"/>' + dot(4.5, 6.5) + dot(4.5, 12) + dot(4.5, 17.5)),
  log: ic('<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8.5 3v4M15.5 3v4M4 10h16"/>'),
  progress: ic('<path d="M4 17l5.5-5.5 4 4L20 9"/><path d="M15 9h5v5"/>'),
  gear: ic('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  x: ic('<path d="M7 7l10 10M17 7L7 17"/>'),
  trash: ic('<path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7"/>'),
  edit: ic('<path d="M4.5 19.5h4l10-10-4-4-10 10z"/><path d="M13 7l4 4"/>'),
  up: ic('<path d="M12 18V6.5M7 11.5l5-5 5 5"/>'),
  down: ic('<path d="M12 6v11.5M7 12.5l5 5 5-5"/>'),
  chev: ic('<path d="M6.5 9.5l5.5 5.5 5.5-5.5"/>'),
  grip: ic(dot(9, 6.5) + dot(15, 6.5) + dot(9, 12) + dot(15, 12) + dot(9, 17.5) + dot(15, 17.5)),
  coach: ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>'),
  protein: ic('<path d="M8.5 3h7v3l1.5 2.5V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8.5L8.5 6z"/><path d="M8.5 6h7M7 12h10"/>'),
  plus: ic('<path d="M12 5.5v13M5.5 12h13"/>')
};

/* ── 코치: 기준표 ─────────────────────────────── */
const DAY = 864e5, WEEK = 7 * DAY;
const MUSCLES = [['chest', '가슴'], ['back', '등'], ['shoulders', '어깨'], ['biceps', '이두'], ['triceps', '삼두'], ['quads', '앞허벅지'], ['posterior', '엉덩이·뒤허벅지'], ['calves', '종아리'], ['core', '코어']];
const MLABEL = Object.fromEntries(MUSCLES);
const DEFAULT_PROFILE = { age: null, height: null };
// 저장소·백업 파일에서 읽은 프로필은 믿지 않고 숫자 범위로만 받는다 (XSS 방지)
function sanitizeProfile(p) {
  const src = p && typeof p === 'object' ? p : {};
  const pick = (v, lo, hi) => { const n = num(v); return n != null && n >= lo && n <= hi ? n : null; };
  const age = pick(src.age, 10, 100), height = pick(src.height, 100, 250);
  return {
    age: age == null ? null : Math.round(age),
    height: height == null ? null : Math.round(height * 10) / 10,
    limits: Array.isArray(src.limits) ? src.limits.filter(x => typeof x === 'string').map(x => x.slice(0, 60)).slice(0, 20) : []
  };
}
const REF_SETS = 10, HIGH_SETS = 20, MAX_EX_SETS = 6;   // 근육당 주 10세트 참고선 [1] · 이미 많은 주간 볼륨 · 운동당 세트 상한
const mLabel = m => MLABEL[m] || '기타';
const GUESS = [
  [/파이크|핸드스탠드|pike|handstand/i, 'shoulders', ['triceps']],
  [/다이아몬드|클로즈 ?그립|diamond/i, 'triceps', ['chest']],
  [/풀업|턱걸이|친업|풀다운|로우|pull.?up|chin.?up|pulldown|\brow\b|\blat\b/i, 'back', ['biceps']],
  [/딥스|dip/i, 'chest', ['triceps', 'shoulders']],
  [/푸시업|팔굽|벤치|체스트|플라이|가슴|push.?up|bench|fly/i, 'chest', ['triceps', 'shoulders']],
  [/데드버그|플랭크|크런치|레그 ?레이즈|복근|코어|싯업|할로우|plank|crunch/i, 'core', []],
  [/레그 ?컬|루마니안|데드|힙|브릿지|굿모닝|햄스트링|둔근|노르딕|rdl|deadlift|hip|leg ?curl|hamstring|glute/i, 'posterior', []],
  [/스쿼트|런지|레그 ?프레스|레그 ?익스텐션|스텝업|스플릿|squat|lunge|leg ?press|leg ?extension|step.?up/i, 'quads', ['posterior']],
  [/숄더|오버헤드 ?프레스|밀리터리|레터럴|사이드 ?레이즈|어깨|press|lateral/i, 'shoulders', ['triceps']],
  [/컬|이두|curl/i, 'biceps', []],
  [/푸시다운|익스텐션|삼두|킥백|pushdown|extension/i, 'triceps', []],
  [/카프|종아리|calf/i, 'calves', []]
];
const EVIDENCE = [
  { t: 'ACSM 저항운동 입장문', src: 'ACSM(Phillips 외), Med Sci Sports Exerc 2026', p: '주요 근육은 주 2회 이상, 근비대는 근육당 주 약 10세트, 근력은 1RM의 80% 안팎으로 운동당 2–3세트를 권해요. 맨몸·홈트도 효과가 있고, 실패까지 하기·머신 대 프리웨이트·복잡한 주기화는 결과를 일관되게 바꾸지 않았어요.', use: '코치 탭에서 근육당 주 10세트를 참고선으로 보여 주고, 루틴 짤 때 원칙에 넣었어요.', u: 'https://acsm.org/resistance-training-guidelines-update-2026/' },
  { t: '주간 볼륨·빈도 용량-반응 메타회귀', src: 'Pelland 외, Sports Med 2026', p: '67개 연구 분석. 겹쳐 쓰이는 근육을 0.5세트로 셀 때 결과를 가장 잘 설명했고, 근비대는 볼륨이 늘수록 수확체감하며 계속 늘었어요. 근력은 주 3–4세트 이후 이득이 작아졌고, 빈도를 늘리는 쪽이 도움이 됐어요.', use: '주간 세트를 셀 때 보조로 쓰인 근육은 0.5세트로 세고, 정체된 운동은 세트를 조금씩 늘리도록 제안해요.', u: 'https://sci-sport.com/en/muscle-hypertrophy-strength-and-volume-how-does-the-relationship-evolve-272/' },
  { t: '실패 근접도 메타회귀', src: 'Robinson 외, Sports Med 2024', p: '55개 연구에서 세트를 실패에 가깝게 끝낼수록 근비대가 컸고, 근력 향상에는 뚜렷한 차이가 없었어요.', use: '루틴 짤 때 원칙으로 세트마다 실패 전 1–3회 남기기를 안내해요.', u: 'https://doi.org/10.1007/s40279-024-02069-2' },
  { t: '무게 대신 횟수로 과부하', src: 'Plotkin 외, PeerJ 2022', p: '훈련 경력자 8주 실험에서 횟수를 늘린 그룹과 무게를 늘린 그룹의 근비대가 비슷했고, 최대근력은 무게를 늘린 쪽이 약간 앞섰어요.', use: '범위 상한 전까지는 +1회, 다 채우면 증량하는 이중 진행을 써요.', u: 'https://peerj.com/articles/14142' },
  { t: '세트 간 휴식 메타분석', src: 'Singer 외, Front Sports Act Living 2024', p: '60초보다 길게 쉬면 근비대에 약간 유리했고, 90초를 넘어서는 추가 차이가 거의 없었어요.', use: '휴식 타이머 기본값이 90초이고, 루틴 편집에서 운동마다 바꿀 수 있어요.', u: 'https://doi.org/10.3389/fspor.2024.1429789' },
  { t: '1주 디로드 실험', src: 'Coleman 외, PeerJ 2024', p: '9주 프로그램 중간에 1주 쉬어도 근비대는 차이가 없었지만, 하체 근력은 계속 훈련한 쪽이 더 늘었어요.', use: '디로드를 정해진 주기로 강제하지 않고, 정체가 여러 근육에 겹칠 때만 세트를 절반으로 줄인 주간을 제안해요.', u: 'https://peerj.com/articles/16777' },
  { t: '개인 맞춤 볼륨 증가', src: 'Scarpelli 외, J Strength Cond Res 2022', p: '훈련 경력자에서 기존에 하던 볼륨보다 20% 늘린 조건이 정해진 고정 볼륨보다 근육이 더 컸어요.', use: '주간 점검에서 제자리인 운동은 세트를 하나 늘려 볼륨을 조금 올리도록 제안해요.', u: 'https://pubmed.ncbi.nlm.nih.gov/32108724/' },
  { t: '에너지 적자와 근성장 메타분석', src: 'Murphy & Koehler, Scand J Med Sci Sports 2021', p: '칼로리 적자는 근력이 아니라 제지방 증가를 방해했고, 하루 약 500kcal 이하 적자에서는 제지방 감소가 나타나지 않았어요.', use: '체중이 주 1% 넘게 빠지거나 골격근량이 줄면 내 몸 카드에서 알려 줘요.', u: 'https://doi.org/10.1111/sms.14075' },
  { t: '단백질 섭취 메타분석', src: 'Morton 외, Br J Sports Med 2018', p: '단백질을 하루 체중 1kg당 약 1.6g보다 더 먹어도 제지방 증가가 더 늘지 않았어요.', use: '단백질 탭의 하루 목표를 기본 체중 1kg당 1.6g으로 계산해요.', u: 'https://bjsm.bmj.com/content/52/6/376' },
  { t: '긴 근육 길이 훈련 체계적 고찰', src: 'Wolf 외, Sports Med Health Sci 2026 (온라인 2025)', p: '근육이 늘어난 구간에서 훈련할 때 근비대가 더 큰 경향이 있었어요. 다만 연구 수가 적고 질이 아직 높지 않아요.', use: '루틴 짤 때 원칙으로 깊은 가동범위를 권해요.', u: 'https://doi.org/10.1016/j.smhs.2025.03.001' },
  { t: '끼니당 단백질 양', src: 'Schoenfeld & Aragon, J Int Soc Sports Nutr 2018', p: '근육을 키우려면 끼니당 체중 1kg당 0.4g씩 하루 4번 이상 나눠 최소 1.6g/kg을 채우고, 많게는 2.2g/kg(끼니당 0.55g/kg)까지를 권했어요.', use: '단백질 탭에서 끼니당 목표를 보여 주고, 하루 목표를 1.6–2.2g/kg 안에서 고를 수 있게 해요.', u: 'https://pubmed.ncbi.nlm.nih.gov/29497353/' }
];

/* ── 단백질: 음식 데이터 ───────────────────────── */
const FOOD_SRC = { mfds: '식약처 식품성분 DB', ex: '대한당뇨병학회 식품교환표', lab: 'ProteinLab 음료 DB (2026.11 확인)', label: '제품 영양 정보', d20: '식약처 식품영양성분 자료집 (2020)', d19: '식약처 외식영양성분자료집 통합본 (2019)' };
const P_FACTORS = [1.6, 1.8, 2, 2.2];
const P_X = [0.5, 1, 1.5, 2, 3];
const P_LIMIT = 8;
const PCATS = [['recent', '자주 먹는'], ['food', '식재료'], ['kr', '한식'], ['cn', '중식'], ['jp', '일식·아시안'], ['we', '양식'], ['bs', '분식'], ['drink', '단백질 음료'], ['powder', '단백질 파우더'], ['mine', '내 음식']];
// c: 분류, s: 1회 기준, q·u: 1회 기준량과 단위(g·ml, 모르면 null), p: 1회 단백질(g)
const FOODS = [
  { k: 'chicken_breast', n: '닭가슴살 (삶은 것)', c: 'food', s: '1팩 100g', q: 100, u: 'g', p: 23.1, src: 'mfds' },
  { k: 'egg', n: '계란 (삶은 것)', c: 'food', s: '1개 50g', q: 50, u: 'g', p: 6.3, src: 'mfds' },
  { k: 'tofu', n: '두부', c: 'food', s: '½모 150g', q: 150, u: 'g', p: 13.5, src: 'mfds' },
  { k: 'milk', n: '우유', c: 'food', s: '1컵 200ml', q: 200, u: 'ml', p: 6.4, src: 'mfds' },
  { k: 'greek_yogurt', n: '그릭요거트 (무지방)', c: 'food', s: '1컵 100g', q: 100, u: 'g', p: 10, src: 'mfds' },
  { k: 'tuna_water', n: '참치캔 (물에 담근 살코기)', c: 'food', s: '100g', q: 100, u: 'g', p: 26, src: 'mfds' },
  { k: 'cheese', n: '가공치즈 (슬라이스)', c: 'food', s: '1장 20g', q: 20, u: 'g', p: 5, src: 'mfds' },
  { k: 'pork_tender', n: '돼지 안심 (구운 것)', c: 'food', s: '100g', q: 100, u: 'g', p: 22.2, src: 'mfds' },
  { k: 'beef_sirloin', n: '소고기 등심 (구운 것)', c: 'food', s: '100g', q: 100, u: 'g', p: 21, src: 'mfds' },
  { k: 'salmon', n: '연어 (생것)', c: 'food', s: '100g', q: 100, u: 'g', p: 20.4, src: 'mfds' },
  { k: 'shrimp', n: '새우 (삶은 것)', c: 'food', s: '100g', q: 100, u: 'g', p: 20.3, src: 'mfds' },
  { k: 'edamame', n: '풋콩·에다마메 (삶은 것)', c: 'food', s: '100g', q: 100, u: 'g', p: 11.9, src: 'mfds' },
  { k: 'oats', n: '오트밀·귀리 (마른 것)', c: 'food', s: '1회 40g', q: 40, u: 'g', p: 5.3, src: 'mfds' },
  { k: 'peanut', n: '땅콩 (볶은 것)', c: 'food', s: '1줌 30g', q: 30, u: 'g', p: 7.7, src: 'mfds' },
  { k: 'almond', n: '아몬드', c: 'food', s: '1줌 30g', q: 30, u: 'g', p: 6.4, src: 'mfds' },
  { k: 'pumpkin_seed', n: '호박씨 (볶은 것)', c: 'food', s: '1줌 30g', q: 30, u: 'g', p: 9.1, src: 'mfds' },
  { k: 'black_bean', n: '검정콩 (마른 것)', c: 'food', s: '30g', q: 30, u: 'g', p: 10.9, src: 'mfds' },
  { k: 'lentil', n: '렌틸콩 (마른 것)', c: 'food', s: '50g', q: 50, u: 'g', p: 12.5, src: 'mfds' },
  { k: 'lean_meat', n: '소·돼지 살코기 (기름 적은 부위)', c: 'food', s: '100g (생것)', q: 100, u: 'g', p: 20, src: 'ex' },
  { k: 'chicken_skin', n: '닭고기 (껍질 포함)', c: 'food', s: '100g (생것)', q: 100, u: 'g', p: 20, src: 'ex' },
  { k: 'pork_belly', n: '삼겹살', c: 'food', s: '100g (생것)', q: 100, u: 'g', p: 20, src: 'ex' },
  { k: 'white_fish', n: '흰살생선 (동태·광어 등)', c: 'food', s: '100g', q: 100, u: 'g', p: 16, src: 'ex' },
  { k: 'mackerel', n: '고등어·꽁치·갈치', c: 'food', s: '100g', q: 100, u: 'g', p: 16, src: 'ex' },
  { k: 'squid', n: '오징어', c: 'food', s: '100g', q: 100, u: 'g', p: 16, src: 'ex' },
  { k: 'tuna_oil', n: '참치캔 (일반, 기름 포함)', c: 'food', s: '1캔 100g', q: 100, u: 'g', p: 16, src: 'ex' },
  { k: 'fishcake', n: '어묵 (튀긴 것)', c: 'food', s: '50g', q: 50, u: 'g', p: 8, src: 'ex' },
  { k: 'crab_stick', n: '게맛살', c: 'food', s: '50g', q: 50, u: 'g', p: 8, src: 'ex' },
  { k: 'ham', n: '햄', c: 'food', s: '40g', q: 40, u: 'g', p: 8, src: 'ex' },
  { k: 'sausage', n: '소시지·런천미트', c: 'food', s: '40g', q: 40, u: 'g', p: 8, src: 'ex' },
  { k: 'natto', n: '낫토', c: 'food', s: '1팩 40g', q: 40, u: 'g', p: 8, src: 'ex' },
  { k: 'soft_tofu', n: '순두부', c: 'food', s: '200g', q: 200, u: 'g', p: 8, src: 'ex' },
  { k: 'silken_tofu', n: '연두부', c: 'food', s: '150g', q: 150, u: 'g', p: 8, src: 'ex' },
  { k: 'anchovy', n: '멸치 (마른 것)', c: 'food', s: '15g', q: 15, u: 'g', p: 8, src: 'ex' },
  { k: 'shellfish', n: '조개·굴·게살', c: 'food', s: '70g', q: 70, u: 'g', p: 8, src: 'ex' },
  { k: 'rice', n: '밥 (쌀밥·잡곡밥)', c: 'food', s: '1공기 210g', q: 210, u: 'g', p: 6, src: 'ex' },
  { k: 'bread', n: '식빵', c: 'food', s: '1장 35g', q: 35, u: 'g', p: 2, src: 'ex' },
  { k: 'noodle', n: '국수 (삶은 것)', c: 'food', s: '1인분 270g', q: 270, u: 'g', p: 6, src: 'ex' },
  { k: 'sweet_potato', n: '고구마', c: 'food', s: '1개 140g', q: 140, u: 'g', p: 4, src: 'ex' },
  { k: 'potato', n: '감자', c: 'food', s: '1개 140g', q: 140, u: 'g', p: 2, src: 'ex' },
  { k: 'rice_cake', n: '떡', c: 'food', s: '100g', q: 100, u: 'g', p: 4, src: 'ex' },
  { k: 'lowfat_milk', n: '저지방 우유', c: 'food', s: '1컵 200ml', q: 200, u: 'ml', p: 6, src: 'ex' },
  { k: 'soy_milk', n: '두유', c: 'food', s: '1컵 200ml', q: 200, u: 'ml', p: 6, src: 'ex' },
  { k: 'ramen', n: '라면 (신라면 1봉 기준)', c: 'food', s: '1봉 120g', q: 120, u: 'g', p: 10, src: 'label' },
  // 메뉴 1인분: 식약처 식품영양성분 자료집(2020)·외식영양성분자료집 통합본(2019), NOFAT 음식 분류에서 옮김. k = 자료 코드
  { k: 'D018204', n: '비빔밥', c: 'kr', s: '1인분 450g', q: 450, u: 'g', p: 30.9, src: 'd20' },
  { k: 'D018197', n: '돌솥비빔밥', c: 'kr', s: '1인분 380g', q: 380, u: 'g', p: 20.5, src: 'd20' },
  { k: 'D018219', n: '육회비빔밥', c: 'kr', s: '1인분 300g', q: 300, u: 'g', p: 19.2, src: 'd20' },
  { k: 'D018222', n: '제육덮밥', c: 'kr', s: '1인분 470g', q: 470, u: 'g', p: 44.3, src: 'd20' },
  { k: 'D018203', n: '불고기덮밥', c: 'kr', s: '1인분 400g', q: 400, u: 'g', p: 26.4, src: 'd20' },
  { k: 'D018216', n: '오징어덮밥', c: 'kr', s: '1인분 360g', q: 360, u: 'g', p: 25.9, src: 'd20' },
  { k: 'D018193', n: '낙지덮밥', c: 'kr', s: '1인분 350g', q: 350, u: 'g', p: 20.6, src: 'd20' },
  { k: 'D000261', n: '회덮밥', c: 'kr', s: '1인분 500g', q: 500, u: 'g', p: 30.2, src: 'd19' },
  { k: 'D018192', n: '김치볶음밥', c: 'kr', s: '1인분 330g', q: 330, u: 'g', p: 17.6, src: 'd20' },
  { k: 'D018212', n: '순대국밥', c: 'kr', s: '1인분 900g', q: 900, u: 'g', p: 28.6, src: 'd20' },
  { k: 'D000213', n: '돼지국밥', c: 'kr', s: '1인분 1200g', q: 1200, u: 'g', p: 66.4, src: 'd19' },
  { k: 'D000230', n: '소고기국밥', c: 'kr', s: '1인분 700g', q: 700, u: 'g', p: 21.8, src: 'd19' },
  { k: 'D018234', n: '콩나물국밥', c: 'kr', s: '1인분 780g', q: 780, u: 'g', p: 11.3, src: 'd20' },
  { k: 'D018239', n: '현미밥', c: 'kr', s: '1공기 230g', q: 230, u: 'g', p: 7.1, src: 'd20' },
  { k: 'D018461', n: '전복죽', c: 'kr', s: '1인분 400g', q: 400, u: 'g', p: 7.3, src: 'd20' },
  { k: 'D018457', n: '닭죽', c: 'kr', s: '1인분 400g', q: 400, u: 'g', p: 10.7, src: 'd20' },
  { k: 'D000385', n: '김치찌개', c: 'kr', s: '1인분 400g', q: 400, u: 'g', p: 15.1, src: 'd19' },
  { k: 'D018500', n: '참치김치찌개', c: 'kr', s: '1인분 300g', q: 300, u: 'g', p: 10.8, src: 'd20' },
  { k: 'D018480', n: '된장찌개', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 6.8, src: 'd20' },
  { k: 'D018492', n: '순두부찌개', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 9.1, src: 'd20' },
  { k: 'D018487', n: '부대찌개', c: 'kr', s: '1인분 600g', q: 600, u: 'g', p: 35.2, src: 'd20' },
  { k: 'D018501', n: '청국장찌개', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 10.1, src: 'd20' },
  { k: 'D018504', n: '콩비지찌개', c: 'kr', s: '1인분 400g', q: 400, u: 'g', p: 26.9, src: 'd20' },
  { k: 'D018477', n: '동태찌개', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 12.2, src: 'd20' },
  { k: 'D018467', n: '감자탕', c: 'kr', s: '1인분 530g', q: 530, u: 'g', p: 33.4, src: 'd20' },
  { k: 'D018475', n: '닭볶음탕', c: 'kr', s: '1인분 300g', q: 300, u: 'g', p: 35.7, src: 'd20' },
  { k: 'D018493', n: '알탕', c: 'kr', s: '1인분 520g', q: 520, u: 'g', p: 33.1, src: 'd20' },
  { k: 'D000076', n: '소고기 샤브샤브', c: 'kr', s: '1인분 600g', q: 600, u: 'g', p: 29.1, src: 'd19' },
  { k: 'D018053', n: '갈비탕', c: 'kr', s: '1인분 670g', q: 670, u: 'g', p: 57, src: 'd20' },
  { k: 'D018083', n: '설렁탕', c: 'kr', s: '1인분 500g', q: 500, u: 'g', p: 21.3, src: 'd20' },
  { k: 'D018056', n: '곰탕', c: 'kr', s: '1인분 600g', q: 600, u: 'g', p: 20.6, src: 'd20' },
  { k: 'D018079', n: '삼계탕', c: 'kr', s: '1인분 900g', q: 900, u: 'g', p: 96.1, src: 'd20' },
  { k: 'D018065', n: '닭곰탕', c: 'kr', s: '1인분 650g', q: 650, u: 'g', p: 48.8, src: 'd20' },
  { k: 'D018067', n: '도가니탕', c: 'kr', s: '1인분 500g', q: 500, u: 'g', p: 41.8, src: 'd20' },
  { k: 'D018099', n: '육개장', c: 'kr', s: '1인분 440g', q: 440, u: 'g', p: 16.2, src: 'd20' },
  { k: 'D018077', n: '뼈해장국', c: 'kr', s: '1인분 800g', q: 800, u: 'g', p: 25.6, src: 'd20' },
  { k: 'D018085', n: '소고기미역국', c: 'kr', s: '1그릇 400g', q: 400, u: 'g', p: 7.4, src: 'd20' },
  { k: 'D018076', n: '북엇국', c: 'kr', s: '1그릇 400g', q: 400, u: 'g', p: 15.6, src: 'd20' },
  { k: 'D018160', n: '떡국', c: 'kr', s: '1인분 700g', q: 700, u: 'g', p: 24, src: 'd20' },
  { k: 'D000037', n: '만둣국', c: 'kr', s: '1인분 700g', q: 700, u: 'g', p: 21.4, src: 'd19' },
  { k: 'D018502', n: '추어탕', c: 'kr', s: '1인분 350g', q: 350, u: 'g', p: 11.3, src: 'd20' },
  { k: 'D018476', n: '대구 매운탕', c: 'kr', s: '1인분 600g', q: 600, u: 'g', p: 27, src: 'd20' },
  { k: 'D000461', n: '해물탕', c: 'kr', s: '1인분 600g', q: 600, u: 'g', p: 39.8, src: 'd19' },
  { k: 'D018033', n: '삼겹살구이', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 45.1, src: 'd20' },
  { k: 'D018039', n: '소불고기', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 32.8, src: 'd20' },
  { k: 'D018027', n: '돼지불고기', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 29.7, src: 'd20' },
  { k: 'D018025', n: '돼지갈비구이', c: 'kr', s: '1인분 300g', q: 300, u: 'g', p: 84.7, src: 'd20' },
  { k: 'D000007', n: '닭갈비', c: 'kr', s: '1인분 400g', q: 400, u: 'g', p: 45.9, src: 'd19' },
  { k: 'D018288', n: '제육볶음', c: 'kr', s: '1인분 250g', q: 250, u: 'g', p: 30.4, src: 'd20' },
  { k: 'D000281', n: '오삼불고기', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 25.6, src: 'd19' },
  { k: 'D018516', n: '돼지고기 수육 (보쌈)', c: 'kr', s: '1인분 300g', q: 300, u: 'g', p: 59.6, src: 'd20' },
  { k: 'D018523', n: '족발', c: 'kr', s: '1인분 250g', q: 250, u: 'g', p: 65.1, src: 'd20' },
  { k: 'D018517', n: '소갈비찜', c: 'kr', s: '1인분 300g', q: 300, u: 'g', p: 21.8, src: 'd20' },
  { k: 'D018515', n: '돼지갈비찜', c: 'kr', s: '1인분 300g', q: 300, u: 'g', p: 39.9, src: 'd20' },
  { k: 'D018514', n: '닭찜', c: 'kr', s: '1인분 300g', q: 300, u: 'g', p: 37.1, src: 'd20' },
  { k: 'D000027', n: '훈제오리', c: 'kr', s: '1회 250g', q: 250, u: 'g', p: 43.1, src: 'd19' },
  { k: 'D018384', n: '육회', c: 'kr', s: '1회 150g', q: 150, u: 'g', p: 14.9, src: 'd20' },
  { k: 'D018018', n: '고등어구이', c: 'kr', s: '1회 200g', q: 200, u: 'g', p: 47.6, src: 'd20' },
  { k: 'D018017', n: '갈치구이', c: 'kr', s: '1회 200g', q: 200, u: 'g', p: 43.1, src: 'd20' },
  { k: 'D018034', n: '삼치구이', c: 'kr', s: '1회 200g', q: 200, u: 'g', p: 42.8, src: 'd20' },
  { k: 'D018044', n: '조기구이', c: 'kr', s: '1회 180g', q: 180, u: 'g', p: 34.8, src: 'd20' },
  { k: 'D018429', n: '고등어조림', c: 'kr', s: '1회 100g', q: 100, u: 'g', p: 11.2, src: 'd20' },
  { k: 'D018279', n: '오징어볶음', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 19.7, src: 'd20' },
  { k: 'D018247', n: '낙지볶음', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 11.5, src: 'd20' },
  { k: 'D000285', n: '주꾸미볶음', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 18.3, src: 'd19' },
  { k: 'D018521', n: '아귀찜', c: 'kr', s: '1인분 200g', q: 200, u: 'g', p: 13.4, src: 'd20' },
  { k: 'D000074', n: '물회', c: 'kr', s: '1인분 700g', q: 700, u: 'g', p: 34.4, src: 'd19' },
  { k: 'D018435', n: '돼지고기 장조림', c: 'kr', s: '1회 100g', q: 100, u: 'g', p: 15.6, src: 'd20' },
  { k: 'D000342', n: '동그랑땡', c: 'kr', s: '1회 150g', q: 150, u: 'g', p: 19.6, src: 'd19' },
  { k: 'D018402', n: '계란말이', c: 'kr', s: '1회 100g', q: 100, u: 'g', p: 17.2, src: 'd20' },
  { k: 'D018403', n: '계란후라이', c: 'kr', s: '1개 60g', q: 60, u: 'g', p: 9.4, src: 'd20' },
  { k: 'D018405', n: '두부부침', c: 'kr', s: '1회 100g', q: 100, u: 'g', p: 10.9, src: 'd20' },
  { k: 'D018263', n: '멸치볶음', c: 'kr', s: '1회 50g', q: 50, u: 'g', p: 19.7, src: 'd20' },
  { k: 'D018417', n: '해물파전', c: 'kr', s: '1회 150g', q: 150, u: 'g', p: 8.2, src: 'd20' },
  { k: 'D018401', n: '김치전', c: 'kr', s: '1회 150g', q: 150, u: 'g', p: 7.6, src: 'd20' },
  { k: 'D018183', n: '칼국수', c: 'kr', s: '1인분 700g', q: 700, u: 'g', p: 23.1, src: 'd20' },
  { k: 'D018170', n: '바지락칼국수', c: 'kr', s: '1인분 700g', q: 700, u: 'g', p: 24, src: 'd20' },
  { k: 'D000142', n: '닭칼국수', c: 'kr', s: '1인분 900g', q: 900, u: 'g', p: 42.2, src: 'd19' },
  { k: 'D018167', n: '물냉면', c: 'kr', s: '1인분 700g', q: 700, u: 'g', p: 13.8, src: 'd20' },
  { k: 'D018173', n: '비빔냉면', c: 'kr', s: '1인분 500g', q: 500, u: 'g', p: 28.3, src: 'd20' },
  { k: 'D018178', n: '잔치국수', c: 'kr', s: '1인분 700g', q: 700, u: 'g', p: 13.5, src: 'd20' },
  { k: 'D018172', n: '비빔국수', c: 'kr', s: '1인분 500g', q: 500, u: 'g', p: 15.1, src: 'd20' },
  { k: 'D018184', n: '콩국수', c: 'kr', s: '1인분 800g', q: 800, u: 'g', p: 31.2, src: 'd20' },
  { k: 'D018164', n: '막국수', c: 'kr', s: '1인분 600g', q: 600, u: 'g', p: 34.8, src: 'd20' },
  { k: 'D018180', n: '짜장면', c: 'cn', s: '1인분 600g', q: 600, u: 'g', p: 16.1, src: 'd20' },
  { k: 'D018155', n: '간짜장', c: 'cn', s: '1인분 500g', q: 500, u: 'g', p: 25.6, src: 'd20' },
  { k: 'D018181', n: '짬뽕', c: 'cn', s: '1인분 800g', q: 800, u: 'g', p: 22.3, src: 'd20' },
  { k: 'D000154', n: '삼선짬뽕', c: 'cn', s: '1인분 900g', q: 900, u: 'g', p: 39.6, src: 'd19' },
  { k: 'D018224', n: '짬뽕밥', c: 'cn', s: '1인분 900g', q: 900, u: 'g', p: 28.8, src: 'd20' },
  { k: 'D018223', n: '짜장밥', c: 'cn', s: '1인분 470g', q: 470, u: 'g', p: 20.1, src: 'd20' },
  { k: 'D018221', n: '잡채밥', c: 'cn', s: '1인분 550g', q: 550, u: 'g', p: 22.1, src: 'd20' },
  { k: 'D000245', n: '잡탕밥', c: 'cn', s: '1인분 750g', q: 750, u: 'g', p: 44.1, src: 'd19' },
  { k: 'D018202', n: '볶음밥', c: 'cn', s: '1인분 350g', q: 350, u: 'g', p: 19.5, src: 'd20' },
  { k: 'D018205', n: '새우볶음밥', c: 'cn', s: '1인분 370g', q: 370, u: 'g', p: 23.3, src: 'd20' },
  { k: 'D018546', n: '탕수육', c: 'cn', s: '1회 200g', q: 200, u: 'g', p: 27.2, src: 'd20' },
  { k: 'D018533', n: '깐풍기', c: 'cn', s: '1회 150g', q: 150, u: 'g', p: 18.9, src: 'd20' },
  { k: 'D000072', n: '라조기', c: 'cn', s: '1회 200g', q: 200, u: 'g', p: 20.7, src: 'd19' },
  { k: 'D000070', n: '난자완스', c: 'cn', s: '1회 200g', q: 200, u: 'g', p: 21.6, src: 'd19' },
  { k: 'D000229', n: '모둠초밥', c: 'jp', s: '1인분 300g', q: 300, u: 'g', p: 25.4, src: 'd19' },
  { k: 'D000237', n: '연어초밥', c: 'jp', s: '1인분 250g', q: 250, u: 'g', p: 18.9, src: 'd19' },
  { k: 'D000228', n: '광어초밥', c: 'jp', s: '1인분 300g', q: 300, u: 'g', p: 27.1, src: 'd19' },
  { k: 'D018218', n: '유부초밥', c: 'jp', s: '1인분 200g', q: 200, u: 'g', p: 11.6, src: 'd20' },
  { k: 'D000256', n: '캘리포니아롤', c: 'jp', s: '1인분 300g', q: 300, u: 'g', p: 12.3, src: 'd19' },
  { k: 'D000236', n: '연어롤', c: 'jp', s: '1인분 300g', q: 300, u: 'g', p: 18.6, src: 'd19' },
  { k: 'D018176', n: '우동', c: 'jp', s: '1인분 800g', q: 800, u: 'g', p: 14.3, src: 'd20' },
  { k: 'D018171', n: '볶음우동', c: 'jp', s: '1인분 300g', q: 300, u: 'g', p: 8.4, src: 'd20' },
  { k: 'D018166', n: '메밀국수 (소바)', c: 'jp', s: '1인분 350g', q: 350, u: 'g', p: 11, src: 'd20' },
  { k: 'D018537', n: '등심돈까스', c: 'jp', s: '1인분 200g', q: 200, u: 'g', p: 33.8, src: 'd20' },
  { k: 'D000474', n: '안심돈까스', c: 'jp', s: '1인분 200g', q: 200, u: 'g', p: 33.3, src: 'd19' },
  { k: 'D000479', n: '치즈돈까스', c: 'jp', s: '1인분 250g', q: 250, u: 'g', p: 42, src: 'd19' },
  { k: 'D018233', n: '카레라이스', c: 'jp', s: '1인분 480g', q: 480, u: 'g', p: 14.9, src: 'd20' },
  { k: 'D018215', n: '오므라이스', c: 'jp', s: '1인분 400g', q: 400, u: 'g', p: 26, src: 'd20' },
  { k: 'D000246', n: '장어덮밥', c: 'jp', s: '1인분 400g', q: 400, u: 'g', p: 30.1, src: 'd19' },
  { k: 'D018048', n: '치킨데리야끼', c: 'jp', s: '1인분 340g', q: 340, u: 'g', p: 56.2, src: 'd20' },
  { k: 'D000156', n: '쌀국수', c: 'jp', s: '1인분 600g', q: 600, u: 'g', p: 15.6, src: 'd19' },
  { k: 'D018326', n: '햄버거', c: 'we', s: '1개 200g', q: 200, u: 'g', p: 25.7, src: 'd20' },
  { k: 'D018308', n: '불고기버거', c: 'we', s: '1개 200g', q: 200, u: 'g', p: 27.8, src: 'd20' },
  { k: 'D018320', n: '치킨버거', c: 'we', s: '1개 200g', q: 200, u: 'g', p: 24.9, src: 'd20' },
  { k: 'D000304', n: '치즈피자', c: 'we', s: '1회 200g', q: 200, u: 'g', p: 31.4, src: 'd19' },
  { k: 'D000309', n: '페퍼로니피자', c: 'we', s: '1회 200g', q: 200, u: 'g', p: 29.4, src: 'd19' },
  { k: 'D000297', n: '불고기피자', c: 'we', s: '1회 200g', q: 200, u: 'g', p: 27.4, src: 'd19' },
  { k: 'D018322', n: '콤비네이션피자', c: 'we', s: '1회 200g', q: 200, u: 'g', p: 21.4, src: 'd20' },
  { k: 'D000172', n: '토마토 스파게티', c: 'we', s: '1인분 500g', q: 500, u: 'g', p: 24.4, src: 'd19' },
  { k: 'D000171', n: '크림 스파게티', c: 'we', s: '1인분 400g', q: 400, u: 'g', p: 21.8, src: 'd19' },
  { k: 'D018028', n: '등심스테이크', c: 'we', s: '1인분 200g', q: 200, u: 'g', p: 60.4, src: 'd20' },
  { k: 'D018040', n: '안심스테이크', c: 'we', s: '1인분 200g', q: 200, u: 'g', p: 69.6, src: 'd20' },
  { k: 'D018051', n: '함박스테이크', c: 'we', s: '1인분 200g', q: 200, u: 'g', p: 24.2, src: 'd20' },
  { k: 'D018547', n: '후라이드치킨', c: 'we', s: '1회 200g', q: 200, u: 'g', p: 35.5, src: 'd20' },
  { k: 'D000475', n: '양념치킨', c: 'we', s: '1회 200g', q: 200, u: 'g', p: 35.5, src: 'd19' },
  { k: 'D018528', n: '간장치킨', c: 'we', s: '1회 200g', q: 200, u: 'g', p: 20.5, src: 'd20' },
  { k: 'D018545', n: '치킨너겟', c: 'we', s: '1회 150g', q: 150, u: 'g', p: 22.5, src: 'd20' },
  { k: 'D018299', n: '닭가슴살 샌드위치', c: 'we', s: '1개 230g', q: 230, u: 'g', p: 28, src: 'd20' },
  { k: 'D018328', n: '햄치즈 샌드위치', c: 'we', s: '1개 240g', q: 240, u: 'g', p: 21.1, src: 'd20' },
  { k: 'D000299', n: '참치 샌드위치', c: 'we', s: '1개 250g', q: 250, u: 'g', p: 23.3, src: 'd19' },
  { k: 'D018342', n: '닭가슴살 샐러드', c: 'we', s: '1회 150g', q: 150, u: 'g', p: 10.8, src: 'd20' },
  { k: 'D018373', n: '참치 샐러드', c: 'we', s: '1회 150g', q: 150, u: 'g', p: 16.2, src: 'd20' },
  { k: 'D018411', n: '스크램블에그', c: 'we', s: '1회 110g', q: 110, u: 'g', p: 13, src: 'd20' },
  { k: 'D018307', n: '베이글', c: 'we', s: '1개 120g', q: 120, u: 'g', p: 12, src: 'd20' },
  { k: 'D018190', n: '김밥', c: 'bs', s: '1줄 230g', q: 230, u: 'g', p: 11.1, src: 'd20' },
  { k: 'D018227', n: '참치김밥', c: 'bs', s: '1줄 250g', q: 250, u: 'g', p: 17.5, src: 'd20' },
  { k: 'D018232', n: '치즈김밥', c: 'bs', s: '1줄 270g', q: 270, u: 'g', p: 16.9, src: 'd20' },
  { k: 'D000231', n: '소고기김밥', c: 'bs', s: '1줄 250g', q: 250, u: 'g', p: 16, src: 'd19' },
  { k: 'D018196', n: '돈까스김밥', c: 'bs', s: '1줄 320g', q: 320, u: 'g', p: 18.4, src: 'd20' },
  { k: 'D018228', n: '참치마요 삼각김밥', c: 'bs', s: '1회 200g', q: 200, u: 'g', p: 11.9, src: 'd20' },
  { k: 'D018256', n: '떡볶이', c: 'bs', s: '1인분 180g', q: 180, u: 'g', p: 6.3, src: 'd20' },
  { k: 'D018257', n: '라볶이', c: 'bs', s: '1인분 200g', q: 200, u: 'g', p: 5.7, src: 'd20' },
  { k: 'D018159', n: '계란라면', c: 'bs', s: '1그릇 550g', q: 550, u: 'g', p: 14.4, src: 'd20' },
  { k: 'D000169', n: '치즈라면', c: 'bs', s: '1그릇 600g', q: 600, u: 'g', p: 16.8, src: 'd19' },
  { k: 'D018182', n: '쫄면', c: 'bs', s: '1인분 550g', q: 550, u: 'g', p: 17.7, src: 'd20' },
  { k: 'D000417', n: '순대', c: 'bs', s: '1인분 300g', q: 300, u: 'g', p: 19.6, src: 'd19' },
  { k: 'D018156', n: '고기만두', c: 'bs', s: '1인분 220g', q: 220, u: 'g', p: 27.2, src: 'd20' },
  { k: 'D018158', n: '김치만두', c: 'bs', s: '1인분 220g', q: 220, u: 'g', p: 22.5, src: 'd20' },
  { k: 'D018157', n: '군만두', c: 'bs', s: '1인분 220g', q: 220, u: 'g', p: 15.5, src: 'd20' },
  { k: 'D018535', n: '닭강정', c: 'bs', s: '1회 200g', q: 200, u: 'g', p: 23.7, src: 'd20' },
  { k: 'D000009', n: '닭꼬치', c: 'bs', s: '1개 70g', q: 70, u: 'g', p: 11.6, src: 'd19' },
  { k: 'D018093', n: '어묵국', c: 'bs', s: '1그릇 350g', q: 350, u: 'g', p: 5.2, src: 'd20' },
  { k: 'selex_profit', n: '셀렉스 프로핏', c: 'drink', s: '1개 250ml', q: 250, u: 'ml', p: 20, src: 'lab' },
  { k: 'hymune_active', n: '하이뮨 프로틴 밸런스 액티브', c: 'drink', s: '1개 250ml', q: 250, u: 'ml', p: 20, src: 'lab' },
  { k: 'danbaek_coffee', n: '더단백 드링크 (커피·초콜릿 등)', c: 'drink', s: '1개 250ml', q: 250, u: 'ml', p: 20, src: 'lab' },
  { k: 'takefit_max', n: '테이크핏 맥스', c: 'drink', s: '1개 250ml', q: 250, u: 'ml', p: 24, src: 'lab' },
  { k: 'newcare_all', n: '뉴케어 올프로틴', c: 'drink', s: '1개 245ml', q: 245, u: 'ml', p: 25, src: 'lab' },
  { k: 'mymil', n: '마이밀 퓨로틴', c: 'drink', s: '1개 250ml', q: 250, u: 'ml', p: 20, src: 'lab' },
  { k: 'ultive', n: '얼티브 프로틴', c: 'drink', s: '1개 250ml', q: 250, u: 'ml', p: 21, src: 'lab' },
  { k: 'selex_whey', n: '셀렉스 웨이프로핏 (아메리카노)', c: 'drink', s: '1개 330ml', q: 330, u: 'ml', p: 20, src: 'lab' },
  { k: 'hymune_dark', n: '하이뮨 프로틴 밸런스 액티브 (다크초코)', c: 'drink', s: '1개 330ml', q: 330, u: 'ml', p: 31, src: 'lab' },
  { k: 'seven_ljh', n: '세븐일레븐 이정후 프로틴', c: 'drink', s: '1개 330ml', q: 330, u: 'ml', p: 33, src: 'lab' },
  { k: 'myprotein_drink', n: '마이프로틴 프로틴 드링크', c: 'drink', s: '1개 340ml', q: 340, u: 'ml', p: 28, src: 'lab' },
  { k: 'labnosh', n: '랩노쉬 프로틴 드링크 퍼펙트', c: 'drink', s: '1개 350ml', q: 350, u: 'ml', p: 27, src: 'lab' },
  { k: 'danbaek_dark', n: '더단백 드링크 (다크초코)', c: 'drink', s: '1개 330ml', q: 330, u: 'ml', p: 35, src: 'lab' },
  { k: 'danbaek_double', n: '더단백 드링크 (더블초코)', c: 'drink', s: '1개 350ml', q: 350, u: 'ml', p: 40, src: 'lab' },
  { k: 'newcare_41', n: '뉴케어 올프로틴 41g', c: 'drink', s: '1개 350ml', q: 350, u: 'ml', p: 41, src: 'lab' },
  { k: 'takefit_monster', n: '테이크핏 몬스터 (고소한맛·초코바나나)', c: 'drink', s: '1개 350ml', q: 350, u: 'ml', p: 45, src: 'lab' },
  { k: 'takefit_monster_s', n: '테이크핏 몬스터 (딸기맛)', c: 'drink', s: '1개 350ml', q: 350, u: 'ml', p: 47, src: 'lab' },
  { k: 'selex_wild', n: '셀렉스 프로핏 스포츠 와일드 초코', c: 'drink', s: '1개 350ml', q: 350, u: 'ml', p: 45, src: 'lab' },
  { k: 'hymune_ultra', n: '하이뮨 울트라', c: 'drink', s: '1개 400ml', q: 400, u: 'ml', p: 49, src: 'lab' },
  { k: 'labnosh_max', n: '랩노쉬 프로틴 드링크 맥스', c: 'drink', s: '1개 400ml', q: 400, u: 'ml', p: 52, src: 'lab' },
  { k: 'takefit_extreme', n: '테이크핏 익스트림', c: 'drink', s: '1개 450ml', q: 450, u: 'ml', p: 60, src: 'lab' },
  { k: 'danbaek_water', n: '더단백 워터 프로틴', c: 'drink', s: '1개 400ml', q: 400, u: 'ml', p: 25, src: 'lab' },
  { k: 'newcare_water', n: '뉴케어 올프로틴 워터', c: 'drink', s: '1개 350ml', q: 350, u: 'ml', p: 20, src: 'lab' },
  { k: 'takefit_pro', n: '테이크핏 프로 (워터)', c: 'drink', s: '1개 500ml', q: 500, u: 'ml', p: 25, src: 'lab' },
  { k: 'on_gold', n: '옵티멈 골드 스탠다드 100% 웨이', c: 'powder', s: '1스쿱 31g', q: 31, u: 'g', p: 24, src: 'label' },
  { k: 'mp_impact', n: '마이프로틴 임팩트 웨이 프로틴', c: 'powder', s: '1회 25g', q: 25, u: 'g', p: 21, src: 'label' },
  { k: 'hymune_powder', n: '하이뮨 프로틴 밸런스 (분말)', c: 'powder', s: '1회 38g', q: 38, u: 'g', p: 20, src: 'label' },
  { k: 'selex_core', n: '셀렉스 코어프로틴 프로·락토프리 (분말)', c: 'powder', s: '1회 38g', q: 38, u: 'g', p: 20, src: 'label' },
  { k: 'whey_generic', n: '웨이 프로틴 (일반, 단백질 73%)', c: 'powder', s: '1스쿱 30g', q: 30, u: 'g', p: 22, src: 'label' }
];
const FOOD_MAP = Object.fromEntries(FOODS.map(f => [f.k, f]));
const DEFAULT_NUTRI = { factor: 1.6, target: null, custom: [] };

/* ── 상태 ─────────────────────────────────────── */
const state = { exercises: [], routines: [], settings: Object.assign({}, DEFAULT_SETTINGS), months: {}, live: null, profile: clone(DEFAULT_PROFILE), body: [], coach: null, nutri: clone(DEFAULT_NUTRI), pmonths: {} };
const ui = { tab: 'workout', ready: false, slow: false, loadErr: null, writeErr: false, sync: 'loading', progEx: null, progPart: null, metric: null, addEx: false, addExName: '', addExType: 'weight', sheet: null, chart: null, xs: null, calMonth: null, calDay: null, bd: null,
  pday: null, pcat: null, pq: '', pmore: false, pa: null, pc: null, pk: null, pt: null, se: null, plOpen: new Set(), rtOpen: new Set() };
const store = { mode: 'loading', db: null, uid: null };
let edit = null;

let _sess = null, _hist = null;
const invalidate = () => { _sess = null; _hist = null; };
function sessions() {
  if (!_sess) _sess = Object.values(state.months).flat().filter(s => s && Number.isFinite(s.start) && Array.isArray(s.entries)).sort((a, b) => b.start - a.start);
  return _sess;
}
function hist(exId) {
  if (!_hist) {
    _hist = new Map();
    for (const s of sessions()) for (const e of s.entries) {
      const sets = (e.sets || []).filter(x => x && x.r > 0);
      if (!sets.length) continue;
      if (!_hist.has(e.exId)) _hist.set(e.exId, []);
      _hist.get(e.exId).push({ start: s.start, sets, bw: Number.isFinite(s.bw) ? s.bw : null });
    }
  }
  return _hist.get(exId) || [];
}
const exById = id => state.exercises.find(x => x.id === id) || null;
const exByName = n => state.exercises.find(x => norm(x.name) === norm(n)) || null;
const exName = (id, fb) => (exById(id) || {}).name || fb || '이름 없는 운동';
const itemTarget = it => ({ sets: it.sets, repMin: it.repMin, repMax: it.repMax });
const TYPES = ['weight', 'bw', 'cardio'];
const typeOf = v => TYPES.includes(v) ? v : 'weight';
const isCardio = t => t === 'cardio';
const CARDIO_RE = /러닝|런닝|트레드밀|달리기|조깅|걷기|사이클|자전거|스피닝|로잉|천국의 ?계단|스텝밀|계단 ?오르기|일립티컬|크로스 ?트레이너|줄넘기|수영|유산소|treadmill|running|jogging|cycling|bike|rowing|elliptical|stair/i;
const looksCardio = n => CARDIO_RE.test(String(n || '')) && !/런지|lunge/i.test(String(n || ''));
const CARDIO_TGT = { sets: 1, repMin: 20, repMax: 20 };
// 그 시점의 몸무게: 그날까지의 마지막 측정, 그 전 측정이 없으면 첫 측정
function bodyW(ts) {
  const B = bodySorted().filter(b => b.w != null); if (!B.length) return null;
  let v = B[0].w; for (const b of B) { if (b.at <= ts + DAY / 2) v = b.w; else break; }
  return v;
}
const sessBW = s => Number.isFinite(s.bw) ? s.bw : bodyW(s.start);
const kmOf = sets => sets.reduce((a, x) => a + (x.w || 0) * (x.r || 0) / 60, 0);

/* ── 점진적 과부하 규칙 ───────────────────────── */
const topW = sets => sets.reduce((m, s) => Math.max(m, s.w || 0), 0);
const repsAt = (sets, W) => sets.reduce((a, s) => a + ((s.w || 0) === W ? (s.r || 0) : 0), 0);

// 이중 진행(double progression): 모든 세트가 범위 상한 → 증량, 아니면 같은 무게로 세트마다 +1회.
// 같은 무게에서 3회 연속 총 횟수가 늘지 않으면 정체(무게 운동은 10% 디로드).
function recommend(ex, tgt, history) {
  if (isCardio(ex.type)) {   // 유산소: 지난번 속도·시간을 그대로 채움
    const last = (history || []).map(h => (h.sets || []).filter(x => x.r > 0)).find(ss => ss.length), n = Math.max(1, tgt.sets | 0);
    return { kind: 'cardio', w: last ? (last[0].w || null) : null, reps: Array.from({ length: n }, (_, i) => last && last[i] ? last[i].r : tgt.repMin) };
  }
  const S = Math.max(1, tgt.sets | 0), a = tgt.repMin, b = Math.max(tgt.repMin, tgt.repMax);
  const inc = Number(ex.inc) || 0, bw = ex.type === 'bw';
  const fill = v => Array.from({ length: S }, () => v);
  const valid = (history || []).map(h => (h.sets || []).filter(s => s.r > 0)).filter(ss => ss.length);
  if (!valid.length) return { kind: 'new', w: bw ? 0 : null, reps: fill(a) };
  const last = valid[0], W = topW(last);
  const work = last.filter(s => (s.w || 0) === W);
  if (work.length >= S && work.slice(0, S).every(s => s.r >= b)) return { kind: 'up', w: r2(W + inc), reps: fill(a), from: W };
  const next = Array.from({ length: S }, (_, i) => {
    const prev = work[i] ? work[i].r : work[work.length - 1].r;
    return Math.min(b, Math.max(a, prev + 1));
  });
  if (valid.length >= 3) {
    const h3 = valid.slice(0, 3);
    if (h3.every(ss => topW(ss) === W) && repsAt(h3[0], W) <= repsAt(h3[2], W)) {
      if (!bw && W > 0) return { kind: 'deload', w: roundStep(W * 0.9, inc), reps: fill(a), from: W };
      return { kind: 'stall', w: W, reps: next };
    }
  }
  return { kind: 'reps', w: W, reps: next };
}

function wLabel(w, type) { return type === 'bw' ? (w > 0 ? '+' + fmtN(w) + 'kg' : '맨몸') : (w == null ? '—' : fmtN(w) + 'kg'); }
function setsText(sets, type) {
  if (!sets || !sets.length) return '';
  if (isCardio(type)) { const km = r1(kmOf(sets)); return sets.map(x => (x.w ? fmtN(x.w) + 'km/h ' : '') + fmtN(x.r) + '분').join(' · ') + (km ? ' · ' + fmtN(km) + 'km' : ''); }
  if (sets.every(s => (s.w || 0) === (sets[0].w || 0))) return wLabel(sets[0].w || 0, type) + ' × ' + sets.map(s => s.r).join('·');
  return sets.map(s => (type === 'bw' ? (s.w > 0 ? '+' + fmtN(s.w) : '맨몸') : fmtN(s.w || 0)) + '×' + s.r).join(' · ');
}
function recView(rec, type, inc, tgt) {
  const bw = type === 'bw', reps = (rec.reps || []).join('·');
  if (rec.kind === 'cardio') return { k: '유산소', v: (rec.w ? fmtN(rec.w) + 'km/h · ' : '') + rec.reps.reduce((a, b) => a + b, 0) + '분', note: '' };
  switch (rec.kind) {
    case 'new': return { k: '첫 기록', v: (bw ? '맨몸 ' : '') + tgt.repMin + '–' + tgt.repMax + '회', note: bw ? '' : '목표 횟수를 채울 수 있는 무게로 기준을 잡아요.' };
    case 'up':
      if (!inc) return { k: '▲ 상한 달성', v: '범위 올리기', note: '모든 세트가 목표 상한에 닿았어요. 횟수 범위를 올리거나 더 어려운 동작으로 바꿔요.' };
      return bw ? { k: '▲ 가중', v: '+' + fmtN(rec.w) + 'kg × ' + reps, note: '가중이 어렵다면 더 어려운 동작으로 바꿔도 돼요.' }
                : { k: '▲ 증량', v: fmtN(rec.w) + 'kg × ' + reps, note: '' };
    case 'deload': return { k: '▼ 디로드', v: fmtN(rec.w) + 'kg × ' + reps, note: '같은 무게에서 3번 연속 횟수가 늘지 않았어요. 10% 낮춰 다시 쌓아요.' };
    case 'stall': return { k: '정체', v: wLabel(rec.w, type) + ' × ' + reps, note: '3번 연속 총 횟수가 그대로예요. 세트 사이 휴식을 늘리거나 횟수 범위를 조정해 봐요.' };
    default: return { k: '+1회', v: wLabel(rec.w, type) + ' × ' + reps, note: '' };
  }
}
function recChip(rec, type, inc, tgt) {
  const v = recView(rec, type, inc, tgt);
  return '<span class="rec" data-k="' + rec.kind + '"><b>' + esc(v.k) + '</b><span class="nv">' + esc(v.v) + '</span></span>';
}

function makeEntry(ex, tgt, it) {
  const rec = recommend(ex, tgt, hist(ex.id));
  return {
    exId: ex.id, name: ex.name, type: ex.type, inc: Number(ex.inc) || 0, target: Object.assign({}, tgt), rec,
    rest: (it && it.rest) || 0, rir: (it && it.rir) || '',
    sets: rec.reps.map(tr => ({ w: rec.w, r: null, tr, done: false }))
  };
}
const restLabel = sec => sec % 60 === 0 ? (sec / 60) + '분' : sec > 60 ? Math.floor(sec / 60) + '분 ' + (sec % 60) + '초' : sec + '초';
// 맨몸 운동 볼륨은 (체중 + 가중) × 횟수, 유산소는 시간·거리로 따로 셈
function liveTotals(L) {
  let done = 0, total = 0, reps = 0, vol = 0, cmin = 0;
  const bw = bodyW(L.start) || 0;
  for (const e of L.entries) for (const s of e.sets) {
    total++;
    if (!s.done) continue;
    done++;
    if (isCardio(e.type)) { cmin += s.r || 0; continue; }
    reps += s.r || 0; vol += ((e.type === 'bw' ? bw : 0) + (s.w || 0)) * (s.r || 0);
  }
  return { done, total, reps, vol, cmin };
}
function sessStats(s) {
  let sets = 0, reps = 0, vol = 0, bwReps = 0, cmin = 0, km = 0;
  const bw = sessBW(s) || 0;
  for (const e of s.entries || []) for (const x of e.sets || []) {
    if (isCardio(e.type)) { cmin += x.r; km += (x.w || 0) * x.r / 60; continue; }
    sets++; reps += x.r;
    if (e.type === 'bw') { bwReps += x.r; vol += (bw + (x.w || 0)) * x.r; } else vol += (x.w || 0) * x.r;
  }
  return { sets, reps, vol, bwReps, cmin, km: r1(km), min: Math.max(1, Math.round(((s.end || s.start) - s.start) / 60000)) };
}
function findPRs(entry, prev) {
  if (!prev.length || isCardio(entry.type)) return [];
  const all = prev.flatMap(h => h.sets), out = [];
  const mw = topW(entry.sets), pmw = topW(all);
  if (entry.type === 'bw') {
    if (mw > pmw) out.push({ exId: entry.exId, label: '가중 +' + fmtN(mw) + 'kg' });
    const mr = Math.max(...entry.sets.map(s => s.r)), pmr = Math.max(...all.map(s => s.r));
    if (mr > pmr) out.push({ exId: entry.exId, label: '최고 ' + mr + '회' });
  } else {
    if (mw > pmw) out.push({ exId: entry.exId, label: '최고 무게 ' + fmtN(mw) + 'kg' });
    const be = Math.max(...entry.sets.map(s => e1rm(s.w, s.r))), pbe = Math.max(...all.map(s => e1rm(s.w, s.r)));
    if (r1(be) > r1(pbe)) out.push({ exId: entry.exId, label: '추정 1RM ' + r1(be) + 'kg' });
  }
  return out;
}
function nextRoutineId() {
  if (state.routines.length < 2) return null;
  let best = null, bestT = Infinity;
  for (const rt of state.routines) {
    const last = sessions().find(s => s.routineId === rt.id);
    const t = last ? last.start : -1;
    if (t < bestT) { bestT = t; best = rt.id; }
  }
  return best;
}
function trackedExercises() {
  const seen = new Map();
  for (const s of sessions()) for (const e of s.entries) {
    if (seen.has(e.exId) || !(e.sets || []).length) continue;
    const ex = exById(e.exId);
    seen.set(e.exId, { id: e.exId, name: ex ? ex.name : (e.name || '운동'), type: ex ? ex.type : (e.type || 'weight') });
  }
  return [...seen.values()];
}
function seriesFor(H, metric, type) {
  return H.slice().reverse().map(h => {
    const ss = h.sets, base = type === 'bw' ? ((h.bw != null ? h.bw : bodyW(h.start)) || 0) : 0; let v;
    switch (metric) {
      case 'e1rm': v = Math.max(...ss.map(s => e1rm(base + (s.w || 0), s.r))); break;
      case 'km': v = kmOf(ss); break;
      case 'min': v = ss.reduce((a, s) => a + s.r, 0); break;
      case 'speed': { const m = ss.reduce((a, s) => a + s.r, 0); v = m ? kmOf(ss) / (m / 60) : 0; break; }
      case 'top': case 'added': v = topW(ss); break;
      case 'vol': v = ss.reduce((a, s) => a + (s.w || 0) * s.r, 0); break;
      case 'reps': v = Math.max(...ss.map(s => s.r)); break;
      default: v = ss.reduce((a, s) => a + s.r, 0);
    }
    return { t: h.start, v: r1(v), sets: ss };
  });
}

/* ── 저장 ─────────────────────────────────────── */
const refApp = () => store.db.doc('data/users/' + store.uid + '/app');
const refLive = () => store.db.doc('data/users/' + store.uid + '/live');
const colMonths = () => refApp().collection('months');
const colProtein = () => refApp().collection('protein');
const writers = new Map();
let lsTimer = null, liveTimer = null;

function setSync(s) { ui.sync = s; renderSync(); }
function renderSync() {
  const el = document.getElementById('sync'); if (!el) return;
  const txt = { loading: '불러오는 중', saving: '저장 중', saved: '저장됨', local: '이 기기에 저장', memory: '저장 안 됨', error: '저장 실패' };
  el.dataset.s = ui.sync;
  document.getElementById('sync-t').textContent = txt[ui.sync] || '';
}
function writeLocalNow() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ v: 1, exercises: state.exercises, routines: state.routines, settings: state.settings, profile: state.profile, body: state.body, coach: state.coach, nutri: state.nutri, months: state.months, pmonths: state.pmonths, live: state.live }));
    store.mode = 'local'; setSync('local');
  } catch (e) { store.mode = 'memory'; setSync('memory'); }
}
function saveLocal() { clearTimeout(lsTimer); lsTimer = setTimeout(() => { lsTimer = null; writeLocalNow(); }, 250); }

function persistDoc(key, refFn, bodyFn) {
  if (store.mode === 'loading') return;
  if (store.mode !== 'cloud') { saveLocal(); return; }
  let w = writers.get(key);
  if (!w) { w = { busy: false, again: false }; writers.set(key, w); }
  if (w.busy) { w.again = true; return; }
  w.busy = true; setSync('saving');
  (async () => {
    do {
      w.again = false;
      const body = clone(Object.assign({}, bodyFn(), { by: CLIENT, at: Date.now() }));
      try { await refFn().set(body); ui.writeErr = false; }
      catch (err) {
        let e = err;
        if (e && e.code === 'unavailable') {
          await sleep(500 + Math.random() * 900);
          try { await refFn().set(body); ui.writeErr = false; continue; } catch (e2) { e = e2; }
        }
        writeFailed(e);
      }
    } while (w.again);
    w.busy = false;
    if (![...writers.values()].some(x => x.busy)) setSync(ui.writeErr ? 'error' : 'saved');
  })();
}
function writeFailed(e) {
  ui.writeErr = true;
  const c = e && e.code;
  if (c === 'quota_exceeded') toast('저장 공간이 가득 찼어요. 오래된 기록을 지운 뒤 다시 저장해 주세요.');
  else if (c === 'invalid_argument') toast('이 화면에서는 기록을 저장할 수 없어요. 내 계정으로 열었는지 확인해 주세요.');
  else if (c === 'revoked' || c === 'not_granted') toast('저장 권한이 사라졌어요. 페이지를 다시 열어 주세요.');
  else toast('저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
}
const saveApp = () => persistDoc('app', refApp, () => ({ v: 1, exercises: state.exercises, routines: state.routines, settings: state.settings, profile: state.profile, body: state.body, coach: state.coach, nutri: state.nutri }));
const saveMonth = k => persistDoc('m:' + k, () => colMonths().doc(k), () => ({ sessions: state.months[k] || [] }));
const savePMonth = k => persistDoc('p:' + k, () => colProtein().doc(k), () => ({ days: state.pmonths[k] || {} }));
function saveLive(debounced) {
  clearTimeout(liveTimer); liveTimer = null;
  if (debounced) {
    if (store.mode === 'cloud') setSync('saving');
    liveTimer = setTimeout(() => { liveTimer = null; saveLive(false); }, 700);
    return;
  }
  persistDoc('live', refLive, () => ({ session: state.live }));
}
function flush() {
  if (liveTimer) { clearTimeout(liveTimer); liveTimer = null; saveLive(false); }
  if (lsTimer) { clearTimeout(lsTimer); lsTimer = null; writeLocalNow(); }
}

// 코치 점검 상태(이전 버전의 프로그램 기록이 있으면 점검 날짜·디로드·변경 기록만 이어받음)
function coachFrom(c) {
  if (!c || typeof c !== 'object') return null;
  const t = v => Number.isFinite(v) ? v : 0;
  return { lastReview: t(c.lastReview), lastDeload: t(c.lastDeload), deloadUntil: t(c.deloadUntil), changed: c.changed && typeof c.changed === 'object' ? clone(c.changed) : {},
    log: (Array.isArray(c.log) ? c.log : []).filter(e => e && Number.isFinite(e.at)).slice(0, 30).map(e => ({ at: e.at, items: (Array.isArray(e.items) ? e.items : []).map(x => String(x).slice(0, 120)).slice(0, 8) })) };
}
function applyData(d) {
  state.exercises = Array.isArray(d.exercises) ? clone(d.exercises) : [];
  state.routines = Array.isArray(d.routines) ? clone(d.routines) : [];
  state.routines.forEach(r => { if (r) delete r.coach; });
  state.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings ? clone(d.settings) : {});
  state.profile = sanitizeProfile(d.profile);
  state.body = Array.isArray(d.body) ? clone(d.body).filter(b => b && Number.isFinite(b.at)) : [];
  state.coach = coachFrom(d.coach || d.program);
  state.nutri = Object.assign(clone(DEFAULT_NUTRI), d.nutri && typeof d.nutri === 'object' ? clone(d.nutri) : {});
  if (!Array.isArray(state.nutri.custom)) state.nutri.custom = [];
}
async function boot() {
  render();
  let db = null, user = null;
  try {
    const c = window.claude;
    if (c && typeof c.use === 'function') [db, user] = await Promise.all([c.use('db'), c.use('user')]);
  } catch (e) { db = null; user = null; }
  let id = null;
  if (db && user) { try { id = await user.id(); } catch (e) { id = null; } }
  if (db && id) startCloud(db, id); else startLocal();
}
function startLocal() {
  let ok = true;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      applyData(d);
      state.months = d.months && typeof d.months === 'object' ? d.months : {};
      state.pmonths = d.pmonths && typeof d.pmonths === 'object' ? d.pmonths : {};
      state.live = d.live || null;
    }
  } catch (e) { ok = false; }
  store.mode = ok ? 'local' : 'memory';
  invalidate(); ui.ready = true; setSync(store.mode); render();
  if (state.live) keepAwake(true);
}
function startCloud(db, id) {
  store.db = db; store.uid = id; store.mode = 'cloud';
  const got = { app: false, live: false, months: false, protein: false };
  const slowT = setTimeout(() => { if (!ui.ready) { ui.slow = true; render(); } }, 10000);
  const settle = () => {
    if (ui.ready || !got.app || !got.live || !got.months || !got.protein) return;
    clearTimeout(slowT); ui.ready = true; ui.slow = false; invalidate(); setSync('saved'); render();
    if (state.live) keepAwake(true);
  };
  const fail = err => {
    clearTimeout(slowT);
    ui.loadErr = (err && err.code) || 'unavailable';
    ui.ready = true; setSync('error'); render();
  };
  try {
    refApp().onSnapshot(snap => {
      if (snap.exists) {
        const d = snap.data() || {};
        if (d.by !== CLIENT) { applyData(d); invalidate(); if (ui.ready) requestRender(); }
      }
      got.app = true; settle();
    }, fail);
    refLive().onSnapshot(snap => {
      if (snap.exists) {
        const d = snap.data() || {};
        if (d.by !== CLIENT) { state.live = d.session ? clone(d.session) : null; if (ui.ready) requestRender(); }
      }
      got.live = true; settle();
    }, fail);
    colMonths().onSnapshot(qs => {
      let changed = false;
      for (const ch of qs.docChanges()) {
        if (ch.type === 'removed') { delete state.months[ch.doc.id]; changed = true; continue; }
        const d = ch.doc.data();
        if (!d || d.by === CLIENT) continue;
        state.months[ch.doc.id] = Array.isArray(d.sessions) ? clone(d.sessions) : [];
        changed = true;
      }
      if (changed) { invalidate(); if (ui.ready) requestRender(); }
      got.months = true; settle();
    }, fail);
    colProtein().onSnapshot(qs => {
      let changed = false;
      for (const ch of qs.docChanges()) {
        if (ch.type === 'removed') { delete state.pmonths[ch.doc.id]; changed = true; continue; }
        const d = ch.doc.data();
        if (!d || d.by === CLIENT) continue;
        state.pmonths[ch.doc.id] = d.days && typeof d.days === 'object' ? clone(d.days) : {};
        changed = true;
      }
      if (changed && ui.ready) requestRender();
      got.protein = true; settle();
    }, fail);
  } catch (e) { fail(e); }
}

/* ── 렌더 ─────────────────────────────────────── */
let pendingRender = false;
const typingInMain = () => { const a = document.activeElement; return isField(a) && !!a.closest('#main'); };
function requestRender() { if (typingInMain()) { pendingRender = true; return; } render(); }
document.addEventListener('focusout', () => {
  if (!pendingRender) return;
  setTimeout(() => { if (pendingRender && !typingInMain()) render(); }, 0);
});

function render() {
  pendingRender = false;
  const act = document.activeElement && document.activeElement.id;
  renderTabs(); renderSync(); renderRest();
  const main = document.getElementById('main');
  let html = ui.loadErr ? '<p class="banner" role="alert">기록 저장소에 연결하지 못했어요. 지금 입력하는 내용은 저장되지 않을 수 있으니 페이지를 다시 열어 주세요.</p>' : '';
  if (!ui.ready) html += viewLoading();
  else if (ui.tab === 'workout') html += state.live ? viewSession() : viewToday();
  else if (ui.tab === 'routines') html += viewRoutines();
  else if (ui.tab === 'protein') html += viewProtein();
  else if (ui.tab === 'log') html += viewLog();
  else if (ui.tab === 'coach') html += viewCoach();
  else html += viewProgress();
  main.innerHTML = html;
  if (ui.ready && ui.tab === 'progress') mountChart();
  if (state.live) { ensureTicker(); updateClock(); }
  if (act) { const el = document.getElementById(act); if (el && main.contains(el) && el !== document.activeElement) el.focus({ preventScroll: true }); }
}
function renderTabs() {
  const cur = ui.tab === 'routines' ? 'workout' : ui.tab;
  document.querySelectorAll('.tab').forEach(b => { if (b.dataset.tab === cur) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const d = document.getElementById('live-dot'); if (d) d.hidden = !state.live;
}
const head = (eyebrow, title) => '<div class="head"><div class="eyebrow">' + eyebrow + '</div><h1 class="page-title">' + title + '</h1></div>';

function viewLoading() {
  return head('불러오는 중', '오늘 할 루틴') + '<div class="card empty"><h2>' + (ui.slow ? '저장소 연결이 늦어지고 있어요' : '루틴과 지난 기록을 불러오고 있어요') + '</h2><p>' + (ui.slow ? '연결되면 자동으로 이어서 불러와요.' : '루틴이 있으면 여기에 운동별 다음 목표가 떠요. 처음이라면 루틴부터 만들면 돼요.') + '</p></div>';
}
function rulesHTML() {
  return '<details class="rules"><summary>다음 목표는 이렇게 정해져요</summary><ul>' +
    '<li><span class="rec" data-k="reps"><b>+1회</b></span><p>지난번과 같은 무게로 세트마다 1회씩 더 해요.</p></li>' +
    '<li><span class="rec" data-k="up"><b>▲ 증량</b></span><p>모든 세트가 횟수 범위 상한을 채우면 증량 단위만큼 올리고 하한부터 다시 쌓아요. 맨몸 운동은 가중으로 올려요.</p></li>' +
    '<li><span class="rec" data-k="deload"><b>▼ 디로드</b></span><p>같은 무게에서 3번 연속 총 횟수가 늘지 않으면 10% 낮춰 다시 시작해요. 맨몸 운동은 정체로만 알려 줘요.</p></li>' +
    '</ul><p class="muted fine">추정 1RM은 Epley 공식, 무게 × (1 + 횟수 ÷ 30)으로 계산해요.</p></details>';
}
function viewToday() {
  let h = head(dayLabel(Date.now()), '오늘 할 루틴');
  if (!state.routines.length) {
    return h + proteinMini() + '<div class="card empty"><h2>아직 루틴이 없어요</h2><p>루틴에 운동과 세트·횟수 범위를 넣어 두면, 운동할 때 지난 기록을 보고 다음 목표를 자동으로 잡아 줘요.</p><div class="row"><button class="btn primary" data-act="preset-add">추천 루틴 넣기</button><button class="btn" data-act="new-routine">직접 만들기</button><button class="btn" data-act="start-free">루틴 없이 시작</button></div></div>' + rulesHTML();
  }
  const nextId = nextRoutineId(), C = state.coach, now = Date.now();
  if (C && C.deloadUntil > now) h += '<p class="notice">디로드 주간이에요. ' + md(C.deloadUntil) + '까지 루틴 세트가 절반으로 줄어요.</p>';
  else { const R = review(now); if (R.due && R.props.length) h += '<button class="notice" type="button" data-act="goto" data-v="coach">주간 점검이 준비됐어요. 코치 탭에서 내 루틴 조정을 확인해 봐요 →</button>'; }
  h += proteinMini();
  h += '<div class="stack">' + state.routines.map(rt => {
    const last = sessions().find(s => s.routineId === rt.id);
    const rows = rt.items.map((it, i) => planRow(rt, it, i)).join('');
    const open = ui.rtOpen.has(rt.id), bid = 'rb-' + rt.id;
    return '<article class="card rt"><h2 class="rt-t"><button class="rt-tg" type="button" data-act="rt-tg" data-id="' + esc(rt.id) + '" aria-expanded="' + open + '" aria-controls="' + bid + '">' +
        '<span class="rt-tx"><span class="rt-n">' + esc(rt.name) + (rt.id === nextId ? '<span class="tag">다음 차례</span>' : '') + '</span><span class="ago">' + (last ? '마지막 ' + md(last.start) + ' · ' + ago(last.start) : '아직 기록 없음') + '</span></span>' +
        '<span class="chev">' + ICON.chev + '</span></button></h2>' +
      '<div class="rt-b" id="' + bid + '"' + (open ? '' : ' hidden') + '><ul class="plan">' + (rows || '<li class="muted">운동이 없어요. 루틴 관리에서 추가해 주세요.</li>') + '</ul></div>' +
      '<button class="btn primary block" data-act="start" data-id="' + esc(rt.id) + '">운동 시작</button></article>';
  }).join('') + '</div>';
  h += '<div class="row2"><button class="btn" type="button" data-act="goto" data-v="routines">루틴 관리</button><button class="btn dashed" type="button" data-act="start-free">빈 운동 시작</button></div>';
  return h + rulesHTML();
}

function planChip(ex, it) { const tg = itemTarget(it); return recChip(recommend(ex, tg, hist(ex.id)), ex.type, ex.inc, tg); }
function planRow(rt, it, i) {
  const ex = exById(it.exId); if (!ex) return '';
  const key = rt.id + ':' + i, open = ui.plOpen.has(key), id = 'pd-' + rt.id + '-' + i, ca = isCardio(ex.type), bw = ex.type === 'bw';
  const f = (fld, v, lbl, mode, ph) => '<input id="pl-' + rt.id + '-' + i + '-' + fld + '" class="num" inputmode="' + (mode || 'numeric') + '" data-pl="' + fld + '" data-r="' + esc(rt.id) + '" data-i="' + i + '" value="' + esc(v == null ? '' : v) + '"' + (ph ? ' placeholder="' + ph + '"' : '') + ' aria-label="' + esc(ex.name) + ' ' + lbl + '">';
  return '<li class="pl"><button class="pl-h" type="button" data-act="pl-tg" data-r="' + esc(rt.id) + '" data-i="' + i + '" aria-expanded="' + open + '" aria-controls="' + id + '"><span class="pn">' + esc(ex.name) + '</span><span class="chev">' + ICON.chev + '</span></button>' +
    '<div class="pdet" id="' + id + '"' + (open ? '' : ' hidden') + '><div class="pd-next"><span>다음 목표</span><span id="pc-' + rt.id + '-' + i + '">' + planChip(ex, it) + '</span></div><div class="pd-f">' +
    (ca
      ? '<label class="nf">구간 ' + f('sets', it.sets, '구간 수') + '</label><label class="nf">목표 시간 ' + f('repMin', it.repMin, '목표 시간 분') + ' 분</label>'
      : '<label class="nf">세트 ' + f('sets', it.sets, '세트 수') + '</label>' +
        '<label class="nf">횟수 ' + f('repMin', it.repMin, '최소 횟수') + ' – ' + f('repMax', it.repMax, '최대 횟수') + '</label>' +
        '<label class="nf">' + (bw ? '가중 단위' : '증량 단위') + ' ' + f('inc', ex.inc, bw ? '가중 단위 kg' : '증량 단위 kg', 'decimal') + ' kg</label>' +
        '<label class="nf">휴식 ' + f('rest', it.rest || '', '휴식 초', 'numeric', '기본') + ' 초</label>') +
    '</div></div></li>';
}
function plToggle(t) {
  const key = t.dataset.r + ':' + t.dataset.i, open = !ui.plOpen.has(key);
  if (open) ui.plOpen.add(key); else ui.plOpen.delete(key);
  t.setAttribute('aria-expanded', String(open));
  const d = document.getElementById(t.getAttribute('aria-controls')); if (d) d.hidden = !open;
}
// 오늘 화면에서 고친 세트·횟수를 바로 루틴에 저장하고 다음 목표를 다시 계산
function plChange(el) {
  const rt = state.routines.find(r => r.id === el.dataset.r), i = +el.dataset.i, it = rt && rt.items[i];
  const ex = it && exById(it.exId); if (!ex) return;
  const fld = el.dataset.pl, ca = isCardio(ex.type);
  if (fld === 'sets') it.sets = clampInt(el.value, 1, 20, it.sets);
  else if (ca && fld === 'repMin') it.repMin = it.repMax = clampInt(el.value, 1, 600, it.repMin);
  else if (fld === 'repMin' || fld === 'repMax') {
    it[fld] = clampInt(el.value, 1, 200, it[fld]);
    if (it.repMax < it.repMin) { const a = it.repMin; it.repMin = it.repMax; it.repMax = a; }
  } else if (fld === 'rest') { const r = clampInt(el.value, 0, 600, 0); if (r) it.rest = r; else delete it.rest; }
  else if (fld === 'inc') { const n = num(el.value); if (n != null) ex.inc = Math.min(100, Math.max(0, r2(n))); }
  saveApp();
  const $f = k => document.getElementById('pl-' + rt.id + '-' + i + '-' + k);
  [['sets', it.sets], ['repMin', it.repMin], ['repMax', it.repMax], ['inc', ex.inc], ['rest', it.rest || '']].forEach(([k, v]) => { const x = $f(k); if (x && x !== document.activeElement) x.value = v; });
  el.value = { sets: it.sets, repMin: it.repMin, repMax: it.repMax, inc: ex.inc, rest: it.rest || '' }[fld];
  const c = document.getElementById('pc-' + rt.id + '-' + i); if (c) c.innerHTML = planChip(ex, it);
}

function viewSession() {
  const L = state.live, T = liveTotals(L);
  let h = '<div class="sess-top"><div class="sess-id"><div class="eyebrow">진행 중 · ' + dayLabel(L.start) + (L.deload ? ' · 디로드' : '') + '</div><h1 class="page-title">' + esc(L.routineName || '자유 운동') + '</h1></div><div class="clock" id="clock" role="timer" aria-label="운동 시간">' + clock((Date.now() - L.start) / 1000) + '</div></div>';
  h += '<div class="meter" role="progressbar" aria-label="완료한 세트" aria-valuemin="0" aria-valuemax="' + T.total + '" aria-valuenow="' + T.done + '"><i style="width:' + (T.total ? (T.done / T.total * 100).toFixed(1) : 0) + '%"></i></div>';
  h += '<p class="sess-sum"><b>' + T.done + '</b> / ' + T.total + '세트 완료' + (T.reps ? ' · 횟수 ' + T.reps : '') + (T.vol ? ' · 볼륨 ' + fmtK(T.vol) + 'kg' : '') + (T.cmin ? ' · 유산소 ' + T.cmin + '분' : '') + '</p>';
  if (L.entries.some(e => e.type === 'bw') && bodyW(L.start) == null) h += '<div class="notice bwn">몸무게를 넣으면 맨몸 운동을 체중 + 가중으로 계산해요.<button class="btn sm" type="button" data-act="body-open">몸무게 입력</button></div>';
  h += '<div class="stack">' + (L.entries.map(exCard).join('') || '<div class="card empty"><p>아직 운동이 없어요. 아래에서 추가해 주세요.</p></div>') + '</div>';
  h += addExBlock();
  h += '<div class="sess-actions"><button class="btn primary block" data-act="finish">운동 완료</button><button class="btn ghost block" data-act="discard">기록하지 않고 취소</button></div>';
  return h;
}
const wVal = (s, e) => (s.w == null || ((e.type === 'bw' || isCardio(e.type)) && !s.w)) ? '' : fmtN(s.w);
// 이 운동의 가장 최근 기록 (지금 하는 운동은 아직 저장 전이라 안 섞임)
const prevOf = e => hist(e.exId)[0] || null;
function exCard(e, i) {
  const name = exName(e.exId, e.name), bw = e.type === 'bw', P = prevOf(e);
  const allDone = e.sets.length > 0 && e.sets.every(s => s.done);
  return '<section class="card ex' + (P ? ' hp' : '') + '" aria-label="' + esc(name) + '">' +
    '<header class="ex-h"><div class="ex-t"><h3>' + esc(name) + (allDone ? '<span class="pill">완료</span>' : '') + '</h3></div>' +
    '<button class="icon-btn sm ghost" type="button" data-act="rmex" data-e="' + i + '" aria-label="' + esc(name) + ' 오늘 운동에서 빼기">' + ICON.x + '</button></header>' +
    '<div class="set-head" aria-hidden="true">' + setHead(e, P) + '</div>' +
    '<div class="sets">' + e.sets.map((s, j) => setRow(e, i, s, j, P)).join('') + '</div>' +
    '<div class="ex-foot"><button class="btn sm" type="button" data-act="addset" data-e="' + i + '">+ ' + (isCardio(e.type) ? '구간' : '세트') + '</button><button class="btn sm ghost" type="button" data-act="delset" data-e="' + i + '"' + (e.sets.length ? '' : ' disabled') + '>− ' + (isCardio(e.type) ? '구간' : '세트') + '</button></div>' +
    '</section>';
}
function setHead(e, P) {
  const L = state.live, bwKg = L ? bodyW(L.start) : null, pv = P ? '<span>지난번</span>' : '';
  if (isCardio(e.type)) return '<span>구간</span>' + pv + '<span>속도 km/h</span><span>시간</span><span>완료</span>';
  if (e.type === 'bw') return '<span>세트</span>' + pv + '<span>' + (bwKg ? '체중 ' + fmtN(bwKg) + ' + kg' : '가중 kg') + '</span><span>횟수</span><span>완료</span>';
  return '<span>세트</span>' + pv + '<span>무게 kg</span><span>횟수</span><span>완료</span>';
}
function prevCell(e, i, j, P) {
  const p = P && P.sets[j];
  if (!p) return '<span class="prev none" aria-hidden="true">—</span>';
  const ca = isCardio(e.type), bw = e.type === 'bw';
  const top = ca ? fmtN(p.w || 0) + 'km/h' : bw ? (p.w ? '+' + fmtN(p.w) + 'kg' : '체중') : fmtN(p.w || 0) + 'kg', bot = p.r + (ca ? '분' : '회');
  return '<button type="button" class="prev" id="p-' + i + '-' + j + '" data-act="use-prev" data-e="' + i + '" data-s="' + j + '" aria-label="' + (j + 1) + '세트 지난번 ' + top + ' ' + bot + ' (' + md(P.start) + '), 눌러서 그대로 채우기">' +
    '<b>' + top + '</b><span>' + bot + '</span></button>';
}
// 지난번 칸을 누르면 그 세트의 무게·횟수를 그대로 채움
function usePrev(ei, si) {
  const L = state.live, e = L && L.entries[ei], s = e && e.sets[si], P = e && prevOf(e), p = P && P.sets[si];
  if (!s || !p || s.done) return;
  s.w = p.w == null ? s.w : p.w; s.r = p.r;
  saveLive(); render();
}
function setRow(e, i, s, j, P) {
  const id = i + '-' + j, bw = e.type === 'bw', ca = isCardio(e.type), wv = wVal(s, e);
  return '<div class="set' + (s.done ? ' done' : '') + '"><span class="no">' + (j + 1) + '</span>' + (P ? prevCell(e, i, j, P) : '') +
    '<div class="field' + (ca ? ' wide-u' : '') + '"><input id="w-' + id + '" data-f="w" data-e="' + i + '" data-s="' + j + '" data-prev="' + esc(wv) + '" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" value="' + esc(wv) + '" placeholder="' + (bw ? '0' : '—') + '" aria-label="' + (j + 1) + (ca ? '구간 속도 km/h' : '세트 ' + (bw ? '체중에 더한 가중' : '무게') + ' kg') + '"><span class="u">' + (ca ? 'km/h' : bw ? '+kg' : 'kg') + '</span></div>' +
    '<div class="field"><input id="r-' + id + '" data-f="r" data-e="' + i + '" data-s="' + j + '" type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" value="' + (s.r == null ? '' : s.r) + '" placeholder="' + (s.tr || '') + '" aria-label="' + (j + 1) + (ca ? '구간 시간, 목표 ' + (s.tr || '') + '분' : '세트 횟수, 목표 ' + (s.tr || '') + '회') + '"><span class="u">' + (ca ? '분' : '회') + '</span></div>' +
    '<button class="chk" type="button" id="c-' + id + '" data-act="done" data-e="' + i + '" data-s="' + j + '" aria-pressed="' + !!s.done + '" aria-label="' + (j + 1) + '세트 완료">' + ICON.check + '</button></div>';
}
const TYPE_L = { weight: '무게', bw: '맨몸', cardio: '유산소' };
const typeSeg = (cur, attrs) => TYPES.map(t => '<button type="button" ' + attrs(t) + ' aria-pressed="' + (typeOf(cur) === t) + '">' + TYPE_L[t] + '</button>').join('');
function addExBlock() {
  if (!ui.addEx) return '<button class="btn block dashed gap-top" type="button" data-act="addex-open">+ 운동 추가</button>';
  return '<div class="card addex"><label class="lbl" for="addex-name">추가할 운동</label>' +
    '<input id="addex-name" class="txt" list="ex-list-main" value="' + esc(ui.addExName) + '" placeholder="예: 플랭크, 벤치프레스" autocomplete="off" enterkeyhint="done">' +
    '<div class="row"><div class="seg sm grow-none" role="group" aria-label="새 운동 종류">' + typeSeg(ui.addExType, t => 'data-act="addex-type" data-v="' + t + '"') + '</div>' +
    '<span class="grow"></span><button class="btn sm" type="button" data-act="addex-cancel">닫기</button><button class="btn sm primary" type="button" data-act="addex-ok">추가</button></div>' +
    '<datalist id="ex-list-main">' + state.exercises.map(x => '<option value="' + esc(x.name) + '"></option>').join('') + '</datalist></div>';
}

// n: 운동 이름(첫 번째가 새로 만들 이름, 나머지는 같은 운동으로 볼 이름) · a–b: 횟수 범위 · 플랭크는 초
const PRESETS = [
  { name: '등 날', items: [
    { n: ['턱걸이', '풀업', '친업'], t: 'bw', m: 'back', s: ['biceps'], inc: 2.5, sets: 5, a: 5, b: 10, rest: 120 },
    { n: ['랫풀다운 3그립'], t: 'weight', m: 'back', s: ['biceps'], inc: 5, sets: 3, a: 30, b: 36, rest: 150 },
    { n: ['시티드 케이블 로우', '시티드 로우', '케이블 로우'], t: 'weight', m: 'back', s: ['biceps'], inc: 5, sets: 3, a: 8, b: 12 },
    { n: ['덤벨 컬', '덤벨컬'], t: 'weight', m: 'biceps', s: [], inc: 1, sets: 4, a: 8, b: 12 },
    { n: ['레그컬', '레그 컬', '시티드 레그 컬'], t: 'weight', m: 'posterior', s: [], inc: 5, sets: 4, a: 10, b: 15 },
    { n: ['힙 하이크'], t: 'bw', m: 'posterior', s: [], inc: 0, sets: 2, a: 15, b: 15 }
  ] },
  { name: '가슴 날', items: [
    { n: ['벤치프레스', '벤치 프레스'], t: 'weight', m: 'chest', s: ['triceps', 'shoulders'], inc: 2.5, sets: 5, a: 6, b: 10, rest: 120 },
    { n: ['팔굽혀펴기', '푸시업', '푸쉬업'], t: 'bw', m: 'chest', s: ['triceps', 'shoulders'], inc: 0, sets: 5, a: 10, b: 20 },
    { n: ['덤벨 레터럴 레이즈', '레터럴 레이즈', '사이드 레터럴 레이즈'], t: 'weight', m: 'shoulders', s: [], inc: 1, sets: 5, a: 12, b: 15 },
    { n: ['케이블 푸시다운', '케이블 푸쉬다운', '푸시다운'], t: 'weight', m: 'triceps', s: [], inc: 2.5, sets: 5, a: 10, b: 15 },
    { n: ['레그 익스텐션', '레그익스텐션'], t: 'weight', m: 'quads', s: [], inc: 5, sets: 5, a: 10, b: 15 },
    { n: ['플랭크'], t: 'bw', m: 'core', s: [], inc: 0, sets: 5, a: 30, b: 60 }
  ] }
];
const presetsIn = () => PRESETS.every(p => state.routines.some(r => r.name === p.name));
function presetCard() {
  if (presetsIn()) return '';
  return '<section class="card preset"><div class="preset-b"><h2>추천 루틴 · 등 날 + 가슴 날</h2>' +
    '<p class="muted">등 날: 턱걸이 · 랫풀다운 3그립 · 시티드 로우 · 덤벨 컬 · 레그컬 · 힙 하이크<br>가슴 날: 벤치프레스 · 팔굽혀펴기 · 레터럴 레이즈 · 푸시다운 · 레그 익스텐션 · 플랭크</p></div>' +
    '<button class="btn primary" type="button" data-act="preset-add">넣기</button></section>';
}
async function addPresets() {
  const exist = PRESETS.filter(p => state.routines.some(r => r.name === p.name));
  if (exist.length && !(await ask(exist.map(p => '‘' + p.name + '’').join(', ') + ' 루틴이 이미 있어요. 추천 구성으로 바꿀까요?', '바꾸기'))) return;
  let linked = 0;
  PRESETS.forEach(p => {
    const items = p.items.map(c => {
      let ex = c.n.map(exByName).find(Boolean);
      if (ex) { linked++; if (!ex.m && !isCardio(ex.type)) { ex.m = c.m; ex.s = c.s.slice(); } }
      else { ex = { id: uid(), name: c.n[0], type: c.t, inc: c.inc, m: c.m, s: c.s.slice() }; state.exercises.push(ex); }
      return Object.assign({ exId: ex.id, sets: c.sets, repMin: c.a, repMax: c.b }, c.rest ? { rest: c.rest } : {});
    });
    const rt = state.routines.find(r => r.name === p.name);
    if (rt) rt.items = items; else state.routines.push({ id: uid(), name: p.name, items });
  });
  gcExercises(); saveApp(); ui.tab = 'workout'; render(); window.scrollTo(0, 0);
  toast('등 날 · 가슴 날을 넣었어요' + (linked ? '. 이미 있던 운동 ' + linked + '개는 지난 기록을 이어 써요' : ''));
}
function viewRoutines() {
  let h = '<button class="btn sm ghost back" type="button" data-act="goto" data-v="workout">‹ 운동</button>' + head('루틴 ' + state.routines.length + '개 · 운동 ' + state.exercises.length + '종', '루틴 관리') + presetCard();
  if (!state.routines.length) {
    h += '<div class="card empty"><h2>아직 루틴이 없어요</h2><p>운동, 세트 수, 목표 횟수 범위, 증량 단위를 정해 두면 그 기준으로 다음 목표를 잡아요.</p></div>';
  } else {
    h += '<div class="stack">' + state.routines.map(rt => {
      const items = rt.items.map(it => { const ex = exById(it.exId); return ex ? esc(ex.name) + ' <span class="nv">' + (isCardio(ex.type) ? (it.sets > 1 ? it.sets + '×' : '') + it.repMin + '분' : it.sets + '×' + it.repMin + '–' + it.repMax) + '</span>' : ''; }).filter(Boolean).join(' · ');
      return '<article class="card rt-row"><div class="rt-main"><h2>' + esc(rt.name) + '</h2><p class="muted">' + (items || '운동 없음') + '</p></div>' +
        '<div class="rt-actions"><button class="btn" type="button" data-act="edit" data-id="' + esc(rt.id) + '">편집</button><button class="btn primary" type="button" data-act="start" data-id="' + esc(rt.id) + '">시작</button></div></article>';
    }).join('') + '</div>';
  }
  h += '<button class="btn block dashed gap-top" type="button" data-act="new-routine">+ 새 루틴 만들기</button>';
  return h + libHTML();
}
function libHTML() {
  const groups = libGroups(state.exercises.slice());
  let h = '<div class="sec-h"><h2>내 운동 <span class="muted">' + state.exercises.length + '종</span></h2><button class="btn sm" type="button" data-act="xs-new">+ 운동 등록</button></div>';
  if (!groups.length) return h + '<div class="card empty"><p>루틴에 넣거나 기록한 운동이 여기 모여요. 루틴을 만들 때 ‘내 운동에서 고르기’로 여러 개를 한 번에 넣을 수 있어요.</p></div>';
  return h + '<section class="card lib">' + groups.map(([g, list]) => '<div class="lib-g"><h3 class="sub-h">' + g + ' <span class="muted">' + list.length + '</span></h3><div class="lib-ch">' +
      list.map(ex => '<button type="button" class="chip" data-act="xs-open" data-id="' + esc(ex.id) + '">' + esc(ex.name) + '</button>').join('') + '</div></div>').join('') +
    '</section><p class="muted lib-help">운동을 누르면 이름·종류·증량 단위·주 근육을 바꿀 수 있어요. 루틴을 만들 때 ‘내 운동에서 고르기’로 여러 개를 한 번에 넣어요.</p>';
}

const dayKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
function viewLog() {
  const all = sessions(), byDay = new Map();
  all.forEach(s => { const k = dayKey(s.start); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(s); });
  if (!ui.calMonth) { const b = new Date(all[0] ? all[0].start : Date.now()); ui.calMonth = new Date(b.getFullYear(), b.getMonth(), 1).getTime(); }
  if (!ui.calDay) ui.calDay = all[0] ? dayKey(all[0].start) : dayKey(Date.now());
  const m0 = new Date(ui.calMonth), y = m0.getFullYear(), mo = m0.getMonth();
  const lead = new Date(y, mo, 1).getDay(), daysIn = new Date(y, mo + 1, 0).getDate(), todayK = dayKey(Date.now());
  const inMonth = all.filter(s => { const d = new Date(s.start); return d.getFullYear() === y && d.getMonth() === mo; });
  let sets = 0, vol = 0;
  const activeDays = new Set(inMonth.map(s => dayKey(s.start)));
  inMonth.forEach(s => { const st = sessStats(s); sets += st.sets; vol += st.vol; });
  let cells = DOW.map((d, i) => '<div class="cal-dow' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '') + '" aria-hidden="true">' + d + '</div>').join('');
  for (let i = 0; i < lead; i++) cells += '<span class="cal-d blank"></span>';
  for (let d = 1; d <= daysIn; d++) {
    const k = y + '-' + pad2(mo + 1) + '-' + pad2(d), list = byDay.get(k) || [], dow = (lead + d - 1) % 7;
    const pr = list.some(s => (s.prs || []).length);
    const mk = list.length ? '<span class="mk" aria-hidden="true">' + list.slice(0, 2).map(() => '<i></i>').join('') + (pr ? '<i class="pr"></i>' : '') + '</span>' : '';
    cells += '<button type="button" class="cal-d' + (list.length ? ' has' : '') + (k === todayK ? ' today' : '') + (dow === 0 ? ' sun' : dow === 6 ? ' sat' : '') + '" data-act="cal-pick" data-v="' + k + '" aria-pressed="' + (k === ui.calDay) + '" aria-label="' + (mo + 1) + '월 ' + d + '일' + (list.length ? ', 운동 ' + list.length + '회' + (pr ? ', 최고 기록' : '') : '') + '"><span>' + d + '</span>' + mk + '</button>';
  }
  let h = head('기록 ' + all.length + '회', '운동 기록');
  h += '<section class="card cal"><div class="cal-h"><button class="icon-btn sm" type="button" data-act="cal-prev" aria-label="이전 달">‹</button><h2>' + y + '년 ' + (mo + 1) + '월</h2><button class="icon-btn sm" type="button" data-act="cal-next" aria-label="다음 달">›</button></div>' +
    '<div class="cal-grid">' + cells + '</div>' +
    '<p class="cal-sum"><span>운동한 날 <b>' + activeDays.size + '</b>일</span><span>세트 <b>' + sets + '</b></span>' + (vol ? '<span>볼륨 <b>' + fmtK(vol) + '</b>kg</span>' : '') + '</p></section>';
  const [sy, sm, sd] = ui.calDay.split('-').map(Number), sel = byDay.get(ui.calDay) || [];
  h += '<h2 class="day-h">' + sm + '월 ' + sd + '일 (' + DOW[new Date(sy, sm - 1, sd).getDay()] + ')</h2>';
  if (sel.length) h += '<div class="card loglist">' + sel.map(logItem).join('') + '</div>';
  else if (!all.length) h += '<div class="card empty"><h2>아직 완료한 운동이 없어요</h2><p>운동 탭에서 루틴을 시작하고 ‘운동 완료’를 누르면 그날 칸에 표시되고, 눌러서 세트별 기록을 볼 수 있어요.</p><button class="btn primary" data-act="goto" data-v="workout">운동하러 가기</button></div>';
  else h += '<div class="card empty"><p>이날은 운동 기록이 없어요. 표시된 날짜를 누르면 그날 한 운동이 나와요.</p></div>';
  return h;
}
function logItem(s) {
  const d = new Date(s.start), st = sessStats(s);
  const lines = s.entries.map(e => '<li><span class="ln">' + esc(exName(e.exId, e.name)) + '</span><span class="lv">' + esc(setsText(e.sets, e.type)) + '</span></li>').join('');
  const prs = (s.prs || []).map(p => '<span class="pr">PR · ' + esc(exName(p.exId, '')) + ' ' + esc(p.label) + '</span>').join('');
  const meta = [st.min + '분'];
  if (st.sets) meta.push(st.sets + '세트');
  if (st.cmin) meta.push('유산소 ' + st.cmin + '분' + (st.km ? ' · ' + fmtN(st.km) + 'km' : ''));
  if (st.bwReps) meta.push('맨몸 ' + st.bwReps + '회');
  if (st.vol) meta.push('볼륨 ' + fmtK(st.vol) + 'kg');
  return '<article class="log"><div class="log-d"><b>' + d.getDate() + '</b><span>' + DOW[d.getDay()] + '</span></div><div class="log-b">' +
    '<header><div><h3>' + esc(s.routineName || '자유 운동') + '</h3><p class="muted">' + meta.join(' · ') + '</p></div>' +
    '<div class="acts"><button class="icon-btn sm ghost" type="button" data-act="sess-edit" data-id="' + esc(s.id) + '" aria-label="' + md(s.start) + ' ' + esc(s.routineName || '운동') + ' 기록 고치기">' + ICON.edit + '</button>' +
    '<button class="icon-btn sm ghost" type="button" data-act="delsess" data-id="' + esc(s.id) + '" aria-label="' + md(s.start) + ' ' + esc(s.routineName || '운동') + ' 기록 지우기">' + ICON.trash + '</button></div></header>' +
    '<ul class="lines">' + lines + '</ul>' + (prs ? '<div class="prs">' + prs + '</div>' : '') + '</div></article>';
}

// 성장 탭 부위: 세부 근육을 크게 묶음
const PARTS = [['chest', '가슴', ['chest']], ['back', '등', ['back']], ['shoulders', '어깨', ['shoulders']], ['arms', '팔', ['biceps', 'triceps']], ['legs', '하체', ['quads', 'posterior', 'calves']], ['core', '코어', ['core']], ['cardio', '유산소', []], ['etc', '기타', []]];
function partOf(t) {
  if (isCardio(t.type)) return 'cardio';
  const ex = exById(t.id), m = (ex && ex.m) || guessMuscles(t.name).m;
  const p = PARTS.find(x => x[2].includes(m)); return p ? p[0] : 'etc';
}
// 운동마다 대표 지표 하나로 첫 기록 대비 변화를 계산
function primaryOf(t, hasBW) {
  const H = hist(t.id), type = t.type;
  const [mk, ml, unit] = isCardio(type) ? ['km', '거리', 'km'] : type === 'bw' && !hasBW ? ['reps', '최고 횟수', '회'] : ['e1rm', '추정 1RM', 'kg'];
  const pts = seriesFor(H, mk, type), first = pts[0], last = pts[pts.length - 1];
  const d = pts.length > 1 ? r1(last.v - first.v) : null, pct = pts.length > 1 && first.v > 0 ? (last.v - first.v) / first.v * 100 : null;
  return { t, pts, mk, ml, unit, last: last ? last.v : null, d, pct, n: H.length, at: H[0] ? H[0].start : 0 };
}
function sparkSVG(pts) {
  if (pts.length < 2) return '<svg class="spark" viewBox="0 0 58 24" aria-hidden="true"><circle cx="29" cy="12" r="2.4" fill="currentColor"/></svg>';
  const v = pts.map(p => p.v), lo = Math.min(...v), hi = Math.max(...v), span = hi - lo || 1, P = pts.slice(-12);
  const xy = P.map((p, i) => [3 + i * 52 / (P.length - 1), 21 - (p.v - lo) / span * 18]);
  return '<svg class="spark" viewBox="0 0 58 24" aria-hidden="true"><polyline points="' + xy.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + xy[xy.length - 1][0].toFixed(1) + '" cy="' + xy[xy.length - 1][1].toFixed(1) + '" r="2.4" fill="currentColor"/></svg>';
}
function partCard(label, rows) {
  const ch = rows.filter(r => r.pct != null), avg = ch.length ? ch.reduce((a, r) => a + r.pct, 0) / ch.length : null;
  return '<section class="card part-card"><div class="part-h"><h2>' + label + '</h2><span>운동 ' + rows.length + '종' + (avg == null ? '' : ' · 첫 기록 대비 평균 <b class="' + dcls(r1(avg)) + '">' + signed(r1(avg), '%') + '</b>') + '</span></div><ul class="part-list">' +
    rows.map(r => '<li><button type="button" class="part-row" data-act="pick-ex" data-id="' + esc(r.t.id) + '" aria-pressed="' + (r.t.id === ui.progEx) + '">' +
      '<span class="pr-n">' + esc(r.t.name) + '<small>' + r.ml + ' · ' + r.n + '회 기록</small></span>' + sparkSVG(r.pts) +
      '<span class="pr-v">' + (r.last == null ? '—' : fmtN(r.last) + r.unit) + '<small class="' + (r.d == null ? 'muted' : dcls(r.d)) + '">' + (r.d == null ? '첫 기록' : signed(r.d, r.unit)) + '</small></span></button></li>').join('') +
    '</ul></section>';
}
function viewProgress() {
  const tr = trackedExercises(), B = bodySorted();
  const list = (B.length ? [{ id: '__body', name: '체성분' }] : []).concat(tr);
  let h = head('운동 ' + tr.length + '종' + (B.length ? ' · 체성분 ' + B.length + '회' : '') + ' 기록', '성장');
  if (!list.length) { ui.chart = null; return h + '<div class="card empty"><h2>아직 그래프가 없어요</h2><p>운동을 한 번 완료하면 운동별 추정 1RM·최고 무게·횟수 그래프와 최고 기록이 여기에 생겨요. 체성분을 기록하면 몸무게·체지방률·골격근량 추이도 볼 수 있어요.</p><div class="row"><button class="btn primary" data-act="goto" data-v="workout">운동하러 가기</button><button class="btn" data-act="body-open">체성분 기록</button></div></div>'; }
  const hasBW = B.some(b => b.w != null);
  // 부위별로 묶고, 부위 안에서는 최근에 한 운동부터
  const byPart = new Map();
  tr.map(t => primaryOf(t, hasBW)).sort((a, b) => b.at - a.at).forEach(r => { const p = partOf(r.t); if (!byPart.has(p)) byPart.set(p, []); byPart.get(p).push(r); });
  const parts = PARTS.filter(p => byPart.has(p[0]));
  if (ui.progEx && ui.progEx !== '__body' && tr.some(t => t.id === ui.progEx)) ui.progPart = partOf(tr.find(t => t.id === ui.progEx));
  if (ui.progPart !== '__body' && !byPart.has(ui.progPart)) { const recent = [...byPart.values()].flat().sort((a, b) => b.at - a.at)[0]; ui.progPart = recent ? partOf(recent.t) : '__body'; }
  if (ui.progPart === '__body' && !B.length) ui.progPart = parts[0][0];
  const chips = '<div class="chips wrap" role="group" aria-label="부위 선택">' +
    (B.length ? '<button type="button" class="chip" data-act="pick-part" data-v="__body" aria-pressed="' + (ui.progPart === '__body') + '">체성분</button>' : '') +
    parts.map(p => '<button type="button" class="chip" data-act="pick-part" data-v="' + p[0] + '" aria-pressed="' + (p[0] === ui.progPart) + '">' + p[1] + '<span class="cn">' + byPart.get(p[0]).length + '</span></button>').join('') + '</div>';
  if (ui.progPart === '__body') { ui.progEx = '__body'; return h + chips + bodyProgress(B); }
  const rows = byPart.get(ui.progPart);
  if (!rows.some(r => r.t.id === ui.progEx)) ui.progEx = rows[0].t.id;
  const cur = rows.find(r => r.t.id === ui.progEx).t, type = cur.type;
  h += chips + partCard(PARTS.find(p => p[0] === ui.progPart)[1], rows);
  const metrics = isCardio(type) ? [['km', '거리', 'km'], ['min', '시간', '분'], ['speed', '평균 속도', 'km/h']]
    : type === 'bw' ? (hasBW ? [['e1rm', '추정 1RM', 'kg'], ['reps', '최고 횟수', '회'], ['added', '가중', 'kg']] : [['reps', '최고 횟수', '회'], ['total', '총 횟수', '회'], ['added', '가중', 'kg']])
    : [['e1rm', '추정 1RM', 'kg'], ['top', '최고 무게', 'kg'], ['vol', '볼륨', 'kg']];
  if (!metrics.some(m => m[0] === ui.metric)) ui.metric = metrics[0][0];
  const met = metrics.find(m => m[0] === ui.metric);
  const H = hist(cur.id);
  ui.chart = { pts: seriesFor(H, met[0], type), unit: met[2], type, title: cur.name + ' ' + met[1] };
  h += '<section class="card chart-card"><div class="chart-h"><h2>' + esc(cur.name) + ' <span class="muted">· ' + met[1] + '</span></h2>' +
    '<div class="seg sm" role="group" aria-label="지표">' + metrics.map(m => '<button type="button" data-act="metric" data-v="' + m[0] + '" aria-pressed="' + (m[0] === met[0]) + '">' + m[1] + '</button>').join('') + '</div></div>' +
    '<div class="chart" id="chart" aria-label="기록 그래프. 좌우 화살표로 날짜별 값을 볼 수 있어요."></div>' +
    (H.length < 2 ? '<p class="chart-note">기록이 2번 이상 쌓이면 추세선이 그려져요.</p>' : '') + '</section>';
  h += tilesHTML(H, type) + recentTable(H, type);
  if (type === 'bw' && hasBW && met[0] === 'e1rm') h += '<p class="hint">맨몸 운동의 추정 1RM은 그날 체중 + 가중으로 계산했어요.</p>';
  h += '<div class="row center"><button class="btn" type="button" data-act="xs-open" data-id="' + esc(cur.id) + '">이 운동 설정 · 이름, 종류' + (isCardio(type) ? '' : ', 증량 단위') + '</button></div>';
  return h;
}
function tilesHTML(H, type) {
  const last = H[0], first = H[H.length - 1];
  const tile = (l, v, sub, vc, sc) => '<div class="tile"><span class="lbl">' + l + '</span><b class="' + (vc || '') + '">' + v + '</b><small class="' + (sc || '') + '">' + sub + '</small></div>';
  const t = [];
  if (isCardio(type)) {
    let bk = 0, bkT = 0;
    H.forEach(h => { const k = kmOf(h.sets); if (k > bk) { bk = k; bkT = h.start; } });
    const mins = h => h.sets.reduce((a, s) => a + s.r, 0), lm = mins(last), pm = H[1] ? mins(H[1]) : null, dk = r1(kmOf(last.sets) - kmOf(first.sets));
    t.push(tile('최장 거리', fmtN(r1(bk)) + 'km', md(bkT)));
    t.push(tile('최근 시간', lm + '분', pm == null ? md(last.start) : '지난번 ' + signed(lm - pm, '분'), '', pm == null ? '' : dcls(lm - pm)));
    t.push(tile('첫 기록 대비', H.length > 1 ? signed(dk, 'km') : '—', H.length + '회 기록 · 거리', H.length > 1 ? dcls(dk) : ''));
  } else if (type === 'bw') {
    let mr = 0, mrT = 0;
    H.forEach(h => h.sets.forEach(s => { if (s.r > mr) { mr = s.r; mrT = h.start; } }));
    const tot = h => h.sets.reduce((a, s) => a + s.r, 0);
    const lt = tot(last), pt = H[1] ? tot(H[1]) : null, ft = tot(first);
    t.push(tile('최고 횟수', mr + '회', md(mrT)));
    t.push(tile('최근 총 횟수', lt + '회', pt == null ? md(last.start) : '지난번 ' + signed(lt - pt, '회'), '', pt == null ? '' : dcls(lt - pt)));
    t.push(tile('첫 기록 대비', H.length > 1 ? signed(lt - ft, '회') : '—', H.length + '회 기록', H.length > 1 ? dcls(lt - ft) : ''));
  } else {
    let be = 0, beT = 0, tw = -1, twR = 0, twT = 0;
    H.forEach(h => h.sets.forEach(s => {
      const e = e1rm(s.w, s.r);
      if (e > be) { be = e; beT = h.start; }
      if (s.w > tw || (s.w === tw && s.r > twR)) { tw = s.w; twR = s.r; twT = h.start; }
    }));
    const bestOf = h => Math.max(...h.sets.map(s => e1rm(s.w, s.r)));
    const d = r1(bestOf(last) - bestOf(first));
    t.push(tile('최고 추정 1RM', r1(be) + 'kg', md(beT)));
    t.push(tile('최고 무게', fmtN(Math.max(0, tw)) + 'kg', twR + '회 · ' + md(twT)));
    t.push(tile('첫 기록 대비', H.length > 1 ? signed(d, 'kg') : '—', H.length + '회 기록 · 1RM', H.length > 1 ? dcls(d) : ''));
  }
  return '<div class="tiles">' + t.join('') + '</div>';
}
function recentTable(H, type) {
  const rows = H.slice(0, 8).map(h => {
    const val = isCardio(type) ? fmtN(r1(kmOf(h.sets))) + 'km' : type === 'bw' ? h.sets.reduce((a, s) => a + s.r, 0) + '회' : r1(Math.max(...h.sets.map(s => e1rm(s.w, s.r)))) + 'kg';
    return '<tr><td>' + md(h.start) + '</td><td>' + esc(setsText(h.sets, type)) + '</td><td class="n">' + val + '</td></tr>';
  }).join('');
  return '<section class="card tbl-card"><h2 class="tbl-h">최근 기록</h2><div class="tbl-wrap"><table class="rtbl"><thead><tr><th scope="col">날짜</th><th scope="col">세트</th><th scope="col" class="n">' + (isCardio(type) ? '거리' : type === 'bw' ? '총 횟수' : '추정 1RM') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}

function niceTicks(lo, hi, n, minStep) {
  if (!(hi > lo)) { const d = Math.max(Math.abs(lo) * 0.1, minStep || 1); lo -= d; hi += d; }
  const raw = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  const step = Math.max(minStep || 0, (f > 5 ? 10 : f > 2.5 ? 5 : f > 2 ? 2.5 : f > 1 ? 2 : 1) * mag);
  const out = [];
  for (let v = Math.floor(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(r2(v));
  if (out[out.length - 1] < hi) out.push(r2(out[out.length - 1] + step));
  return out;
}
const fmtTick = v => Math.abs(v) >= 10000 ? r1(v / 1000) + 'K' : (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('ko-KR') : String(r2(v)));
function mountChart() {
  const host = document.getElementById('chart'), C = ui.chart;
  if (!host || !C) return;
  const pts = C.pts;
  if (!pts.length) { host.innerHTML = ''; return; }
  const W = Math.max(280, Math.round(host.getBoundingClientRect().width) || 520), H = 220;
  const m = { l: 44, r: 14, t: 30, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const vals = pts.map(p => p.v);
  const ticks = niceTicks(Math.min(...vals), Math.max(...vals), 4, C.unit === '회' ? 1 : 0.5);
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const X = i => m.l + (pts.length === 1 ? iw / 2 : i * iw / (pts.length - 1));
  const Y = v => m.t + ih - (v - y0) / (y1 - y0) * ih;
  const f1 = n => n.toFixed(1);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(C.title) + ' 추이, ' + pts.length + '회 기록">';
  ticks.forEach(t => {
    s += '<line class="ch-grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + f1(Y(t)) + '" y2="' + f1(Y(t)) + '"/>';
    s += '<text class="ch-axis" x="' + (m.l - 8) + '" y="' + f1(Y(t) + 4) + '" text-anchor="end">' + fmtTick(t) + '</text>';
  });
  const li = pts.length - 1;
  const xi = pts.length === 1 ? [0] : pts.length <= 4 ? pts.map((_, i) => i) : [0, Math.round(li / 2), li];
  xi.forEach(i => {
    const anc = pts.length === 1 ? 'middle' : i === 0 ? 'start' : i === li ? 'end' : 'middle';
    s += '<text class="ch-axis" x="' + f1(X(i)) + '" y="' + (H - 6) + '" text-anchor="' + anc + '">' + md(pts[i].t) + '</text>';
  });
  if (pts.length > 1) {
    const d = pts.map((p, i) => (i ? 'L' : 'M') + f1(X(i)) + ' ' + f1(Y(p.v))).join(' ');
    s += '<path class="ch-area" d="' + d + ' L' + f1(X(li)) + ' ' + (m.t + ih) + ' L' + f1(X(0)) + ' ' + (m.t + ih) + ' Z"/>';
    s += '<path class="ch-line" d="' + d + '"/>';
  }
  let mi = 0; vals.forEach((v, i) => { if (v >= vals[mi]) mi = i; });
  if (pts.length <= 30) pts.forEach((p, i) => { if (i !== li) s += '<circle class="ch-dot" cx="' + f1(X(i)) + '" cy="' + f1(Y(p.v)) + '" r="4"/>'; });
  if (mi !== li && (Math.abs(X(mi) - X(li)) > 64 || Math.abs(Y(vals[mi]) - Y(vals[li])) > 22)) {
    s += '<text class="ch-lbl sm" x="' + f1(X(mi)) + '" y="' + f1(Y(vals[mi]) - 11) + '" text-anchor="' + (mi === 0 ? 'start' : 'middle') + '">최고 ' + fmtN(vals[mi]) + '</text>';
  }
  s += '<circle class="ch-end" cx="' + f1(X(li)) + '" cy="' + f1(Y(vals[li])) + '" r="5.5"/>';
  s += '<text class="ch-lbl" x="' + f1(X(li)) + '" y="' + f1(Y(vals[li]) - 12) + '" text-anchor="' + (pts.length === 1 ? 'middle' : 'end') + '">' + fmtN(vals[li]) + C.unit + '</text>';
  s += '<line class="ch-cross" x1="0" x2="0" y1="' + m.t + '" y2="' + (m.t + ih) + '" visibility="hidden"/></svg><div class="tip" hidden></div>';
  host.innerHTML = s;

  const svg = host.querySelector('svg'), tip = host.querySelector('.tip'), cross = host.querySelector('.ch-cross');
  let cur = -1;
  const show = i => {
    cur = i; const p = pts[i];
    cross.setAttribute('x1', f1(X(i))); cross.setAttribute('x2', f1(X(i))); cross.setAttribute('visibility', 'visible');
    const b = document.createElement('b'); b.textContent = fmtN(p.v) + C.unit;
    const sp = document.createElement('span'); sp.textContent = md(p.t) + (p.sets ? ' · ' + setsText(p.sets, C.type) : '');
    tip.replaceChildren(b, sp); tip.hidden = false;
    const rect = svg.getBoundingClientRect(), rw = rect.width || W, k = rw / W;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.max(tw / 2 + 2, Math.min(rw - tw / 2 - 2, X(i) * k)) + 'px';
    tip.style.top = Math.max(th + 2, Y(p.v) * k - 12) + 'px';
  };
  const hide = () => { cur = -1; tip.hidden = true; cross.setAttribute('visibility', 'hidden'); };
  const at = cx => {
    const rect = svg.getBoundingClientRect(), px = (cx - rect.left) * (W / (rect.width || W));
    let bi = 0, bd = Infinity;
    pts.forEach((_, i) => { const dd = Math.abs(X(i) - px); if (dd < bd) { bd = dd; bi = i; } });
    return bi;
  };
  host.onpointermove = ev => show(at(ev.clientX));
  host.onpointerdown = ev => show(at(ev.clientX));
  host.onpointerleave = ev => { if (ev.pointerType === 'mouse') hide(); };
  host.tabIndex = 0;
  host.onfocus = () => show(cur < 0 ? li : cur);
  host.onblur = hide;
  host.onkeydown = ev => {
    const c = cur < 0 ? li : cur;
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); show(Math.max(0, c - 1)); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); show(Math.min(li, c + 1)); }
    else if (ev.key === 'Escape') hide();
  };
}

/* ── 운동 진행 ───────────────────────────────── */
function switchTab(t) { if (!TABS.includes(t)) return; ui.tab = t; render(); window.scrollTo(0, 0); }
function startSession(L) {
  state.live = L; ui.tab = 'workout';
  saveLive(); render(); window.scrollTo(0, 0); keepAwake(true);
}
function startRoutine(rid) {
  if (state.live) { toast('진행 중인 운동이 있어요. 먼저 완료하거나 취소해 주세요.'); switchTab('workout'); return; }
  const rt = state.routines.find(r => r.id === rid); if (!rt) return;
  const deload = !!(state.coach && state.coach.deloadUntil > Date.now());
  const entries = rt.items.map(it => {
    const ex = exById(it.exId); if (!ex) return null;
    const tg = itemTarget(it);
    if (deload) tg.sets = Math.max(1, Math.ceil(tg.sets / 2));
    return makeEntry(ex, tg, it);
  }).filter(Boolean);
  if (!entries.length) { toast('이 루틴에 운동이 없어요. 루틴 관리에서 추가해 주세요.'); return; }
  ui.addEx = false;
  startSession({ id: uid(), routineId: rt.id, routineName: rt.name, start: Date.now(), entries, deload });
}
function startFree() {
  if (state.live) { toast('진행 중인 운동이 있어요. 먼저 완료하거나 취소해 주세요.'); switchTab('workout'); return; }
  ui.addEx = true; ui.addExName = '';
  startSession({ id: uid(), routineId: null, routineName: '자유 운동', start: Date.now(), entries: [] });
  focusLater('addex-name');
}
function cellOf(el) {
  const L = state.live; if (!L) return null;
  const e = L.entries[+el.dataset.e]; if (!e) return null;
  const s = e.sets[+el.dataset.s];
  return s ? { e, s } : null;
}
function onSetInput(el) {
  const c = cellOf(el); if (!c) return;
  const raw = el.value.trim(), v = raw === '' ? null : num(raw);
  if (el.dataset.f === 'w') c.s.w = v == null ? null : Math.max(0, r2(v));
  else c.s.r = v == null ? null : Math.max(0, Math.round(v));
  saveLive(true);
}
function onWeightChange(el) {
  const c = cellOf(el); if (!c) return;
  const old = el.dataset.prev === '' ? null : num(el.dataset.prev), nv = c.s.w;
  const ei = +el.dataset.e, si = +el.dataset.s;
  for (let j = si + 1; j < c.e.sets.length; j++) {
    const t = c.e.sets[j];
    if (t.done) continue;
    if (t.w == null || t.w === old || (c.e.type === 'bw' && !t.w && !old)) {
      t.w = nv;
      const inp = document.getElementById('w-' + ei + '-' + j);
      if (inp) { inp.value = wVal(t, c.e); inp.dataset.prev = inp.value; }
    }
  }
  el.dataset.prev = el.value;
  saveLive(true);
}
function toggleDone(ei, si) {
  const L = state.live; if (!L) return;
  const e = L.entries[ei]; if (!e) return;
  const s = e.sets[si]; if (!s) return;
  if (!s.done) {
    if (s.w == null) {
      if (e.type === 'bw' || isCardio(e.type)) s.w = 0;
      else { toast('무게를 먼저 입력해 주세요'); focusLater('w-' + ei + '-' + si); return; }
    }
    if (!(s.r > 0)) s.r = s.tr || e.target.repMin;
    s.done = true;
    const nx = e.sets[si + 1];
    if (nx && !nx.done && nx.w == null) nx.w = s.w;
    if (!isCardio(e.type)) startRest(state.settings.rest ? (e.rest || state.settings.rest) : 0);
  } else s.done = false;
  saveLive(); render();
}
function addSet(ei) {
  const e = state.live && state.live.entries[ei]; if (!e) return;
  const last = e.sets[e.sets.length - 1];
  e.sets.push({ w: last ? last.w : e.rec.w, r: null, tr: last ? last.tr : e.target.repMin, done: false });
  saveLive(); render();
}
async function delSet(ei) {
  const e = state.live && state.live.entries[ei]; if (!e || !e.sets.length) return;
  const last = e.sets[e.sets.length - 1];
  if (last.done && !(await ask('완료한 ' + e.sets.length + '세트를 지울까요?', '지우기'))) return;
  e.sets.pop(); saveLive(); render();
}
async function rmEx(ei) {
  const L = state.live, e = L && L.entries[ei]; if (!e) return;
  if (e.sets.some(s => s.done) && !(await ask(exName(e.exId, e.name) + '을(를) 빼면 완료한 세트도 함께 빠져요. 뺄까요?', '빼기'))) return;
  L.entries.splice(ei, 1); saveLive(); render();
}
function addExToSession() {
  if (!state.live) return;
  const name = String(ui.addExName || '').trim().replace(/\s+/g, ' ');
  if (!name) { toast('운동 이름을 입력해 주세요'); focusLater('addex-name'); return; }
  let ex = exByName(name);
  if (!ex) {
    const type = ui.addExType === 'weight' && looksCardio(name) ? 'cardio' : typeOf(ui.addExType), g = isCardio(type) ? { m: null, s: [] } : guessMuscles(name);
    ex = { id: uid(), name, type, inc: isCardio(type) ? 0 : 2.5, m: g.m, s: g.s }; state.exercises.push(ex); saveApp();
  }
  let tgt = null, src = null;
  for (const r of state.routines) { const it = r.items.find(x => x.exId === ex.id); if (it) { tgt = itemTarget(it); src = it; break; } }
  if (!tgt) tgt = isCardio(ex.type) ? Object.assign({}, CARDIO_TGT) : ex.type === 'bw' ? { sets: 3, repMin: 8, repMax: 15 } : { sets: 3, repMin: 8, repMax: 12 };
  state.live.entries.push(makeEntry(ex, tgt, src));
  ui.addEx = false; ui.addExName = '';
  saveLive(); render();
}
async function finish() {
  const L = state.live; if (!L) return;
  const entries = L.entries.map(e => ({
    exId: e.exId, name: exName(e.exId, e.name), type: e.type, target: e.target,
    sets: e.sets.filter(s => s.done && s.r > 0).map(s => ({ w: s.w || 0, r: s.r }))
  })).filter(e => e.sets.length);
  if (!entries.length) {
    if (await ask('완료로 체크한 세트가 없어요. 기록 없이 운동을 끝낼까요?', '기록 없이 끝내기')) endLive();
    return;
  }
  const prs = [];
  entries.forEach(e => prs.push(...findPRs(e, hist(e.exId))));
  const prev = L.routineId ? sessions().find(s => s.routineId === L.routineId) : null;
  const sess = { id: L.id, routineId: L.routineId || null, routineName: L.routineName || '자유 운동', start: L.start, end: Date.now(), entries, prs };
  const bwKg = entries.some(e => e.type === 'bw') ? bodyW(L.start) : null;
  if (bwKg) sess.bw = bwKg;
  const k = monthKey(L.start);
  (state.months[k] = state.months[k] || []).push(sess);
  invalidate(); saveMonth(k);
  endLive();
  openSheet('summary', summaryHTML(sess, prev));
}
function endLive() {
  state.live = null; ui.addEx = false;
  saveLive(); stopRest(); keepAwake(false); render(); window.scrollTo(0, 0);
}
async function discard() {
  const L = state.live; if (!L) return;
  if (L.entries.some(e => e.sets.some(s => s.done)) && !(await ask('완료한 세트까지 모두 지우고 이번 운동을 취소할까요?', '취소하고 지우기', '계속 운동'))) return;
  endLive();
}
/* ── 지난 기록 고치기 ─────────────────────────── */
// 최고 기록(PR)은 그때까지의 기록과 비교해 정해지므로, 기록을 고치면 처음부터 다시 계산
function recomputePRs() {
  const seen = new Map(), changed = new Set();
  for (const s of sessions().slice().reverse()) {
    const prs = [];
    for (const e of s.entries) prs.push(...findPRs(e, seen.get(e.exId) || []));
    for (const e of s.entries) { const ss = (e.sets || []).filter(x => x && x.r > 0); if (!ss.length) continue; if (!seen.has(e.exId)) seen.set(e.exId, []); seen.get(e.exId).unshift({ start: s.start, sets: ss }); }
    if (JSON.stringify(s.prs || []) !== JSON.stringify(prs)) { s.prs = prs; changed.add(monthKey(s.start)); }
  }
  return changed;
}
function openSessEdit(id) {
  const s = sessions().find(x => x.id === id); if (!s) return;
  const bw = sessBW(s);
  ui.se = {
    id, date: dayKey(s.start), min: String(sessStats(s).min), bw: s.entries.some(e => e.type === 'bw') ? (bw == null ? '' : String(bw)) : null,
    entries: s.entries.map(e => ({ exId: e.exId, name: exName(e.exId, e.name), type: typeOf(e.type), target: e.target || null,
      sets: (e.sets || []).map(x => ({ w: x.w ? fmtN(x.w) : (typeOf(e.type) === 'weight' ? '0' : ''), r: String(x.r) })) })),
    addName: '', addType: 'weight', newEx: false
  };
  openSheet('sedit', seHTML());
}
function seHTML() {
  const d = ui.se;
  const f = (id, key, label, mode, ph) => '<label for="' + id + '">' + label + '<input id="' + id + '" class="txt" ' + (mode === 'date' ? 'type="date"' : 'type="text" inputmode="' + mode + '" autocomplete="off"') + ' data-se="' + key + '" value="' + esc(d[key] == null ? '' : d[key]) + '"' + (ph ? ' placeholder="' + ph + '"' : '') + '></label>';
  const list = d.entries.map((e, i) => {
    const ca = isCardio(e.type), bw = e.type === 'bw';
    const rows = e.sets.map((x, j) => '<div class="set"><span class="no">' + (j + 1) + '</span>' +
      '<div class="field' + (ca ? ' wide-u' : '') + '"><input id="se-w-' + i + '-' + j + '" data-se="w" data-i="' + i + '" data-j="' + j + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(x.w) + '" placeholder="' + (bw || ca ? '0' : '—') + '" aria-label="' + esc(e.name) + ' ' + (j + 1) + (ca ? '구간 속도' : '세트 ' + (bw ? '가중' : '무게')) + '"><span class="u">' + (ca ? 'km/h' : bw ? '+kg' : 'kg') + '</span></div>' +
      '<div class="field"><input id="se-r-' + i + '-' + j + '" data-se="r" data-i="' + i + '" data-j="' + j + '" type="text" inputmode="numeric" autocomplete="off" value="' + esc(x.r) + '" aria-label="' + esc(e.name) + ' ' + (j + 1) + (ca ? '구간 시간' : '세트 횟수') + '"><span class="u">' + (ca ? '분' : '회') + '</span></div>' +
      '<button class="icon-btn sm ghost" type="button" data-act="se-del-set" data-i="' + i + '" data-j="' + j + '" aria-label="' + esc(e.name) + ' ' + (j + 1) + (ca ? '구간' : '세트') + ' 지우기">' + ICON.trash + '</button></div>').join('');
    return '<section class="card ex"><header class="ex-h"><div class="ex-t"><h3>' + esc(e.name) + '<span class="se-type">' + TYPE_L[e.type] + '</span></h3></div>' +
      '<button class="icon-btn sm ghost" type="button" data-act="se-rm-ex" data-i="' + i + '" aria-label="' + esc(e.name) + ' 이 기록에서 빼기">' + ICON.x + '</button></header>' +
      '<div class="set-head" aria-hidden="true">' + (ca ? '<span>구간</span><span>속도 km/h</span><span>시간</span><span></span>' : '<span>세트</span><span>' + (bw ? '가중 kg' : '무게 kg') + '</span><span>횟수</span><span></span>') + '</div>' +
      '<div class="sets">' + rows + '</div><div class="ex-foot"><button class="btn sm" type="button" id="se-as-' + i + '" data-act="se-add-set" data-i="' + i + '">+ ' + (ca ? '구간' : '세트') + '</button></div></section>';
  }).join('');
  return '<div class="sheet-h"><button class="btn ghost" type="button" data-act="sheet-close">취소</button><h2 id="sheet-title">기록 고치기</h2><button class="btn primary" type="button" data-act="se-save">저장</button></div>' +
    '<div class="sheet-b"><div class="fgrid">' + f('se-date', 'date', '날짜', 'date') + f('se-min', 'min', '운동 시간 (분)', 'numeric') +
      (d.bw != null ? f('se-bw', 'bw', '그날 체중 (kg)', 'decimal', '체성분 기록 사용') : '') + '</div>' +
    '<div class="stack se-list">' + (list || '<p class="muted">운동이 없어요. 아래에서 추가해 주세요.</p>') + '</div>' +
    '<div class="card addex"><label class="lbl" for="se-add">빠뜨린 운동 추가</label><input id="se-add" class="txt" list="se-ex-list" data-se="addName" value="' + esc(d.addName) + '" placeholder="예: 풀업, 러닝머신" autocomplete="off">' +
      '<div class="row"><div class="seg sm" role="group" aria-label="새 운동 종류">' + typeSeg(d.addType, t => 'id="se-t' + t[0] + '" data-act="se-type" data-v="' + t + '"') + '</div><span class="grow"></span><button class="btn sm primary" type="button" id="se-add-ok" data-act="se-add-ex">추가</button></div>' +
      '<datalist id="se-ex-list">' + state.exercises.map(x => '<option value="' + esc(x.name) + '"></option>').join('') + '</datalist></div>' +
    '<p class="se-note">고친 기록은 다음 목표, 최고 기록, 성장 그래프, 캘린더 합계, 코치 점검에 바로 반영돼요.</p>' +
    '<p class="err" id="se-err" role="alert" hidden></p></div>';
}
function seAddEx() {
  const d = ui.se; if (!d) return;
  const name = String(d.addName || '').trim().replace(/\s+/g, ' ');
  if (!name) { toast('운동 이름을 입력해 주세요'); focusLater('se-add'); return; }
  let ex = exByName(name);
  if (!ex) {
    const type = d.addType === 'weight' && looksCardio(name) ? 'cardio' : typeOf(d.addType), g = isCardio(type) ? { m: null, s: [] } : guessMuscles(name);
    ex = { id: uid(), name, type, inc: isCardio(type) ? 0 : 2.5, m: g.m, s: g.s }; state.exercises.push(ex); d.newEx = true;
  }
  d.entries.push({ exId: ex.id, name: ex.name, type: typeOf(ex.type), target: null, sets: [{ w: '', r: '' }] });
  if (ex.type === 'bw' && d.bw == null) { const s = sessions().find(x => x.id === d.id), v = s ? sessBW(s) : null; d.bw = v == null ? '' : String(v); }
  d.addName = ''; refreshSheet(); focusLater('se-r-' + (d.entries.length - 1) + '-0');
}
function saveSessEdit() {
  const d = ui.se; if (!d) return;
  const s = sessions().find(x => x.id === d.id); if (!s) { closeSheet(); return; }
  const err = document.getElementById('se-err');
  const fail = m => { err.textContent = m; err.hidden = false; if (err.scrollIntoView) err.scrollIntoView({ block: 'nearest' }); };
  const p = String(d.date || '').split('-').map(Number), old = new Date(s.start);
  const start = p.length === 3 && p.every(Number.isFinite) ? new Date(p[0], p[1] - 1, p[2], old.getHours(), old.getMinutes()).getTime() : NaN;
  if (!Number.isFinite(start)) return fail('날짜를 다시 확인해 주세요.');
  if (start > Date.now() + 60000) return fail('앞으로의 날짜는 고를 수 없어요.');
  const minN = num(d.min);
  if (minN == null || minN < 1 || minN > 600) return fail('운동 시간을 1–600분 사이로 넣어 주세요.');
  let bwV = null;
  if (d.bw != null && String(d.bw).trim() !== '') { bwV = num(d.bw); if (bwV == null || bwV < 20 || bwV > 300) return fail('그날 체중을 다시 확인해 주세요.'); }
  const entries = [];
  for (const e of d.entries) {
    const ca = isCardio(e.type), sets = [];
    for (let j = 0; j < e.sets.length; j++) {
      const x = e.sets[j], rs = String(x.r).trim(), ws = String(x.w).trim();
      if (!rs && !ws) continue;
      const r = num(rs), w = ws ? num(ws) : 0;
      if (r == null || r <= 0 || r > (ca ? 600 : 1000)) return fail(e.name + ' ' + (j + 1) + (ca ? '구간 시간' : '세트 횟수') + '를 다시 확인해 주세요.');
      if (w == null || w < 0 || w > 1000) return fail(e.name + ' ' + (j + 1) + (ca ? '구간 속도' : '세트 무게') + '를 다시 확인해 주세요.');
      sets.push({ w: r2(w), r: Math.round(r) });
    }
    if (sets.length) entries.push(Object.assign({ exId: e.exId, name: e.name, type: e.type }, e.target ? { target: e.target } : {}, { sets }));
  }
  if (!entries.length) return fail('세트를 하나 이상 남겨 주세요. 기록을 통째로 지우려면 기록 탭의 휴지통을 눌러요.');
  const oldK = monthKey(s.start), newK = monthKey(start);
  s.entries = entries; s.start = start; s.end = start + Math.round(minN) * 60000;
  if (bwV != null) s.bw = r1(bwV); else delete s.bw;
  if (oldK !== newK) { state.months[oldK] = (state.months[oldK] || []).filter(x => x.id !== s.id); (state.months[newK] = state.months[newK] || []).push(s); }
  invalidate();
  const changed = recomputePRs(); changed.add(oldK); changed.add(newK);
  changed.forEach(k => saveMonth(k));
  const nEx = state.exercises.length; gcExercises();
  if (d.newEx || state.exercises.length !== nEx) saveApp();
  const sd = new Date(start); ui.calDay = dayKey(start); ui.calMonth = new Date(sd.getFullYear(), sd.getMonth(), 1).getTime();
  closeSheet(); render(); toast('기록을 고쳤어요. 다음 목표와 그래프에도 반영했어요');
}
async function delSession(sid) {
  const s = sessions().find(x => x.id === sid); if (!s) return;
  if (!(await ask(md(s.start) + ' ' + (s.routineName || '운동') + ' 기록을 지울까요? 되돌릴 수 없어요.', '지우기'))) return;
  const k = monthKey(s.start);
  state.months[k] = (state.months[k] || []).filter(x => x.id !== sid);
  invalidate(); saveMonth(k); render();
}

/* ── 휴식 타이머 · 화면 켜짐 ───────────────────── */
const rest = { end: 0, total: 0, doneUntil: 0 };
let ticker = null, actx = null, wakeLock = null;
function startRest(sec) {
  if (!sec) return;
  primeAudio();
  rest.total = sec; rest.end = Date.now() + sec * 1000; rest.doneUntil = 0;
  ensureTicker(); renderRest();
}
function restAdd() { if (rest.end) { rest.end += 15000; rest.total += 15; renderRest(); } else startRest(15); }
function stopRest() { rest.end = 0; rest.doneUntil = 0; renderRest(); }
function ensureTicker() { if (!ticker) ticker = setInterval(tick, 250); }
function tick() {
  const now = Date.now();
  if (rest.end && now >= rest.end) { rest.end = 0; rest.doneUntil = now + 5000; restAlert(); }
  else if (rest.doneUntil && now >= rest.doneUntil) rest.doneUntil = 0;
  renderRest(); updateClock();
  if (!rest.end && !rest.doneUntil && !state.live) { clearInterval(ticker); ticker = null; }
}
function renderRest() {
  const bar = document.getElementById('restbar'); if (!bar) return;
  const on = !!(rest.end || rest.doneUntil);
  bar.hidden = !on;
  document.body.classList.toggle('has-rest', on);
  if (!on) return;
  const t = document.getElementById('rest-t'), l = document.getElementById('rest-l'), p = document.getElementById('rest-p');
  if (rest.end) {
    const left = Math.max(0, (rest.end - Date.now()) / 1000);
    t.textContent = clock(Math.ceil(left)); l.textContent = '휴식 중';
    p.style.width = Math.min(100, 100 * (1 - left / rest.total)).toFixed(1) + '%';
    bar.classList.remove('done');
  } else { t.textContent = '0:00'; l.textContent = '휴식 끝 · 다음 세트'; bar.classList.add('done'); }
}
function updateClock() { const el = document.getElementById('clock'); if (el && state.live) el.textContent = clock((Date.now() - state.live.start) / 1000); }
function restAlert() {
  try { if (navigator.vibrate) navigator.vibrate([180, 90, 180]); } catch (e) {}
  if (state.settings.sound) beep();
}
function primeAudio() {
  if (!state.settings.sound) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    if (!actx) actx = new AC();
    if (actx.state === 'suspended') actx.resume().catch(() => {});
  } catch (e) { actx = null; }
}
function beep() {
  try {
    if (!actx) return;
    const t0 = actx.currentTime + 0.02;
    [0, 0.24].forEach(dt => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0 + dt);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.18);
      o.connect(g); g.connect(actx.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.2);
    });
  } catch (e) {}
}
async function keepAwake(on) {
  try {
    if (on) {
      if (wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (wakeLock) { const w = wakeLock; wakeLock = null; await w.release(); }
  } catch (e) { wakeLock = null; }
}

/* ── 시트 · 대화상자 ─────────────────────────── */
let sheetReturn = null;
function openSheet(kind, html) {
  const sh = document.getElementById('sheet'), p = document.getElementById('sheet-panel');
  if (sh.hidden) sheetReturn = document.activeElement;
  ui.sheet = kind; p.innerHTML = html; sh.hidden = false; p.scrollTop = 0;
  document.body.classList.add('locked');
  setTimeout(() => p.focus({ preventScroll: true }), 0);
}
function refreshSheet() {
  const p = document.getElementById('sheet-panel');
  const act = document.activeElement && document.activeElement.id, top = p.scrollTop;
  if (ui.sheet === 'settings') p.innerHTML = settingsHTML();
  else if (ui.sheet === 'editor' && edit) p.innerHTML = editorHTML();
  else if (ui.sheet === 'xs' && ui.xs) p.innerHTML = xsHTML();
  else if (ui.sheet === 'body' && ui.bd) p.innerHTML = bodyHTML();
  else if (ui.sheet === 'p-amt' && ui.pa) p.innerHTML = amtHTML();
  else if (ui.sheet === 'p-custom' && ui.pc) p.innerHTML = customHTML();
  else if (ui.sheet === 'p-quick' && ui.pk) p.innerHTML = quickHTML();
  else if (ui.sheet === 'p-target' && ui.pt) p.innerHTML = targetHTML();
  else if (ui.sheet === 'sedit' && ui.se) p.innerHTML = seHTML();
  p.scrollTop = top;
  if (act) { const el = document.getElementById(act); if (el && p.contains(el)) el.focus({ preventScroll: true }); }
}
function closeSheet() {
  document.getElementById('sheet').hidden = true;
  document.getElementById('sheet-panel').innerHTML = '';
  ui.sheet = null; ui.xs = null; ui.bd = null; ui.pa = null; ui.pc = null; ui.pk = null; ui.pt = null; ui.se = null; edit = null;
  document.body.classList.remove('locked');
  if (sheetReturn && document.contains(sheetReturn) && sheetReturn.focus) sheetReturn.focus({ preventScroll: true });
  sheetReturn = null;
}
function ask(msg, okLabel, cancelLabel) {
  return new Promise(resolve => {
    const d = document.getElementById('dialog'), prev = document.activeElement;
    d.innerHTML = '<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-msg"><p id="dlg-msg">' + esc(msg) + '</p><div class="row end"><button type="button" class="btn" data-r="0">' + esc(cancelLabel || '취소') + '</button><button type="button" class="btn danger-fill" data-r="1">' + esc(okLabel || '확인') + '</button></div></div>';
    d.hidden = false;
    const close = v => {
      d.hidden = true; d.innerHTML = ''; d.onclick = null;
      document.removeEventListener('keydown', onKey, true);
      if (prev && prev.focus && document.contains(prev)) prev.focus({ preventScroll: true });
      resolve(v);
    };
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(false); } };
    document.addEventListener('keydown', onKey, true);
    d.onclick = e => { const b = e.target.closest('[data-r]'); if (b) close(b.dataset.r === '1'); else if (e.target === d) close(false); };
    setTimeout(() => { const b = d.querySelector('[data-r="0"]'); if (b) b.focus(); }, 0);
  });
}
let toastT = null, toastFn = null;
function toast(msg, actLabel, fn) {
  const t = document.getElementById('toast');
  t.textContent = msg; toastFn = fn || null;
  if (fn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-btn'; b.dataset.act = 'toast-act'; b.textContent = actLabel; t.append(b); }
  t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; toastFn = null; }, fn ? 5000 : 2800);
}
function toastAct() {
  const f = toastFn; toastFn = null; clearTimeout(toastT);
  document.getElementById('toast').hidden = true;
  if (f) f();
}

function summaryHTML(s, prev) {
  const st = sessStats(s);
  const tiles = [['운동 시간', st.min + '분']];
  if (st.sets) tiles.push(['완료 세트', st.sets + '세트'], ['총 횟수', st.reps + '회']);
  if (st.vol) tiles.push(['볼륨', fmtK(st.vol) + 'kg']);
  if (st.cmin) tiles.push(['유산소', st.cmin + '분']);
  if (st.km) tiles.push(['거리', fmtN(st.km) + 'km']);
  let cmp = '';
  if (prev) {
    const p = sessStats(prev), parts = ['횟수 ' + signed(st.reps - p.reps, '회')];
    if (st.vol && p.vol) parts.push('볼륨 ' + signed(r1((st.vol - p.vol) / p.vol * 100), '%'));
    cmp = '지난번(' + md(prev.start) + ')보다 ' + parts.join(' · ');
  }
  const prs = (s.prs || []).map(p => '<li><span class="pr">PR</span>' + esc(exName(p.exId)) + ' ' + esc(p.label) + '</li>').join('');
  return '<div class="sheet-h"><span></span><h2 id="sheet-title">운동 완료</h2><span></span></div>' +
    '<div class="sheet-b sum"><div class="eyebrow">' + dayLabel(s.start) + '</div><h3 class="sum-title">' + esc(s.routineName) + '</h3>' +
    '<div class="tiles' + (tiles.length === 4 ? ' t4' : '') + '">' + tiles.map(t => '<div class="tile"><span class="lbl">' + t[0] + '</span><b>' + t[1] + '</b></div>').join('') + '</div>' +
    (cmp ? '<p class="cmp">' + esc(cmp) + '</p>' : '') +
    (prs ? '<h4 class="sub-h">이번에 세운 기록</h4><ul class="pr-list">' + prs + '</ul>' : '') +
    '<p class="muted">다음 목표는 운동 탭에 바로 반영됐어요.</p>' +
    '<button class="btn primary block" type="button" data-act="sheet-close">확인</button></div>';
}

function settingsHTML() {
  const modeTxt = {
    cloud: '내 계정에 저장돼요. 다른 기기에서 이 페이지를 열어도 이어서 쓸 수 있어요.',
    local: '이 기기에만 저장돼요. 폰을 바꾸거나 앱을 지우면 사라지니 가끔 JSON으로 백업해 두세요.',
    memory: '이 화면에서는 저장할 수 없어요. 창을 닫으면 기록이 사라져요.',
    loading: '저장소에 연결하는 중이에요.'
  }[store.mode] || '';
  return '<div class="sheet-h"><span></span><h2 id="sheet-title">설정</h2><button class="btn ghost" type="button" data-act="sheet-close">닫기</button></div>' +
    '<div class="sheet-b srows">' +
    '<section class="srow"><h3>휴식 타이머</h3><p>세트를 완료로 체크하면 자동으로 시작해요. 루틴 편집에서 운동마다 휴식 시간을 정해 두면 그 시간을 먼저 써요.</p><div class="seg" role="group" aria-label="휴식 시간">' +
      REST_OPTS.map(v => '<button type="button" id="rest-' + v + '" data-act="set-rest" data-v="' + v + '" aria-pressed="' + (state.settings.rest === v) + '">' + (v ? v + '초' : '끔') + '</button>').join('') + '</div></section>' +
    '<section class="srow"><h3>휴식 끝 알림음</h3><p>휴대폰이 지원하면 진동도 함께 울려요.</p><div class="seg" role="group" aria-label="알림음">' +
      '<button type="button" id="snd-1" data-act="set-sound" data-v="1" aria-pressed="' + !!state.settings.sound + '">켜기</button><button type="button" id="snd-0" data-act="set-sound" data-v="0" aria-pressed="' + !state.settings.sound + '">끄기</button></div></section>' +
    '<section class="srow"><h3>저장 위치</h3><p>' + esc(modeTxt) + '</p></section>' +
    '<section class="srow"><h3>백업</h3><p>루틴, 운동·단백질 기록, 체성분, 코치 프로그램을 JSON 파일로 내보내고 그 파일로 되돌릴 수 있어요.</p>' +
      '<div class="row"><button class="btn" type="button" data-act="export">JSON 내보내기</button><label class="btn" for="import-file">JSON 가져오기</label><input class="vh" type="file" id="import-file" accept="application/json,.json"></div></section>' +
    '</div>';
}

const blankItem = () => ({ k: uid(), exId: null, name: '', type: 'weight', inc: 2.5, sets: 3, repMin: 8, repMax: 12, m: '', rest: '', rir: '', open: true });
function openEditor(rid) {
  const rt = rid ? state.routines.find(r => r.id === rid) : null;
  edit = {
    id: rt ? rt.id : null,
    name: rt ? rt.name : '',
    items: rt ? rt.items.map(it => {
      const ex = exById(it.exId) || {};
      return { k: uid(), exId: it.exId, name: ex.name || '', type: ex.type || 'weight', inc: ex.inc == null ? 2.5 : ex.inc, sets: it.sets, repMin: it.repMin, repMax: it.repMax, m: ex.m || guessMuscles(ex.name).m || '', rest: it.rest || '', rir: it.rir || '', open: false };
    }) : [blankItem()]
  };
  if (!edit.items.length) edit.items.push(blankItem());
  openSheet('editor', editorHTML());
}
function editorHTML() {
  if (edit.pick) return pickHTML();
  const n = edit.items.length;
  const items = edit.items.map((it, i) => {
    const k = it.k, bw = it.type === 'bw', ca = isCardio(it.type), nm = String(it.name || '').trim();
    return '<div class="ed-item' + (it.open ? ' open' : '') + '" data-k="' + k + '">' +
      '<div class="ed-r1" data-act="ed-tg" data-k="' + k + '" data-drag="' + k + '"><span class="grip" title="꾹 눌러 끌면 순서가 바뀌어요">' + ICON.grip + '</span><span class="ed-no">' + (i + 1) + '</span>' +
        '<span class="ed-nm' + (nm ? '' : ' ph') + '" id="ed-' + k + '-nm">' + esc(nm || '새 운동') + '</span>' +
        '<button class="icon-btn xs ed-tg" type="button" id="ed-' + k + '-tg" data-act="ed-tg" data-k="' + k + '" aria-expanded="' + !!it.open + '" aria-controls="ed-' + k + '-d" aria-label="' + esc(nm || (i + 1) + '번 운동') + ' 세부 설정">' + ICON.chev + '</button></div>' +
      '<div class="ed-d" id="ed-' + k + '-d"' + (it.open ? '' : ' hidden') + '>' +
      '<div class="ed-r0"><label class="lbl" for="ed-' + k + '-name">운동 이름</label><input id="ed-' + k + '-name" class="txt" list="ex-names" data-ed="iname" data-k="' + k + '" value="' + esc(it.name) + '" placeholder="예: 벤치프레스" autocomplete="off"></div>' +
      '<div class="ed-r2">' +
        '<div class="seg sm" role="group" aria-label="종류">' + TYPES.map(t => '<button type="button" id="ed-' + k + '-t' + t[0] + '" data-act="ed-type" data-k="' + k + '" data-v="' + t + '" aria-pressed="' + (typeOf(it.type) === t) + '">' + TYPE_L[t] + '</button>').join('') + '</div>' +
        (ca
          ? '<label class="nf">구간 <input id="ed-' + k + '-sets" class="num" inputmode="numeric" data-ed="sets" data-k="' + k + '" value="' + esc(it.sets) + '"></label>' +
            '<label class="nf">목표 시간 <input id="ed-' + k + '-min" class="num" inputmode="numeric" data-ed="repMin" data-k="' + k + '" value="' + esc(it.repMin) + '" aria-label="목표 시간 분"> 분</label>'
          : '<label class="nf">세트 <input id="ed-' + k + '-sets" class="num" inputmode="numeric" data-ed="sets" data-k="' + k + '" value="' + esc(it.sets) + '"></label>' +
            '<label class="nf">횟수 <input id="ed-' + k + '-min" class="num" inputmode="numeric" data-ed="repMin" data-k="' + k + '" value="' + esc(it.repMin) + '" aria-label="최소 횟수"> – <input id="ed-' + k + '-max" class="num" inputmode="numeric" data-ed="repMax" data-k="' + k + '" value="' + esc(it.repMax) + '" aria-label="최대 횟수"></label>' +
            '<label class="nf">' + (bw ? '가중 단위' : '증량 단위') + ' <input id="ed-' + k + '-inc" class="num" inputmode="decimal" data-ed="inc" data-k="' + k + '" value="' + esc(it.inc) + '"> kg</label>' +
            '<label class="nf">휴식 <input id="ed-' + k + '-rest" class="num" inputmode="numeric" data-ed="rest" data-k="' + k + '" value="' + esc(it.rest) + '" placeholder="기본"> 초</label>' +
            '<label class="nf">주 근육 <select id="ed-' + k + '-m" class="sel" data-ed="m" data-k="' + k + '"><option value="">모름</option>' + MUSCLES.map(([mk, ml]) => '<option value="' + mk + '"' + (it.m === mk ? ' selected' : '') + '>' + ml + '</option>').join('') + '</select></label>') +
      '</div><div class="ed-r3">' +
        '<button class="icon-btn xs" type="button" id="ed-' + k + '-up" data-act="ed-up" data-k="' + k + '" aria-label="위로"' + (i === 0 ? ' disabled' : '') + '>' + ICON.up + '</button>' +
        '<button class="icon-btn xs" type="button" id="ed-' + k + '-down" data-act="ed-down" data-k="' + k + '" aria-label="아래로"' + (i === n - 1 ? ' disabled' : '') + '>' + ICON.down + '</button>' +
        '<button class="btn sm ghost" type="button" id="ed-' + k + '-rm" data-act="ed-rm" data-k="' + k + '">이 운동 빼기</button></div></div></div>';
  }).join('');
  return '<div class="sheet-h"><button class="btn ghost" type="button" data-act="sheet-close">취소</button><h2 id="sheet-title">' + (edit.id ? '루틴 편집' : '새 루틴') + '</h2><button class="btn primary" type="button" data-act="ed-save">저장</button></div>' +
    '<div class="sheet-b"><label class="lbl" for="ed-name">루틴 이름</label>' +
    '<input id="ed-name" class="txt" data-ed="name" value="' + esc(edit.name) + '" placeholder="예: 상체 A, 맨몸 데일리" autocomplete="off" style="margin-top:6px">' +
    '<div class="ed-items">' + items + '</div>' +
    (state.exercises.length
      ? '<div class="row2 ed-adds"><button class="btn dashed" type="button" id="ed-pick" data-act="ed-pick">내 운동에서 고르기</button><button class="btn dashed" type="button" id="ed-add" data-act="ed-add">+ 새 운동</button></div>'
      : '<button class="btn block dashed" type="button" id="ed-add" data-act="ed-add">+ 운동 추가</button>') +
    '<p class="ed-help">블록을 꾹 누른 채 끌면 순서가 바뀌어요. ▾를 누르면 이름·종류·세트·횟수·휴식을 바꿀 수 있어요. 세트 수와 횟수 범위가 다음 목표의 기준이에요. 모든 세트가 범위 상한을 채우면 증량 단위만큼 올라가요. 맨몸 운동은 체중에 더한 가중만 적고, 유산소는 속도와 시간을 적어요. 이미 있는 운동 이름을 고르면 지난 기록이 이어져요.</p>' +
    '<p class="err" id="ed-err" role="alert" hidden></p>' +
    (edit.id ? '<button class="btn block danger-line gap-top" type="button" data-act="ed-del">이 루틴 삭제</button>' : '') +
    '<datalist id="ex-names">' + state.exercises.map(x => '<option value="' + esc(x.name) + '"></option>').join('') + '</datalist></div>';
}
const edItem = k => edit && edit.items.find(x => x.k === k);
/* 내 운동에서 여러 개 고르기 */
function pickHTML() {
  const P = edit.pick, inR = new Set(edit.items.map(it => it.exId || (exByName(it.name) || {}).id).filter(Boolean)), n = P.sel.length;
  const groups = libGroups(state.exercises.slice());
  return '<div class="sheet-h"><button class="btn ghost" type="button" data-act="pk-back">‹ 뒤로</button><h2 id="sheet-title">내 운동에서 고르기</h2><button class="btn primary" type="button" id="pk-ok" data-act="pk-ok"' + (n ? '' : ' disabled') + '>' + (n ? n + '개 넣기' : '넣기') + '</button></div>' +
    '<div class="sheet-b"><input id="pk-q" class="txt pk-q" type="search" placeholder="운동 검색" autocomplete="off" aria-label="내 운동 검색" value="' + esc(P.q) + '">' +
    groups.map(([g, list]) => '<section class="pk-g"><h3 class="sub-h">' + g + '</h3><div class="pk-list">' + list.map(ex => {
      const has = inR.has(ex.id), on = P.sel.includes(ex.id), hide = P.q && !norm(ex.name).includes(norm(P.q));
      return '<button type="button" class="pk-it" role="checkbox" id="pk-' + esc(ex.id) + '" aria-checked="' + on + '" data-act="pk-tg" data-id="' + esc(ex.id) + '" data-n="' + esc(norm(ex.name)) + '"' + (has ? ' disabled' : '') + (hide ? ' hidden' : '') + '>' +
        '<span class="pk-box">' + ICON.check + '</span><span class="pk-nm">' + esc(ex.name) + '</span><span class="pk-meta">' + (has ? '루틴에 있음' : esc(planLabel(ex, exPlan(ex)))) + '</span></button>';
    }).join('') + '</div></section>').join('') +
    '<p class="muted pk-none" id="pk-none" hidden>찾는 운동이 없어요. 뒤로 가서 ‘+ 새 운동’으로 넣어 주세요.</p>' +
    '<p class="ed-help">고른 순서대로 루틴 끝에 붙어요. 세트·횟수는 다른 루틴이나 지난 기록에서 쓰던 값을 가져와요.</p></div>';
}
function pkFilter() {
  const q = norm(edit.pick.q || ''); let any = false;
  document.querySelectorAll('.pk-g').forEach(g => {
    let vis = 0;
    g.querySelectorAll('.pk-it').forEach(b => { const ok = !q || b.dataset.n.includes(q); b.hidden = !ok; if (ok) vis++; });
    g.hidden = !vis; if (vis) any = true;
  });
  const none = document.getElementById('pk-none'); if (none) none.hidden = any;
}
function pkToggle(t) {
  const P = edit && edit.pick; if (!P) return;
  const id = t.dataset.id, i = P.sel.indexOf(id);
  if (i >= 0) P.sel.splice(i, 1); else P.sel.push(id);
  t.setAttribute('aria-checked', String(i < 0));
  const ok = document.getElementById('pk-ok'); if (ok) { ok.disabled = !P.sel.length; ok.textContent = P.sel.length ? P.sel.length + '개 넣기' : '넣기'; }
}
function pkAdd() {
  const P = edit && edit.pick; if (!P || !P.sel.length) return;
  const add = P.sel.map(exById).filter(Boolean).map(itemFromEx);
  edit.items = edit.items.filter(it => String(it.name || '').trim()).concat(add);
  edit.pick = null; refreshSheet();
  const first = add[0] && document.querySelector('.ed-item[data-k="' + add[0].k + '"]'); if (first) first.scrollIntoView({ block: 'center' });
  toast(add.length + '개를 넣었어요');
}

/* 루틴 편집: 블록을 꾹 눌러 끌어서 순서 바꾸기 */
const drag = { t: 0, el: null, on: false, x0: 0, y0: 0, y: 0, grab: 0, raf: 0, pid: null, ended: 0 };
function dragWaitCancel() { clearTimeout(drag.t); drag.t = 0; if (!drag.on) drag.el = null; }
function dragStart() {
  const el = drag.el; drag.t = 0;
  if (!el || !edit || edit.pick || !document.contains(el)) { drag.el = null; return; }
  drag.on = true; drag.grab = drag.y - el.getBoundingClientRect().top;
  el.classList.add('dragging'); document.body.classList.add('drag-on');
  try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
  dragPlace(); drag.raf = requestAnimationFrame(dragTick);
}
function flipSwap(sib, move) {
  const before = sib.offsetTop; move(); const d = before - sib.offsetTop;
  if (!d || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  sib.style.transition = 'none'; sib.style.transform = 'translateY(' + d + 'px)';
  void sib.offsetHeight;
  sib.style.transition = 'transform .16s ease'; sib.style.transform = '';
}
function dragPlace() {
  const el = drag.el, box = el && el.parentNode; if (!box) return;
  const bt = box.getBoundingClientRect().top, want = drag.y - drag.grab, mid = want + el.offsetHeight / 2;
  for (let g = 0; g < 60; g++) {
    const prev = el.previousElementSibling, next = el.nextElementSibling;
    if (next && mid > bt + next.offsetTop + next.offsetHeight / 2) flipSwap(next, () => box.insertBefore(next, el));
    else if (prev && mid < bt + prev.offsetTop + prev.offsetHeight / 2) flipSwap(prev, () => box.insertBefore(el, prev));
    else break;
  }
  el.style.transform = 'translateY(' + Math.round(want - (bt + el.offsetTop)) + 'px) scale(1.02)';
}
// 화면 위·아래 끝으로 끌면 시트를 스크롤
function dragTick() {
  if (!drag.on) return;
  const p = document.getElementById('sheet-panel'), r = p.getBoundingClientRect(), top = r.top + 110, bot = r.bottom - 70;
  const v = drag.y < top ? -Math.min(16, (top - drag.y) / 5) : drag.y > bot ? Math.min(16, (drag.y - bot) / 5) : 0;
  if (v) { const s0 = p.scrollTop; p.scrollTop += v; if (p.scrollTop !== s0) dragPlace(); }
  drag.raf = requestAnimationFrame(dragTick);
}
function dragEnd() {
  const el = drag.el; cancelAnimationFrame(drag.raf);
  drag.on = false; drag.el = null; drag.ended = Date.now();
  document.body.classList.remove('drag-on');
  if (!el || !edit) return;
  const order = [...el.parentNode.children].map(x => x.dataset.k);
  edit.items.sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k));
  refreshSheet();
}
document.addEventListener('pointerdown', ev => {
  if (drag.on || drag.t || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
  const h = ev.target.closest('[data-drag]');
  if (!h || ev.target.closest('button') || !edit || edit.pick) return;
  drag.el = h.closest('.ed-item'); drag.pid = ev.pointerId; drag.x0 = ev.clientX; drag.y0 = drag.y = ev.clientY;
  drag.t = setTimeout(dragStart, ev.pointerType === 'mouse' ? 250 : 380);
});
document.addEventListener('pointermove', ev => {
  if (drag.on) { if (ev.pointerId === drag.pid) { drag.y = ev.clientY; dragPlace(); } return; }
  if (drag.t) { drag.y = ev.clientY; if (Math.abs(ev.clientX - drag.x0) > 8 || Math.abs(ev.clientY - drag.y0) > 8) dragWaitCancel(); }
});
['pointerup', 'pointercancel'].forEach(n => document.addEventListener(n, ev => { if (drag.on) { if (ev.pointerId === drag.pid) dragEnd(); } else if (drag.t) dragWaitCancel(); }));
document.addEventListener('touchmove', ev => { if (drag.on) ev.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', ev => { if (drag.on || drag.t) ev.preventDefault(); });
function edMove(k, d) {
  const i = edit.items.findIndex(x => x.k === k), j = i + d;
  if (i < 0 || j < 0 || j >= edit.items.length) return;
  const t = edit.items[i]; edit.items[i] = edit.items[j]; edit.items[j] = t;
  refreshSheet();
}
// 종류를 바꿀 때 세트·횟수 기본값도 그 종류에 맞춤
function edSetType(it, t) {
  t = typeOf(t); if (it.type === t) return;
  if (isCardio(t)) { it.sets = 1; it.repMin = it.repMax = 20; it.inc = 0; it.m = ''; }
  else if (isCardio(it.type)) { it.sets = 3; it.repMin = 8; it.repMax = t === 'bw' ? 15 : 12; it.inc = 2.5; }
  it.type = t;
}
function edNameChange(el) {
  const it = edItem(el.dataset.k); if (!it) return;
  const ex = exByName(el.value), was = it.type;
  if (ex) { edSetType(it, ex.type); it.inc = ex.inc; it.m = isCardio(ex.type) ? '' : (ex.m || guessMuscles(ex.name).m || it.m); }
  else if (looksCardio(el.value)) edSetType(it, 'cardio');
  else { const g = guessMuscles(el.value); if (g.m) it.m = g.m; else return; }
  // 유산소로 바뀌면 칸 구성이 달라지니 터치가 끝난 뒤에 다시 그림
  if (isCardio(was) !== isCardio(it.type)) { setTimeout(() => { if (ui.sheet === 'editor' && edit) refreshSheet(); }, 350); return; }
  // 시트 전체를 다시 그리지 않고 해당 칸만 맞춤 (이름 입력 직후 다른 버튼을 누를 때 터치가 씹히지 않게)
  const $k = s => document.getElementById('ed-' + it.k + '-' + s), bw = it.type === 'bw';
  const m = $k('m'), inc = $k('inc');
  if (m) m.value = it.m || '';
  TYPES.forEach(t => { const b = $k('t' + t[0]); if (b) b.setAttribute('aria-pressed', String(it.type === t)); });
  if (inc) { inc.value = it.inc; if (inc.parentNode.firstChild.nodeType === 3) inc.parentNode.firstChild.textContent = (bw ? '가중 단위' : '증량 단위') + ' '; }
}
// 한 번 등록한 운동은 루틴에서 빠져도 ‘내 운동’에 남겨 둠. 지우기는 운동 설정에서 (루틴·기록에 없을 때만)
function gcExercises() {}
const exInRoutine = id => state.routines.some(r => r.items.some(it => it.exId === id));
const exHasHist = id => sessions().some(s => s.entries.some(e => e.exId === id)) || !!(state.live && state.live.entries.some(e => e.exId === id));
function libGroups(list) {
  const by = new Map(), order = MUSCLES.map(m => m[0]).concat(['__other', '__cardio']);
  list.forEach(ex => { const g = isCardio(ex.type) ? '__cardio' : (MLABEL[ex.m] ? ex.m : '__other'); if (!by.has(g)) by.set(g, []); by.get(g).push(ex); });
  return order.filter(g => by.has(g)).map(g => [g === '__cardio' ? '유산소' : g === '__other' ? '기타' : MLABEL[g], by.get(g).sort((a, b) => a.name.localeCompare(b.name, 'ko'))]);
}
// 이 운동을 루틴에 다시 넣을 때 쓸 세트·횟수: 다른 루틴에 있던 값 → 마지막 기록의 목표 → 종류별 기본값
function exPlan(ex) {
  for (const r of state.routines) { const it = r.items.find(x => x.exId === ex.id); if (it) return it; }
  for (const se of sessions()) { const e = se.entries.find(x => x.exId === ex.id && x.target); if (e) return e.target; }
  return isCardio(ex.type) ? { sets: 1, repMin: 20, repMax: 20 } : ex.type === 'bw' ? { sets: 3, repMin: 8, repMax: 15 } : { sets: 3, repMin: 8, repMax: 12 };
}
const planLabel = (ex, pl) => isCardio(ex.type) ? (pl.sets > 1 ? pl.sets + '×' : '') + pl.repMin + '분' : pl.sets + '×' + pl.repMin + '–' + pl.repMax;
function itemFromEx(ex) {
  const pl = exPlan(ex);
  return { k: uid(), exId: ex.id, name: ex.name, type: typeOf(ex.type), inc: ex.inc == null ? 2.5 : ex.inc, sets: pl.sets, repMin: pl.repMin, repMax: pl.repMax, m: isCardio(ex.type) ? '' : (ex.m || guessMuscles(ex.name).m || ''), rest: pl.rest || '', rir: pl.rir || '', open: false };
}
function edSave() {
  if (!edit) return;
  const items = [];
  for (const it of edit.items) {
    const nm = String(it.name || '').trim().replace(/\s+/g, ' ');
    if (!nm) continue;
    let ex = it.exId ? exById(it.exId) : null;
    if (!ex || norm(ex.name) !== norm(nm)) ex = exByName(nm);
    const n = num(it.inc), inc = Math.min(100, Math.max(0, r2(n == null ? 2.5 : n)));
    const type = typeOf(it.type), ca = isCardio(type);
    const g = ca ? { m: null, s: [] } : guessMuscles(nm), m = ca ? null : MLABEL[it.m] ? it.m : (g.m || null);
    const secFor = mm => g.m === mm ? g.s.slice() : [];
    if (!ex) { ex = { id: uid(), name: nm, type, inc, m, s: m && g.m === m ? g.s.slice() : [] }; state.exercises.push(ex); }
    else { ex.type = type; ex.inc = ca ? 0 : inc; if (ca) { ex.m = null; ex.s = []; } else if (m && ex.m !== m) { ex.m = m; ex.s = secFor(m); } }
    if (ca) { const mins = clampInt(it.repMin, 1, 600, 20); items.push({ exId: ex.id, sets: clampInt(it.sets, 1, 20, 1), repMin: mins, repMax: mins }); continue; }
    let a = clampInt(it.repMin, 1, 200, 8), b = clampInt(it.repMax, 1, 200, 12);
    if (b < a) { const t = a; a = b; b = t; }
    const item = { exId: ex.id, sets: clampInt(it.sets, 1, 20, 3), repMin: a, repMax: b };
    const rest = clampInt(it.rest, 0, 600, 0);
    if (rest) item.rest = rest;
    if (it.rir) item.rir = it.rir;
    items.push(item);
  }
  if (!items.length) { const err = document.getElementById('ed-err'); err.textContent = '운동을 하나 이상 넣어 주세요.'; err.hidden = false; return; }
  const name = String(edit.name || '').trim() || '새 루틴';
  const rt = edit.id ? state.routines.find(r => r.id === edit.id) : null;
  if (rt) { rt.name = name; rt.items = items; } else state.routines.push({ id: edit.id || uid(), name, items });
  gcExercises(); ui.plOpen.clear();
  saveApp(); closeSheet(); render(); toast('루틴을 저장했어요');
}
async function edDelete() {
  const rt = edit && state.routines.find(r => r.id === edit.id); if (!rt) return;
  if (!(await ask('‘' + rt.name + '’ 루틴을 삭제할까요? 지난 기록은 그대로 남아요.', '삭제'))) return;
  state.routines = state.routines.filter(r => r.id !== rt.id);
  gcExercises();
  saveApp(); closeSheet(); render(); toast('루틴을 삭제했어요');
}

function openXs(id) {
  const ex = exById(id); if (!ex) return;
  ui.xs = { id, name: ex.name, type: ex.type, inc: ex.inc, m: isCardio(ex.type) ? '' : (ex.m || '') };
  openSheet('xs', xsHTML());
}
function newXs() { ui.xs = { id: null, name: '', type: 'weight', inc: 2.5, m: '' }; openSheet('xs', xsHTML()); focusLater('xs-name'); }
async function delXs() {
  const x = ui.xs, ex = x && exById(x.id); if (!ex || exInRoutine(ex.id) || exHasHist(ex.id)) return;
  if (!(await ask('‘' + ex.name + '’을(를) 내 운동에서 지울까요?', '지우기'))) return;
  state.exercises = state.exercises.filter(o => o.id !== ex.id);
  saveApp(); closeSheet(); render(); toast('운동을 지웠어요');
}
function xsHTML() {
  const x = ui.xs, bw = x.type === 'bw', ca = isCardio(x.type);
  return '<div class="sheet-h"><button class="btn ghost" type="button" data-act="sheet-close">취소</button><h2 id="sheet-title">' + (x.id ? '운동 설정' : '운동 등록') + '</h2><button class="btn primary" type="button" data-act="xs-save">저장</button></div>' +
    '<div class="sheet-b srows">' +
    '<section class="srow"><label class="lbl" for="xs-name">이름</label><input id="xs-name" class="txt" data-xs="name" value="' + esc(x.name) + '" placeholder="예: 인클라인 덤벨 프레스" autocomplete="off"><p>' + (x.id ? '이름을 바꿔도 지난 기록은 그대로 이어져요.' : '등록해 두면 루틴을 만들 때 ‘내 운동에서 고르기’로 바로 넣을 수 있어요.') + '</p></section>' +
    '<section class="srow"><h3>종류</h3><div class="seg" role="group" aria-label="종류">' + typeSeg(x.type, t => 'id="xs-t' + t[0] + '" data-act="xs-type" data-v="' + t + '"') + '</div><p>' + (ca ? '유산소는 속도(km/h)와 시간(분)을 적고, 거리는 자동으로 계산해요.' : '맨몸 운동은 체중을 기본으로 잡고, 무게 칸에는 더한 가중(kg)만 적어요.') + '</p></section>' +
    (ca ? '' : '<section class="srow"><label class="lbl" for="xs-inc">' + (bw ? '가중 단위' : '증량 단위') + ' (kg)</label><input id="xs-inc" class="num wide" inputmode="decimal" data-xs="inc" value="' + esc(x.inc) + '"><p>모든 세트가 범위 상한을 채웠을 때 올릴 무게예요.</p></section>' +
      '<section class="srow"><label class="lbl" for="xs-m">주 근육</label><select id="xs-m" class="sel" data-xs="m"><option value="">모름</option>' + MUSCLES.map(([mk, ml]) => '<option value="' + mk + '"' + (x.m === mk ? ' selected' : '') + '>' + ml + '</option>').join('') + '</select><p>내 운동 목록을 근육별로 묶고, 코치의 근육별 세트 계산에 써요.</p></section>') +
    '<p class="err" id="xs-err" role="alert" hidden></p>' +
    (x.id ? (exInRoutine(x.id) || exHasHist(x.id)
      ? '<p class="muted">' + (exInRoutine(x.id) ? '루틴에 들어 있는 운동이라 지울 수 없어요.' : '기록이 있는 운동은 성장 그래프와 다음 목표 계산을 위해 남겨 둬요.') + '</p>'
      : '<button class="btn block danger-line" type="button" data-act="xs-del">내 운동에서 지우기</button>') : '') + '</div>';
}
function saveXs() {
  const x = ui.xs; if (!x) return;
  let ex = x.id ? exById(x.id) : null; if (x.id && !ex) { closeSheet(); return; }
  const nm = String(x.name || '').trim().replace(/\s+/g, ' '), err = document.getElementById('xs-err');
  if (!nm) { err.textContent = '이름을 입력해 주세요.'; err.hidden = false; return; }
  if (state.exercises.some(o => (!ex || o.id !== ex.id) && norm(o.name) === norm(nm))) { err.textContent = '같은 이름의 운동이 이미 있어요.'; err.hidden = false; return; }
  const isNew = !ex; if (isNew) { ex = { id: uid(), name: nm, type: 'weight', inc: 2.5, m: null, s: [] }; state.exercises.push(ex); }
  const n = num(x.inc);
  ex.name = nm; ex.type = typeOf(x.type); ex.inc = isCardio(ex.type) ? 0 : Math.min(100, Math.max(0, r2(n == null ? ex.inc : n)));
  if (isCardio(ex.type)) { ex.m = null; ex.s = []; }
  else {
    const m = MLABEL[x.m] ? x.m : (isNew ? guessMuscles(nm).m || null : null);
    if (m !== (ex.m || null) && (m || x.m === '')) { const g = guessMuscles(nm); ex.m = m; ex.s = m && g.m === m ? g.s.slice() : []; }
  }
  saveApp(); closeSheet(); render(); toast(isNew ? '‘' + nm + '’을(를) 내 운동에 등록했어요' : '운동 설정을 바꿨어요');
}

/* ── 백업 ─────────────────────────────────────── */
async function exportData() {
  const payload = { app: 'overload-log', version: 4, exportedAt: new Date().toISOString(), exercises: state.exercises, routines: state.routines, settings: state.settings, profile: state.profile, body: state.body, coach: state.coach, nutri: state.nutri, protein: state.pmonths, sessions: sessions().slice().reverse() };
  const json = JSON.stringify(payload, null, 2);
  const d = new Date(), filename = 'workout-' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '.json';
  let dl = null;
  try { const c = window.claude; dl = c && typeof c.use === 'function' ? await c.use('downloads') : null; } catch (e) { dl = null; }
  if (!dl) { if (!window.claude && blobDownload(filename, json)) return; exportFallback(json); return; }
  try { await dl.save({ filename, data: json }); toast('백업 파일을 저장했어요'); }
  catch (e) {
    const c = e && e.code;
    if (c === 'declined') return;
    if (c === 'rate_limited') toast('저장 창이 이미 열려 있어요. 잠시 뒤 다시 눌러 주세요.');
    else exportFallback(json);
  }
}
// 설치형 앱(깃허브 페이지)처럼 Claude 밖에서 열었을 때: 브라우저 다운로드로 저장
function blobDownload(filename, text) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('백업 파일을 저장했어요'); return true;
  } catch (e) { return false; }
}
function exportFallback(json) {
  openSheet('export', '<div class="sheet-h"><span></span><h2 id="sheet-title">백업 데이터</h2><button class="btn ghost" type="button" data-act="sheet-close">닫기</button></div>' +
    '<div class="sheet-b"><p class="muted">이 화면에서는 파일로 바로 저장할 수 없어요. 아래 내용을 복사해서 .json 파일로 저장해 두면 나중에 ‘JSON 가져오기’로 되돌릴 수 있어요.</p>' +
    '<textarea id="export-text" class="code" readonly aria-label="백업 JSON">' + esc(json) + '</textarea>' +
    '<button class="btn primary block" type="button" data-act="copy-export">복사</button></div>');
}
function copyExport() {
  const ta = document.getElementById('export-text'); if (!ta) return;
  const fallback = () => { ta.focus(); ta.select(); toast('선택된 내용을 직접 복사해 주세요'); };
  try { navigator.clipboard.writeText(ta.value).then(() => toast('복사했어요'), fallback); } catch (e) { fallback(); }
}
function importFile(file) {
  if (file.size > 5 * 1024 * 1024) { toast('백업 파일이 너무 커요 (최대 5MB).'); return; }
  const fr = new FileReader();
  fr.onload = async () => {
    let data;
    try { data = sanitizeImport(JSON.parse(String(fr.result))); }
    catch (e) { toast('파일을 읽지 못했어요. 이 앱에서 내보낸 JSON 파일인지 확인해 주세요.'); return; }
    const pDays = Object.values(data.protein).reduce((a, m) => a + Object.keys(m).length, 0);
    const what = '루틴 ' + data.routines.length + '개와 운동 기록 ' + data.sessions.length + '회' + (pDays ? ', 단백질 기록 ' + pDays + '일을' : '를');
    if (!(await ask(what + ' 가져와서 지금 데이터를 모두 바꿀까요?', '바꾸기'))) return;
    applyImport(data);
  };
  fr.onerror = () => toast('파일을 읽지 못했어요.');
  fr.readAsText(file);
}
function sanitizeImport(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.exercises) || !Array.isArray(d.routines)) throw new Error('shape');
  const exercises = d.exercises.filter(x => x && x.id && x.name).map(x => {
    const n = num(x.inc);
    return { id: String(x.id), name: String(x.name).slice(0, 60), type: typeOf(x.type), inc: Math.min(100, Math.max(0, n == null ? 2.5 : n)) };
  });
  const ids = new Set(exercises.map(x => x.id));
  const rawSess = Array.isArray(d.sessions) ? d.sessions : (d.months && typeof d.months === 'object' ? Object.values(d.months).flat() : []);
  const list = rawSess.filter(s => s && Number.isFinite(s.start) && Array.isArray(s.entries)).map(s => ({
    id: String(s.id || uid()), routineId: s.routineId ? String(s.routineId) : null, routineName: String(s.routineName || '자유 운동'),
    start: s.start, end: Number.isFinite(s.end) ? s.end : s.start,
    entries: s.entries.filter(e => e && e.exId && Array.isArray(e.sets)).map(e => ({
      exId: String(e.exId), name: String(e.name || ''), type: typeOf(e.type),
      target: e.target && typeof e.target === 'object' ? { sets: clampInt(e.target.sets, 1, 20, 3), repMin: clampInt(e.target.repMin, 1, 200, 8), repMax: clampInt(e.target.repMax, 1, 200, 12) } : null,
      sets: e.sets.filter(x => x && num(x.r) > 0).map(x => ({ w: Math.max(0, num(x.w) || 0), r: Math.round(num(x.r)) }))
    })).filter(e => e.sets.length),
    prs: Array.isArray(s.prs) ? s.prs.filter(p => p && p.exId && p.label).map(p => ({ exId: String(p.exId), label: String(p.label).slice(0, 40) })) : [],
    ...(Number.isFinite(s.bw) && s.bw > 0 ? { bw: s.bw } : {})
  }));
  for (const s of list) for (const e of s.entries) if (!ids.has(e.exId)) { ids.add(e.exId); exercises.push({ id: e.exId, name: e.name || '운동', type: e.type, inc: 2.5 }); }
  const routines = d.routines.filter(r => r && r.id && Array.isArray(r.items)).map(r => Object.assign({
    id: String(r.id), name: String(r.name || '루틴').slice(0, 60),
    items: r.items.filter(it => it && ids.has(String(it.exId))).map(it => Object.assign({ exId: String(it.exId), sets: clampInt(it.sets, 1, 20, 3), repMin: clampInt(it.repMin, 1, 200, 8), repMax: clampInt(it.repMax, 1, 200, 12) },
      clampInt(it.rest, 0, 600, 0) ? { rest: clampInt(it.rest, 0, 600, 0) } : {}, it.rir ? { rir: String(it.rir).slice(0, 8) } : {}))
  }));
  exercises.forEach((x, i) => { const src = d.exercises.find(e => e && String(e.id) === x.id) || {}; if (MLABEL[src.m]) { x.m = src.m; x.s = (Array.isArray(src.s) ? src.s : []).filter(z => MLABEL[z]); } });
  const st = d.settings || {};
  const pf = sanitizeProfile(d.profile);
  const body = (Array.isArray(d.body) ? d.body : []).filter(b => b && Number.isFinite(b.at)).map(b => ({ id: String(b.id || uid()), at: b.at, w: num(b.w), bf: num(b.bf), smm: num(b.smm) }));
  return { exercises, routines, settings: { rest: REST_OPTS.includes(+st.rest) ? +st.rest : 90, sound: st.sound !== false }, profile: pf, body, coach: coachFrom(d.coach || d.program), nutri: sanitizeNutri(d.nutri), protein: sanitizeProtein(d.protein), sessions: list };
}
function sanitizeNutri(n) {
  const o = clone(DEFAULT_NUTRI);
  if (!n || typeof n !== 'object') return o;
  const f = num(n.factor), t = num(n.target);
  if (f != null && P_FACTORS.includes(r1(f))) o.factor = r1(f);
  if (t != null && t >= 20 && t <= 400) o.target = Math.round(t);
  o.custom = (Array.isArray(n.custom) ? n.custom : []).filter(c => c && c.k && c.n && num(c.p) != null).slice(0, 300).map(c => {
    const q = num(c.q), u = c.u === 'g' || c.u === 'ml' ? c.u : null;
    return { k: String(c.k).slice(0, 40), n: String(c.n).slice(0, 60), c: ['food', 'drink', 'powder'].includes(c.c) ? c.c : 'food', s: String(c.s || '1회').slice(0, 30), q: u && q > 0 ? q : null, u: u && q > 0 ? u : null, p: Math.min(200, Math.max(0, r1(num(c.p)))) };
  });
  return o;
}
function sanitizeProtein(P) {
  const out = {};
  if (!P || typeof P !== 'object') return out;
  for (const [mk, days] of Object.entries(P)) {
    if (!/^\d{4}-\d{2}$/.test(mk) || !days || typeof days !== 'object') continue;
    for (const [dk, list] of Object.entries(days)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dk) || dk.slice(0, 7) !== mk || !Array.isArray(list)) continue;
      const [y, m, d] = dk.split('-').map(Number), noon = new Date(y, m - 1, d, 12).getTime();
      const L = list.filter(e => e && num(e.p) != null && num(e.p) >= 0).map(e => Object.assign({
        id: String(e.id || uid()), at: Number.isFinite(e.at) ? e.at : noon, k: e.k ? String(e.k).slice(0, 40) : null,
        n: String(e.n || '음식').slice(0, 60), d: String(e.d || '').slice(0, 40), p: Math.min(300, r1(num(e.p)))
      }, e.nt || !Number.isFinite(e.at) ? { nt: 1 } : {}));
      if (L.length) (out[mk] = out[mk] || {})[dk] = L.sort((a, b) => a.at - b.at);
    }
  }
  return out;
}
function applyImport(d) {
  const oldKeys = Object.keys(state.months), oldP = Object.keys(state.pmonths);
  state.exercises = d.exercises; state.routines = d.routines; state.settings = d.settings;
  state.profile = d.profile; state.body = d.body; state.coach = d.coach; state.nutri = d.nutri;
  state.months = {};
  for (const s of d.sessions) { const k = monthKey(s.start); (state.months[k] = state.months[k] || []).push(s); }
  state.pmonths = d.protein;
  invalidate(); saveApp();
  new Set(oldKeys.concat(Object.keys(state.months))).forEach(k => saveMonth(k));
  new Set(oldP.concat(Object.keys(state.pmonths))).forEach(k => savePMonth(k));
  closeSheet(); render(); toast('백업을 가져왔어요');
}

/* ── 코치: 프로그램 생성 · 주간 점검 ───────────── */
function guessMuscles(name) { const n = String(name || ''); for (const [re, m, s] of GUESS) if (re.test(n)) return { m, s: s.slice() }; return { m: null, s: [] }; }
function musclesOf(exId, fallbackName) {
  const ex = exById(exId);
  if (ex && isCardio(ex.type)) return { m: null, s: [] };
  if (ex && ex.m) return { m: ex.m, s: Array.isArray(ex.s) ? ex.s : [] };
  return guessMuscles(ex ? ex.name : fallbackName);
}
const mondayOf = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); };
const bodySorted = () => state.body.filter(b => b && Number.isFinite(b.at)).sort((a, b) => a.at - b.at);
const refs = list => (list && list.length) ? ' <span class="ref">[' + list.join('·') + ']</span>' : '';
function weeklyFrom(items) {
  const v = {}; MUSCLES.forEach(([k]) => { v[k] = 0; });
  items.forEach(it => { if (it.m && v[it.m] != null) v[it.m] += it.sets; (it.s || []).forEach(x => { if (v[x] != null) v[x] += 0.5 * it.sets; }); });
  return v;
}
function weekVolume(from, to) {
  const items = [];
  sessions().forEach(s => { if (s.start < from || s.start >= to) return; s.entries.forEach(e => { if (isCardio(e.type)) return; const mm = musclesOf(e.exId, e.name); items.push({ m: mm.m, s: mm.s, sets: (e.sets || []).length }); }); });
  return weeklyFrom(items);
}
function routineMuscles() {
  const set = new Set();
  state.routines.forEach(r => r.items.forEach(it => { const mm = musclesOf(it.exId); if (mm.m) set.add(mm.m); mm.s.forEach(x => set.add(x)); }));
  return set;
}
const firstSessionAt = () => { const S = sessions(); return S.length ? S[S.length - 1].start : 0; };
function stalledByMuscle() {
  const out = {}, seen = new Set();
  state.routines.forEach(r => r.items.forEach(it => {
    const ex = exById(it.exId); if (!ex || seen.has(ex.id)) return;
    seen.add(ex.id);
    const k = recommend(ex, itemTarget(it), hist(ex.id)).kind;
    if (k !== 'stall' && k !== 'deload') return;
    const m = musclesOf(ex.id).m || 'etc';
    (out[m] = out[m] || []).push(ex);
  }));
  return out;
}
// 주간 점검: 내 루틴에서 3번 연속 제자리인 운동을 근육별로 모아 세트 +1 [7][2], 정체가 여러 근육에 겹치면 디로드 주간 [6]
function review(now) {
  const C = state.coach || {}, first = firstSessionAt();
  const due = !!first && state.routines.length > 0 && now - (C.lastReview || first) >= WEEK - 6 * 3600e3;
  const stalled = stalledByMuscle(), props = [];
  if (due) {
    const ms = Object.keys(stalled), sinceDeload = (now - (C.lastDeload || first)) / WEEK;
    if (ms.length >= 2 && sinceDeload >= 5 && !(C.deloadUntil > now)) {
      props.push({ kind: 'deload', text: ms.map(mLabel).join('·') + '에서 정체가 겹쳤어요. 다음 7일은 모든 루틴의 세트를 절반으로 줄여 회복해요.', ref: [6] });
    } else {
      const v2 = weekVolume(now - 2 * WEEK, now + 1);
      const setsOf = id => { for (const r of state.routines) for (const it of r.items) if (it.exId === id) return it.sets; return 0; };
      ms.forEach(m => {
        if (now - ((C.changed || {})[m] || 0) < 2 * WEEK - 6 * 3600e3) return;
        const names = stalled[m].map(e => e.name).join(', '), cur = r1((v2[m] || 0) / 2);
        if (cur >= HIGH_SETS) { props.push({ kind: 'note', text: mLabel(m) + ' 정체(' + names + '). 이미 주 ' + fmtN(cur) + '세트라 세트를 더 늘리기보다 잠·식사 같은 회복과 세트를 실패에 얼마나 가깝게 끝내는지부터 점검해 봐요.', ref: [2, 3] }); return; }
        const exs = stalled[m].filter(e => state.routines.some(r => r.items.some(it => it.exId === e.id && it.sets < MAX_EX_SETS)));
        if (!exs.length) { props.push({ kind: 'note', text: mLabel(m) + ' 정체(' + names + '). 세트가 이미 ' + MAX_EX_SETS + '개라 더 어려운 변형으로 바꾸거나 횟수 범위를 조정해 봐요.', ref: [4] }); return; }
        props.push({ kind: 'vol', m, ids: exs.map(e => e.id), text: mLabel(m) + ' 정체 → ' + exs.map(e => e.name + ' ' + setsOf(e.id) + '→' + (setsOf(e.id) + 1) + '세트').join(', ') + (cur ? ' (최근 2주 평균 주 ' + fmtN(cur) + '세트)' : ''), ref: [7, 2] });
      });
    }
  }
  return { due, first, stalled, props };
}
function applyReview(apply) {
  const now = Date.now(), R = review(now), items = [];
  const C = state.coach = Object.assign({ lastReview: 0, lastDeload: 0, deloadUntil: 0, changed: {}, log: [] }, state.coach || {});
  if (!C.changed) C.changed = {};
  if (apply) R.props.forEach(p => {
    if (p.kind === 'vol') {
      const names = [];
      p.ids.forEach(id => { let hit = false; state.routines.forEach(r => r.items.forEach(it => { if (it.exId === id && it.sets < MAX_EX_SETS) { it.sets++; hit = true; } })); if (hit) names.push(exName(id)); });
      if (names.length) { C.changed[p.m] = now; items.push(names.join(', ') + ' 세트 +1'); }
    } else if (p.kind === 'deload') { C.deloadUntil = now + WEEK; C.lastDeload = now; items.push('디로드 주간 · ' + md(C.deloadUntil) + '까지 세트 절반'); }
  });
  C.lastReview = now;
  C.log = [{ at: now, items: items.length ? items : ['점검 · 그대로 유지'] }].concat(C.log || []).slice(0, 30);
  saveApp(); render(); toast(items.length ? '내 루틴에 이번 주 조정을 적용했어요' : '이번 주는 그대로 가요');
}
function endDeload() {
  const C = state.coach; if (!C || !(C.deloadUntil > Date.now())) return;
  C.deloadUntil = 0;
  C.log = [{ at: Date.now(), items: ['디로드 주간 끝냄'] }].concat(C.log || []).slice(0, 30);
  saveApp(); render(); toast('디로드를 끝냈어요. 다음 운동부터 원래 세트로 해요');
}
function bodyNotes() {
  const B = bodySorted(), out = [];
  if (B.length < 2) return out;
  const last = B[B.length - 1], base = B.slice(0, -1).reverse().find(b => last.at - b.at >= 13 * DAY) || B[0];
  const weeks = (last.at - base.at) / WEEK;
  if (weeks < 1) return out;
  if (last.w && base.w) {
    const rate = (last.w - base.w) / base.w / weeks * 100;
    if (rate < -1) out.push({ t: '몸무게가 주 ' + r1(-rate) + '%씩 줄고 있어요. 감량 중이라도 적자가 크면 근육 증가가 막힐 수 있으니 하루 500kcal 이내 적자를 권해요.', ref: [8] });
  }
  if (last.smm != null && base.smm != null) {
    const d = r1(last.smm - base.smm), T = proteinTarget();
    if (d <= -0.5) out.push({ t: md(base.at) + '보다 골격근량이 ' + Math.abs(d) + 'kg 줄었어요. 운동량은 유지하고 단백질을 ' + (T ? '하루 ' + T.g + 'g 이상' : '충분히') + ' 챙겨요.', ref: [8, 9] });
    else if (d >= 0.3) out.push({ t: md(base.at) + '보다 골격근량이 ' + d + 'kg 늘었어요.', ref: [] });
  }
  return out;
}

/* ── 코치 화면 ───────────────────────────────── */
function viewCoach() {
  const now = Date.now(), R = review(now);
  return head('내 몸 · 내 루틴 점검', '코치') + bodyCard() + volumeCard(now) + reviewCard(R, now) + logCard() + principlesHTML() + evidenceHTML();
}
function bodyCard() {
  const B = bodySorted(), last = B[B.length - 1], pf = state.profile;
  let h = '<div class="sec-h"><h2>내 몸</h2><button class="btn sm ghost" type="button" data-act="body-open">체성분 기록</button></div>';
  if (!last) return h + '<div class="card empty"><p>몸무게·체지방률·골격근량과 키·나이를 기록하면 변화 추이와 제지방량, FFMI, 하루 단백질 기준을 계산해요.</p><button class="btn primary" type="button" data-act="body-open">첫 기록 입력</button></div>';
  const prevOf = k => { for (let i = B.length - 2; i >= 0; i--) if (B[i][k] != null) return B[i][k]; return null; };
  const latest = k => { for (let i = B.length - 1; i >= 0; i--) if (B[i][k] != null) return B[i][k]; return null; };
  const tile = (l, k, unit) => {
    const v = last[k];
    if (v == null) return '<div><span>' + l + '</span><b>—</b><small>이번엔 미입력</small></div>';
    const pv = prevOf(k);
    return '<div><span>' + l + '</span><b>' + fmtN(v) + unit + '</b><small>' + (pv == null ? md(last.at) + ' 측정' : '지난번 ' + signed(r1(v - pv), unit)) + '</small></div>';
  };
  const w = latest('w'), bf = latest('bf'), hm = pf.height ? pf.height / 100 : null, d = [];
  if (w && hm) d.push('<span>BMI <b>' + r1(w / (hm * hm)) + '</b></span>');
  if (w && bf != null) { const lbm = w * (1 - bf / 100); d.push('<span>제지방량 <b>' + r1(lbm) + '</b>kg</span>'); if (hm) d.push('<span>FFMI <b>' + r1(lbm / (hm * hm)) + '</b></span>'); }
  const PT = proteinTarget();
  if (PT) d.push('<span>단백질 하루 <b>' + PT.g + '</b>g' + (PT.manual ? ' (직접 정함)' : refs([9, 11])) + '</span>');
  if (pf.height) d.push('<span>키 <b>' + fmtN(pf.height) + '</b>cm</span>'); else d.push('<span>키를 입력하면 BMI·FFMI도 계산해요</span>');
  if (pf.age) d.push('<span>나이 <b>' + esc(pf.age) + '</b></span>');
  const notes = bodyNotes();
  return h + '<section class="card body-card"><div class="kv">' + tile('몸무게', 'w', 'kg') + tile('체지방률', 'bf', '%') + tile('골격근량', 'smm', 'kg') + '</div>' +
    '<p class="derived">' + d.join('') + '</p>' +
    (notes.length ? '<ul class="notes">' + notes.map(n => '<li>' + esc(n.t) + refs(n.ref) + '</li>').join('') + '</ul>' : '') + '</section>';
}
function volumeCard(now) {
  const mon = mondayOf(now), cur = weekVolume(mon, now + DAY), prev = weekVolume(mon - WEEK, mon), rm = routineMuscles();
  const list = MUSCLES.filter(([m]) => rm.has(m) || cur[m] > 0 || prev[m] > 0);
  const h = '<div class="sec-h"><h2>이번 주 근육별 세트</h2><span class="ago">' + md(mon) + ' 월요일부터</span></div>';
  if (!list.length) return h + '<div class="card empty"><p>루틴을 만들고 운동을 기록하면 근육마다 이번 주에 몇 세트 했는지 지난주와 비교해 보여 줘요.</p><button class="btn" type="button" data-act="goto" data-v="routines">루틴 관리</button></div>';
  const max = Math.max(REF_SETS * 1.5, ...list.map(([m]) => Math.max(cur[m] || 0, prev[m] || 0)));
  const rows = list.map(([m, l]) => {
    const d = r1(cur[m] || 0), p = r1(prev[m] || 0);
    return '<div class="vol-row"><span>' + l + '</span><div class="vol-bar" role="img" aria-label="' + l + ' 이번 주 ' + fmtN(d) + '세트, 지난주 ' + fmtN(p) + '세트"><i class="' + (d >= REF_SETS ? 'full' : '') + '" style="width:' + (d / max * 100).toFixed(1) + '%"></i><b class="ref-line" style="left:' + (REF_SETS / max * 100).toFixed(1) + '%"></b></div>' +
      '<span class="nv">' + fmtN(d) + '<small>지난주 ' + fmtN(p) + '</small></span></div>';
  }).join('');
  return h + '<section class="card review"><div class="vol">' + rows + '</div><p class="hint">세로선은 근육당 주 10세트 참고선이에요 [1]. 보조로 쓰인 근육은 0.5세트로 셌어요 [2].</p></section>';
}
function reviewCard(R, now) {
  const C = state.coach || {}, deloadOn = C.deloadUntil > now;
  const next = R.first ? md((C.lastReview || R.first) + WEEK) : '';
  const KL = { vol: ['up', '▲ 세트'], deload: ['deload', '▼ 디로드'], note: ['stall', '참고'] };
  let body;
  if (!state.routines.length) body = '<p class="muted">루틴을 만들면 매주 내 루틴에서 제자리인 운동을 찾아 세트 조정과 회복 주간을 제안해요.</p>';
  else if (!R.first) body = '<p class="muted">운동을 기록하기 시작하면 일주일마다 내 루틴을 점검해요.</p>';
  else if (R.props.length) body = R.props.map(p => '<div class="prop"><span class="rec" data-k="' + KL[p.kind][0] + '"><b>' + KL[p.kind][1] + '</b></span><p>' + esc(p.text) + refs(p.ref) + '</p></div>').join('');
  else {
    const fresh = m => now - ((C.changed || {})[m] || 0) < 2 * WEEK;   // 방금 세트를 늘린 근육은 다음 기록이 쌓일 때까지 정체로 띄우지 않음
    const stall = Object.keys(R.stalled).filter(m => !fresh(m)).map(m => mLabel(m) + '(' + R.stalled[m].map(e => e.name).join(', ') + ')').join(' · ');
    body = '<p class="muted">' + (stall ? '정체 중: ' + esc(stall) + '. ' : '') + (R.due ? '지금은 바꿀 게 없어요. 잘 되고 있을 땐 루틴을 그대로 둬요.' : '다음 점검은 ' + next + '이에요. 그때 운동별로 제자리인지 보고 조정을 제안해요.') + '</p>';
  }
  const act = R.props.some(p => p.kind === 'vol' || p.kind === 'deload');
  return '<div class="sec-h"><h2>주간 점검</h2><span class="ago">' + (R.due ? '점검할 때예요' : next ? '다음 ' + next : '') + '</span></div>' +
    '<section class="card review">' + (deloadOn ? '<div class="notice">디로드 주간이에요. ' + md(C.deloadUntil) + '까지 루틴 세트가 절반으로 줄어요.<button class="btn sm ghost" type="button" data-act="deload-end">그만하기</button></div>' : '') + body +
    (R.due ? '<div class="row">' + (act ? '<button class="btn primary" type="button" data-act="review-apply">내 루틴에 적용</button>' : '') + '<button class="btn" type="button" data-act="review-skip">' + (act ? '이번 주는 그대로' : '확인했어요') + '</button></div>' : '') + '</section>';
}
function logCard() {
  const L = ((state.coach || {}).log || []).slice(0, 8);
  if (!L.length) return '';
  return '<div class="sec-h"><h2>변경 기록</h2></div><section class="card review"><ul class="log-list">' + L.map(e => '<li><span class="nv">' + md(e.at) + '</span><span>' + (e.items || []).map(esc).join(' · ') + '</span></li>').join('') + '</ul></section>';
}
function principlesHTML() {
  const L = [['큰 근육은 주 2회 이상, 근육당 주 10세트 안팎에서 시작해요.', [1, 2]], ['세트마다 실패 전 1–3회 남기고 끝내요.', [3]], ['범위 상한을 다 채우기 전엔 +1회, 모든 세트가 상한에 닿으면 증량해요.', [4]], ['세트 사이는 90초 이상 쉬어요.', [5]], ['근육이 늘어나는 깊은 구간까지 움직여요.', [10]]];
  return '<div class="sec-h"><h2>루틴 짤 때 참고</h2></div><section class="card review"><ul class="notes">' + L.map(([t, r]) => '<li>' + esc(t) + refs(r) + '</li>').join('') + '</ul></section>';
}
function evidenceHTML() {
  return '<details class="ev"><summary>근거 논문 ' + EVIDENCE.length + '편 <span>· 2026년 11월 기준</span></summary><ol>' +
    EVIDENCE.map(e => '<li><b>' + esc(e.t) + '</b><span class="src">' + esc(e.src) + '</span><p>' + esc(e.p) + '</p><p class="use">앱 적용: ' + esc(e.use) + '</p><a href="' + esc(e.u) + '" target="_blank" rel="noopener noreferrer">원문 보기</a></li>').join('') + '</ol></details>';
}
function bodyProgress(B) {
  const metrics = [['w', '몸무게', 'kg'], ['bf', '체지방률', '%'], ['smm', '골격근량', 'kg']];
  if (!metrics.some(m => m[0] === ui.metric)) ui.metric = 'w';
  const met = metrics.find(m => m[0] === ui.metric), k = met[0];
  const pts = B.filter(b => b[k] != null).map(b => ({ t: b.at, v: b[k] }));
  ui.chart = { pts, unit: met[2], type: 'body', title: met[1] };
  let h = '<section class="card chart-card"><div class="chart-h"><h2>체성분 <span class="muted">· ' + met[1] + '</span></h2><div class="seg sm" role="group" aria-label="지표">' + metrics.map(m => '<button type="button" data-act="metric" data-v="' + m[0] + '" aria-pressed="' + (m[0] === k) + '">' + m[1] + '</button>').join('') + '</div></div>' +
    '<div class="chart" id="chart" aria-label="체성분 그래프. 좌우 화살표로 날짜별 값을 볼 수 있어요."></div>' +
    (pts.length < 2 ? '<p class="chart-note">' + (pts.length ? '측정이 2번 이상 쌓이면 추세선이 그려져요.' : '아직 이 항목을 기록하지 않았어요.') + '</p>' : '') + '</section>';
  if (pts.length) {
    const last = pts[pts.length - 1], first = pts[0], ref4 = pts.slice(0, -1).reverse().find(p => last.t - p.t >= 27 * DAY);
    const tile = (l, v, sub) => '<div class="tile"><span class="lbl">' + l + '</span><b>' + v + '</b><small>' + sub + '</small></div>';
    h += '<div class="tiles">' + tile('최근', fmtN(last.v) + met[2], md(last.t)) + tile('첫 측정 대비', pts.length > 1 ? signed(r1(last.v - first.v), met[2]) : '—', md(first.t) + ' 기준') + tile('4주 변화', ref4 ? signed(r1(last.v - ref4.v), met[2]) : '—', ref4 ? md(ref4.t) + ' 기준' : '4주 이상 기록 필요') + '</div>';
  }
  const cell = v => v != null ? fmtN(v) : '—';
  const rows = B.slice().reverse().map(b => '<tr><td>' + md(b.at) + '</td><td class="n">' + cell(b.w) + '</td><td class="n">' + cell(b.bf) + '</td><td class="n">' + cell(b.smm) + '</td><td class="n"><button class="icon-btn xs ghost" type="button" data-act="body-del" data-id="' + esc(b.id) + '" aria-label="' + md(b.at) + ' 측정 지우기">' + ICON.trash + '</button></td></tr>').join('');
  h += '<section class="card tbl-card"><h2 class="tbl-h">측정 기록</h2><div class="tbl-wrap"><table class="rtbl"><thead><tr><th scope="col">날짜</th><th scope="col" class="n">몸무게</th><th scope="col" class="n">체지방률</th><th scope="col" class="n">골격근량</th><th scope="col" class="n"><span class="vh">삭제</span></th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  return h + '<div class="row center"><button class="btn primary" type="button" data-act="body-open">체성분 기록 추가</button></div>';
}

/* ── 체성분 시트 ─────────────────────────── */
function openBody() {
  const pf = state.profile;
  ui.bd = { date: dayKey(Date.now()), w: '', bf: '', smm: '', height: pf.height == null ? '' : pf.height, age: pf.age == null ? '' : pf.age };
  openSheet('body', bodyHTML());
}
function bodyHTML() {
  const d = ui.bd;
  const f = (id, key, label, mode, ph) => '<label for="' + id + '">' + label + '<input id="' + id + '" class="txt" ' + (mode === 'date' ? 'type="date"' : 'type="text" inputmode="' + mode + '" autocomplete="off"') + ' data-bf="' + key + '" value="' + esc(d[key]) + '"' + (ph ? ' placeholder="' + ph + '"' : '') + '></label>';
  return '<div class="sheet-h"><button class="btn ghost" type="button" data-act="sheet-close">취소</button><h2 id="sheet-title">체성분 기록</h2><button class="btn primary" type="button" data-act="body-save">저장</button></div>' +
    '<div class="sheet-b srows"><div class="fgrid">' +
    f('bd-date', 'date', '측정일', 'date') + f('bd-w', 'w', '몸무게 (kg)', 'decimal', '예: 72.5') +
    f('bd-bf', 'bf', '체지방률 (%)', 'decimal', '예: 15.2') + f('bd-smm', 'smm', '골격근량 (kg)', 'decimal', '예: 34.1') +
    f('bd-h', 'height', '키 (cm)', 'decimal', '예: 175') + f('bd-age', 'age', '나이', 'numeric', '예: 24') +
    '</div><p class="muted">체성분계 수치는 수분·식사에 따라 흔들려요. 같은 시간대, 같은 조건에서 재고 한 번보다 추세로 보세요. 비워 둔 칸은 저장하지 않아요.</p><p class="err" id="bd-err" role="alert" hidden></p></div>';
}
function saveBody() {
  const d = ui.bd; if (!d) return;
  const err = document.getElementById('bd-err');
  const val = (v, lo, hi) => { if (v === '' || v == null) return null; const n = num(v); return n != null && n >= lo && n <= hi ? r1(n) : NaN; };
  const w = val(d.w, 20, 300), bf = val(d.bf, 2, 70), smm = val(d.smm, 5, 100), height = val(d.height, 100, 250), age = val(d.age, 10, 100);
  const bad = [[w, '몸무게'], [bf, '체지방률'], [smm, '골격근량'], [height, '키'], [age, '나이']].filter(x => Number.isNaN(x[0])).map(x => x[1]);
  if (bad.length) { err.textContent = bad.join(', ') + ' 값을 다시 확인해 주세요.'; err.hidden = false; return; }
  if (w == null && bf == null && smm == null && height == null && age == null) { err.textContent = '하나 이상 입력해 주세요.'; err.hidden = false; return; }
  if (height != null) state.profile.height = height;
  if (age != null) state.profile.age = Math.round(age);
  if (w != null || bf != null || smm != null) {
    const p = String(d.date || '').split('-').map(Number);
    let at = p.length === 3 ? new Date(p[0], p[1] - 1, p[2], 12).getTime() : NaN;
    if (!Number.isFinite(at)) at = Date.now();
    const k = dayKey(at), same = state.body.find(b => dayKey(b.at) === k);
    if (same) { if (w != null) same.w = w; if (bf != null) same.bf = bf; if (smm != null) same.smm = smm; }
    else state.body.push({ id: uid(), at, w, bf, smm });
    state.body.sort((a, b) => a.at - b.at);
  }
  saveApp(); closeSheet(); render(); toast('체성분을 기록했어요');
}
async function delBody(id) {
  const b = state.body.find(x => x.id === id); if (!b) return;
  if (!(await ask(md(b.at) + ' 측정 기록을 지울까요?', '지우기'))) return;
  state.body = state.body.filter(x => x.id !== id);
  saveApp(); render();
}
/* ── 단백질: 목표 · 기록 ─────────────────────── */
const pday = () => ui.pday || dayKey(Date.now());
const pEntries = dk => ((state.pmonths[dk.slice(0, 7)] || {})[dk] || []);
const pTotal = list => r1(list.reduce((a, e) => a + (Number(e.p) || 0), 0));
const customFoods = () => state.nutri.custom.map(c => Object.assign({ mine: true }, c));
const allFoods = () => FOODS.concat(customFoods());
const foodById = k => FOOD_MAP[k] || customFoods().find(c => c.k === k) || null;
const catLabel = f => (PCATS.find(c => c[0] === (f.mine ? 'mine' : f.c)) || [])[1] || '';
const srcLabel = f => f.mine ? '직접 추가한 음식' : FOOD_SRC[f.src] || '';
const pBar = (v, g) => '<span class="p-bar" aria-hidden="true"><i class="' + (v >= g ? 'full' : '') + '" style="width:' + Math.min(100, v / g * 100).toFixed(1) + '%"></i></span>';
function latestWeight() { const B = bodySorted(); for (let i = B.length - 1; i >= 0; i--) if (B[i].w != null) return B[i]; return null; }
// 하루 목표: 직접 정한 값, 아니면 최근 몸무게 × g/kg(기본 1.6) [9]. 끼니당은 하루 목표 ÷ 4 (0.4–0.55g/kg × 4끼) [11]
function proteinTarget() {
  const N = state.nutri, b = latestWeight();
  const g = N.target ? N.target : b ? Math.round(b.w * N.factor) : null;
  if (!g) return null;
  return { g, manual: !!N.target, perMeal: Math.round(g / 4), w: b ? b.w : null, factor: N.factor };
}
function recentFoods() {
  const cut = Date.now() - 30 * DAY, mk0 = monthKey(cut), cnt = new Map();
  for (const [mk, days] of Object.entries(state.pmonths)) {
    if (mk < mk0 || !days) continue;
    for (const list of Object.values(days)) for (const e of list || []) {
      if (!e || !e.k || e.at < cut) continue;
      const c = cnt.get(e.k) || { n: 0, t: 0 }; c.n++; c.t = Math.max(c.t, e.at); cnt.set(e.k, c);
    }
  }
  return [...cnt.entries()].sort((a, b) => b[1].n - a[1].n || b[1].t - a[1].t).map(([k]) => foodById(k)).filter(Boolean).slice(0, 12);
}
function pushProtein(e) {
  const dk = pday(), mk = dk.slice(0, 7), today = dk === dayKey(Date.now());
  const [y, m, d] = dk.split('-').map(Number);
  const entry = Object.assign({ id: uid(), at: today ? Date.now() : new Date(y, m - 1, d, 12).getTime() }, e, today ? {} : { nt: 1 });
  const days = state.pmonths[mk] = state.pmonths[mk] || {};
  (days[dk] = days[dk] || []).push(entry);
  days[dk].sort((a, b) => a.at - b.at);
  savePMonth(mk);
  return entry;
}
function findEntry(id) {
  for (const [mk, days] of Object.entries(state.pmonths)) for (const [dk, list] of Object.entries(days || {})) {
    const i = (list || []).findIndex(e => e && e.id === id);
    if (i >= 0) return { mk, dk, list, i };
  }
  return null;
}
function removeEntry(id) {
  const f = findEntry(id); if (!f) return null;
  const [e] = f.list.splice(f.i, 1);
  if (!f.list.length) delete state.pmonths[f.mk][f.dk];
  savePMonth(f.mk); render();
  return { e, mk: f.mk, dk: f.dk };
}
function addedToast(e) {
  const T = proteinTarget(), tot = pTotal(pEntries(pday()));
  toast(e.n + ' +' + fmtN(e.p) + 'g · 합계 ' + fmtN(tot) + (T ? '/' + T.g : '') + 'g', '되돌리기', () => removeEntry(e.id));
}
function addFood(f, x, amt) {
  const byAmt = amt != null && !!f.q;
  const p = r1(byAmt ? f.p * amt / f.q : f.p * x);
  const e = pushProtein({ k: f.k, n: f.n, d: byAmt ? fmtN(amt) + f.u : x === 1 ? f.s : f.s + ' × ' + fmtX(x), p });
  render(); addedToast(e);
}
function delProtein(id) {
  const r = removeEntry(id); if (!r) return;
  toast(r.e.n + ' 기록을 지웠어요', '되돌리기', () => {
    const days = state.pmonths[r.mk] = state.pmonths[r.mk] || {};
    (days[r.dk] = days[r.dk] || []).push(r.e);
    days[r.dk].sort((a, b) => a.at - b.at);
    savePMonth(r.mk); render();
  });
}

/* ── 단백질 화면 ─────────────────────────────── */
function proteinMini() {
  const T = proteinTarget(), tot = pTotal(pEntries(dayKey(Date.now())));
  if (!T && !tot) return '';
  return '<button class="card p-mini" type="button" data-act="goto" data-v="protein" aria-label="오늘 단백질 ' + fmtN(tot) + 'g' + (T ? ', 목표 ' + T.g + 'g' : '') + '. 단백질 탭 열기">' +
    '<span class="p-mini-top"><span class="lbl">오늘 단백질</span><span><b>' + fmtN(tot) + '</b><small> / ' + (T ? T.g + 'g' : '목표 미정') + '</small></span></span>' +
    (T ? pBar(tot, T.g) : '') + '</button>';
}
function viewProtein() {
  const dk = pday(), todayK = dayKey(Date.now()), isToday = dk === todayK;
  const [y, m, d] = dk.split('-').map(Number), dt = new Date(y, m - 1, d);
  const list = pEntries(dk), tot = pTotal(list), T = proteinTarget();
  if (ui.pcat == null) ui.pcat = recentFoods().length ? 'recent' : 'food';
  let h = head(T ? '하루 목표 ' + T.g + '<span class="nt">g</span>' : '하루 목표 미정', '단백질');
  h += '<div class="daynav"><button class="icon-btn sm" type="button" data-act="p-day" data-v="-1" aria-label="전날">‹</button><b>' + m + '월 ' + d + '일 (' + DOW[dt.getDay()] + ')' + (isToday ? ' · 오늘' : '') + '</b>' +
    '<button class="icon-btn sm" type="button" data-act="p-day" data-v="1" aria-label="다음 날"' + (isToday ? ' disabled' : '') + '>›</button></div>';
  if (T) {
    const left = r1(T.g - tot);
    h += '<section class="card p-sum" aria-label="단백질 합계"><div class="p-big"><b>' + fmtN(tot) + '</b><span>/ ' + T.g + 'g</span></div>' + pBar(tot, T.g) +
      '<p class="p-meta"><span>' + (left > 0 ? '남은 양 <b>' + fmtN(left) + '</b>g' : '목표 달성' + (left < 0 ? ' <b>+' + fmtN(-left) + '</b>g' : '')) + '</span>' +
      '<span>끼니당 약 <b>' + T.perMeal + '</b>g × 4끼' + refs([11]) + '</span>' +
      '<span>' + (T.manual ? '직접 정한 목표' : '체중 ' + fmtN(T.w) + 'kg × ' + T.factor.toFixed(1) + 'g' + refs([9])) + '</span></p>' +
      '<div class="row"><button class="btn sm" type="button" data-act="p-target-open">목표 바꾸기</button></div></section>';
  } else {
    h += '<section class="card empty"><h2>하루 목표부터 정해요</h2><p>몸무게를 기록하면 체중 1kg당 1.6g으로 하루 단백질 목표를 계산해요' + refs([9]) + '.' + (tot ? ' 이날 먹은 양은 ' + fmtN(tot) + 'g이에요.' : '') + '</p>' +
      '<div class="row"><button class="btn primary" type="button" data-act="body-open">몸무게 기록</button><button class="btn" type="button" data-act="p-target-open">직접 정하기</button></div></section>';
  }
  h += '<div class="sec-h"><h2>먹은 음식 더하기</h2>' + (isToday ? '' : '<span class="ago">' + m + '/' + d + '에 기록돼요</span>') + '</div>';
  h += '<section class="card padd"><input id="p-search" class="txt" type="search" value="' + esc(ui.pq) + '" placeholder="음식·메뉴·제품 검색 (예: 김치찌개, 닭가슴살)" autocomplete="off" enterkeyhint="search" aria-label="음식 검색">' +
    '<div class="chips" role="group" aria-label="음식 분류" id="p-chips">' + PCATS.map(([k, l]) => '<button type="button" class="chip" id="pcat-' + k + '" data-act="p-cat" data-v="' + k + '" aria-pressed="' + (!ui.pq.trim() && ui.pcat === k) + '">' + l + '</button>').join('') + '</div>' +
    '<ul class="flist" id="p-flist" aria-label="음식 목록">' + foodListHTML() + '</ul>' +
    '<div class="row"><button class="btn sm" type="button" data-act="p-quick-open">단백질 양만 입력</button><button class="btn sm" type="button" data-act="p-custom-open">+ 내 음식 추가</button></div></section>';
  h += '<div class="sec-h"><h2>' + (isToday ? '오늘' : m + '월 ' + d + '일') + ' 먹은 것</h2>' + (list.length ? '<span class="ago">' + list.length + '개 · ' + fmtN(tot) + 'g</span>' : '') + '</div>';
  h += list.length
    ? '<section class="card"><ul class="plog">' + list.map(e => '<li><span class="tm">' + (e.nt ? '—' : hm(e.at)) + '</span><span class="nm">' + esc(e.n) + (e.d ? '<small>' + esc(e.d) + '</small>' : '') + '</span><span class="pv">' + fmtN(e.p) + 'g</span>' +
        '<button class="icon-btn xs ghost" type="button" data-act="p-del" data-id="' + esc(e.id) + '" aria-label="' + esc(e.n) + ' 기록 지우기">' + ICON.trash + '</button></li>').join('') + '</ul></section>'
    : '<div class="card empty"><p>' + (isToday ? '아직 기록이 없어요. 위 목록에서 음식을 고르면 단백질이 자동으로 더해져요.' : '이날은 기록이 없어요. 지금 더하면 이 날짜에 들어가요.') + '</p></div>';
  h += weekHTML(dk, T);
  h += '<p class="fsrc">음식 데이터: 한식·중식·일식·양식·분식 메뉴는 식약처 식품영양성분 자료집(2020)과 외식영양성분자료집 통합본(2019)의 1인분 값(NOFAT 정리), 식재료는 식약처 식품성분 DB(100g당 값을 1회 분량으로 환산)와 대한당뇨병학회 식품교환표(어육류 1교환 단백질 8g · 곡류 2g · 우유 200ml 6g), ProteinLab 단백질 음료 DB(2026년 11월 확인), 파우더는 제품 영양 정보. 메뉴는 식당·레시피마다, 제품은 맛과 리뉴얼에 따라 수치가 달라질 수 있어요. 먹은 양이 다르면 분량이나 g으로 맞춰 주세요. 포장지 값과 다르면 ‘내 음식’으로 추가해 주세요. 목표 근거는 코치 탭 근거 논문 9·11번이에요.</p>';
  return h;
}
function foodListHTML() {
  const q = norm(ui.pq).replace(/\s+/g, ''), mode = ui.pcat;
  let list, empty = '';
  if (q) {
    list = allFoods().filter(f => norm(f.n + catLabel(f)).replace(/\s+/g, '').includes(q));
    empty = '‘' + ui.pq.trim() + '’ 검색 결과가 없어요. 아래 ‘내 음식 추가’로 넣어 두면 다음부터 바로 찾을 수 있어요.';
  } else if (mode === 'recent') { list = recentFoods(); empty = '최근 30일 동안 자주 먹은 음식이 여기에 모여요.'; }
  else if (mode === 'mine') { list = customFoods(); empty = '목록에 없는 음식이나 제품을 포장지 영양 정보대로 추가해 두세요.'; }
  else list = FOODS.filter(f => f.c === mode);
  if (!list.length) return '<li class="fempty muted">' + esc(empty) + '</li>';
  const more = !q && !ui.pmore && list.length > P_LIMIT + 2, shown = more ? list.slice(0, P_LIMIT) : list;
  return shown.map(f => foodRow(f, !!q || mode === 'recent', !q && mode === 'mine')).join('') +
    (more ? '<li><button class="btn sm ghost fmore" type="button" data-act="p-more">전체 ' + list.length + '개 보기</button></li>' : '');
}
function foodRow(f, withCat, canDel) {
  return '<li><button class="fitem" type="button" data-act="p-pick" data-id="' + esc(f.k) + '"><span class="nm">' + esc(f.n) + '<small>' + esc(f.s) + (withCat ? ' · ' + esc(catLabel(f)) : '') + '</small></span><span class="pv">' + fmtN(f.p) + 'g</span></button>' +
    (canDel ? '<button class="icon-btn xs ghost" type="button" data-act="p-custom-del" data-id="' + esc(f.k) + '" aria-label="' + esc(f.n) + ' 내 음식에서 지우기">' + ICON.trash + '</button>' : '') +
    '<button class="icon-btn sm" type="button" data-act="p-add" data-id="' + esc(f.k) + '" aria-label="' + esc(f.n) + ' ' + esc(f.s) + ' 바로 더하기">' + ICON.plus + '</button></li>';
}
function renderFoodList() {
  const ul = document.getElementById('p-flist'); if (!ul) return;
  ul.innerHTML = foodListHTML();
  const searching = !!ui.pq.trim();
  document.querySelectorAll('#p-chips .chip').forEach(b => b.setAttribute('aria-pressed', String(!searching && b.dataset.v === ui.pcat)));
}
function weekHTML(sel, T) {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const [sy, sm, sd] = sel.split('-').map(Number), selT = new Date(sy, sm - 1, sd).getTime();
  const end = Math.round((t0.getTime() - selT) / DAY) <= 6 ? t0 : new Date(selT), todayK = dayKey(Date.now());
  const days = Array.from({ length: 7 }, (_, i) => { const dt = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6 + i); const k = dayKey(dt.getTime()); return { k, dt, v: pTotal(pEntries(k)) }; });
  const tg = T ? T.g : 0, logged = days.filter(x => x.v > 0);
  const max = Math.max(tg * 1.25, Math.max(...days.map(x => x.v)) * 1.18, 10);
  const avg = logged.length ? Math.round(logged.reduce((a, x) => a + x.v, 0) / logged.length) : 0;
  const hit = tg ? days.filter(x => x.v >= tg).length : 0;
  const bars = days.map(x => {
    const hp = (x.v / max * 100).toFixed(1), ok = tg && x.v >= tg;
    return '<button type="button" class="wk" data-act="p-wk" data-v="' + x.k + '" aria-pressed="' + (x.k === sel) + '" aria-label="' + (x.dt.getMonth() + 1) + '월 ' + x.dt.getDate() + '일 단백질 ' + fmtN(x.v) + 'g' + (ok ? ', 목표 달성' : '') + '">' +
      '<i class="' + (ok ? 'ok' : '') + '" style="height:' + hp + '%"></i>' + (x.v ? '<span class="v" style="bottom:calc(' + hp + '% + 4px)">' + Math.round(x.v) + '</span>' : '') + '</button>';
  }).join('');
  return '<div class="sec-h"><h2>최근 7일</h2>' + (logged.length ? '<span class="ago">기록한 날 평균 ' + avg + 'g' + (tg ? ' · 목표 달성 ' + hit + '일' : '') + '</span>' : '') + '</div>' +
    '<section class="card wk-card"><div class="wk-bars">' + (tg ? '<span class="tline" style="bottom:' + (tg / max * 100).toFixed(1) + '%" aria-hidden="true"></span>' : '') + bars + '</div>' +
    '<div class="wk-labels" aria-hidden="true">' + days.map(x => '<span' + (x.k === sel ? ' class="on"' : '') + '>' + (x.k === todayK ? '오늘' : (x.dt.getMonth() + 1) + '/' + x.dt.getDate()) + '</span>').join('') + '</div>' +
    '<p class="hint">' + (tg ? '가로선은 하루 목표 ' + tg + 'g, 초록 막대는 목표를 채운 날이에요. ' : '') + '막대를 누르면 그날 기록을 봐요.</p></section>';
}

/* ── 단백질 시트: 분량 · 내 음식 · 직접 입력 · 목표 ─ */
function openAmt(k) { if (!foodById(k)) return; ui.pa = { k, x: 1, amt: '' }; openSheet('p-amt', amtHTML()); }
function amtVal() {
  const f = foodById(ui.pa.k), s = String(ui.pa.amt).trim(), a = s ? num(s) : null;
  const byAmt = !!(f && f.q && a != null && a > 0);
  return { f, s, a, byAmt, p: f ? r1(byAmt ? f.p * a / f.q : f.p * ui.pa.x) : 0 };
}
function amtHTML() {
  const { f, byAmt, p } = amtVal(); if (!f) return '';
  return '<div class="sheet-h"><button class="btn ghost" type="button" data-act="sheet-close">취소</button><h2 id="sheet-title">얼마나 먹었어요?</h2><button class="btn primary" type="button" data-act="p-amt-save">더하기</button></div>' +
    '<div class="sheet-b srows">' +
    '<section class="srow"><h3>' + esc(f.n) + '</h3><p>' + esc(f.s) + '에 단백질 ' + fmtN(f.p) + 'g · ' + esc(srcLabel(f)) + '</p></section>' +
    '<section class="srow"><h3>분량 <span class="muted">(1 = ' + esc(f.s) + ')</span></h3><div class="seg" role="group" aria-label="분량">' +
      P_X.map(v => '<button type="button" id="pa-x' + String(v).replace('.', '_') + '" data-act="p-amt" data-v="' + v + '" aria-pressed="' + (!byAmt && ui.pa.x === v) + '">' + fmtX(v) + '</button>').join('') + '</div></section>' +
    (f.q ? '<section class="srow"><h3>또는 먹은 양 (' + f.u + ')</h3><div class="field amt"><input id="pa-amt" data-pa="amt" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" value="' + esc(ui.pa.amt) + '" placeholder="' + fmtN(f.q) + '" aria-label="먹은 양 ' + f.u + '"><span class="u">' + f.u + '</span></div></section>' : '') +
    '<p class="p-calc" id="pa-calc" aria-live="polite">단백질 <b>' + fmtN(p) + '</b>g</p></div>';
}
function amtSync() {
  const { byAmt, p } = amtVal();
  const c = document.getElementById('pa-calc'); if (c) c.innerHTML = '단백질 <b>' + fmtN(p) + '</b>g';
  document.querySelectorAll('[data-act="p-amt"]').forEach(b => b.setAttribute('aria-pressed', String(!byAmt && +b.dataset.v === ui.pa.x)));
}
function saveAmt() {
  if (!ui.pa) return;
  const { f, s, a, byAmt } = amtVal(), x = ui.pa.x; if (!f) return;
  if (s && (!byAmt || a > 5000)) { toast('먹은 양을 다시 확인해 주세요'); focusLater('pa-amt'); return; }
  closeSheet(); addFood(f, x, byAmt ? a : null);
}
function openCustom() {
  ui.pc = { n: ui.pq.trim(), c: ['drink', 'powder'].includes(ui.pcat) ? ui.pcat : 'food', q: '', u: 'g', p: '' };
  openSheet('p-custom', customHTML());
}
function customHTML() {
  const d = ui.pc;
  const tg = (f, cls, list) => '<div class="' + cls + '" role="group">' + list.map(([v, l]) => '<button type="button" id="pc-' + f + '-' + v + '" data-act="pc-set" data-f="' + f + '" data-v="' + v + '" aria-pressed="' + (d[f] === v) + '">' + l + '</button>').join('') + '</div>';
  return '<div class="sheet-h"><button class="btn ghost" type="button" data-act="sheet-close">취소</button><h2 id="sheet-title">내 음식 추가</h2><button class="btn primary" type="button" data-act="p-custom-save">저장</button></div>' +
    '<div class="sheet-b srows">' +
    '<section class="srow"><label class="lbl" for="pc-n">이름</label><input id="pc-n" class="txt" data-pc="n" value="' + esc(d.n) + '" placeholder="예: 편의점 닭가슴살 소시지" autocomplete="off" maxlength="60"></section>' +
    '<section class="srow"><h3>분류</h3>' + tg('c', 'tg', [['food', '음식'], ['drink', '단백질 음료'], ['powder', '단백질 파우더']]) + '</section>' +
    '<section class="srow"><h3>1회 기준 <span class="muted">(선택)</span></h3><div class="row"><input id="pc-q" class="num wide" data-pc="q" type="text" inputmode="decimal" autocomplete="off" value="' + esc(d.q) + '" placeholder="예: 100" aria-label="1회 기준 양">' +
      tg('u', 'seg sm', [['g', 'g'], ['ml', 'ml'], ['ea', '개']]) + '</div><p>포장지 영양 정보의 1회 제공량을 넣으면 먹은 양을 g·ml로 넣어도 계산해요. 비우면 ‘1회’로 저장해요.</p></section>' +
    '<section class="srow"><label class="lbl" for="pc-p">그 양에 든 단백질 (g)</label><input id="pc-p" class="num wide" data-pc="p" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" value="' + esc(d.p) + '" placeholder="예: 20"></section>' +
    '<p class="err" id="pc-err" role="alert" hidden></p></div>';
}
function saveCustom() {
  const d = ui.pc; if (!d) return;
  const err = document.getElementById('pc-err'), fail = m => { err.textContent = m; err.hidden = false; };
  const n = String(d.n || '').trim().replace(/\s+/g, ' ').slice(0, 60), qs = String(d.q || '').trim(), q = qs ? num(qs) : null, p = num(d.p);
  if (!n) return fail('이름을 입력해 주세요.');
  if (state.nutri.custom.some(c => norm(c.n) === norm(n))) return fail('내 음식에 같은 이름이 이미 있어요.');
  if (qs && (q == null || q <= 0 || q > 5000)) return fail('1회 기준 양을 다시 확인해 주세요.');
  if (p == null || p < 0 || p > 200) return fail('단백질은 0–200g 사이로 넣어 주세요.');
  const byW = !!q && d.u !== 'ea';
  state.nutri.custom.push({ k: 'c_' + uid(), n, c: d.c, s: q ? fmtN(q) + (d.u === 'ea' ? '개' : d.u) : '1회', q: byW ? q : null, u: byW ? d.u : null, p: r1(p) });
  saveApp(); closeSheet();
  ui.pq = ''; ui.pcat = 'mine'; ui.pmore = false; render();
  toast('‘' + n + '’ 추가했어요. + 를 누르면 바로 더해져요');
}
async function delCustom(k) {
  const c = state.nutri.custom.find(x => x.k === k); if (!c) return;
  if (!(await ask('내 음식에서 ‘' + c.n + '’ 항목을 지울까요? 이미 더한 기록은 그대로 남아요.', '지우기'))) return;
  state.nutri.custom = state.nutri.custom.filter(x => x.k !== k);
  saveApp(); render();
}
function openQuick() { ui.pk = { n: '', p: '' }; openSheet('p-quick', quickHTML()); }
function quickHTML() {
  const d = ui.pk;
  return '<div class="sheet-h"><button class="btn ghost" type="button" data-act="sheet-close">취소</button><h2 id="sheet-title">단백질 양만 입력</h2><button class="btn primary" type="button" data-act="p-quick-save">더하기</button></div>' +
    '<div class="sheet-b srows">' +
    '<section class="srow"><label class="lbl" for="pk-p">단백질 (g)</label><input id="pk-p" class="num wide" data-pk="p" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" value="' + esc(d.p) + '" placeholder="예: 25"></section>' +
    '<section class="srow"><label class="lbl" for="pk-n">메모 <span class="muted">(선택)</span></label><input id="pk-n" class="txt" data-pk="n" value="' + esc(d.n) + '" placeholder="예: 회사 점심 제육볶음" autocomplete="off" maxlength="60"></section>' +
    '<p class="muted">영양 정보에서 단백질 g을 알 때 바로 더해요. 자주 먹는 거라면 ‘내 음식 추가’로 저장해 두는 게 편해요.</p>' +
    '<p class="err" id="pk-err" role="alert" hidden></p></div>';
}
function saveQuick() {
  const d = ui.pk; if (!d) return;
  const p = num(d.p), err = document.getElementById('pk-err');
  if (p == null || p <= 0 || p > 300) { err.textContent = '단백질 양을 0–300g 사이로 넣어 주세요.'; err.hidden = false; return; }
  const n = String(d.n || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  closeSheet();
  const e = pushProtein({ k: null, n: n || '직접 입력', d: n ? '직접 입력' : '', p: r1(p) });
  render(); addedToast(e);
}
function openTarget() { ui.pt = { f: state.nutri.factor, g: state.nutri.target ? String(state.nutri.target) : '' }; openSheet('p-target', targetHTML()); }
function targetHTML() {
  const d = ui.pt, b = latestWeight(), manual = String(d.g).trim() !== '';
  return '<div class="sheet-h"><button class="btn ghost" type="button" data-act="sheet-close">취소</button><h2 id="sheet-title">하루 단백질 목표</h2><button class="btn primary" type="button" data-act="p-target-save">저장</button></div>' +
    '<div class="sheet-b srows">' +
    '<section class="srow"><h3>체중 1kg당</h3><p>' + (b ? '최근 몸무게 ' + fmtN(b.w) + 'kg(' + md(b.at) + ' 측정) 기준이에요.' : '몸무게를 기록하면 이 기준으로 g을 계산해요.') + '</p>' +
      '<div class="tg" role="group" aria-label="체중 1kg당 단백질">' + P_FACTORS.map(f => '<button type="button" id="pt-f' + String(f).replace('.', '_') + '" data-act="pt-f" data-v="' + f + '" aria-pressed="' + (!manual && d.f === f) + '">' + f.toFixed(1) + 'g' + (b ? ' · ' + Math.round(b.w * f) + 'g' : '') + '</button>').join('') + '</div>' +
      (b ? '' : '<button class="btn sm" type="button" data-act="body-open">몸무게 기록</button>') + '</section>' +
    '<section class="srow"><h3>직접 정하기 <span class="muted">(선택)</span></h3><div class="row"><input id="pt-g" class="num wide" data-pt="g" type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" value="' + esc(d.g) + '" placeholder="예: 130" aria-label="하루 목표 g"><span class="muted">g</span></div><p>값을 넣으면 체중 기준 대신 이 값을 써요. 비우면 체중 기준으로 돌아가요.</p></section>' +
    '<section class="srow"><h3>근거</h3><ul class="notes">' +
      '<li>하루 1.6g/kg보다 더 먹어도 근육 증가가 더 늘지 않았어요. 개인차를 생각해 2.2g/kg까지를 권해요' + refs([9, 11]) + '</li>' +
      '<li>끼니당 0.4g/kg 정도씩 하루 4번 이상 나눠 먹는 걸 권해요' + refs([11]) + '</li>' +
      '<li>신장 질환이 있다면 단백질을 늘리기 전에 의사와 먼저 상의해 주세요.</li></ul></section>' +
    '<p class="err" id="pt-err" role="alert" hidden></p></div>';
}
function ptSync() {
  const manual = String(ui.pt.g).trim() !== '';
  document.querySelectorAll('[data-act="pt-f"]').forEach(b => b.setAttribute('aria-pressed', String(!manual && +b.dataset.v === ui.pt.f)));
}
function saveTarget() {
  const d = ui.pt; if (!d) return;
  const s = String(d.g).trim(), g = s ? num(s) : null, err = document.getElementById('pt-err');
  if (s && (g == null || g < 20 || g > 400)) { err.textContent = '목표는 20–400g 사이로 넣어 주세요.'; err.hidden = false; return; }
  state.nutri.factor = d.f; state.nutri.target = g == null ? null : Math.round(g);
  saveApp(); closeSheet(); render();
  const T = proteinTarget();
  toast(T ? '하루 목표를 ' + T.g + 'g으로 정했어요' : '저장했어요. 몸무게를 기록하면 목표가 계산돼요');
}
function shiftPday(n) {
  const [y, m, d] = pday().split('-').map(Number), k = dayKey(new Date(y, m - 1, d + n).getTime());
  ui.pday = k >= dayKey(Date.now()) ? null : k;
  render();
}

/* ── 이벤트 ───────────────────────────────────── */
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-act],[data-tab]');
  if (!t || t.disabled) return;
  if (Date.now() - drag.ended < 250 && t.closest('.ed-item')) return;   // 끌어서 놓은 직후의 클릭은 무시
  if (t.dataset.tab) { switchTab(t.dataset.tab); return; }
  const a = t.dataset.act, e = +t.dataset.e, s = +t.dataset.s, id = t.dataset.id, k = t.dataset.k, v = t.dataset.v;
  switch (a) {
    case 'settings': openSheet('settings', settingsHTML()); break;
    case 'goto': switchTab(v); break;
    case 'start': startRoutine(id); break;
    case 'start-free': startFree(); break;
    case 'done': toggleDone(e, s); break;
    case 'use-prev': usePrev(e, s); break;
    case 'addset': addSet(e); break;
    case 'delset': delSet(e); break;
    case 'rmex': rmEx(e); break;
    case 'addex-open': ui.addEx = true; ui.addExName = ''; render(); focusLater('addex-name'); break;
    case 'addex-type': ui.addExType = typeOf(v); render(); break;
    case 'addex-cancel': ui.addEx = false; render(); break;
    case 'addex-ok': addExToSession(); break;
    case 'finish': finish(); break;
    case 'discard': discard(); break;
    case 'rest-add': restAdd(); break;
    case 'rest-skip': stopRest(); break;
    case 'new-routine': openEditor(null); break;
    case 'preset-add': addPresets(); break;
    case 'edit': openEditor(id); break;
    case 'ed-type': { const it = edItem(k); if (it) { edSetType(it, v); refreshSheet(); } break; }
    case 'ed-tg': {
      const it = edItem(k); if (!it) break;
      it.open = !it.open;
      const b = document.getElementById('ed-' + k + '-tg'), d = document.getElementById('ed-' + k + '-d'), box = d && d.closest('.ed-item');
      if (b) b.setAttribute('aria-expanded', String(it.open)); if (d) d.hidden = !it.open; if (box) box.classList.toggle('open', it.open);
      break;
    }
    case 'ed-pick': if (edit) { edit.pick = { sel: [], q: '' }; refreshSheet(); document.getElementById('sheet-panel').scrollTop = 0; } break;
    case 'pk-tg': pkToggle(t); break;
    case 'pk-ok': pkAdd(); break;
    case 'pk-back': if (edit) { edit.pick = null; refreshSheet(); } break;
    case 'xs-new': newXs(); break;
    case 'xs-del': delXs(); break;
    case 'pl-tg': plToggle(t); break;
    case 'rt-tg': { const open = !ui.rtOpen.has(id); if (open) ui.rtOpen.add(id); else ui.rtOpen.delete(id); t.setAttribute('aria-expanded', String(open)); const d = document.getElementById(t.getAttribute('aria-controls')); if (d) d.hidden = !open; break; }
    case 'ed-up': edMove(k, -1); break;
    case 'ed-down': edMove(k, 1); break;
    case 'ed-rm': edit.items = edit.items.filter(x => x.k !== k); if (!edit.items.length) edit.items.push(blankItem()); refreshSheet(); break;
    case 'ed-add': { const it = blankItem(); edit.items.push(it); refreshSheet(); focusLater('ed-' + it.k + '-name'); break; }
    case 'ed-save': edSave(); break;
    case 'ed-del': edDelete(); break;
    case 'sheet-close': closeSheet(); break;
    case 'set-rest': state.settings.rest = +v; saveApp(); refreshSheet(); break;
    case 'set-sound': state.settings.sound = v === '1'; saveApp(); refreshSheet(); break;
    case 'export': exportData(); break;
    case 'copy-export': copyExport(); break;
    case 'delsess': delSession(id); break;
    case 'sess-edit': openSessEdit(id); break;
    case 'se-add-set': if (ui.se) { const e = ui.se.entries[+t.dataset.i]; if (e) { const l = e.sets[e.sets.length - 1]; e.sets.push({ w: l ? l.w : '', r: '' }); refreshSheet(); focusLater('se-r-' + t.dataset.i + '-' + (e.sets.length - 1)); } } break;
    case 'se-del-set': if (ui.se) { const e = ui.se.entries[+t.dataset.i]; if (e) { e.sets.splice(+t.dataset.j, 1); refreshSheet(); } } break;
    case 'se-rm-ex': if (ui.se) { ui.se.entries.splice(+t.dataset.i, 1); refreshSheet(); } break;
    case 'se-type': if (ui.se) { ui.se.addType = typeOf(v); refreshSheet(); } break;
    case 'se-add-ex': seAddEx(); break;
    case 'se-save': saveSessEdit(); break;
    case 'pick-ex': ui.progEx = id; ui.metric = null; render(); break;
    case 'pick-part': ui.progPart = v; ui.progEx = null; ui.metric = null; render(); break;
    case 'metric': ui.metric = v; render(); break;
    case 'xs-open': openXs(id); break;
    case 'xs-type': if (ui.xs) { ui.xs.type = typeOf(v); refreshSheet(); } break;
    case 'xs-save': saveXs(); break;
    case 'cal-prev': case 'cal-next': { const d = new Date(ui.calMonth || Date.now()); ui.calMonth = new Date(d.getFullYear(), d.getMonth() + (a === 'cal-next' ? 1 : -1), 1).getTime(); render(); break; }
    case 'cal-pick': ui.calDay = v; render(); break;
    case 'body-open': openBody(); break;
    case 'body-save': saveBody(); break;
    case 'body-del': delBody(id); break;
    case 'deload-end': endDeload(); break;
    case 'review-apply': applyReview(true); break;
    case 'review-skip': applyReview(false); break;
    case 'toast-act': toastAct(); break;
    case 'p-day': shiftPday(+v); break;
    case 'p-wk': ui.pday = v >= dayKey(Date.now()) ? null : v; render(); break;
    case 'p-cat': ui.pcat = v; ui.pq = ''; ui.pmore = false; render(); break;
    case 'p-more': ui.pmore = true; renderFoodList(); break;
    case 'p-add': { const f = foodById(id); if (f) addFood(f, 1, null); break; }
    case 'p-pick': openAmt(id); break;
    case 'p-amt': if (ui.pa) { ui.pa.x = +v; ui.pa.amt = ''; const inp = document.getElementById('pa-amt'); if (inp) inp.value = ''; amtSync(); } break;
    case 'p-amt-save': saveAmt(); break;
    case 'p-del': delProtein(id); break;
    case 'p-custom-open': openCustom(); break;
    case 'p-custom-save': saveCustom(); break;
    case 'p-custom-del': delCustom(id); break;
    case 'pc-set': if (ui.pc) { ui.pc[t.dataset.f] = v; refreshSheet(); } break;
    case 'p-quick-open': openQuick(); break;
    case 'p-quick-save': saveQuick(); break;
    case 'p-target-open': openTarget(); break;
    case 'pt-f': if (ui.pt) { ui.pt.f = +v; ui.pt.g = ''; refreshSheet(); } break;
    case 'p-target-save': saveTarget(); break;
  }
});
document.addEventListener('input', ev => {
  const el = ev.target;
  if (!el.dataset) return;
  if (el.dataset.f && el.closest('#main')) onSetInput(el);
  else if (el.dataset.ed && edit) {
    if (el.dataset.ed === 'name') edit.name = el.value;
    else {
      const it = edItem(el.dataset.k); if (it) it[el.dataset.ed === 'iname' ? 'name' : el.dataset.ed] = el.value;
      if (it && el.dataset.ed === 'iname') { const l = document.getElementById('ed-' + it.k + '-nm'), v = el.value.trim(); if (l) { l.textContent = v || '새 운동'; l.classList.toggle('ph', !v); } }
    }
  }
  else if (el.dataset.xs && ui.xs) ui.xs[el.dataset.xs] = el.value;
  else if (el.dataset.bf && ui.bd) ui.bd[el.dataset.bf] = el.value;
  else if (el.id === 'addex-name') ui.addExName = el.value;
  else if (el.id === 'p-search') { ui.pq = el.value; ui.pmore = false; renderFoodList(); }
  else if (el.id === 'pk-q' && edit && edit.pick) { edit.pick.q = el.value; pkFilter(); }
  else if (el.dataset.pa && ui.pa) { ui.pa[el.dataset.pa] = el.value; amtSync(); }
  else if (el.dataset.pc && ui.pc) ui.pc[el.dataset.pc] = el.value;
  else if (el.dataset.pk && ui.pk) ui.pk[el.dataset.pk] = el.value;
  else if (el.dataset.pt && ui.pt) { ui.pt[el.dataset.pt] = el.value; ptSync(); }
  else if (el.dataset.se && ui.se) { const k = el.dataset.se; if (k === 'w' || k === 'r') { const x = (ui.se.entries[+el.dataset.i] || { sets: [] }).sets[+el.dataset.j]; if (x) x[k] = el.value; } else ui.se[k] = el.value; }
});
document.addEventListener('change', ev => {
  const el = ev.target;
  if (el.dataset && el.dataset.f === 'w' && el.closest('#main')) onWeightChange(el);
  else if (el.dataset && el.dataset.ed === 'iname') edNameChange(el);
  else if (el.dataset && el.dataset.pl && el.closest('#main')) plChange(el);
  else if (el.dataset && el.dataset.ed === 'm' && edit) { const it = edItem(el.dataset.k); if (it) it.m = el.value; }
  else if (el.dataset && el.dataset.bf && ui.bd) ui.bd[el.dataset.bf] = el.value;
  else if (el.id === 'import-file' && el.files && el.files[0]) { importFile(el.files[0]); el.value = ''; }
});
document.addEventListener('keydown', ev => {
  const t = ev.target;
  if (ev.key === 'Escape' && !document.getElementById('sheet').hidden && document.getElementById('dialog').hidden) { ev.preventDefault(); closeSheet(); return; }
  if (ev.key !== 'Enter' || ev.isComposing) return;
  if (t.id === 'addex-name') { ev.preventDefault(); addExToSession(); }
  else if (t.id === 'p-search' || t.id === 'pk-q') { ev.preventDefault(); t.blur(); }
  else if (t.id === 'pa-amt') { ev.preventDefault(); saveAmt(); }
  else if (t.id === 'pk-p' || t.id === 'pk-n') { ev.preventDefault(); saveQuick(); }
  else if (t.id === 'pc-p') { ev.preventDefault(); saveCustom(); }
  else if (t.id === 'pt-g') { ev.preventDefault(); saveTarget(); }
  else if (t.dataset && t.dataset.f === 'w' && t.closest('#main')) { ev.preventDefault(); focusLater('r-' + t.dataset.e + '-' + t.dataset.s); }
  else if (t.dataset && t.dataset.f === 'r' && t.closest('#main')) { ev.preventDefault(); t.blur(); }
  else if (t.dataset && t.dataset.pl) { ev.preventDefault(); t.blur(); }
});
document.getElementById('sheet').addEventListener('click', ev => { if (ev.target.id === 'sheet' && ['settings', 'summary', 'export'].includes(ui.sheet)) closeSheet(); });
window.addEventListener('scroll', () => document.getElementById('top').classList.toggle('scrolled', window.scrollY > 4), { passive: true });
let rzT = null;
window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (ui.ready && ui.tab === 'progress') mountChart(); }, 150); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
  else if (state.live) keepAwake(true);
});
window.addEventListener('pagehide', flush);

document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', ICON[el.dataset.icon] || ''));
boot();
})();

// 오프라인 사용을 위한 서비스 워커와, 기기 저장 공간이 지워지지 않도록 요청
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', () => navigator.serviceWorker.register('sw.js?v=2621667211').catch(() => {}));
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
