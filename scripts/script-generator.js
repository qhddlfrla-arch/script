import { getGeminiAPIKey, StorageManager } from './storage.js';

// ============================================================
// localStorage를 통한 데이터 영구 저장 (재부팅해도 유지)
// ============================================================

const STORAGE_KEYS = {
    SCRIPT_INPUT: 'scriptRemixer_scriptInput',
    SAFE_SCRIPT: 'scriptRemixer_safeScript',
    SAFETY_LOG: 'scriptRemixer_safetyLog',
    IMAGE_PROMPTS: 'scriptRemixer_imagePrompts',
    CHARACTER_STYLE: 'scriptRemixer_characterStyle',
    MOOD_STYLE: 'scriptRemixer_moodStyle',
    COMPOSITION: 'scriptRemixer_composition',
    RATIO: 'scriptRemixer_ratio',
    PERSONA: 'scriptRemixer_persona',
    BLOG_ID: 'scriptRemixer_blogId'
};

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('저장 실패:', e);
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('불러오기 실패:', e);
        return defaultValue;
    }
}

function clearAllStorage() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

// ============================================================
// 1. [핵심] 작가들의 지침 보관소 (페르소나 설정)
// ============================================================

// 🍵 [모드 1] 감성 에세이 작가 (인생 이야기) - 여울 사연 구조
const PROMPT_ESSAY = `
===== [6070 인생 라디오 '여울'] 사연 전문 작가 시스템 가이드 =====

===== 1. 페르소나 및 핵심 역할 (Persona & Role) =====
신분: 20년 경력의 시니어 라디오 사연 전문 작가 (인생 상담, 리얼 스토리 각색 전문가).
타겟 청취자: 50대~70대 시니어 (인생의 희로애락을 아는 세대).
문체: 옆집 친구나 언니가 속마음을 털어놓는 듯한 고백적이고 솔직한 구어체. (때로는 울먹이듯, 때로는 담담하게).

핵심 능력:
- 평범한 소재(고부갈등, 황혼육아, 재산문제, 첫사랑 등)를 드라마틱한 사연으로 각색.
- 청자가 듣는 즉시 감정 이입할 수 있는 심리 묘사와 현실적인 대사 구현.
- TTS가 읽었을 때 마치 실제 사연자가 읽는 듯한 리듬감과 호흡 조절.

===== 2. 절대 준수 원칙 (Non-Negotiable Rules) =====
★ 리얼리티 추구: 소설처럼 멋부린 문장보다는, 실제 말하는 듯한 입말("글쎄 제가...", "어이가 없어서 원...")을 적극 사용합니다.
★ 순수 본문 출력: 인사말, 제목, 잡담 없이 **사연의 첫 문장(독백)**으로 즉시 시작합니다.
★ 감정선 중심: 사건의 나열보다는 그 사건을 겪는 주인공의 '속마음' 위주로 서술합니다.
★ 대사 처리: 따옴표("")를 사용하되, 인물의 성격이 드러나는 말투(사투리, 말버릇 등)를 자연스럽게 녹여냅니다.
★ 수위 조절: 자극적인 소재라도 표현은 품격 있게 다듬어, 듣기에 거북하지 않게 만듭니다.

===== 3. 롱폼 대본 구조 템플릿 (The 'Yeoul' 6080 Structure) =====
어르신들이 듣기 편안하면서도 끝까지 듣게 만드는 [회상과 공감] 중심의 구조입니다.

[Part 1. 오프닝: 마음을 여는 40초]
★ 감성 후킹 (5초): 자극적인 사건보다는 가슴 찡한 **'감정의 한 줄'**로 시작.
  - 예: "내 평생 자식 농사가 전부인 줄 알았는데... 빈 둥지가 이렇게 추울 줄은 몰랐습니다."

★ 채널 인사 및 구독 (Pre-CTA, 15초): (필수)
  - "반갑습니다. 인생의 굽이굽이, 여러분과 함께 흐르는 **6070 인생 라디오 '여울'**입니다. 이야기 시작 전, 구독과 좋아요 한번 꾹 눌러주시면 큰 힘이 됩니다." (천천히, 정중하게)

★ 사연 도입 (Intro, 20초): 사연자의 나이와 상황을 밝히며 "남의 얘기 같지 않은" 분위기 조성.

[Part 2. 본문: 인생을 걷는 시간 (롱폼 핵심)]
★ 과거 회상 (The Past): 사건의 뿌리가 된 옛날이야기. (향수를 자극하는 디테일 포함).

★ 갈등의 골 (The Conflict): 참아왔던 서운함이 터지거나, 피할 수 없는 현실의 벽(건강, 돈, 자식)에 부딪힘.

★ 절정 (The Climax):
  - 소리 지르고 싸우는 것보다, **'참았던 눈물이 터지는 순간'**이나 **'가슴을 치는 독백'**으로 감정을 폭발시킴.
  - 이 부분에서는 문장을 아주 짧게 끊어 긴장감을 줍니다.

[Part 3. 클로징: 위로와 여운]
★ 해소 및 성찰 (Resolution): 갈등 후 얻은 평온함, 혹은 내려놓음의 지혜.
  - "이제야 알겠습니다. 중요한 건 자식이 아니라, 내 자신이었다는 걸요."

★ 작가의 따뜻한 첨언 (Outro): 사연자에게 보내는 따뜻한 응원 멘트.

★ 채널명 재확인: "지금까지 **6070 인생 라디오 '여울'**이었습니다."

★ 최종 행동 유도 (Final CTA):
  - "비슷한 경험이 있으신가요? 댓글로 남겨주시면 서로에게 큰 위로가 됩니다. 구독과 좋아요 부탁드립니다. 늘 건강하세요."

===== 4. 작업 워크플로우 (Workflow) =====
[단계 1: 청취자 눈높이 분석]
- 사용자 입력 주제를 6080 세대의 관점에서 재해석합니다. (예: '이혼' -> '황혼의 홀로서기', '손주' -> '눈에 넣어도 안 아픈 내 강아지')

[단계 2: 감정선 설계]
- 자극적인 막장 드라마보다는, 인간극장이나 아침마당 스타일의 진솔한 감동 코드를 설계합니다.
- 오프닝의 '구독/좋아요' 요청이 상업적으로 들리지 않도록, **"서로에게 힘이 되어주세요"**라는 뉘앙스로 포장합니다.

[단계 3: 1인칭 빙의 집필]
- 주인공은 '나'입니다. 60~70대 화자의 말투(어휘 선택)를 완벽하게 구사합니다.
- TTS가 너무 빠르게 읽지 않도록 쉼표(,)와 마침표(.)를 평소보다 자주 사용하여 낭독 속도를 물리적으로 제어합니다.

[단계 4: 최종 검수]
- 어르신들이 듣기에 말이 너무 빠르거나 어렵지는 않은가?
- '여울' 채널명과 구독/좋아요 요청이 적절히 배치되었는가?
- 최종적으로 본문 텍스트만 출력합니다.

★★★ 중요: 반드시 한국어(한글)로 대본을 작성하세요! 영어로 작성하지 마세요! ★★★

[출력 순서] (반드시 이 순서를 지키세요!)
1. 먼저 [SCRIPT] 제목을 쓰고, 그 아래에 한글 대본 전체를 작성하세요.
2. 대본 작성이 완전히 끝난 후에만 [IMAGE_PROMPTS], [YOUTUBE_PACKAGE], [SAFETY_LOG] 섹션을 작성하세요.

★★★ 분량 가이드 (매우 중요!) ★★★
사용자가 지정한 영상 길이에 맞게 반드시 충분한 분량으로 작성하세요!
- 8분 영상: 최소 2,500자 이상
- 10분 영상: 최소 3,000자 이상
- 15분 영상: 최소 4,500자 이상
- 20분 영상: 최소 6,000자 이상
- 30분 영상: 최소 9,000자 이상 → ★파트1 작성 (클로징 없이 [계속...]으로 끝내기!)
- 45분 영상: 최소 13,500자 이상 → ★파트1, 2, 3 (파트3에서만 클로징!)
- 1시간 영상: 최소 18,000자 이상 → ★파트1, 2, 3, 4 (파트4에서만 클로징!)

🚨🚨🚨 [매우 중요] 파트별 끝맺음 규칙 🚨🚨🚨
★ 파트1, 파트2... (마지막 파트 전): 
  - 클로징(채널명, 구독, 좋아요 유도) 절대 작성 금지!!!
  - 스토리 중간에서 "[계속...]"으로 끝내세요!
  - 예: "영숙은 아들의 손을 꼭 잡았다. 그리고... [계속...]"

★ 마지막 파트에서만: 
  - 스토리 완결 + 클로징 5가지 체크리스트 모두 작성
  - 채널명 언급, 구독/좋아요 유도 등

🚨 파트1에서 "6070 인생 라디오 '여울'이었습니다" 같은 클로징을 쓰면 실패입니다! 🚨
★ 각 파트마다 최소 4,000~5,000자를 확보하세요!

★★★★★ [최우선] 이어쓰기 규칙 (연속성 필수!) ★★★★★
사용자가 "지난 이야기"를 제공하면, 이것은 **이전 파트의 내용**입니다!

▶ 절대 금지 사항:
- 새로운 오프닝이나 도입부 작성 금지! 바로 본문으로 이어가세요!
- 인물 이름, 배경, 상황을 바꾸지 마세요! 지난 이야기와 동일하게 유지!
- "첫 번째 이야기는...", "오늘의 이야기는..." 같은 새 시작 문구 금지!
- 지난 이야기를 요약하거나 다시 설명하지 마세요!

▶ 반드시 해야 할 것:
- 지난 이야기의 마지막 문장/장면에서 **바로 이어지는 다음 내용** 작성!
- 예: 지난 이야기가 "영숙은 아들의 손을 잡았다."로 끝났다면 → "그 순간, 영숙의 눈에서 눈물이 흘렀다."로 바로 시작!
- 인물 이름, 성격, 관계를 100% 동일하게 유지!
- 스토리의 흐름과 갈등을 자연스럽게 발전시키세요!
- 중간 파트에서는 이야기가 절정으로 향하게 하고, 마지막 파트에서만 클로징을 작성하세요!

▶ 파트 마무리 규칙:
- 마지막 파트가 아니면: "[계속...]"으로 끝내고, 현재 장면의 긴장감을 유지하세요!
- 마지막 파트에서만: 클로징 5가지 체크리스트를 모두 포함하세요!

★★★★★ 중요: 파트 끊김 방지 ★★★★★
대본 작성 중 절대로 문장 중간에서 끊지 마세요!
- 토큰 제한이 가까워지면, 현재 문장을 완성한 후 "[계속...]"으로 깔끔하게 마무리하세요.
- ★★★ 모든 파트에서 [IMAGE_PROMPTS] 필수! ★★★
- 중간 파트: 해당 파트 대본의 [IMAGE_PROMPTS] 작성 후 → "[계속...]"으로 끝내세요!
- 마지막 파트: 클로징 5가지 + [IMAGE_PROMPTS] + [YOUTUBE_PACKAGE] + [SAFETY_LOG] 모두 포함!
- 문장이 끊긴 채로 끝나면 실패입니다!

★★★★★ [필수] 파트별 이미지 프롬프트 개수 - 반드시 지키세요! ★★★★★
각 파트마다 [IMAGE_PROMPTS] 섹션에 **최소 15개 이상** 프롬프트를 작성해야 합니다!
1개나 2개만 작성하면 실패입니다! 반드시 15~25개 작성하세요!

- 파트1: 해당 파트의 장면에 맞는 이미지 프롬프트 **15~25개** 작성 (필수!)
- 파트2: 해당 파트의 새로운 장면에 맞는 이미지 프롬프트 **15~25개** 작성 (필수!)
- 파트3 이후: 마찬가지로 각 파트마다 **15~25개** 작성 (필수!)

[IMAGE_PROMPTS] 형식 예시:
1. Korean elderly woman, Boksoon, with short gray hair... (60대 여성 봉순 할머니)
2. Same Korean elderly woman Boksoon looking at old photo... (사진을 보는 봉순)
3. ...
15. ... (최소 여기까지!)
... (더 많이 작성 가능)

분량: 사용자가 지정한 영상 길이에 맞게 충분한 분량의 대본을 작성하세요.
`;

// 📱 [모드 2] '모아(함께하는60+)' - 디지털 튜터
const PROMPT_TUTOR = `
당신은 유튜브 채널 '함께하는60+'를 운영하는 64세 시니어 유튜버 '모아'입니다.
부산 출신으로 30년 직장 생활 후 은퇴했고, 손주와 소통하기 위해 디지털 공부를 시작한 '노력파 시니어'입니다.
시청자는 60~75세 남성들이며, 이들에게 "나도 했으니 당신도 할 수 있다"는 용기를 주는 동행자입니다.

★★★ 중요: 반드시 한국어(한글)로 대본을 작성하세요! 영어로 작성하지 마세요! ★★★

[출력 순서] (반드시 이 순서를 지키세요!)
1. 먼저 [SCRIPT] 제목을 쓰고, 그 아래에 한글 대본 전체를 작성하세요.
2. 대본 작성이 완전히 끝난 후에만 [IMAGE_PROMPTS], [YOUTUBE_PACKAGE], [SAFETY_LOG] 섹션을 작성하세요.

[페르소나 특징]
1. 관계: 권위적인 강사가 아님. "저도 어제 배웠습니다", "실수해도 괜찮습니다"라며 다독이는 '선배이자 동료'.
2. 말투:
   - 전체적으로 존댓말 사용. 조곤조곤하고 또박또박 설명.
   - 가끔 엉뚱한 생활 유머나 실수를 고백함. (예: "아이고, 제가 또 깜빡했네요 허허")
   - 어려운 전문 용어는 반드시 생활 언어로 풀어서 비유.
3. 진행 스타일:
   - "자, 화면을 크게 보여드릴게요", "손가락으로 꾹 누르세요" 같이 행동 위주로 묘사.

[작성 법칙]
★ 1. 오프닝 (순서 엄수): 
   - ① 5초 후킹 (가장 먼저): "이 기능 모르면 손주가 답답해합니다!" 처럼 시청자가 영상을 꼭 봐야 할 강력한 이유를 먼저 제시.
   - ② 30초 오프닝 (주제 소개): 후킹 직후, 오늘 배울 내용을 간략히 소개.
   - ③ 자기소개 (오프닝 끝난 후): 후킹과 주제 소개가 끝나고 나서 "안녕하세요, 함께하는60+ 모아입니다."라고 인사.
2. 본문 전개:
   - [동기부여] -> [준비물] -> [1단계, 2단계... 실습] -> [자주 하는 실수 꿀팁]
   - 중간중간 "저도 처음에 이거 못 찾아서 한참 헤맸습니다" 같은 공감 멘트 필수 삽입.
3. 마무리 (고정 멘트): 
   - "오늘도 긴 시간 고생하셨습니다. 우리 나이에도 충분히 하실 수 있습니다. 천천히, 저랑 같이 가봅시다."
4. 분량: 사용자가 지정한 영상 길이에 맞게 충분한 분량의 대본을 작성하세요.
5. 금지: 너무 빠르거나, 차갑거나, 가르치려 드는 태도.
`;

// ★ [공통 법칙] 안전성 & 이미지 프롬프트 (모든 모드 적용)
const COMMON_RULES = `
★★★ 유튜브 안전성 가이드 (수익화 보호 - 매우 중요!) ★★★
대본 작성 시 아래 단어들은 절대 사용하지 말고, 반드시 순화된 표현으로 대체하세요!

【폭력/범죄 관련】
- 자살/자해 → "극단적 선택", "스스로를 해치다", "세상을 등지다"
- 죽다/죽음/사망 → "떠나다", "세상을 떠나다", "영면하다", "하늘나라로 가다"
- 살인/살해/죽이다 → "범행", "사고", "해치다"
- 폭행/구타/때리다 → "다툼", "충돌", "손을 대다"
- 강도/절도 → "범죄", "도둑질"
- 총/칼/흉기 → "위험한 물건"

【자해/정신건강 관련】
- 우울증/정신병 → "마음의 병", "힘든 시간", "어두운 시기"
- 미친/미쳤다 → "지쳐있는", "힘든", "고통스러운"
- 정신적 문제 → "마음의 어려움"

【성인/선정성 관련】
- 성폭행/강간 → "끔찍한 일", "범죄 피해"
- 불륜/바람 → "잘못된 관계", "다른 사람"
- 성관계 관련 → 직접적 언급 금지

【약물/중독 관련】
- 마약/각성제 → "나쁜 것", "위험한 물질"
- 술/알코올 → "음료" (과음 장면 주의)
- 담배 → 흡연 장면 최소화

【혐오/차별 관련】
- 욕설/비속어 → 전면 금지
- 인종/성별/종교 비하 → 전면 금지

★ 대본 전체에서 위 단어들을 사용하지 않도록 주의하세요!
★ 순화한 단어가 있으면 반드시 [SAFETY_LOG]에 기록하세요!

[이미지 프롬프트 작성]
★★★ 중요: 대본을 모두 작성한 후, 맨 마지막에 '[IMAGE_PROMPTS]' 섹션을 한 번만 작성하세요. ★★★
🚨🚨🚨 최소 15개~25개 프롬프트 필수! 1-2개만 쓰면 실패! 🚨🚨🚨
1. 대본 전체를 먼저 완성하세요.
2. 대본이 끝나면 '[IMAGE_PROMPTS]' 제목을 쓰고, 그 아래에 모든 이미지 프롬프트를 정리해서 작성하세요.
3. ★★★ 이미지 개수 (절대 규칙): 파트당 최소 15개~25개! 1-2개면 실패! ★★★
   - 8분 영상: 최소 15~20개
   - 10분 영상: 최소 20~25개
   - 15분 영상: 최소 25~35개
   - 20분 영상: 최소 35~45개
   - 30분 영상: 최소 50개 이상
4. **중요: 모든 인물은 반드시 "Korean"으로 명시하세요.**
5. 스타일: 
   - 에세이: Photorealistic, cinematic lighting, 8k, emotional.
   - 튜터: Close-up of senior's hands holding smartphone, clear screen interface, warm indoor lighting.
6. **형식**: 번호를 붙이고, 영어 프롬프트 뒤에 괄호로 한글 설명을 추가하세요.
7. ★ **일관성 유지**: 
   - 첫 번째 프롬프트에서 주인공의 외모를 상세히 정의하세요.
   - 2번 이후 프롬프트에서도 "same woman" 또는 첫 번째와 동일한 외모 묘사를 반복하세요.

[유튜브 제목 및 태그] ★★★ 떡상하는 후킹 제목 필수! ★★★
1. '[YOUTUBE_PACKAGE]' 제목을 쓰세요.
2. **클릭을 부르는 후킹 제목 3개**를 추천하세요!

★ 제목 작성 공식 (반드시 적용):
- 숫자 활용: "30년 만에", "단 3만원으로", "10분 만에 터진"
- 감정 자극: "눈물 멈추지 않는", "소름 돋는", "가슴이 먹먹한"
- 궁금증 유발: "...그런데 반전이", "알고 보니", "이유가 있었다"
- 결과 암시: "결국 눈물바다", "모두가 박수쳤다", "인생이 바뀌었다"
- 타겟 지목: "60대 필수 시청", "우리 세대라면 공감"

★ 후킹 제목 예시:
- "30년 모른 척하던 아들이 어머니 장례식장에서 한 행동... 결국"
- "매일 욕하던 시어머니가 며느리 암 판정 후 보인 반응"
- "10년간 외면받던 막내딸, 아버지 유산 공개 날 터진 진실"

3. 관련 태그 10개를 쉼표(,)로 구분해서 한 줄로 작성하세요.

[안전성 검사 리포트]
1. 맨 마지막에 '[SAFETY_LOG]' 제목 작성.
2. 순화한 단어가 있으면 기록, 없으면 "이상 없음".
`;

// ============================================================
// 대본 → 안전 대본 + 이미지 프롬프트 변환 전용 프롬프트
// ============================================================

const PROMPT_CONVERTER = `
당신은 '20년 경력의 시니어 오디오북 편집 전문가이자 AI 아트 디렉터'입니다.
사용자가 제공하는 대본을 아래 작업에 따라 처리하세요.

★★★ 중요: 반드시 한국어(한글)로 응답하세요! 영어로 응답하지 마세요! ★★★

[작업 1: 안전 대본 변환] - ★★★ 유튜브 수익화 보호 필수 ★★★
1. 사용자가 제공한 대본을 그대로 유지하되, 유튜브 수익화에 위험할 수 있는 모든 단어를 적극적으로 순화하세요.
2. ★ 순화 대상 카테고리별 예시:

   【폭력/범죄】
   - '자살/자해' → '극단적 선택/스스로를 해치다'
   - '죽다/죽음/사망' → '떠나다/세상을 떠나다/영면하다'
   - '살인/살해' → '범죄/사고'
   
   【자해/정신건강】
   - '우울증/정신병' → '마음의 병/힘든 시간'
   - '미친/미쳤다' → '힘든/지쳐있는'
   
   【성인/선정성】
   - '성폭행/강간' → '끔찍한 일/범죄'
   - '불륜/바람' → '잘못된 관계'
   
   【약물/중독】
   - '마약/각성제' → '나쁜 것/위험한 물질'

3. 대본의 전체 흐름, 문체, 톤, 분량은 절대 변경하지 마세요. 오직 위험 단어만 교체하세요.
4. 순화할 단어가 없으면 원본 대본을 그대로 출력하세요.
5. 순화한 단어는 반드시 [SAFETY_LOG]에 기록하세요.

[작업 2: 이미지 프롬프트 생성] - ★★★ 한국인 일관성 필수 ★★★
1. 대본을 읽고, 각 문단(단락)마다 최소 1개의 이미지 프롬프트를 영어로 작성하세요.
2. ★★★ 프롬프트 개수: 대본의 문단 수만큼 작성하세요 (최소 15~30개 이상) ★★★
3. ★★★ **[필수] 모든 인물은 반드시 "Korean"으로 시작하세요!** ★★★
   - 올바른 예: "Korean elderly woman", "Korean middle-aged man"
4. 스타일: {IMAGE_STYLE}
5. ★ **일관성 유지 (매우 중요)**:
   - 첫 번째 프롬프트에서 주인공의 외모를 상세히 정의하세요.
   - 2번 이후 모든 프롬프트에서 "same Korean woman" 또는 동일한 외모 묘사를 반복하세요.
6. 형식: 번호를 붙이고, 영어 프롬프트 뒤에 괄호로 한글 설명을 추가하세요.

[출력 형식]
아래 형식을 정확히 따르세요:

[SAFE_SCRIPT]
(순화된 대본 전체 또는 원본 대본)

[IMAGE_PROMPTS]
(이미지 프롬프트 목록)

[SAFETY_LOG]
(순화한 단어가 있으면 "원래단어 → 순화단어" 형식으로 기록, 없으면 "이상 없음")
`;

// 등장인물 페르소나 분석 전용 프롬프트
const PERSONA_ANALYZER = `
당신은 '시니어 오디오북 일러스트 디렉터'입니다.
사용자가 제공하는 대본을 읽고, 주인공(메인 등장인물)의 외모 페르소나를 생성하세요.

★★★ 중요: 반드시 영어로 출력하세요! 이미지 생성 AI에 사용됩니다. ★★★

[분석 규칙]
1. 대본에서 주인공의 나이, 성별, 외모 단서를 찾으세요.
2. 명시되지 않은 부분은 대본 맥락에 맞게 적절히 추론하세요.
3. **반드시 "Korean"으로 시작**하세요 (예: "Korean elderly woman")

[포함해야 할 요소]
- 국적: Korean (필수)
- 예상 나이: 구체적 숫자 (예: 65 years old)
- 성별
- 머리 스타일/색상
- 얼굴 특징
- 체형
- 대표 의상
- 전반적인 분위기

[출력 형식]
한 문장으로 쉼표로 구분하여 출력하세요. 다른 설명 없이 페르소나만 출력하세요.

[사용자 대본]
`;

// ============================================================
// 블로그 글쓰기 전용 프롬프트 (더유니크한)
// ============================================================

const PROMPT_BLOG = `
당신은 네이버 블로그 SEO 전문가이자 10년 경력의 블로거입니다.
사용자가 제공하는 키워드로 **정보형 블로그 글**을 작성하세요.

★★★★★ 최우선 규칙: 줄바꿈 (이것이 가장 중요합니다!) ★★★★★
절대로 글을 한 덩어리로 붙여쓰지 마세요!
- 각 소제목 앞에 빈 줄 2개 필수
- 각 문단은 3~4문장으로 구성하고, 문단 사이에 빈 줄 1개 필수
- 복사해서 블로그에 붙여넣을 때 가독성이 좋아야 합니다
- 예시:
  
소제목1

이것은 첫 번째 문단입니다. 3~4문장으로 구성됩니다.

이것은 두 번째 문단입니다. 문단 사이에 빈 줄이 있습니다.


소제목2

세 번째 문단입니다. 소제목 앞에는 빈 줄 2개가 있습니다.

★★★ 글 스타일: 정보형 ★★★
- 효능, 특징, 사용법, 장단점 등 **체계적인 정보 전달** 중심
- 객관적인 정보 + 개인 경험담을 적절히 섞어 신뢰성 확보
- 독자가 궁금해할 내용을 미리 파악하고 답변하는 형식

★★★ SEO 최적화 (매우 중요) ★★★
1. **메인 키워드**: 제목과 첫 문단에 반드시 포함
2. **관련 키워드 확장**: 메인 키워드와 관련된 유사어/동의어를 본문 곳곳에 자연스럽게 배치
   예시) 꿀 → 벌꿀, 천연꿀, 생꿀, 아카시아꿀, 마누카꿀
3. **롱테일 키워드**: 검색량 높은 구체적인 문구를 소제목이나 본문에 포함
   예시) "꿀 효능" → "꿀 먹는 법", "꿀 부작용", "진짜 꿀 구별법", "꿀 보관법"
4. **질문형 소제목 활용**: "~할까요?", "~일까요?" 형태로 검색 의도 반영
5. **키워드 밀도**: 전체 글에서 메인 키워드가 5~8회 자연스럽게 등장

★★★ 절대 금지 사항 ★★★
1. 특수문자 사용 금지: #, *, _, \`, ~, ^, [ ], ( ) 등 일체 사용 금지
2. HTML 태그 사용 금지 (예: <b>, <strong>, <em> 등)
3. 마크다운 문법 사용 금지 (예: **굵게**, *기울임*, \`코드\` 등)
4. 강조나 목록 표시를 위한 특수문자 일체 사용 금지
5. 순수한 한글 텍스트만 사용할 것, 이모지 사용 금지
6. "소제목1", "본문1", "결론", "태그" 같은 구조 레이블 절대 사용 금지

★★★ 글 구조 (정보형) - 줄바꿈 매우 중요! ★★★
아래 형식으로 자연스럽게 작성하되, 레이블 없이 바로 내용만 작성하세요.

★★★ 줄바꿈 규칙 (필수!) ★★★
1. 모든 소제목 앞에는 반드시 빈 줄 2개를 넣으세요
2. 모든 문단 사이에는 빈 줄 1개를 넣으세요
3. 글이 한 덩어리로 붙어있으면 안 됩니다
4. 가독성을 위해 적절히 문단을 나누세요

[글 구조 예시]

소제목1

첫 번째 문단 내용...

두 번째 문단 내용...


소제목2

세 번째 문단 내용...

네 번째 문단 내용...


소제목3

다섯 번째 문단 내용...


소제목4

여섯 번째 문단 내용...


마무리

본문 요약 (2~3줄)

오늘 정보가 도움 되셨다면 공감과 댓글 부탁드려요! 더유니크한이었습니다.

#태그1 #태그2 #태그3 ...

[BLOG_IMAGES]
(여기에 이미지 프롬프트 작성)

★★★ 문체 ★★★
친근한 해요체 사용 (~해요)

★★★ 본문 작성 조건 (5가지 모두 충족) ★★★
1. 구글/네이버 SEO에 최적화된 글 (키워드 + 관련 키워드 자연스럽게 포함)
2. 남에게 공유하고 싶은 유용한 정보가 담긴 글
3. 작성자 본인이 직접 겪은 듯한 생생한 경험과 후기가 담긴 자연스러운 글
4. 검색자가 더이상 검색하지 않아도 될 정도로 상세한 정보를 포함한 글
5. "~인가요?", "~할까요?" 같은 질문에 답하는 형식으로 작성

★★★ 마무리 규칙 ★★★
1. 본문 전체 내용을 2~3줄로 요약
2. 글의 맨 마지막 문장은 무조건 아래 멘트로 끝낼 것:
   "오늘 정보가 도움 되셨다면 공감과 댓글 부탁드려요! 더유니크한이었습니다."

★★★ 태그 규칙 (SEO 강화) ★★★
1. 메인 키워드 + 관련 롱테일 키워드로 해시태그 10개 작성
2. 형식: #키워드1 #키워드2 #키워드3 ...
3. 아래 3개 태그는 무조건 포함할 것:
   #더유니크한 #더유니크한푸드 #천연벌꿀
4. 나머지 7개는 검색량 높은 관련 키워드로 구성
   예시) #꿀효능 #천연벌꿀추천 #꿀먹는법 #생꿀 #아카시아꿀 #꿀건강 #꿀다이어트

★★★ 블로그 이미지 프롬프트 (필수) ★★★
블로그 본문 끝에 반드시 [BLOG_IMAGES] 섹션을 추가하고, 블로그 내용에 어울리는 이미지 프롬프트 3~5개를 작성하세요.
형식: 번호. 한글설명 | 영어프롬프트
- 한글설명: 이미지가 무엇인지 간단히 설명
- 영어프롬프트: AI 이미지 생성용 상세한 영어 프롬프트
스타일: 음식/제품 사진은 밝고 깔끔한 테이블 위, 자연광, 고화질 푸드 포토그래피 스타일
예시:
1. 꿀이 흐르는 모습 | Golden organic honey dripping from wooden dipper into glass jar, warm natural lighting, clean white marble background, food photography, 8k
2. 벌집과 야생화 | Fresh honeycomb on rustic wooden board with wildflowers, soft morning light, appetizing food styling, high quality

[분량 가이드]
{LENGTH_GUIDE}

[키워드]
{KEYWORD}
`;

// ============================================================
// 2. 기능 구현
// ============================================================

// ★ 스타일 선택 변수 및 초기화 ★
let selectedCharacterStyle = loadFromStorage(STORAGE_KEYS.CHARACTER_STYLE) || "Photorealistic, hyper-realistic, 8k, cinematic lighting, detailed skin texture";
let selectedMoodStyle = loadFromStorage(STORAGE_KEYS.MOOD_STYLE) || "2000s aesthetic, Y2K style, digital era, early internet vibes";
let selectedComposition = loadFromStorage(STORAGE_KEYS.COMPOSITION) || "natural angle, balanced composition, comfortable framing";
let selectedRatio = loadFromStorage(STORAGE_KEYS.RATIO) || "16:9";
let characterPersona = loadFromStorage(STORAGE_KEYS.PERSONA) || '';
let generatedPrompts = loadFromStorage(STORAGE_KEYS.IMAGE_PROMPTS) || [];

function getFullStyle() {
    return selectedCharacterStyle + ", " + selectedMoodStyle;
}

function getFullStyleWithComposition() {
    return getFullStyle() + ", " + selectedComposition + ", " + selectedRatio + " aspect ratio";
}

// ★ 스타일 버튼 초기화 함수 ★
function initStyleButtons() {
    // 인물 스타일
    const characterStyleButtons = document.querySelectorAll('#characterStyleGroup .style-btn');
    characterStyleButtons.forEach(btn => {
        if (btn.getAttribute('data-value') === selectedCharacterStyle) {
            characterStyleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            characterStyleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCharacterStyle = btn.getAttribute('data-value');
            saveToStorage(STORAGE_KEYS.CHARACTER_STYLE, selectedCharacterStyle);
        });
    });

    // 분위기 스타일
    const moodStyleButtons = document.querySelectorAll('#moodStyleGroup .style-btn');
    moodStyleButtons.forEach(btn => {
        if (btn.getAttribute('data-value') === selectedMoodStyle) {
            moodStyleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            moodStyleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMoodStyle = btn.getAttribute('data-value');
            saveToStorage(STORAGE_KEYS.MOOD_STYLE, selectedMoodStyle);
        });
    });

    // 구도
    const compositionButtons = document.querySelectorAll('#compositionGroup .style-btn');
    compositionButtons.forEach(btn => {
        if (btn.getAttribute('data-value') === selectedComposition) {
            compositionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            compositionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedComposition = btn.getAttribute('data-value');
            saveToStorage(STORAGE_KEYS.COMPOSITION, selectedComposition);
        });
    });

    // 비율
    const ratioButtons = document.querySelectorAll('#ratioGroup .style-btn');
    ratioButtons.forEach(btn => {
        if (btn.getAttribute('data-ratio') === selectedRatio) {
            ratioButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            ratioButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRatio = btn.getAttribute('data-ratio');
            saveToStorage(STORAGE_KEYS.RATIO, selectedRatio);
        });
    });
}

// ★ 탭 전환 기능 ★
const tabNewScript = document.getElementById('tabNewScript');
const tabMyScript = document.getElementById('tabMyScript');
const tabBlogWrite = document.getElementById('tabBlogWrite');
const newScriptSection = document.getElementById('newScriptSection');
const myScriptSection = document.getElementById('myScriptSection');
const blogWriteSection = document.getElementById('blogWriteSection');

function switchTab(activeTab) {
    // 모든 탭 비활성화
    tabNewScript?.classList.remove('active');
    tabMyScript?.classList.remove('active');
    tabBlogWrite?.classList.remove('active');

    // 모든 섹션 숨기기
    if (newScriptSection) newScriptSection.style.display = 'none';
    if (myScriptSection) myScriptSection.style.display = 'none';
    if (blogWriteSection) blogWriteSection.style.display = 'none';

    // 선택된 탭 활성화
    if (activeTab === 'new') {
        tabNewScript?.classList.add('active');
        if (newScriptSection) newScriptSection.style.display = 'block';
    } else if (activeTab === 'my') {
        tabMyScript?.classList.add('active');
        if (myScriptSection) myScriptSection.style.display = 'block';
        initStyleButtons();
    } else if (activeTab === 'blog') {
        tabBlogWrite?.classList.add('active');
        if (blogWriteSection) blogWriteSection.style.display = 'block';
    }
}

if (tabNewScript) {
    tabNewScript.addEventListener('click', () => switchTab('new'));
}
if (tabMyScript) {
    tabMyScript.addEventListener('click', () => switchTab('my'));
}
if (tabBlogWrite) {
    tabBlogWrite.addEventListener('click', () => switchTab('blog'));
}

// 작가 모드 버튼 그룹
let selectedMode = "essay";
const modeButtons = document.querySelectorAll('#modeGroup .tone-btn');
const modeSelectHidden = document.getElementById('modeSelect');
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.getAttribute('data-value');
        if (modeSelectHidden) modeSelectHidden.value = selectedMode;
    });
});

// 감성 버튼
let selectedTone = "따뜻한";
const toneButtons = document.querySelectorAll('#toneGroup .tone-btn');
toneButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toneButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTone = btn.getAttribute('data-value');
    });
});

// 영상 길이 선택 시 안내 문구 동적 업데이트
const durationSelect = document.getElementById('durationSelect');
const durationGuideText = document.getElementById('durationGuideText');

// 진행 상황 업데이트 함수
function updateProgressDisplay() {
    if (!durationSelect || !durationGuideText) return;

    const selectedOption = durationSelect.selectedOptions[0];
    const totalParts = parseInt(selectedOption.getAttribute('data-parts'), 10);
    const currentPart = parseInt(localStorage.getItem('scriptRemixer_partCount') || '0', 10);

    if (totalParts === 1) {
        durationGuideText.innerHTML = '✅ <strong>1회 생성</strong>으로 완성됩니다.';
        durationGuideText.style.color = '#4caf50';
    } else if (currentPart === 0) {
        durationGuideText.innerHTML = `⚠️ <strong>${totalParts}회 생성</strong> 필요! 파트1 생성 후 → "지난 이야기"에 붙여넣기 → 다시 생성 (${totalParts}번 반복)`;
        durationGuideText.style.color = '#ffc107';
    } else if (currentPart >= totalParts) {
        durationGuideText.innerHTML = `🎉 <strong>${totalParts}회 중 ${totalParts}회 완료!</strong> 대본이 완성되었습니다!`;
        durationGuideText.style.color = '#4caf50';
    } else {
        durationGuideText.innerHTML = `🔄 <strong>${totalParts}회 중 ${currentPart}회 생성 완료</strong> → 남은 ${totalParts - currentPart}회 더 생성하세요!`;
        durationGuideText.style.color = '#2196f3';
    }
}

if (durationSelect && durationGuideText) {
    durationSelect.addEventListener('change', updateProgressDisplay);
    // 페이지 로드 시 진행 상황 표시
    updateProgressDisplay();
}

// API 키 관리
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const keyStatusText = document.getElementById('keyStatusText');

function checkKeyStatus() {
    const key = getGeminiAPIKey();
    if (key) {
        apiKeyInput.value = key;
        keyStatusText.innerText = "✅ API 키 준비 완료";
        keyStatusText.style.color = "#4caf50";
    } else {
        keyStatusText.innerText = "❌ 저장된 키가 없습니다";
        keyStatusText.style.color = "#ff5252";
    }
}
checkKeyStatus();

saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) return alert("키를 입력하세요");
    StorageManager.saveApiKey(key);
    alert("저장되었습니다!");
    checkKeyStatus();
});

// ============================================================
// 3. 새 대본 생성 로직
// ============================================================
const generateBtn = document.getElementById('generateBtn');
generateBtn.addEventListener('click', async () => {
    const mode = document.getElementById('modeSelect').value;
    const topic = document.getElementById('topicInput').value;
    const prevStory = document.getElementById('prevStoryInput').value;
    const duration = document.getElementById('durationSelect').value;

    const resultDiv = document.getElementById('result');
    const safetyBox = document.getElementById('safetyReportBox');
    const bridge = document.getElementById('bridgeSection');

    if (!topic) return alert("주제를 입력해주세요!");

    // 현재 파트 번호 계산
    const selectedOption = document.getElementById('durationSelect').selectedOptions[0];
    const totalParts = parseInt(selectedOption.getAttribute('data-parts'), 10);
    const currentPart = parseInt(localStorage.getItem('scriptRemixer_partCount') || '0', 10);
    const nextPart = prevStory && prevStory.trim().length > 100 ? currentPart + 1 : 1;

    let loadingMsg = "";
    let systemPromptBase = "";

    if (mode === "essay") {
        loadingMsg = "⏳ [감성 에세이] 작가가 인생 이야기를 집필 중입니다...";
        systemPromptBase = PROMPT_ESSAY;
    } else {
        loadingMsg = "⏳ [함께하는60+ 모아]님이 강의 자료를 준비 중입니다...";
        systemPromptBase = PROMPT_TUTOR;
    }

    // 진행 상황 표시 업데이트
    if (totalParts > 1) {
        durationGuideText.innerHTML = `🔄 <strong>${totalParts}회 중 ${nextPart}회 생성 중...</strong>`;
        durationGuideText.style.color = '#ff9800';
    }

    resultDiv.innerText = `${loadingMsg}\n(${totalParts}회 중 ${nextPart}회 생성 중... 안전성 검사 및 미술 감독 대기 중...)`;
    safetyBox.style.display = 'none';
    bridge.style.display = 'none';

    const apiKey = getGeminiAPIKey();
    if (!apiKey) return alert("API 키가 없습니다.");

    // ★★★ 대본 활용 규칙 ★★★
    const scriptUsageRule = `
🚨🚨🚨 [최우선 규칙] 출력 형식 🚨🚨🚨

★★★ 절대 금지 ★★★
❌ 영어로 시작 금지! (예: "Okay, I understand..." 금지!)
❌ "[SCRIPT]" 앞에 설명/인사말 금지!
❌ 사용자 대본의 문장을 그대로 복사 금지!!!

★★★ 반드시 지켜야 할 것 ★★★
✅ 바로 "[SCRIPT]" 제목부터 시작!
✅ 모든 내용 100% 한글!

🎨🎨🎨 [핵심 창작 규칙] 완전히 새로운 대본을 작성하세요! 🎨🎨🎨

사용자가 제공한 것은 **"줄거리 요약"**입니다. 이것을 바탕으로:

★★★ 사용자 입력에서 추출할 것 (구조만!) ★★★
- 등장인물 이름과 관계
- 핵심 사건 (무슨 일이 일어나는지)
- 배경 상황 (어디서, 언제)

★★★ 당신이 새로 창작해야 할 것 (필수!) ★★★
- 🎭 모든 대사를 새로 작성! (사용자 문장 그대로 쓰지 마세요!)
- 🎬 장면 묘사를 풍부하게 새로 작성!
- 💭 인물의 내면 심리/독백을 추가!
- 😢 감정선과 갈등을 더 깊게!
- 📝 TTS에 최적화된 호흡으로!

🚨 예시: 사용자 입력 vs 당신이 써야 할 것 🚨

❌ 사용자 입력 그대로 쓰면 안 됨:
"회장님, 여기서 이러시면 안 돼요."

✅ 당신이 새로 창작해야 함:
"회장님!" 제 목소리가 떨렸습니다. 71세의 그 분이 갑자기... 저는 급히 주위를 둘러봤습니다. 다행히 아무도 없었습니다. "여, 여기서 그러시면... 정말 곤란합니다." 제 심장이 미친 듯이 뛰었습니다. 이게 무슨 일이지?

★ 사용자 문장을 그대로 쓰면 실패! ★
★ 완전히 새로운 문장으로 창작하세요! ★

🚨🚨🚨 [필수] 이미지 프롬프트 개수 🚨🚨🚨
★★★ [IMAGE_PROMPTS]에 **문단별 1개 이상** 프롬프트 작성! ★★★
- 각 문단/장면마다 최소 1개씩!
- 형식: 번호. 영어프롬프트 (한글설명)
`;

    // ★★★ 파트 정보 및 클로징 규칙 ★★★
    const isLastPart = nextPart >= totalParts;

    // ★ 지난 이야기에서 마지막 의미있는 문장 추출 ★
    let lastSentence = '';
    if (prevStory && prevStory.trim().length > 100) {
        // [계속...], [IMAGE_PROMPTS] 등을 제거하고 마지막 의미있는 문장 찾기
        let cleanPrev = prevStory
            .replace(/\[계속\.{3}\]/g, '')
            .replace(/\[IMAGE_PROMPTS\][\s\S]*/g, '')
            .replace(/\[YOUTUBE_PACKAGE\][\s\S]*/g, '')
            .replace(/\[SAFETY_LOG\][\s\S]*/g, '')
            .replace(/━+.*━+/g, '')
            .trim();

        // 마지막 2-3문장 추출 (마침표, 물음표, 느낌표로 분리)
        const sentences = cleanPrev.split(/(?<=[.?!。])\s+/).filter(s => s.trim().length > 10);
        if (sentences.length >= 2) {
            lastSentence = sentences.slice(-2).join(' ');
        } else if (sentences.length === 1) {
            lastSentence = sentences[0];
        }
    }

    const partInfo = `
🚨🚨🚨 [매우 중요] 현재 작성 중인 파트 정보 🚨🚨🚨

현재: 총 ${totalParts}개 파트 중 ${nextPart}번째 파트를 작성 중입니다.

🚨🚨🚨 [필수] 파트 분량 - 반드시 지키세요! 🚨🚨🚨
★★★ 이 파트(파트 ${nextPart})도 최소 4,000자 ~ 5,000자 이상 작성 필수! ★★★
- 2-3문장만 쓰면 절대 실패!
- 풍부한 장면 묘사, 대화, 감정선 포함
- 스토리를 충분히 발전시키세요!

${isLastPart ?
            `✅ 이것은 마지막 파트입니다! 
   - 스토리를 완결하세요
   - 클로징 5가지 체크리스트를 모두 작성하세요
   - 채널명("6070 인생 라디오 '여울'"), 구독, 좋아요 유도를 포함하세요
   - ★ 이 파트도 최소 4,000자 이상! ★` :
            `🚨 이것은 마지막 파트가 아닙니다! (${nextPart}/${totalParts})
   - 클로징을 절대 작성하지 마세요!!!
   - "6070 인생 라디오 여울이었습니다" 같은 문구 금지!!!
   - "구독과 좋아요 부탁드립니다" 같은 문구 금지!!!
   - 스토리 중간에서 "[계속...]"으로 끝내세요!
   - ★ 이 파트도 최소 4,000자 이상 작성 필수! ★
   - 예: "그녀는 아들의 손을 꼭 잡았다. 그리고... [계속...]"`}

${lastSentence ? `
★★★★★ [최우선] 이어쓰기 지침 - 자연스럽게 연결하세요! ★★★★★

▶ 파트${nextPart - 1}의 마지막 장면:
"${lastSentence}"

▶ 파트${nextPart} 시작 규칙:
1. 위 문장의 **바로 다음 순간**부터 시작하세요!
2. 새로운 오프닝/도입부 없이 즉시 이어서 쓰세요!
3. 같은 장면, 같은 감정선을 이어가세요!
4. 예시:
   - 파트1 끝: "영희는 문을 열었다."
   - 파트2 시작: "문 너머에는 예상치 못한 손님이 서 있었다."
5. 인물 이름, 성격, 상황을 100% 동일하게 유지하세요!
` : ''}
`;

    // ★ 감성톤 설명 맵핑 ★
    const toneDescriptions = {
        '따뜻한': '따뜻하고 포근한 분위기, 가슴이 따뜻해지는 이야기',
        '차분한': '차분하고 조용한 톤, 명상적이고 고요한 분위기',
        '희망적': '희망차고 밝은 미래를 그리는 긍정적인 톤',
        '향수적': '옛 추억을 그리워하는 복고풍 감성, 아련한 분위기',
        '지혜로운': '인생의 교훈과 깊은 통찰을 담은 현명한 톤',
        '감동적': '눈물이 나올 정도로 감동적인, 깊은 울림이 있는 톤',
        '위로하는': '상처받은 마음을 어루만지는 따뜻한 위로의 톤',
        '유머러스': '재미있고 유쾌한, 웃음을 자아내는 경쾌한 톤',
        '진솔한': '꾸밈없이 솔직하고 담백한, 진심이 느껴지는 톤',
        '격려하는': '용기를 북돋아주고 힘을 주는 응원의 톤'
    };
    const toneGuide = toneDescriptions[selectedTone] || selectedTone;

    const fullPrompt = `${systemPromptBase}\n\n${COMMON_RULES}\n\n${scriptUsageRule}\n\n${partInfo}\n\n[사용자 대본 - 구조 유지, 오프닝/클로징만 수정!]\n${topic}\n\n[추가 정보]\n- 지난이야기: ${prevStory}\n- ★★★ 감성톤 (매우 중요!): ${selectedTone} - ${toneGuide}. 이 감성이 대본 전체에 스며들도록 작성하세요!\n- 분량: ${duration}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 1.0,  // 창작성 극대화 (0.0=보수적, 1.0=창의적)
                    topP: 0.95,
                    topK: 40
                }
            })
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || "통신 오류");
        if (!data.candidates || !data.candidates[0].content) throw new Error("AI 응답이 비어있습니다");

        const fullText = data.candidates[0].content.parts[0].text;

        const splitLog = fullText.split('[SAFETY_LOG]');
        let mainContent = splitLog[0];
        let safetyLog = splitLog.length > 1 ? splitLog[1].trim() : "정보 없음";

        // 마크다운 코드블록 제거 (```text 등)
        mainContent = mainContent.replace(/```\w*\n?/g, '').trim();

        // ★★★ [SCRIPT] 전의 영어 인사말/설명 제거 ★★★
        if (mainContent.includes('[SCRIPT]')) {
            mainContent = '[SCRIPT]' + mainContent.split('[SCRIPT]').slice(1).join('[SCRIPT]');
        }
        // 영어로 시작하는 줄 제거 (Okay, I understand 등)
        mainContent = mainContent.replace(/^(Okay|I will|I understand|Here is|Here's|Let me|Sure|Certainly)[^\n]*\n*/gi, '').trim();

        // 유튜브 패키지 파싱
        const youtubePackageBox = document.getElementById('youtubePackageBox');
        const titlesBox = document.getElementById('titlesBox');
        const tagsBox = document.getElementById('tagsBox');

        if (mainContent.includes('[YOUTUBE_PACKAGE]')) {
            const ytParts = mainContent.split('[YOUTUBE_PACKAGE]');
            mainContent = ytParts[0];

            let ytContent = ytParts[1].split('[IMAGE_PROMPTS]')[0].trim();

            // 제목 파싱 개선 - 다양한 형식 지원
            let titleLines = ytContent.match(/제목\s*\d?\s*[:.]\s*.+/g) || [];
            if (titleLines.length === 0) {
                // 숫자. 형식도 시도 (예: 1. 제목내용)
                titleLines = ytContent.match(/^\d+\.\s*.+/gm) || [];
            }
            if (titleLines.length === 0) {
                // 줄바꿈으로 분리된 제목도 시도
                const lines = ytContent.split('\n').filter(l => l.trim() && !l.includes('태그'));
                titleLines = lines.slice(0, 3);
            }
            titlesBox.innerHTML = titleLines.map((t, i) => `<div style="margin-bottom: 8px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px;">🎬 ${i + 1}. ${t.replace(/제목\s*\d?\s*[:.]\s*/, '').replace(/^\d+\.\s*/, '').trim()}</div>`).join('');

            // 태그 파싱 개선 - 다양한 형식 지원
            let tagMatch = ytContent.match(/태그\s*[:：]\s*(.+)/);
            if (!tagMatch) {
                // "태그" 이후의 콤마로 구분된 줄 찾기
                const tagLine = ytContent.split('\n').find(l => l.includes('태그') || (l.includes(',') && l.split(',').length >= 3));
                if (tagLine) {
                    tagMatch = [null, tagLine.replace(/태그\s*[:：]?\s*/, '')];
                }
            }
            if (tagMatch && tagMatch[1]) {
                tagsBox.innerText = tagMatch[1].trim();
            } else {
                tagsBox.innerText = '태그 없음';
            }

            youtubePackageBox.style.display = 'block';
        }

        // ★ 이어쓰기: 누적 대본 관리 ★
        const ACCUMULATED_SCRIPT_KEY = 'scriptRemixer_accumulatedScript';
        const PART_COUNT_KEY = 'scriptRemixer_partCount';

        // 현재 파트 번호 가져오기
        let currentPartCount = parseInt(localStorage.getItem(PART_COUNT_KEY) || '0', 10);

        // ★★★ 이미지 프롬프트 섹션 별도 추출 ★★★
        let imagePromptsSection = '';
        if (mainContent.includes('[IMAGE_PROMPTS]')) {
            let prompts = mainContent.split('[IMAGE_PROMPTS]')[1] || '';
            prompts = prompts.split('[YOUTUBE_PACKAGE]')[0];
            prompts = prompts.split('[SAFETY_LOG]')[0];
            prompts = prompts.trim();
            if (prompts) {
                imagePromptsSection = '\n\n[IMAGE_PROMPTS]\n' + prompts;
            }
        }

        // 새 파트 정리 (순수 대본만 추출 - 나중에 프롬프트 다시 추가)
        let cleanNewPart = mainContent.trim()
            .split('[IMAGE_PROMPTS]')[0]  // ★ 프롬프트 섹션 제거 (별도 저장됨) ★
            .split('[YOUTUBE_PACKAGE]')[0] // ★ 유튜브 패키지 제거 ★
            .split('[SAFETY_LOG]')[0]      // ★ 안전성 로그 제거 ★
            .replace(/\[SCRIPT\]/g, '')
            .replace(/\[계속\.{3}\]/g, '')
            .trim();

        // ★★★ 마지막 파트가 아니면 클로징 자동 제거 ★★★
        if (!isLastPart) {
            // 클로징 패턴들 제거 (모든 형식 포함)
            const closingPatterns = [
                // 기본 클로징 패턴
                /여러분,?\s*오늘\s*이야기.*?어떠셨나요\?/gs,
                /6070\s*인생\s*라디오.*?여울.*?이?었습니다\.?/gs,
                /구독과?\s*좋아요.*?부탁드립니다\.?/gs,
                /댓글로?\s*여러분의?\s*이야기.*?들려주세요\.?/gs,
                /알림\s*설정.*?잊지\s*마세요\.?/gs,
                /다음\s*이야기.*?기대해?\s*주세요\.?/gs,
                /오늘도?\s*함께\s*해\s*주셔서.*?감사합니다\.?/gs,
                /여러분의?\s*인생\s*이야기.*?기다리겠습니다\.?/gs,
                /채널.*?구독.*?좋아요/gs,
                /시청해?\s*주셔서\s*감사합니다\.?/gs,

                // ★ 새로운 5가지 체크리스트 형식 클로징 패턴 ★
                /\(암시\)\s*.+/g,
                /\(독려\)\s*.+/g,
                /\(기대\)\s*.+/g,
                /\(댓글\s*유도\)\s*.+/g,
                /\(구독\/좋아요\s*유도\)\s*.+/g,

                // 이야기를 통해 우리는... 형식
                /이\s*이야기를\s*통해\s*우리는?.*?있다는\s*것을\s*알\s*수\s*있었습니다\.?/gs,
                /오늘\s*들으신\s*이야기.*?가득하길\s*바랍니다\.?/gs,
                /여러분의\s*삶에도\s*따뜻한\s*마음이\s*가득하길\s*바랍니다\.?/gs,

                // 추가 클로징 패턴
                /더\s*많은\s*이야기.*?듣고\s*싶으시다면.*?부탁드립니다\.?/gs,
                /여러분의\s*생각은?\s*어떠신가요\?\s*댓글로\s*남겨주세요\.?/gs,
                /지금까지.*?여울.*?이?었습니다\.?/gs,
            ];

            for (const pattern of closingPatterns) {
                cleanNewPart = cleanNewPart.replace(pattern, '');
            }

            // 연속된 빈 줄 정리 (3줄 이상 -> 2줄로)
            cleanNewPart = cleanNewPart.replace(/\n{3,}/g, '\n\n');

            // 끝부분 정리 및 [계속...] 추가
            cleanNewPart = cleanNewPart.trim();
            if (!cleanNewPart.endsWith('[계속...]')) {
                cleanNewPart = cleanNewPart + '\n\n[계속...]';
            }
        }

        let finalContent = '';

        if (prevStory && prevStory.trim().length > 100) {
            // 이어쓰기 모드: 이전 누적 대본 + 새 파트
            let accumulatedScript = localStorage.getItem(ACCUMULATED_SCRIPT_KEY) || '';

            if (!accumulatedScript) {
                // 첫 이어쓰기: 지난 이야기를 기반으로 (파트1 헤더 추가)
                // ★★★ 지난 이야기에서 메타데이터 섹션 모두 제거 ★★★
                let cleanPrevStory = prevStory
                    .split('[IMAGE_PROMPTS]')[0]    // 이미지 프롬프트 제거
                    .split('[YOUTUBE_PACKAGE]')[0]  // 유튜브 패키지 제거
                    .split('[SAFETY_LOG]')[0]       // 안전성 로그 제거
                    .replace(/\[SCRIPT\]/g, '')
                    .replace(/\[계속\.{3}\]/g, '')
                    .replace(/```\w*\n?/g, '')
                    .replace(/━+.*파트\s*\d+.*━+/g, '')  // 파트 헤더 정리
                    .trim();
                // 파트1 헤더가 없으면 추가
                if (!cleanPrevStory.includes('파트 1 대본')) {
                    accumulatedScript = `\n\n━━━━━━━━━━ 📝 파트 1 대본 ━━━━━━━━━━\n\n${cleanPrevStory}`;
                } else {
                    accumulatedScript = cleanPrevStory;
                }
                currentPartCount = 1;
            }

            currentPartCount++;

            // ★★★ 누적 대본에 새 파트 추가 (대본 + 이미지 프롬프트 포함) ★★★
            accumulatedScript = `${accumulatedScript}\n\n━━━━━━━━━━ 📝 파트 ${currentPartCount} 대본 ━━━━━━━━━━\n\n${cleanNewPart}${imagePromptsSection}`;

            // localStorage에 저장
            localStorage.setItem(ACCUMULATED_SCRIPT_KEY, accumulatedScript);
            localStorage.setItem(PART_COUNT_KEY, currentPartCount.toString());

            // 진행 상황 업데이트
            updateProgressDisplay();

            finalContent = `[SCRIPT]\n\n${accumulatedScript}`;
        } else {
            // 새 대본 시작
            currentPartCount = 1;
            // ★★★ 새 대본에도 이미지 프롬프트 포함 ★★★
            const scriptWithPrompts = cleanNewPart + imagePromptsSection;
            localStorage.setItem(ACCUMULATED_SCRIPT_KEY, scriptWithPrompts);
            localStorage.setItem(PART_COUNT_KEY, '1');

            // 진행 상황 업데이트
            updateProgressDisplay();

            // [계속...]이 있으면 파트1 표시
            if (cleanNewPart.includes('[계속') || mainContent.includes('[계속')) {
                finalContent = `[SCRIPT]\n\n━━━━━━━━━━ 📝 파트 1 대본 ━━━━━━━━━━\n\n${scriptWithPrompts}`;
            } else {
                finalContent = mainContent.trim();
            }
        }

        resultDiv.innerText = finalContent;
        bridge.style.display = 'block';

        // ★ 자동 이어쓰기: 생성된 대본을 "지난 이야기"에 자동으로 채움 ★
        const prevStoryInput = document.getElementById('prevStoryInput');
        if (prevStoryInput && totalParts > 1 && nextPart < totalParts) {
            // 순수 대본만 추출 (프롬프트 제외)
            let pureScript = cleanNewPart
                .replace(/\[계속\.{3}\]/g, '')   // [계속...] 제거
                .replace(/━+.*파트.*━+/g, '')    // 파트 헤더 제거
                .replace(/\[IMAGE_PROMPTS\][\s\S]*/g, '')  // 프롬프트 섹션 제거
                .replace(/\[YOUTUBE_PACKAGE\][\s\S]*/g, '') // 유튜브 패키지 제거
                .replace(/\[SAFETY_LOG\][\s\S]*/g, '')     // 안전성 로그 제거
                .trim();

            // 지난 이야기에 자동 복사
            prevStoryInput.value = pureScript;

            // 완료 알림
            setTimeout(() => {
                alert(`✅ 파트 ${nextPart} 생성 완료!\n\n📋 "지난 이야기"에 자동 복사됨!\n\n다시 "안전 대본 생성" 클릭 → 파트 ${nextPart + 1} 생성!`);
            }, 300);
        }

        // ★ 파트별 다운로드 버튼 생성 ★
        const partDownloadContainer = document.getElementById('partDownloadContainer');
        const partDownloadButtons = document.getElementById('partDownloadButtons');
        const currentPartNum = parseInt(localStorage.getItem('scriptRemixer_partCount') || '1', 10);

        // 항상 파트별 다운로드 표시 (파트가 1개 이상이면)
        if (partDownloadContainer && partDownloadButtons && currentPartNum >= 1) {
            partDownloadContainer.style.display = 'block';
            partDownloadButtons.innerHTML = '';

            // 누적된 대본을 파트별로 분리
            const accumulatedScript = localStorage.getItem('scriptRemixer_accumulatedScript') || finalContent;
            const parts = accumulatedScript.split(/={5,}\s*✅\s*파트\s*\d+\s*완성\s*={5,}/);

            for (let i = 0; i < currentPartNum; i++) {
                // 대본 다운로드 버튼
                const btn = document.createElement('button');
                btn.innerText = `📄 파트${i + 1} 대본`;
                btn.style.cssText = 'background: linear-gradient(135deg, #4da3ff, #6c5ce7); border: none; border-radius: 6px; padding: 8px 12px; color: white; cursor: pointer; font-size: 0.8rem; margin: 2px;';

                const partIndex = i;
                btn.addEventListener('click', () => {
                    let partContent = '';
                    if (parts[partIndex]) {
                        partContent = parts[partIndex].trim();
                    } else {
                        partContent = accumulatedScript;
                    }

                    // ★ 순수 대본만 추출 (프롬프트, 유튜브 패키지, 안전성 로그 제거) ★
                    partContent = partContent.split('[IMAGE_PROMPTS]')[0];
                    partContent = partContent.split('[YOUTUBE_PACKAGE]')[0];
                    partContent = partContent.split('[SAFETY_LOG]')[0];
                    partContent = partContent.replace(/\[SCRIPT\]/g, '').trim();

                    const blob = new Blob([partContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `script_part${partIndex + 1}_${Date.now()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                });

                partDownloadButtons.appendChild(btn);
            }

            // ★ 파트별 프롬프트 다운로드 버튼 생성 (항상 표시) ★
            const partPromptButtons = document.getElementById('partPromptButtons');
            if (partPromptButtons) {
                partPromptButtons.innerHTML = '';

                for (let i = 0; i < currentPartNum; i++) {
                    const promptBtn = document.createElement('button');
                    promptBtn.innerText = `🎨 파트${i + 1}프롬프트`;
                    promptBtn.style.cssText = 'background: linear-gradient(135deg, #ff512f, #dd2476); border: none; border-radius: 6px; padding: 8px 12px; color: white; cursor: pointer; font-size: 0.8rem; margin: 2px;';

                    const promptIndex = i;
                    promptBtn.addEventListener('click', () => {
                        // ★ 누적된 스크립트에서 해당 파트의 프롬프트 추출 ★
                        const accumulatedScript = localStorage.getItem('scriptRemixer_accumulatedScript') || '';

                        // 파트 구분자로 나누기
                        const partSeparator = /={5,}\s*✅\s*파트\s*\d+\s*완성\s*={5,}/;
                        const partSections = accumulatedScript.split(partSeparator);

                        let partContent = '';
                        if (partSections[promptIndex]) {
                            partContent = partSections[promptIndex];
                        } else if (promptIndex === 0) {
                            // 첫 파트인데 구분자가 없으면 전체에서 추출
                            partContent = accumulatedScript;
                        }

                        // 해당 파트에서 [IMAGE_PROMPTS] 섹션 추출
                        if (partContent.includes('[IMAGE_PROMPTS]')) {
                            let prompts = partContent.split('[IMAGE_PROMPTS]')[1];
                            prompts = prompts.split('[SAFETY_LOG]')[0];
                            prompts = prompts.split('[YOUTUBE_PACKAGE]')[0];
                            prompts = prompts.split(/={5,}/)[0]; // 다음 구분자 전까지만
                            prompts = prompts.trim();

                            // 프롬프트 라인만 필터링 (번호. 로 시작하는 줄)
                            let promptLines = prompts.split('\n').filter(l => /^\d+\./.test(l.trim()));
                            const finalPrompts = promptLines.join('\n');

                            if (finalPrompts) {
                                // ★ AI 아트 디렉터 섹션에 프롬프트 표시 ★
                                const imageInput = document.getElementById('imageScriptInput');
                                if (imageInput) {
                                    imageInput.value = finalPrompts;
                                }

                                // 프롬프트 배열로 변환하여 렌더링
                                generatedPrompts = promptLines;
                                saveToStorage(STORAGE_KEYS.IMAGE_PROMPTS, generatedPrompts);
                                renderPromptList(promptLines);

                                // 이미지 섹션으로 스크롤
                                document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });

                                // 다운로드도 진행
                                const blob = new Blob([finalPrompts], { type: 'text/plain;charset=utf-8' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `prompts_part${promptIndex + 1}_${Date.now()}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);

                                alert(`✅ 파트${promptIndex + 1}의 ${promptLines.length}개 프롬프트가 추출되었습니다.\n파일 다운로드 + AI 아트 디렉터 섹션에 표시됨!`);
                            } else {
                                alert(`파트${promptIndex + 1}에 프롬프트가 없습니다.`);
                            }
                        } else {
                            alert(`파트${promptIndex + 1}에서 [IMAGE_PROMPTS] 섹션을 찾을 수 없습니다.`);
                        }
                    });

                    partPromptButtons.appendChild(promptBtn);
                }
            }
        }

        document.getElementById('editRequestSection').style.display = 'block';

        safetyBox.style.display = 'block';
        if (safetyLog.includes("이상 없음") || safetyLog.includes("없음")) {
            safetyBox.className = "safe-green";
            safetyBox.innerText = "✅ 유튜브 안전성 검사 통과";
        } else {
            safetyBox.className = "safe-warning";
            safetyBox.innerHTML = "⚠️ <b>금지어 순화 리포트:</b><br>" + safetyLog.replace(/\n/g, '<br>');
        }

    } catch (error) {
        resultDiv.innerText = "❌ 오류 발생: " + error.message;
        console.error(error);
    }
});

// ============================================================
// 4. 등장인물 페르소나 분석 (1단계)
// ============================================================
const analyzePersonaBtn = document.getElementById('analyzePersonaBtn');
const personaSection = document.getElementById('personaSection');
const personaInput = document.getElementById('personaInput');

if (analyzePersonaBtn) {
    analyzePersonaBtn.addEventListener('click', async () => {
        const script = document.getElementById('myScriptInput').value.trim();

        if (!script) {
            return alert("대본을 먼저 입력해주세요!");
        }

        const apiKey = getGeminiAPIKey();
        if (!apiKey) {
            return alert("API 키가 없습니다. 위에서 API 키를 입력하고 저장하세요.");
        }

        analyzePersonaBtn.disabled = true;
        analyzePersonaBtn.innerText = "⏳ 등장인물 분석 중...";

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: PERSONA_ANALYZER + script }] }],
                    generationConfig: {
                        maxOutputTokens: 8192
                    }
                })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error?.message || "통신 오류");
            if (!data.candidates || !data.candidates[0].content) throw new Error("AI 응답이 비어있습니다");

            const persona = data.candidates[0].content.parts[0].text.trim();

            characterPersona = persona;
            personaInput.value = persona;
            personaSection.style.display = 'block';
            saveToStorage(STORAGE_KEYS.PERSONA, persona);

            personaSection.scrollIntoView({ behavior: 'smooth' });

            alert("✅ 등장인물 페르소나 분석 완료!\n\n이제 '2단계: 프롬프트 생성' 버튼을 눌러주세요.\n필요시 페르소나를 직접 수정할 수 있습니다.");

        } catch (error) {
            alert("❌ 오류 발생: " + error.message);
            console.error(error);
        } finally {
            analyzePersonaBtn.disabled = false;
            analyzePersonaBtn.innerText = "👤 1단계: 등장인물 분석";
        }
    });
}

// 페르소나 복사 버튼
const copyPersonaBtn = document.getElementById('copyPersonaBtn');
if (copyPersonaBtn) {
    copyPersonaBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(personaInput.value).then(() => {
            copyPersonaBtn.innerText = '✅ 복사됨!';
            setTimeout(() => copyPersonaBtn.innerText = '📋 복사', 1500);
        });
    });
}

// 페르소나 입력 시 자동 저장
if (personaInput) {
    personaInput.addEventListener('input', () => {
        characterPersona = personaInput.value;
        saveToStorage(STORAGE_KEYS.PERSONA, characterPersona);
    });
}

// ============================================================
// 5. 안전 대본 + 이미지 프롬프트 생성 (2단계)
// ============================================================
const generateFromMyScriptBtn = document.getElementById('generateFromMyScriptBtn');
if (generateFromMyScriptBtn) {
    generateFromMyScriptBtn.addEventListener('click', async () => {
        const myScript = document.getElementById('myScriptInput').value.trim();
        const resultDiv = document.getElementById('result');
        const safetyBox = document.getElementById('safetyReportBox');
        const bridge = document.getElementById('bridgeSection');
        const currentPersona = personaInput ? personaInput.value.trim() : '';

        if (!myScript) return alert("대본을 입력해주세요!");

        const apiKey = getGeminiAPIKey();
        if (!apiKey) return alert("API 키가 없습니다.");

        generateFromMyScriptBtn.disabled = true;
        generateFromMyScriptBtn.innerText = "⏳ 처리 중... (안전 검사 + 프롬프트 생성)";
        resultDiv.innerText = "⏳ 내 대본을 분석하고 이미지 프롬프트를 생성 중입니다...";
        safetyBox.style.display = 'none';
        bridge.style.display = 'none';

        // 페르소나가 있으면 포함
        const personaInstruction = currentPersona ? `
★★★ [중요] 등장인물 페르소나 (모든 이미지 프롬프트의 기준) ★★★
아래 페르소나를 모든 이미지 프롬프트에서 그대로 사용하세요:
"${currentPersona}"
모든 프롬프트는 이 외모 묘사로 시작해야 합니다!
` : '';

        const fullPrompt = PROMPT_CONVERTER.replace('{IMAGE_STYLE}', getFullStyle()) + personaInstruction + `

[사용자 제공 대본]
${myScript}
`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    generationConfig: {
                        maxOutputTokens: 8192
                    }
                })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error?.message || "통신 오류");
            if (!data.candidates || !data.candidates[0].content) throw new Error("AI 응답이 비어있습니다");

            const fullText = data.candidates[0].content.parts[0].text;

            // 파싱
            let safeScript = "";
            let imagePrompts = "";
            let safetyLog = "정보 없음";

            // [SAFE_SCRIPT] 파싱
            if (fullText.includes('[SAFE_SCRIPT]')) {
                const parts = fullText.split('[SAFE_SCRIPT]');
                let afterSafe = parts[1] || "";

                if (afterSafe.includes('[IMAGE_PROMPTS]')) {
                    safeScript = afterSafe.split('[IMAGE_PROMPTS]')[0].trim();
                } else {
                    safeScript = afterSafe.split('[SAFETY_LOG]')[0].trim();
                }
            }

            // [IMAGE_PROMPTS] 파싱
            if (fullText.includes('[IMAGE_PROMPTS]')) {
                const parts = fullText.split('[IMAGE_PROMPTS]');
                let afterPrompts = parts[1] || "";
                imagePrompts = afterPrompts.split('[SAFETY_LOG]')[0].trim();
            }

            // [SAFETY_LOG] 파싱
            if (fullText.includes('[SAFETY_LOG]')) {
                const parts = fullText.split('[SAFETY_LOG]');
                safetyLog = (parts[1] || "").trim();
            }

            // 결과 표시 (프롬프트 섹션 포함)
            resultDiv.innerText = safeScript + "\n\n[IMAGE_PROMPTS]\n" + imagePrompts;
            bridge.style.display = 'block';

            document.getElementById('editRequestSection').style.display = 'block';

            // 안전성 리포트
            safetyBox.style.display = 'block';
            if (safetyLog.includes("이상 없음") || safetyLog.includes("없음") || !safetyLog) {
                safetyBox.className = "safe-green";
                safetyBox.innerText = "✅ 유튜브 안전성 검사 통과 - 순화 필요 없음";
            } else {
                safetyBox.className = "safe-warning";
                safetyBox.innerHTML = "⚠️ <b>순화된 단어:</b><br>" + safetyLog.replace(/\n/g, '<br>');
            }

            // 이미지 프롬프트 저장
            generatedPrompts = imagePrompts.split('\n').filter(line => line.trim().length > 5);
            saveToStorage(STORAGE_KEYS.IMAGE_PROMPTS, generatedPrompts);
            saveToStorage(STORAGE_KEYS.SAFE_SCRIPT, safeScript || myScript);
            saveToStorage(STORAGE_KEYS.SAFETY_LOG, safetyLog);

        } catch (error) {
            resultDiv.innerText = "❌ 오류 발생: " + error.message;
            console.error(error);
        } finally {
            generateFromMyScriptBtn.disabled = false;
            generateFromMyScriptBtn.innerText = "✨ 2단계: 프롬프트 생성";
        }
    });
}

// ============================================================
// 6. 대본 수정 요청 기능
// ============================================================
const editScriptBtn = document.getElementById('editScriptBtn');
if (editScriptBtn) {
    editScriptBtn.addEventListener('click', async () => {
        const editRequest = document.getElementById('editRequestInput').value.trim();
        const currentScript = document.getElementById('result').innerText;
        const resultDiv = document.getElementById('result');

        if (!editRequest) return alert("수정 요청 내용을 입력해주세요!");
        if (!currentScript || currentScript === '여기에 대본이 나옵니다...') {
            return alert("먼저 대본을 생성해주세요!");
        }

        const apiKey = getGeminiAPIKey();
        if (!apiKey) return alert("API 키가 없습니다.");

        const originalBtnText = editScriptBtn.innerText;
        editScriptBtn.innerText = "⏳ 수정 중...";
        editScriptBtn.disabled = true;
        resultDiv.style.opacity = '0.5';

        const editPrompt = `
당신은 시니어 오디오북 대본 편집 전문가입니다.

[현재 대본]
${currentScript}

[사용자 수정 요청]
${editRequest}

[지침]
1. 사용자의 수정 요청에 따라 위 대본을 수정하세요.
2. 수정 요청된 부분만 수정하고, 나머지 대본은 그대로 유지하세요.
3. 대본의 전체 흐름과 톤을 유지하면서 자연스럽게 수정하세요.
4. 수정된 전체 대본만 출력하세요. (설명이나 부연 없이)
5. [IMAGE_PROMPTS]나 [YOUTUBE_PACKAGE], [SAFETY_LOG] 섹션은 포함하지 마세요.
`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: editPrompt }] }],
                    generationConfig: {
                        maxOutputTokens: 8192
                    }
                })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error?.message || "통신 오류");
            if (!data.candidates || !data.candidates[0].content) throw new Error("AI 응답이 비어있습니다");

            const editedScript = data.candidates[0].content.parts[0].text;
            resultDiv.innerText = editedScript.trim();

            document.getElementById('editRequestInput').value = '';

            alert("✅ 대본이 수정되었습니다!");

        } catch (error) {
            alert("❌ 수정 중 오류 발생: " + error.message);
            console.error(error);
        } finally {
            editScriptBtn.innerText = originalBtnText;
            editScriptBtn.disabled = false;
            resultDiv.style.opacity = '1';
        }
    });
}

// ============================================================
// 7. 기타 버튼들
// ============================================================

// 태그 복사 버튼
const copyTagsBtn = document.getElementById('copyTagsBtn');
if (copyTagsBtn) {
    copyTagsBtn.addEventListener('click', () => {
        const tags = document.getElementById('tagsBox').innerText;
        if (tags) {
            navigator.clipboard.writeText(tags).then(() => {
                copyTagsBtn.innerText = '✅ 복사 완료!';
                setTimeout(() => copyTagsBtn.innerText = '📋 태그 복사', 1500);
            });
        }
    });
}

// 전체 복사 버튼 (블로그용)
const copyBlogBtn = document.getElementById('copyBlogBtn');
if (copyBlogBtn) {
    copyBlogBtn.addEventListener('click', () => {
        const resultText = document.getElementById('result').innerText;
        if (resultText && resultText !== '여기에 대본이 나옵니다...') {
            navigator.clipboard.writeText(resultText).then(() => {
                copyBlogBtn.innerText = '✅ 복사 완료!';
                setTimeout(() => copyBlogBtn.innerText = '📋 전체 복사', 1500);
            });
        } else {
            alert("복사할 내용이 없습니다.");
        }
    });
}

// 전체 대본 다운로드
const downloadScriptBtn = document.getElementById('downloadScriptBtn');
if (downloadScriptBtn) {
    downloadScriptBtn.addEventListener('click', () => {
        // localStorage에서 누적된 대본 가져오기 (없으면 화면 내용 사용)
        let accumulatedScript = localStorage.getItem('scriptRemixer_accumulatedScript');
        let pureScript = '';

        if (accumulatedScript && accumulatedScript.trim().length > 100) {
            pureScript = accumulatedScript;
        } else {
            // fallback: 화면에서 가져오기
            const fullText = document.getElementById('result').innerText;
            pureScript = fullText.split('[IMAGE_PROMPTS]')[0].trim();
            pureScript = pureScript.split('[SAFETY_LOG]')[0].trim();
        }

        // [SCRIPT] 태그 및 파트 구분선 정리
        pureScript = pureScript
            .replace(/\[SCRIPT\]/g, '')
            .replace(/={5,}\s*✅\s*파트\s*\d+\s*완성\s*={5,}/g, '\n\n--- 파트 구분 ---\n\n')
            .trim();

        const blob = new Blob([pureScript], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const date = new Date().toLocaleDateString('ko-KR').replace(/\./g, '-').replace(/ /g, '');
        link.href = URL.createObjectURL(blob);
        link.download = `전체대본_${date}.txt`;
        link.click();

        alert(`✅ 전체 대본이 다운로드되었습니다!\n(총 ${pureScript.length.toLocaleString()}자)`);
    });
}

// 프롬프트 리스트 생성
const sendToImageBtn = document.getElementById('sendToImageBtn');
sendToImageBtn.addEventListener('click', () => {
    const promptList = document.getElementById('promptList');
    const imageInput = document.getElementById('imageScriptInput');

    // ★ 누적 스크립트에서 모든 파트의 프롬프트 추출 ★
    const accumulatedScript = localStorage.getItem('scriptRemixer_accumulatedScript') || '';
    const fullText = document.getElementById('result').innerText;

    // 사용할 원본 텍스트 결정 (누적 스크립트 우선)
    const sourceText = accumulatedScript.length > fullText.length ? accumulatedScript : fullText;

    // 모든 [IMAGE_PROMPTS] 섹션 추출
    let allPrompts = [];
    const imageParts = sourceText.split('[IMAGE_PROMPTS]');

    for (let i = 1; i < imageParts.length; i++) {
        let promptSection = imageParts[i];

        // 다른 섹션 시작 전까지만 추출
        promptSection = promptSection.split('[SAFETY_LOG]')[0];
        promptSection = promptSection.split('[YOUTUBE_PACKAGE]')[0];
        promptSection = promptSection.split('[SCRIPT]')[0];
        promptSection = promptSection.split(/={5,}\s*✅\s*파트/)[0]; // 다음 파트 구분자 전까지
        promptSection = promptSection.trim();

        // 번호로 시작하는 프롬프트 라인만 추출
        const lines = promptSection.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 5 && /^\d+\./.test(trimmed);
        });

        allPrompts = allPrompts.concat(lines);
    }

    if (allPrompts.length === 0) {
        alert("⚠️ 이미지 프롬프트를 찾을 수 없습니다.\n\n가능한 원인:\n1. 마지막 파트까지 생성하지 않음\n2. AI가 프롬프트 생성을 건너뜀\n\n해결 방법:\n1. 마지막 파트까지 모두 생성해주세요\n2. 또는 '맞춤 프롬프트 생성' 기능을 사용해주세요");
        return;
    }

    // 프롬프트 번호 재정렬 (1, 2, 3, ...)
    const renumberedPrompts = allPrompts.map((prompt, index) => {
        return prompt.replace(/^\d+\./, `${index + 1}.`);
    });

    const promptOnly = renumberedPrompts.join('\n');
    imageInput.value = promptOnly;

    generatedPrompts = renumberedPrompts;
    saveToStorage(STORAGE_KEYS.IMAGE_PROMPTS, generatedPrompts);

    renderPromptList(renumberedPrompts);

    alert(`✅ 총 ${renumberedPrompts.length}개의 장면이 추출되었습니다.\n(${imageParts.length - 1}개 파트에서 취합)\n목록에서 [복사] 버튼을 눌러 ImageFX에 사용하세요.`);
    document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });
});

// ============================================================
// 맞춤 프롬프트 생성 기능
// ============================================================
const generateCustomPromptsBtn = document.getElementById('generateCustomPromptsBtn');
if (generateCustomPromptsBtn) {
    generateCustomPromptsBtn.addEventListener('click', async () => {
        const fullText = document.getElementById('result').innerText;
        const customCount = parseInt(document.getElementById('customPromptCount').value, 10);
        const imageInput = document.getElementById('imageScriptInput');

        // 대본에서 순수 텍스트만 추출
        let pureScript = fullText.split('[IMAGE_PROMPTS]')[0].trim();
        pureScript = pureScript.split('[SAFETY_LOG]')[0].trim();
        pureScript = pureScript.split('[YOUTUBE_PACKAGE]')[0].trim();
        pureScript = pureScript.split('---')[0].trim();

        if (!pureScript || pureScript === '여기에 대본이 나옵니다...' || pureScript.length < 100) {
            return alert("먼저 대본을 생성해주세요!");
        }

        const apiKey = getGeminiAPIKey();
        if (!apiKey) return alert("API 키가 없습니다.");

        generateCustomPromptsBtn.disabled = true;
        generateCustomPromptsBtn.innerText = "⏳ 생성 중...";

        const customPromptRequest = `
당신은 유튜브 영상용 이미지 프롬프트 생성 전문가입니다.
아래 대본을 분석하여 **정확히 ${customCount}개**의 이미지 프롬프트를 생성하세요.

★★★ 필수 규칙 ★★★
1. 반드시 **${customCount}개**의 프롬프트를 생성하세요 (더 많거나 적으면 안 됨)
2. 대본 전체에 걸쳐 **균등하게** 장면을 배분하세요
3. 모든 프롬프트는 **영어**로 작성하고, 괄호 안에 **한글 설명** 추가
4. 캐릭터와 장면의 **일관성** 유지 (같은 인물은 동일한 외모 묘사)
5. 각 프롬프트에 감정, 조명, 분위기를 포함하세요

★★★ 출력 형식 ★★★
반드시 아래 형식만 출력하세요:
1. [영어 프롬프트] (한글 설명)
2. [영어 프롬프트] (한글 설명)
...
${customCount}. [영어 프롬프트] (한글 설명)

★★★ 대본 ★★★
${pureScript.substring(0, 15000)}
`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: customPromptRequest }] }],
                    generationConfig: {
                        maxOutputTokens: 8000,
                        temperature: 0.7
                    }
                })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error?.message || "통신 오류");
            if (!data.candidates || !data.candidates[0].content) throw new Error("AI 응답이 비어있습니다");

            const generatedText = data.candidates[0].content.parts[0].text;

            // 프롬프트 파싱 및 표시
            imageInput.value = generatedText;
            const promptsArray = generatedText.split('\n').filter(line => line.trim().match(/^\d+\./));
            generatedPrompts = promptsArray;
            saveToStorage(STORAGE_KEYS.IMAGE_PROMPTS, generatedPrompts);

            renderPromptList(promptsArray);

            alert(`✅ ${promptsArray.length}개의 맞춤 프롬프트가 생성되었습니다!`);
            document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            alert("❌ 오류 발생: " + error.message);
            console.error(error);
        } finally {
            generateCustomPromptsBtn.disabled = false;
            generateCustomPromptsBtn.innerText = "🎯 맞춤 프롬프트 생성";
        }
    });
}

// 프롬프트 목록 렌더링 함수
function renderPromptList(promptsArray) {
    const promptList = document.getElementById('promptList');
    promptList.innerHTML = "";

    promptsArray.forEach((text, index) => {
        const englishPrompt = text.replace(/^\d+\.\s*/, '').replace(/\s*\([^)]*[ㄱ-ㅎㅏ-ㅣ가-힣]+[^)]*\)\s*/g, '').trim();
        const koreanMatch = text.match(/\(([^)]*[ㄱ-ㅎㅏ-ㅣ가-힣]+[^)]*)\)/);
        const koreanDesc = koreanMatch ? koreanMatch[1] : null;

        const row = document.createElement('div');
        row.className = 'prompt-row';

        const numBadge = document.createElement('span');
        numBadge.innerText = index === 0 ? '🎬1' : (index + 1);
        numBadge.className = index === 0 ? 'prompt-num first' : 'prompt-num';

        const textSpan = document.createElement('span');
        textSpan.className = 'prompt-text';
        textSpan.innerText = koreanDesc || englishPrompt.substring(0, 40) + '...';

        const copyBtn = document.createElement('button');
        copyBtn.innerText = '📋 복사';
        copyBtn.className = 'prompt-copy-btn';

        copyBtn.addEventListener('click', () => {
            let finalPrompt = englishPrompt;
            if (!englishPrompt.toLowerCase().includes('korean')) {
                finalPrompt = 'Korean person, ' + englishPrompt;
            }
            const antiCollage = ", single image only, one scene, centered composition, no collage, no grid, no split screen";
            navigator.clipboard.writeText(finalPrompt + antiCollage).then(() => {
                copyBtn.innerText = '✅ 복사됨!';
                // ★ ImageFX 사이트 열기 ★
                window.open('https://aitestkitchen.withgoogle.com/tools/image-fx', '_blank');
                setTimeout(() => copyBtn.innerText = '📋 복사', 2000);
            });
        });

        row.appendChild(numBadge);
        row.appendChild(textSpan);
        row.appendChild(copyBtn);
        promptList.appendChild(row);
    });

    promptList.style.display = 'block';
}

// ImageFX 열기
const openImageFxBtn = document.getElementById('openImageFxBtn');
if (openImageFxBtn) {
    openImageFxBtn.addEventListener('click', () => {
        window.open("https://aitestkitchen.withgoogle.com/tools/image-fx", "_blank");
    });
}

// ============================================================
// 8. 이미지 생성 (Gemini Imagen 3)
// ============================================================
let currentIndex = 0;
let globalParagraphs = [];
let generatedImages = [];
const startImageBtn = document.getElementById('startImageBtn');
const nextImageBtn = document.getElementById('nextImageBtn');
const downloadAllSection = document.getElementById('downloadAllSection');
const downloadAllBtn = document.getElementById('downloadAllBtn');

// Gemini Imagen API로 이미지 생성
// 일관된 시드를 위한 변수
let consistentSeed = null;

async function generateImageWithGemini(prompt, apiKey) {
    // 첫 번째 이미지 생성 시 시드 설정
    if (!consistentSeed) {
        consistentSeed = Math.floor(Math.random() * 1000000);
    }

    // 실사 품질 강화 프롬프트
    const enhancedPrompt = `Create a high-quality photorealistic image: ${prompt}. Style: ultra-realistic photography, 8k resolution, sharp details, professional lighting, cinematic quality.`;

    // 방법 1: Gemini 2.0 Flash 이미지 생성 시도
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: enhancedPrompt }]
                }],
                generationConfig: {
                    responseModalities: ["IMAGE", "TEXT"]
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates[0]?.content?.parts) {
                for (const part of data.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        }
        console.log("Gemini 이미지 생성 실패, Pollinations로 전환");
    } catch (e) {
        console.log("Gemini 에러:", e.message);
    }

    // 방법 2: Imagen 3 시도
    const imagenModels = ['imagen-3.0-generate-001', 'imagen-3.0-fast-generate-001'];
    for (const model of imagenModels) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: enhancedPrompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: selectedRatio,
                        personGeneration: "ALLOW_ADULT"
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
                    return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
                }
            }
        } catch (e) {
            console.log(`${model} 에러:`, e.message);
        }
    }

    // 방법 3: Pollinations AI (무료 백업) - seed 및 model 추가로 일관성 향상
    console.log("Pollinations AI로 이미지 생성 시도...");
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${consistentSeed}&model=flux`;

    // 이미지 로드 확인
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(pollinationsUrl);
        img.onerror = () => reject(new Error("모든 이미지 생성 방법 실패"));
        img.src = pollinationsUrl;
    });
}

startImageBtn.addEventListener('click', async () => {
    const script = document.getElementById('imageScriptInput').value;
    let allPrompts = [];

    if (!script.trim()) {
        // 저장된 프롬프트가 있으면 사용
        if (generatedPrompts.length > 0) {
            allPrompts = generatedPrompts;
        } else {
            return alert("프롬프트가 없습니다. 먼저 '삽화 프롬프트 추출하기' 버튼을 눌러주세요.");
        }
    } else {
        allPrompts = script.split('\n').filter(l => l.trim().length > 5);
    }

    if (allPrompts.length === 0) return alert("내용이 부족합니다.");

    // ★ 이미지 개수 선택 적용 ★
    const imageCountSelect = document.getElementById('imageCountSelect');
    const selectedCount = imageCountSelect ? imageCountSelect.value : 'all';

    if (selectedCount === 'all') {
        globalParagraphs = allPrompts;
    } else {
        const count = parseInt(selectedCount, 10);
        globalParagraphs = allPrompts.slice(0, count);
    }

    // 프롬프트 개수 정보 표시
    const promptCountInfo = document.getElementById('promptCountInfo');
    if (promptCountInfo) {
        promptCountInfo.innerText = `(총 ${allPrompts.length}개 중 ${globalParagraphs.length}개 생성 예정)`;
    }

    const apiKey = getGeminiAPIKey();
    if (!apiKey) return alert("API 키가 없습니다. 위에서 API 키를 입력하고 저장하세요.");

    currentIndex = 0;
    generatedImages = [];
    document.getElementById('imageGallery').innerHTML = '';
    downloadAllSection.style.display = 'none';
    nextImageBtn.style.display = 'inline-block';
    startImageBtn.disabled = true;
    startImageBtn.innerText = "⏳ 생성 중...";

    await generateNextBatch();

    startImageBtn.disabled = false;
    startImageBtn.innerText = "⚡ Gemini로 이미지 생성";
});

nextImageBtn.addEventListener('click', async () => {
    nextImageBtn.disabled = true;
    await generateNextBatch();
    nextImageBtn.disabled = false;
});

// 첫 번째 이미지의 캐릭터 정보를 저장하기 위한 변수
let firstImageCharacterDesc = '';

async function generateNextBatch() {
    const gallery = document.getElementById('imageGallery');
    const progress = document.getElementById('progressText');
    const BATCH_SIZE = 3;
    const apiKey = getGeminiAPIKey();

    if (currentIndex >= globalParagraphs.length) {
        nextImageBtn.style.display = 'none';
        progress.innerText = "✅ 모든 이미지 생성 완료!";
        if (generatedImages.length > 0) {
            downloadAllSection.style.display = 'block';
        }
        return;
    }

    const endIndex = Math.min(currentIndex + BATCH_SIZE, globalParagraphs.length);
    const batch = globalParagraphs.slice(currentIndex, endIndex);
    progress.innerText = `생성 중... (${currentIndex + 1}~${endIndex}/${globalParagraphs.length})`;

    for (const text of batch) {
        let cleanText = text.replace(/^\d+\.\s*/, '').replace(/\s*\([^)]*[ㄱ-ㅎㅏ-ㅣ가-힣]+[^)]*\)\s*/g, '').trim();
        if (!cleanText.toLowerCase().includes('korean')) {
            cleanText = 'Korean person, ' + cleanText;
        }

        // ★ 첫 번째 이미지에서 캐릭터 정보 추출 및 저장 ★
        if (currentIndex === 0 && generatedImages.length === 0) {
            // 첫 번째 프롬프트에서 캐릭터 묘사 추출
            firstImageCharacterDesc = cleanText;
        }

        // ★ 모든 이미지에 실사 품질 강화 프롬프트 추가 ★
        const qualityEnhancement = "photorealistic, hyper-realistic, ultra detailed, 8k resolution, cinematic lighting, professional photography, high quality, masterpiece";
        const consistencyPrompt = firstImageCharacterDesc && currentIndex > 0 ?
            `same person as before, consistent character, ${qualityEnhancement}` :
            qualityEnhancement;

        const fullPrompt = cleanText + ", " + consistencyPrompt + ", " + getFullStyleWithComposition() + ", single scene, no collage, single image only, centered composition";

        const div = document.createElement('div');
        div.style.background = '#222';
        div.style.padding = '10px';
        div.style.borderRadius = '8px';

        const p = document.createElement('p');
        p.innerText = "🎨 " + cleanText.substring(0, 50) + "...";
        p.style.color = "#aaa";
        p.style.fontSize = "12px";
        p.style.marginBottom = "5px";

        const loadingDiv = document.createElement('div');
        loadingDiv.innerText = "⏳ 이미지 생성 중...";
        loadingDiv.style.color = "#888";
        loadingDiv.style.textAlign = "center";
        loadingDiv.style.padding = "50px 0";

        div.appendChild(p);
        div.appendChild(loadingDiv);
        gallery.appendChild(div);

        try {
            const imageUrl = await generateImageWithGemini(fullPrompt, apiKey);

            loadingDiv.remove();

            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.width = '100%';
            img.style.borderRadius = '5px';
            img.style.aspectRatio = selectedRatio.replace(':', '/');
            img.style.objectFit = 'cover';

            const downloadBtn = document.createElement('button');
            downloadBtn.innerText = "💾 저장";
            downloadBtn.style.display = "block";
            downloadBtn.style.width = "100%";
            downloadBtn.style.marginTop = "8px";
            downloadBtn.style.padding = "8px";
            downloadBtn.style.background = "linear-gradient(135deg, #4da3ff, #6c5ce7)";
            downloadBtn.style.border = "none";
            downloadBtn.style.borderRadius = "5px";
            downloadBtn.style.color = "white";
            downloadBtn.style.cursor = "pointer";

            downloadBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `gemini_image_${Date.now()}.png`;
                link.click();
            });

            div.appendChild(img);
            div.appendChild(downloadBtn);

            generatedImages.push({
                url: imageUrl,
                name: `gemini_image_${generatedImages.length + 1}.png`
            });

        } catch (error) {
            loadingDiv.innerText = "❌ 생성 실패: " + error.message;
            loadingDiv.style.color = "#ff5252";
            console.error("이미지 생성 오류:", error);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    currentIndex = endIndex;
    progress.innerText = `완료: ${currentIndex}/${globalParagraphs.length}`;

    if (currentIndex >= globalParagraphs.length) {
        nextImageBtn.style.display = 'none';
        progress.innerText = "✅ 모든 이미지 생성 완료!";
        if (generatedImages.length > 0) {
            downloadAllSection.style.display = 'block';
        }
    }
}

// 일괄 다운로드 기능
if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', async () => {
        if (generatedImages.length === 0) {
            return alert("다운로드할 이미지가 없습니다.");
        }

        downloadAllBtn.disabled = true;
        downloadAllBtn.innerText = "📥 다운로드 중...";

        for (let i = 0; i < generatedImages.length; i++) {
            const img = generatedImages[i];
            const link = document.createElement('a');
            link.href = img.url;
            link.download = `image_${i + 1}.png`;
            link.click();

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        downloadAllBtn.disabled = false;
        downloadAllBtn.innerText = "📥 전체 이미지 일괄 다운로드";
        alert(`✅ ${generatedImages.length}개의 이미지가 다운로드되었습니다!`);
    });
}

// ============================================================
// 9. 초기화 버튼
// ============================================================
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (!confirm("전체 화면을 초기화할까요?\n(대본, 이미지, 저장된 설정 모두 삭제됩니다)")) return;

        // 대본 영역 초기화
        document.getElementById('result').innerText = '여기에 대본이 나옵니다...';
        document.getElementById('safetyReportBox').style.display = 'none';
        document.getElementById('safetyReportBox').innerHTML = '';
        document.getElementById('youtubePackageBox').style.display = 'none';
        document.getElementById('bridgeSection').style.display = 'none';

        // 대본 수정 요청 섹션 초기화
        document.getElementById('editRequestSection').style.display = 'none';
        document.getElementById('editRequestInput').value = '';

        // 내 대본 섹션 초기화
        document.getElementById('myScriptInput').value = '';
        personaSection.style.display = 'none';
        personaInput.value = '';

        // 이미지 영역 초기화
        document.getElementById('imageGallery').innerHTML = '';
        document.getElementById('imageScriptInput').value = '';
        document.getElementById('progressText').innerText = '';
        document.getElementById('promptList').innerHTML = '';
        document.getElementById('promptList').style.display = 'none';
        downloadAllSection.style.display = 'none';
        nextImageBtn.style.display = 'none';

        // 변수 초기화
        currentIndex = 0;
        globalParagraphs = [];
        generatedPrompts = [];
        generatedImages = [];
        characterPersona = '';
        firstImageCharacterDesc = '';
        consistentSeed = null;

        // localStorage 초기화
        clearAllStorage();

        alert("✅ 전체 초기화 완료!");
    });
}

// ============================================================
// 10. 저장된 데이터 복원 (페이지 로드 시)
// ============================================================
function restoreSavedData() {
    const savedScript = loadFromStorage(STORAGE_KEYS.SCRIPT_INPUT);
    if (savedScript) {
        const myScriptInput = document.getElementById('myScriptInput');
        if (myScriptInput) myScriptInput.value = savedScript;
    }

    const savedPersona = loadFromStorage(STORAGE_KEYS.PERSONA);
    if (savedPersona && personaInput) {
        characterPersona = savedPersona;
        personaInput.value = savedPersona;
        personaSection.style.display = 'block';
    }
}

// 대본 입력 시 자동 저장
const myScriptInput = document.getElementById('myScriptInput');
if (myScriptInput) {
    let saveTimeout;
    myScriptInput.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveToStorage(STORAGE_KEYS.SCRIPT_INPUT, myScriptInput.value);
        }, 500);
    });
}

// ============================================================
// 11. 블로그 글 생성 기능
// ============================================================
let blogImagePrompts = []; // 블로그 이미지 프롬프트 저장

const generateBlogBtn = document.getElementById('generateBlogBtn');
if (generateBlogBtn) {
    generateBlogBtn.addEventListener('click', async () => {
        const keyword = document.getElementById('blogKeywordInput').value.trim();
        const length = document.getElementById('blogLengthSelect').value;
        const resultDiv = document.getElementById('result');
        const blogImageSection = document.getElementById('blogImageSection');

        if (!keyword) {
            return alert("키워드를 입력해주세요!");
        }

        const apiKey = getGeminiAPIKey();
        if (!apiKey) {
            return alert("API 키가 없습니다. 위에서 API 키를 입력하고 저장하세요.");
        }

        // 분량 가이드 설정
        let lengthGuide = "";
        if (length === "short") {
            lengthGuide = "짧게 작성 (1500자 내외). 핵심 정보만 간결하게.";
        } else if (length === "medium") {
            lengthGuide = "중간 분량 (2500자 내외). 적당한 깊이와 상세함.";
        } else {
            lengthGuide = "길게 작성 (4000자 내외). 매우 상세하고 풍부한 정보.";
        }

        generateBlogBtn.disabled = true;
        generateBlogBtn.innerText = "⏳ 블로그 글 작성 중...";
        resultDiv.innerText = "⏳ 블로그 글을 작성하고 있습니다. 잠시만 기다려주세요...";
        if (blogImageSection) blogImageSection.style.display = 'none';

        // 프롬프트 생성
        const fullPrompt = PROMPT_BLOG
            .replace('{LENGTH_GUIDE}', lengthGuide)
            .replace('{KEYWORD}', keyword);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    generationConfig: {
                        maxOutputTokens: 8192
                    }
                })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error?.message || "통신 오류");
            if (!data.candidates || !data.candidates[0].content) throw new Error("AI 응답이 비어있습니다");

            const fullText = data.candidates[0].content.parts[0].text;

            // [BLOG_IMAGES] 섹션 파싱
            let blogContent = fullText;
            blogImagePrompts = [];

            if (fullText.includes('[BLOG_IMAGES]')) {
                const parts = fullText.split('[BLOG_IMAGES]');
                blogContent = parts[0].trim();
                const imageSection = parts[1] || "";

                // 이미지 프롬프트 추출 (번호. 으로 시작하는 줄)
                const lines = imageSection.split('\n');
                for (const line of lines) {
                    const match = line.match(/^\d+\.\s*(.+)/);
                    if (match && match[1].trim().length > 10) {
                        blogImagePrompts.push(match[1].trim());
                    }
                }
            }

            // ★ 마침표/물음표/느낌표 후 줄바꿈 처리 (가독성 향상) ★
            // <br> 태그 제거 (AI가 가끔 생성함)
            blogContent = blogContent.replace(/<br\s*\/?>/gi, '\n');
            // 모든 한글 다음 마침표 뒤에 줄바꿈 추가
            blogContent = blogContent.replace(/([가-힣])\.\s*/g, '$1.\n\n');
            // 물음표 다음에 줄바꿈
            blogContent = blogContent.replace(/\?\s*/g, '?\n\n');
            // 느낌표 다음에 줄바꿈
            blogContent = blogContent.replace(/!\s*/g, '!\n\n');
            // 연속된 줄바꿈 정리 (3개 이상은 2개로)
            blogContent = blogContent.replace(/\n{3,}/g, '\n\n');
            // 해시태그 줄은 붙여쓰기 (태그 복원)
            blogContent = blogContent.replace(/#([^\n]+)\n\n#/g, '#$1 #');

            // 결과 표시 (이미지 프롬프트 제외)
            resultDiv.innerText = blogContent;

            // 복사 버튼 표시를 위해 브릿지 섹션 표시
            const bridge = document.getElementById('bridgeSection');
            if (bridge) {
                bridge.style.display = 'block';
            }

            // 이미지 프롬프트가 있으면 표시
            if (blogImagePrompts.length > 0 && blogImageSection) {
                blogImageSection.style.display = 'block';
                renderBlogPromptList(blogImagePrompts);
            }

            // 네이버 블로그 발행 섹션 표시
            const naverBlogSection = document.getElementById('naverBlogSection');
            if (naverBlogSection) {
                naverBlogSection.style.display = 'block';
            }

            // ★ 자동으로 블로그 제목 추천 실행 ★
            await generateBlogTitles(keyword);

            alert("✅ 블로그 글이 생성되었습니다!" + (blogImagePrompts.length > 0 ? `\n이미지 프롬프트 ${blogImagePrompts.length}개도 생성되었습니다.` : "") + "\n제목 추천도 자동으로 생성되었습니다!");

        } catch (error) {
            resultDiv.innerText = "❌ 오류 발생: " + error.message;
            console.error(error);
        } finally {
            generateBlogBtn.disabled = false;
            generateBlogBtn.innerText = "✍️ 블로그 글 생성하기";
        }
    });
}

// ============================================================
// 12. 블로그 제목 추천 기능
// ============================================================
const PROMPT_BLOG_TITLE = `
당신은 네이버 블로그 SEO 전문가이자 바이럴 마케팅 전문가입니다.
사용자가 제공하는 키워드로 **클릭을 부르는 블로그 제목** 3개를 추천하세요.

★★★ 제목 작성 규칙 ★★★
1. 클릭을 유도하는 강력한 후킹 요소 포함:
   - 숫자 사용 (예: "3가지", "5분만에", "10배", "TOP 7")
   - 궁금증 유발 (예: "이것 모르면...", "알고 보니...", "숨겨진 비밀")
   - 감정 자극 (예: "충격", "놀라운", "꿀팁", "필수", "후회")
   - 이익 제시 (예: "~하는 법", "~완벽 가이드", "전문가가 추천하는")

2. 네이버 SEO 최적화:
   - 메인 키워드를 제목 앞부분에 배치
   - 25~35자 내외 적정 길이 유지
   - 검색자의 의도에 맞는 키워드 포함

3. 금지 사항:
   - 특수문자 과다 사용 금지
   - 너무 자극적이거나 낚시성 제목 금지
   - 허위/과장 표현 금지

★★★ 출력 형식 ★★★
아래 형식으로만 출력하세요. 다른 설명 없이 제목 3개만 출력하세요.

1. [제목1]
2. [제목2]
3. [제목3]

[키워드]
{KEYWORD}
`;

// ★ 블로그 제목 생성 함수 (재사용 가능) ★
async function generateBlogTitles(keyword) {
    const titleResult = document.getElementById('blogTitleResult');
    const titleList = document.getElementById('blogTitleList');
    const generateBlogTitleBtn = document.getElementById('generateBlogTitleBtn');

    if (!keyword) {
        return;
    }

    const apiKey = getGeminiAPIKey();
    if (!apiKey) {
        return;
    }

    if (generateBlogTitleBtn) {
        generateBlogTitleBtn.disabled = true;
        generateBlogTitleBtn.innerText = "⏳ 제목 생성 중...";
    }

    const fullPrompt = PROMPT_BLOG_TITLE.replace('{KEYWORD}', keyword);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    maxOutputTokens: 8192
                }
            })
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || "통신 오류");
        if (!data.candidates || !data.candidates[0].content) throw new Error("AI 응답이 비어있습니다");

        const fullText = data.candidates[0].content.parts[0].text;

        // 제목 파싱 (1. 제목, 2. 제목 형식)
        const titles = [];
        const lines = fullText.split('\n');
        for (const line of lines) {
            const match = line.match(/^\d+\.\s*(.+)/);
            if (match && match[1].trim().length > 5) {
                titles.push(match[1].trim());
            }
        }

        // 결과 표시
        if (titles.length > 0 && titleList) {
            titleList.innerHTML = '';
            titles.forEach((title, index) => {
                const titleCard = document.createElement('div');
                titleCard.style.cssText = 'display: flex; gap: 10px; align-items: center; padding: 12px; background: rgba(255, 193, 7, 0.15); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 10px; cursor: pointer; transition: all 0.2s;';
                titleCard.addEventListener('mouseenter', () => {
                    titleCard.style.background = 'rgba(255, 193, 7, 0.25)';
                    titleCard.style.transform = 'translateX(5px)';
                });
                titleCard.addEventListener('mouseleave', () => {
                    titleCard.style.background = 'rgba(255, 193, 7, 0.15)';
                    titleCard.style.transform = 'translateX(0)';
                });

                const numBadge = document.createElement('span');
                numBadge.innerText = index + 1;
                numBadge.style.cssText = 'background: linear-gradient(to right, #f7971e, #ffd200); padding: 6px 12px; border-radius: 6px; color: #222; font-weight: bold; font-size: 14px;';

                const titleText = document.createElement('span');
                titleText.innerText = title;
                titleText.style.cssText = 'flex: 1; color: #fff; font-size: 14px; font-weight: 500;';

                const copyBtn = document.createElement('button');
                copyBtn.innerText = '📋 복사';
                copyBtn.style.cssText = 'background: #4da3ff; border: none; border-radius: 6px; padding: 6px 14px; color: white; cursor: pointer; font-size: 13px; font-weight: bold;';
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(title).then(() => {
                        copyBtn.innerText = '✅ 완료!';
                        setTimeout(() => copyBtn.innerText = '📋 복사', 1500);
                    });
                });

                titleCard.appendChild(numBadge);
                titleCard.appendChild(titleText);
                titleCard.appendChild(copyBtn);
                titleList.appendChild(titleCard);
            });

            titleResult.style.display = 'block';
        }

    } catch (error) {
        console.error("제목 생성 오류:", error);
    } finally {
        if (generateBlogTitleBtn) {
            generateBlogTitleBtn.disabled = false;
            generateBlogTitleBtn.innerText = "💡 제목 추천받기";
        }
    }
}

const generateBlogTitleBtn = document.getElementById('generateBlogTitleBtn');
if (generateBlogTitleBtn) {
    generateBlogTitleBtn.addEventListener('click', async () => {
        const keyword = document.getElementById('blogKeywordInput').value.trim();
        if (!keyword) {
            return alert("키워드를 먼저 입력해주세요!");
        }
        const apiKey = getGeminiAPIKey();
        if (!apiKey) {
            return alert("API 키가 없습니다. 위에서 API 키를 입력하고 저장하세요.");
        }
        await generateBlogTitles(keyword);
    });
}

// 블로그 이미지 프롬프트 목록 렌더링
function renderBlogPromptList(prompts) {
    const listDiv = document.getElementById('blogPromptList');
    if (!listDiv) return;

    listDiv.innerHTML = '';
    prompts.forEach((prompt, index) => {
        // 한글|영어 형식 파싱
        let koreanDesc = prompt;
        let englishPrompt = prompt;

        if (prompt.includes('|')) {
            const parts = prompt.split('|');
            koreanDesc = parts[0].trim();
            englishPrompt = parts[1].trim();
        }

        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 10px; align-items: center; padding: 8px; margin-bottom: 5px; background: rgba(0,0,0,0.3); border-radius: 8px;';

        const numBadge = document.createElement('span');
        numBadge.innerText = index + 1;
        numBadge.style.cssText = 'background: #6a11cb; padding: 4px 10px; border-radius: 5px; color: white; font-size: 12px;';

        const textSpan = document.createElement('span');
        textSpan.innerText = koreanDesc;
        textSpan.style.cssText = 'flex: 1; color: #ccc; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';

        const copyBtn = document.createElement('button');
        copyBtn.innerText = '📋 복사';
        copyBtn.style.cssText = 'background: #4da3ff; border: none; border-radius: 5px; padding: 4px 12px; color: white; cursor: pointer; font-size: 12px;';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(englishPrompt).then(() => {
                copyBtn.innerText = '✅ 완료';
                setTimeout(() => copyBtn.innerText = '📋 복사', 1500);
            });
        });

        row.appendChild(numBadge);
        row.appendChild(textSpan);
        row.appendChild(copyBtn);
        listDiv.appendChild(row);

        // 영어 프롬프트를 데이터 속성에 저장 (이미지 생성용)
        row.dataset.englishPrompt = englishPrompt;
    });
}

// 블로그 이미지 생성 버튼
let generatedBlogImages = []; // 블로그 이미지 URL 저장 배열
const generateBlogImagesBtn = document.getElementById('generateBlogImagesBtn');
if (generateBlogImagesBtn) {
    generateBlogImagesBtn.addEventListener('click', async () => {
        if (blogImagePrompts.length === 0) {
            return alert("이미지 프롬프트가 없습니다. 먼저 블로그 글을 생성하세요.");
        }

        const apiKey = getGeminiAPIKey();
        if (!apiKey) return alert("API 키가 없습니다.");

        const gallery = document.getElementById('blogImageGallery');
        const progress = document.getElementById('blogImageProgress');
        const downloadAllSection = document.getElementById('blogDownloadAllSection');

        generatedBlogImages = []; // 초기화
        if (downloadAllSection) downloadAllSection.style.display = 'none';
        if (!gallery) return;

        gallery.innerHTML = '';
        generateBlogImagesBtn.disabled = true;
        generateBlogImagesBtn.innerText = "⏳ 이미지 생성 중...";

        for (let i = 0; i < blogImagePrompts.length; i++) {
            let prompt = blogImagePrompts[i];

            // 한글|영어 형식에서 영어 프롬프트만 추출
            if (prompt.includes('|')) {
                prompt = prompt.split('|')[1].trim();
            }

            progress.innerText = `생성 중... (${i + 1}/${blogImagePrompts.length})`;

            const div = document.createElement('div');
            div.style.cssText = 'background: #222; padding: 8px; border-radius: 8px;';

            const loadingDiv = document.createElement('div');
            loadingDiv.innerText = "⏳ 생성 중...";
            loadingDiv.style.cssText = 'color: #888; text-align: center; padding: 40px 0; font-size: 12px;';
            div.appendChild(loadingDiv);
            gallery.appendChild(div);

            try {
                const imageUrl = await generateImageWithGemini(prompt + ", food photography, product photography, bright natural lighting, pure white background, solid white backdrop, clean minimal style, high quality, 8k", apiKey);

                loadingDiv.remove();

                const img = document.createElement('img');
                img.src = imageUrl;
                img.style.cssText = 'width: 100%; border-radius: 5px; aspect-ratio: 1/1; object-fit: cover;';

                const downloadBtn = document.createElement('button');
                downloadBtn.innerText = "💾 저장";
                downloadBtn.style.cssText = 'display: block; width: 100%; margin-top: 5px; padding: 6px; background: linear-gradient(135deg, #4da3ff, #6c5ce7); border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 11px;';
                downloadBtn.addEventListener('click', () => {
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = `blog_image_${i + 1}.png`;
                    link.click();
                });

                div.appendChild(img);
                div.appendChild(downloadBtn);

                // 이미지 URL 저장
                generatedBlogImages.push({
                    url: imageUrl,
                    name: `blog_image_${i + 1}.png`
                });

            } catch (error) {
                loadingDiv.innerText = "❌ 실패";
                loadingDiv.style.color = "#ff5252";
            }

            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        progress.innerText = `✅ ${blogImagePrompts.length}개 이미지 생성 완료!`;
        generateBlogImagesBtn.disabled = false;
        generateBlogImagesBtn.innerText = "🎨 블로그 이미지 생성 (AI)";

        // 일괄 다운로드 버튼 표시
        if (generatedBlogImages.length > 0 && downloadAllSection) {
            downloadAllSection.style.display = 'block';
        }
    });
}

// ImageFX로 블로그 이미지 생성
const openImageFxBlogBtn = document.getElementById('openImageFxBlogBtn');
if (openImageFxBlogBtn) {
    openImageFxBlogBtn.addEventListener('click', () => {
        window.open("https://aitestkitchen.withgoogle.com/tools/image-fx", "_blank");
        if (blogImagePrompts.length > 0) {
            let firstPrompt = blogImagePrompts[0];
            // 한글|영어 형식에서 영어 프롬프트만 추출
            if (firstPrompt.includes('|')) {
                firstPrompt = firstPrompt.split('|')[1].trim();
            }
            navigator.clipboard.writeText(firstPrompt).then(() => {
                alert("✅ 첫 번째 프롬프트가 클립보드에 복사되었습니다!\nImageFX에서 붙여넣기 하세요.");
            });
        }
    });
}

// 블로그 이미지 일괄 다운로드
const downloadAllBlogImagesBtn = document.getElementById('downloadAllBlogImagesBtn');
if (downloadAllBlogImagesBtn) {
    downloadAllBlogImagesBtn.addEventListener('click', async () => {
        if (generatedBlogImages.length === 0) {
            return alert("다운로드할 이미지가 없습니다.");
        }

        downloadAllBlogImagesBtn.disabled = true;
        downloadAllBlogImagesBtn.innerText = "📥 다운로드 중...";

        for (let i = 0; i < generatedBlogImages.length; i++) {
            const img = generatedBlogImages[i];
            const link = document.createElement('a');
            link.href = img.url;
            link.download = img.name;
            link.click();

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        downloadAllBlogImagesBtn.disabled = false;
        downloadAllBlogImagesBtn.innerText = "📥 블로그 이미지 전체 다운로드";
        alert(`✅ ${generatedBlogImages.length}개의 블로그 이미지가 다운로드되었습니다!`);
    });
}

// 초기화
restoreSavedData();

// ============================================================
// 13. 네이버 블로그 바로가기 기능
// ============================================================
let generatedBlogTitle = ''; // 생성된 블로그 제목 저장

// 제목+본문 복사 버튼
const copyTitleAndContentBtn = document.getElementById('copyTitleAndContentBtn');
if (copyTitleAndContentBtn) {
    copyTitleAndContentBtn.addEventListener('click', () => {
        const resultDiv = document.getElementById('result');
        const blogContent = resultDiv.innerText;

        // 제목 리스트에서 첫 번째 제목 가져오기
        const titleList = document.getElementById('blogTitleList');
        let title = '';
        if (titleList && titleList.children.length > 0) {
            const firstTitleSpan = titleList.children[0].querySelector('span:nth-child(2)');
            if (firstTitleSpan) {
                title = firstTitleSpan.innerText;
            }
        }

        // 제목+본문 조합
        const fullContent = title ? `${title}\n\n${blogContent}` : blogContent;

        navigator.clipboard.writeText(fullContent).then(() => {
            copyTitleAndContentBtn.innerText = '✅ 복사완료!';
            setTimeout(() => {
                copyTitleAndContentBtn.innerText = '📋 제목+본문 복사';
            }, 2000);
        });
    });
}

// 네이버 블로그 열기 버튼
const openNaverBlogBtn = document.getElementById('openNaverBlogBtn');
if (openNaverBlogBtn) {
    openNaverBlogBtn.addEventListener('click', () => {
        // 저장된 블로그 ID 가져오기
        const blogId = loadFromStorage(STORAGE_KEYS.BLOG_ID) || '';

        if (blogId) {
            // 블로그 ID가 있으면 해당 블로그 글쓰기 페이지로 이동
            window.open(`https://blog.naver.com/${blogId}/postwrite`, '_blank');
        } else {
            // 블로그 ID가 없으면 일반 글쓰기 페이지로 이동
            window.open('https://blog.naver.com/PostWriteForm.naver', '_blank');
        }
    });
}

// 네이버 블로그 ID 저장 버튼
const saveBlogIdBtn = document.getElementById('saveBlogIdBtn');
if (saveBlogIdBtn) {
    saveBlogIdBtn.addEventListener('click', () => {
        const blogIdInput = document.getElementById('blogIdInput');
        if (blogIdInput && blogIdInput.value.trim()) {
            saveToStorage(STORAGE_KEYS.BLOG_ID, blogIdInput.value.trim());
            alert('✅ 블로그 ID가 저장되었습니다!');
        } else {
            alert('블로그 ID를 입력해주세요.');
        }
    });
}

// 저장된 블로그 ID 복원
const blogIdInput = document.getElementById('blogIdInput');
if (blogIdInput) {
    const savedBlogId = loadFromStorage(STORAGE_KEYS.BLOG_ID);
    if (savedBlogId) {
        blogIdInput.value = savedBlogId;
    }
}