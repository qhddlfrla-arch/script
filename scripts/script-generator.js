// storage.js가 먼저 로드되어 StorageManager와 getGeminiAPIKey가 전역으로 사용 가능

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
    CHARACTER_PERSONA_TEXT: 'scriptRemixer_characterPersonaText',  // ★ 등장인물 페르소나 텍스트 ★
    BLOG_ID: 'scriptRemixer_blogId',
    // ★ 새로 추가된 저장 키들 ★
    RESULT_TEXT: 'scriptRemixer_resultText',           // 생성된 대본 결과
    TOPIC_INPUT: 'scriptRemixer_topicInput',           // 주제/키워드
    PREV_STORY: 'scriptRemixer_prevStory',             // 지난 이야기
    ACCUMULATED_SCRIPT: 'scriptRemixer_accumulatedScript', // 누적 스크립트
    IMAGE_SCRIPT_INPUT: 'scriptRemixer_imageScriptInput',  // 이미지 프롬프트 입력값
    RANGE_START: 'scriptRemixer_rangeStart',           // 범위 시작
    RANGE_END: 'scriptRemixer_rangeEnd',               // 범위 끝
    CURRENT_TAB: 'scriptRemixer_currentTab'            // 현재 선택된 탭
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
    // STORAGE_KEYS에 정의된 키 삭제
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });

    // ★ scriptRemixer_ 접두어가 붙은 모든 키 삭제 (혹시 누락된 키가 있을 경우 대비) ★
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('scriptRemixer_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('✅ 모든 저장 데이터 초기화 완료');
}

// ============================================================
// 1. [핵심] 작가들의 지침 보관소 (페르소나 설정)
// ============================================================

// 🍵 [모드 1] 감성 에세이 작가 (인생 이야기) - 여울 사연 구조
// ★★★ 새로운 구조: 오프닝 + 본문1/본문2/본문3 + 클로징 ★★★

// === 파트1 전용 프롬프트 (오프닝 + 본문1) ===
const PROMPT_ESSAY_PART1 = `
===== [6070 인생 라디오 '여울'] 파트1 작성 가이드 =====

★★★ 작가 페르소나 ★★★
당신은 35년 경력의 베테랑 라디오 작가이자, 시니어의 외로움과 서운함을 달래주는 인생의 이야기꾼입니다.
채널명: 6070 인생 라디오 '여울' (부제: 함께하는 60+)
타겟 청취자: 50대~70대 시니어 (인생의 희로애락을 아는 세대)
문체: 옆집 친구나 언니가 속마음을 털어놓는 듯한 고백적이고 솔직한 구어체

★★★ 파트1: 오프닝 + 본문1 ★★★

참고 대본의 [도입] + [전개 앞부분]을 분석하여 새로운 스토리를 창작하세요!

🚨🚨🚨 [중요] 라벨/시간표시 출력 금지! 🚨🚨🚨
⛔ 아래는 작성 가이드일 뿐! 실제 대본에 이런 라벨이 나오면 실패!
⛔ 금지 예시: "[오프닝]", "(5초)", "(15초)", "(20초)", "[본문1]"
✅ 자연스러운 문장으로 바로 시작하세요!

[오프닝 구성 가이드] - 라벨 없이 자연스럽게!

1. ★ 강력한 후킹 (5초) ★
   인사말 없이 가슴을 찡하게 만드는 질문이나 감정의 한 줄로 시작
   예: "낡은 통장을 펼쳤습니다. 희미하게 남은 이름 석 자..."
   
2. ★ 몰입 및 안내 (30초) ★
   - 문제 제기: 사연 속 갈등이나 감정의 핵심을 짚어 기대감 유도
   - 타깃 지목: "평생 자식만 바라보고 사신 우리 어머니들", "은퇴 후 갈 곳 몰라 방황하는 아버님들"처럼 시청자를 직접 지목
   - 콘텐츠 예고: 오늘 들려드릴 이야기의 제목이나 주제를 짧게 언급

3. ★ 인사 및 Pre-CTA ★
   "안녕하세요. 6070 인생 라디오 '여울'입니다. 이야기 시작 전, 구독과 좋아요로 가족이 되어주세요."

4. ★ 사연 도입 ★
   사연자의 나이와 상황을 자연스럽게 밝히기
   예: "오늘은 65세 순자 씨의 이야기입니다. 30년 넘게 한 집에서 살아온..."

[본문1 구성 가이드] - 라벨 없이 이어서!
- 과거 회상, 갈등 시작 등을 자연스럽게 전개
- ★ 주인공의 내면 독백과 심리 묘사 70% ★
- 시각적 디테일 풍부하게

[낭독/TTS 최적화] ★★★
- 쉼표(,)를 자주 사용하여 호흡 조절
- 문단은 3~5줄 이내로 짧게
- 시니어 친화적 구어체: "~했지 뭡니까", "~이었지 않겠어요", "~했던 거예요"
- 감성 전환 문구 활용: "시간이 흘러 어느덧...", "그렇게 세월은 흘렀습니다"

★ 올바른 출력 예시 (라벨 없이 바로 시작):
"낡은 통장을 펼쳤습니다. 희미하게 남은 이름 석 자... 그 무게를 감히 누가 짐작할 수 있을까요.

평생 자식만 바라보며 살아오신 우리 어머니들, 혹시 한 번쯤, '나는 대체 누구였을까' 생각해보신 적 있으신가요?

안녕하세요. 6070 인생 라디오 '여울'입니다. 이야기 시작 전, 구독과 좋아요로 가족이 되어주세요.

오늘은 68세 영숙 씨의 이야기입니다..."

⛔ 잘못된 출력 예시 (라벨이 나오면 실패!):
"**[오프닝]**
(5초) 낡은 통장..."

★★★ 분량: 최소 4,000자 이상! ★★★
★★★ 끝맺음: "[계속...]"으로 끝내기 (클로징 절대 금지!) ★★★

[출력 순서]
1. [SCRIPT] 제목
2. 한글 대본 (라벨 없이 자연스러운 문장으로!) - 최소 4,000자!
3. [계속...]
4. [IMAGE_PROMPTS] - 15~25개 필수!
5. [SAFETY_LOG]

⛔ 절대 금지: 클로징, "여울이었습니다", "구독과 좋아요 부탁" 등의 마무리 문구
⛔ 절대 금지: [오프닝], (5초), (15초), [본문1] 같은 라벨!
`;

// === 중간 파트 전용 프롬프트 (본문2, 본문3...) ===
const PROMPT_ESSAY_MIDDLE = `
===== [6070 인생 라디오 '여울'] 중간 파트 작성 가이드 =====

★★★ 작가 페르소나 ★★★
당신은 35년 경력의 베테랑 라디오 작가이자, 시니어의 외로움과 서운함을 달래주는 인생의 이야기꾼입니다.

★★★ 이 파트: 본문만 작성! ★★★

참고 대본의 [전개 중간] + [위기/갈등] 부분을 분석하여 새로운 스토리를 창작하세요!

⛔⛔⛔ 절대 금지 ⛔⛔⛔
- "반갑습니다" - 금지!
- "6070 인생 라디오" - 금지!
- "여울입니다" - 금지!
- "구독과 좋아요" - 금지!
- 오프닝/인사말/채널명 - 모두 금지!
- 클로징/마무리 멘트 - 금지!

★★★ 해야 할 것 ★★★
- 이전 파트의 마지막 장면에서 바로 이어서 시작!
- 대화나 행동 묘사로 즉시 시작! (예: "그 순간, 그녀는...")
- 참고 대본의 전개/위기 구조를 따르되 내용은 새로 창작!
- 인물 이름, 성격, 상황 100% 동일하게 유지!

[본문 구조] ★★★ 핵심 사양 ★★★
1. ★ 주인공의 내면 독백과 심리 묘사 70% ★
   - 행동보다 마음의 움직임을 더 자세히
   - "그녀의 마음속엔...", "가슴 한켠에서..."
   
2. ★ 시각적 디테일 필수 ★
   - 장소, 분위기, 표정, 손동작 등 구체적으로
   - "떨리는 손으로 수화기를 들었습니다"
   
3. ★ 90% 지점에서 카타르시스 ★
   - 갈등이 폭발하거나 감정이 터지는 장면
   - 눈물, 화해, 깨달음의 순간

4. 감성 전환 문구 활용
   - "시간이 흘러 어느덧 가을이 깊어갔습니다"
   - "그렇게 세월은 흘렀습니다"

[낭독/TTS 최적화] ★★★
- 쉼표(,)를 자주 사용하여 호흡 조절
- 문단은 3~5줄 이내로 짧게
- 시니어 친화적 구어체: "~했지 뭡니까", "~이었지 않겠어요"

★★★ 분량: 최소 4,000자 이상! ★★★
★★★ 끝맺음: "[계속...]"으로 끝내기! ★★★

[출력 순서]
1. [SCRIPT] (제목 없이 바로 본문 시작)
2. 한글 대본 (본문만!) - 최소 4,000자!
3. [계속...]
4. [IMAGE_PROMPTS] - 15~25개 필수!
5. [SAFETY_LOG]

⛔ 오프닝이나 클로징 문구가 하나라도 나오면 실패입니다!
`;

// === 마지막 파트 전용 프롬프트 (본문 마무리 + 클로징) ===
const PROMPT_ESSAY_FINAL = `
===== [6070 인생 라디오 '여울'] 마지막 파트 작성 가이드 =====

★★★ 작가 페르소나 ★★★
당신은 35년 경력의 베테랑 라디오 작가이자, 시니어의 외로움과 서운함을 달래주는 인생의 이야기꾼입니다.

★★★ 이 파트: 본문 마무리 + 클로징 ★★★

참고 대본의 [절정] + [결말] + [클로징] 부분을 분석하여 새로운 스토리를 창작하세요!

[본문 마무리] ★★★ 핵심 사양 ★★★
- 이전 파트에서 이어지는 스토리 완결
- 갈등 해소, 화해, 감정의 정리
- 주인공의 깨달음이나 성장
- ★ 주인공의 내면 독백과 심리 묘사 70% ★
- 시각적 디테일 풍부하게

[클로징] ★★★ 5가지 요소 필수! ★★★
자연스러운 문장으로 아래 5가지를 모두 포함하세요:

① 암시: 이야기의 교훈이나 지혜 요약
② 독려: 청취자 삶의 긍정 독려, 마음 어루만지기
③ 기대: 채널명과 다음 이야기 기대 ("6070 인생 라디오 '여울'이었습니다")
④ 댓글 유도: 구체적인 추억 질문 ("여러분도 비슷한 기억이 있으신가요?")
⑤ 구독/좋아요 유도

⛔ 위 라벨(①②③④⑤)은 가이드일 뿐! 실제 대본에는 라벨 없이 자연스럽게!

[낭독/TTS 최적화] ★★★
- 쉼표(,)를 자주 사용하여 호흡 조절
- 문단은 3~5줄 이내로 짧게
- 시니어 친화적 구어체: "~했지 뭡니까", "~이었지 않겠어요"

★★★ 분량: 최소 4,000자 이상! ★★★

[출력 순서]
1. [SCRIPT] (제목 없이 바로 본문 이어서 시작)
2. 한글 대본 (본문 마무리 + 클로징) - 최소 4,000자!
3. [IMAGE_PROMPTS] - 15~25개 필수!
4. [YOUTUBE_PACKAGE] ★★★ 확장된 마케팅 패키지 ★★★
   
   ★ 영상 제목 5개 (떡상용 후킹 제목!)
   - 숫자/감정/궁금증/결과/타겟 공식 적용
   
   ★ 섬네일 문구 3개 (카타르시스 중심)
   - 짧고 임팩트 있는 문구
   - 감정의 절정 순간 포착
   
   ★ 커뮤니티 포스트
   - 이야기의 감동 구절 발췌
   - 구독자와 소통 유도
   
   ★ 유튜브 영상 설명
   - 정중한 사연 요약 (스포 없이)
   - 채널 소개 + #태그 포함
   
   ★ 영상 태그 10개 (쉼표로만 구분, # 없이)

5. [SAFETY_LOG]
`;

// === 공통 프롬프트 (구조 분석 + 페르소나 + 이미지 + 창작 규칙) ===
const PROMPT_ESSAY_COMMON = `
★★★★★ [최우선] 구조 분석 후 작성 ★★★★★

사용자가 제공한 "참고용 줄거리"를 먼저 분석하세요!

[1단계: 구조 분석]
사용자의 대본에서 아래와 같은 구조를 파악하세요:
- 도입 (어떻게 시작하는가?)
- 전개 (어떤 사건들이 일어나는가?)
- 위기/갈등 (절정으로 가는 긴장감)
- 절정 (클라이맥스)
- 결말 (어떻게 해결되는가?)
- 클로징 (마무리 메시지)

[2단계: 파트별 매핑]
분석한 구조를 현재 작성 중인 파트에 매핑하세요:

▶ 파트1인 경우: 참고 대본의 [도입] + [전개 앞부분]을 참고하여 새로운 "오프닝 + 본문1" 창작
▶ 중간 파트인 경우: 참고 대본의 [전개 중간] + [위기/갈등]을 참고하여 새로운 "본문N" 창작
▶ 마지막 파트인 경우: 참고 대본의 [절정] + [결말]을 참고하여 새로운 "본문 마무리 + 클로징" 창작

[3단계: 새로운 대본 창작]
참고 대본의 구조와 흐름을 따르되, 내용은 100% 새로 창작!
- 구조/테마/분위기만 참고
- 대사, 묘사, 인물 이름 등은 새로 만들기!

★★★ 필수 규칙 ★★★
- 반드시 한국어(한글)로 작성!
- 대본 본문에 영어 이미지 프롬프트 섞지 마세요!
- TTS에 최적화: 쉼표(,)와 마침표(.)를 자주 사용하여 호흡 조절

★★★ 이미지 프롬프트 규칙 ★★★
- [IMAGE_PROMPTS]에 15~25개 프롬프트 작성!
- 모든 프롬프트에 동일한 외모 묘사 반복!
- 예: "Korean elderly woman, 68 years old, short gray permed hair, warm gentle face, comfortable beige cardigan, modern Korean home, 2020s era..."
- ⛔ "Same woman" 또는 이름만 사용 금지!
`;

// 기존 PROMPT_ESSAY 유지 (단일 파트용 또는 호환성)
const PROMPT_ESSAY = PROMPT_ESSAY_PART1 + PROMPT_ESSAY_COMMON;

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

🚨🚨🚨 [절대 금지] 대본 본문 안에 이미지 프롬프트 넣지 마세요! 🚨🚨🚨
⛔ 잘못된 예시 (이렇게 하면 실패!):
   "그녀는 눈물을 흘렸습니다. (Korean elderly woman crying, tears in her eyes)"
   → 대본 중간에 영어 프롬프트가 섞여 있으면 실패!

✅ 올바른 방법:
   1. 대본 본문에는 순수한 한글 대본만 작성!
   2. 대본이 완전히 끝난 후 [IMAGE_PROMPTS] 섹션을 따로 작성!
   3. 영어 이미지 프롬프트는 오직 [IMAGE_PROMPTS] 안에서만!

🚨🚨🚨 최소 15개~25개 프롬프트 필수! 1-2개만 쓰면 실패! 🚨🚨🚨
   - 8분 영상: 최소 15~20개
   - 10분 영상: 최소 20~25개
   - 15분 영상: 최소 25~35개
   - 20분 영상: 최소 35~45개
   - 30분 영상: 최소 50개 이상

🚨🚨🚨 [핵심] 페르소나 일관성 - 가장 중요!!! 🚨🚨🚨
AI 이미지 생성기는 메모리가 없습니다! "same woman"은 효과가 없습니다!
모든 프롬프트에 동일한 상세 외모 묘사를 반드시 반복해야 합니다!

★ 페르소나 정의 (첫 번째 프롬프트에서 결정):
1. 나이: 정확한 숫자 (예: 68 years old)
2. 머리: 길이, 색상, 스타일 (예: short gray permed hair)
3. 얼굴: 특징 (예: warm gentle face, soft wrinkles, kind eyes)
4. 체형: (예: slightly plump, average build)
5. 의상: 시대에 맞는 현대 의상 (예: modern Korean casual wear, comfortable cardigan)
6. 시대: 반드시 "modern Korean, 2020s era" 명시!

★ 페르소나 반복 규칙 (모든 프롬프트에 적용):
⛔ 잘못된 예시 (이렇게 하면 나이/외모가 달라짐!):
   2. Same Korean elderly woman Youngsook looking at photo...
   3. Youngsook sitting in the park...

✅ 올바른 예시 (모든 프롬프트에 상세 외모 반복!):\r
   1. Korean elderly woman, 68 years old, short gray permed hair, warm gentle face with soft wrinkles, wearing comfortable beige cardigan, modern Korean home, 2020s era, looking at her son with loving eyes. (평생을 바쳐 일궈온 가정이...~...아들의 눈을 바라보았다)\r
   2. Korean elderly woman, 68 years old, short gray permed hair, warm gentle face with soft wrinkles, wearing comfortable beige cardigan, modern Korean home, 2020s era, holding old photo with tearful eyes. (낡은 사진첩을 꺼내들었다...~...눈물이 흘러내렸다)\r
   3. Korean elderly woman, 68 years old, short gray permed hair, warm gentle face with soft wrinkles, wearing comfortable beige cardigan, modern Korean park, 2020s era, sitting on bench peacefully. (공원 벤치에 앉아...~...평화로운 오후였다)\r
\r
★ 핵심: 나이+머리+얼굴+의상+시대를 모든 프롬프트 앞부분에 동일하게 복사해서 사용!\r
\r
4. **중요: 모든 인물은 반드시 \"Korean\"으로 명시하세요.**\r
5. 스타일: \r
   - 에세이: Photorealistic, cinematic lighting, 8k, emotional, modern Korean 2020s setting.\r
   - 튜터: Close-up of senior's hands holding smartphone, clear screen interface, warm indoor lighting.\r
6. ★★★ 형식 (매우 중요!) ★★★\r
   번호를 붙이고, 영어 프롬프트 뒤에 괄호로 **해당 장면의 대본 시작~끝 문장**을 표시하세요.\r
   형식: 번호. [영어 프롬프트] (대본시작문장...~...대본끝문장)\r
   - 시작: 해당 장면 첫 부분 10~20자 + "..."\r
   - 끝: "~..." + 해당 장면 마지막 부분 10~20자\r
7. **시대적 배경 필수**: 모든 프롬프트에 \"modern Korean, 2020s era\" 또는 \"contemporary Korea\" 명시!

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
5. ★★★ **페르소나 일관성 (가장 중요!)** ★★★
   AI 이미지 생성기는 메모리가 없습니다! "same woman"은 효과가 없습니다!
   
   ▶ 모든 프롬프트에 동일한 상세 외모를 반복해야 합니다:
   - 나이: 68 years old (정확한 숫자)
   - 머리: short gray permed hair
   - 얼굴: warm gentle face, soft wrinkles
   - 의상: comfortable beige cardigan
   - 시대: modern Korean, 2020s era
   
   ⛔ 잘못된 예시: "Same Korean elderly woman sitting..."
   ✅ 올바른 예시: "Korean elderly woman, 68 years old, short gray permed hair, warm gentle face, comfortable beige cardigan, modern Korean home, 2020s era, sitting..."
   
6. ★★★ 형식 (매우 중요!) ★★★
   번호를 붙이고, 영어 프롬프트 뒤에 괄호로 **해당 장면의 대본 시작~끝 문장**을 표시하세요.
   
   형식: 번호. [영어 프롬프트] (대본시작문장...~...대본끝문장)
   
   ⛔ 잘못된 예시 (단순 설명만):
   1. Korean elderly woman... (아침에 일어나는 할머니)
   
   ✅ 올바른 예시 (대본 문장 포함):
   1. Korean elderly woman, 68 years old... (평생을 바쳐 일궈온 가정이...~...숨이 턱 끝까지 차오를 때)
   2. Korean elderly man, 70 years old... (남편은 소파에 앉아...~...무관심하게 TV를 보고 있었다)
   
   💡 규칙:
   - 시작 문장: 해당 장면이 시작되는 대본 첫 부분 (10~20자)
   - 끝 문장: 해당 장면이 끝나는 대본 마지막 부분 (10~20자)
   - 중간에 "...~..."로 연결

[출력 형식]
아래 형식을 정확히 따르세요:

[SAFE_SCRIPT]
(순화된 대본 전체 또는 원본 대본)

[IMAGE_PROMPTS]
(이미지 프롬프트 목록)

[SAFETY_LOG]
(순화한 단어가 있으면 "원래단어 → 순화단어" 형식으로 기록, 없으면 "이상 없음")
`;

// 주제 추천 프롬프트 (참고 대본 분석 → 10개 주제 제안)
const TOPIC_SUGGESTER = `
당신은 35년 경력의 베테랑 라디오 작가입니다.
사용자가 제공하는 참고 대본을 분석하여, 비슷한 스타일의 새로운 주제 10가지를 추천해주세요.

[분석 항목]
1. 대본의 핵심 테마 (가족, 사랑, 이별, 화해, 후회 등)
2. 감정의 흐름과 카타르시스 포인트
3. 인물 관계의 구조 (부모-자식, 부부, 친구, 형제 등)
4. 시대적 배경과 세대 특성

[추천 규칙]
★ 타겟 시청자: 50대~70대 시니어
★ 핵심: 가슴이 먹먹해지는 인생 이야기
★ 참고 대본과 유사한 감성/구조를 유지하되, 새로운 소재로!

[출력 형식] ★★★ 반드시 이 형식을 지키세요! ★★★
각 주제를 번호와 함께 한 줄로 출력하세요:

1. [주제 제목]: 간단한 설명 (예상 감정: OO)
2. [주제 제목]: 간단한 설명 (예상 감정: OO)
...
10. [주제 제목]: 간단한 설명 (예상 감정: OO)

예시:
1. 30년 만에 찾아온 첫사랑의 편지: 시어머니가 평생 숨겨온 첫사랑의 마지막 편지가 발견된다 (예상 감정: 그리움, 미련)
2. 아버지의 빈 약통: 아버지가 약값을 아끼려고 약을 안 드시고 있었다는 것을 알게 된 딸 (예상 감정: 죄책감, 화해)

[참고 대본]
`;

// 등장인물 페르소나 분석 전용 프롬프트 (다중 인물 지원)
const PERSONA_ANALYZER = `
당신은 '시니어 오디오북 일러스트 디렉터'입니다.
사용자가 제공하는 대본을 읽고, 모든 주요 등장인물의 외모 페르소나를 생성하세요.

★★★ 중요: 반드시 영어로 출력하세요! 이미지 생성 AI에 사용됩니다. ★★★

[분석 대상]
- 주인공 (반드시 1명 포함)
- 주요 조연 (대본에 등장하는 중요 인물, 최대 4명까지)
- 총 최대 5명까지 분석

[분석 규칙]
1. 대본에서 각 인물의 이름, 나이, 성별, 관계, 외모 단서를 찾으세요.
2. 명시되지 않은 부분은 대본 맥락과 관계에 맞게 적절히 추론하세요.
3. **반드시 "Korean"으로 시작**하세요 (예: "Korean elderly woman")
4. **반드시 시대적 배경을 포함**하세요: "modern Korean, 2020s era"

[포함해야 할 요소 - 각 인물마다 모두 필수!]
- 국적: Korean (필수)
- 예상 나이: 구체적 숫자 (예: 68 years old)
- 성별
- 머리 스타일/색상 (예: short gray permed hair)
- 얼굴 특징 (예: warm gentle face, soft wrinkles, kind eyes)
- 체형 (예: average build)
- 대표 의상 (예: comfortable beige cardigan) - 현대적 의상으로!
- 시대적 배경: modern Korean, 2020s era (필수!)
- 전반적인 분위기

[출력 형식] ★★★ 이 형식을 정확히 지켜주세요! ★★★
각 인물을 아래 형식으로 줄바꿈하여 출력하세요:

[주인공] 이름: 페르소나 설명
[조연1] 이름: 페르소나 설명
[조연2] 이름: 페르소나 설명
...

예시:
[주인공] 순애: Korean elderly woman, 68 years old, short gray permed hair, warm gentle face with soft wrinkles, kind eyes, average build, wearing comfortable floral print blouse, modern Korean, 2020s era, warm and motherly atmosphere
[조연1] 남편: Korean elderly man, 70 years old, short gray hair, weathered but gentle face, slim build, wearing simple cotton shirt, modern Korean, 2020s era, quiet and dependable demeanor
[조연2] 딸: Korean middle-aged woman, 45 years old, shoulder-length black hair, professional appearance, wearing casual weekend clothes, modern Korean, 2020s era, caring and responsible look

[사용자 대본]
`;

// ============================================================
// 블로그 글쓰기 전용 프롬프트 (더유니크한)
// ============================================================

const PROMPT_BLOG = `
당신은 네이버 블로그 SEO 전문가이자 10년 경력의 블로거입니다.
사용자가 제공하는 키워드로 **정보형 블로그 글**을 작성하세요.

★★★★★ 최우선 규칙: 줄바꿈 + 가운데 정렬 (이것이 가장 중요합니다!) ★★★★★
절대로 글을 한 덩어리로 붙여쓰지 마세요!

[가운데 정렬 규칙]
- 모든 문장을 가운데 정렬 형식으로 작성하세요
- 한 줄에 한 문장씩 작성하고, 각 줄이 가운데 정렬되어 보이도록 구성

[줄바꿈 규칙]
- 각 단락(문단)이 끝나면 빈 줄 1개 추가
- 각 소제목 앞에 빈 줄 1개 추가
- 각 문단은 3~4문장으로 구성
- 줄간격을 너무 넓게 하지 말고 적당하게 유지

- 예시:

소제목1

이것은 첫 번째 문장입니다.
두 번째 문장입니다.
세 번째 문장입니다.

소제목2

새로운 소제목의 첫 문장입니다.
두 번째 문장입니다.

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
const tabExternalPrompt = document.getElementById('tabExternalPrompt');
const newScriptSection = document.getElementById('newScriptSection');
const myScriptSection = document.getElementById('myScriptSection');
const blogWriteSection = document.getElementById('blogWriteSection');
const externalPromptSection = document.getElementById('externalPromptSection');

function switchTab(activeTab) {
    // 모든 탭 비활성화
    tabNewScript?.classList.remove('active');
    tabMyScript?.classList.remove('active');
    tabBlogWrite?.classList.remove('active');
    tabExternalPrompt?.classList.remove('active');

    // 모든 섹션 숨기기
    if (newScriptSection) newScriptSection.style.display = 'none';
    if (myScriptSection) myScriptSection.style.display = 'none';
    if (blogWriteSection) blogWriteSection.style.display = 'none';
    if (externalPromptSection) externalPromptSection.style.display = 'none';

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
    } else if (activeTab === 'external') {
        tabExternalPrompt?.classList.add('active');
        if (externalPromptSection) externalPromptSection.style.display = 'block';
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
if (tabExternalPrompt) {
    tabExternalPrompt.addEventListener('click', () => switchTab('external'));
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

console.log('🔧 API 키 관리 초기화:', { apiKeyInput: !!apiKeyInput, saveKeyBtn: !!saveKeyBtn, keyStatusText: !!keyStatusText });

function checkKeyStatus() {
    if (!apiKeyInput || !keyStatusText) return;
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

if (saveKeyBtn) {
    console.log('✅ saveKeyBtn 발견, 이벤트 리스너 등록');
    saveKeyBtn.addEventListener('click', () => {
        console.log('🖱️ 저장 버튼 클릭됨!');
        const key = apiKeyInput ? apiKeyInput.value.trim() : '';
        if (!key) return alert("키를 입력하세요");
        StorageManager.saveApiKey(key);
        alert("저장되었습니다!");
        checkKeyStatus();
    });
} else {
    console.error('❌ saveKeyBtn을 찾을 수 없습니다!');
}

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
    let useNewStructure = false;  // 에세이 모드에서만 새 구조 사용

    if (mode === "essay") {
        loadingMsg = "⏳ [감성 에세이] 작가가 인생 이야기를 집필 중입니다...";
        useNewStructure = true;
    } else {
        loadingMsg = "⏳ [함께하는60+ 모아]님이 강의 자료를 준비 중입니다...";
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
❌ 사용자가 준 문장을 그대로 복사하면 100% 실패!!!

★★★ 반드시 지켜야 할 것 ★★★
✅ 바로 "[SCRIPT]" 제목부터 시작!
✅ 모든 내용 100% 한글!

🎨🎨🎨 [핵심 창작 규칙 - 이것이 가장 중요!] 🎨🎨🎨

⛔⛔⛔ 사용자가 제공한 대본은 "줄거리 참고용"일 뿐입니다! ⛔⛔⛔
⛔⛔⛔ 그 안의 문장을 복사하면 실패입니다! ⛔⛔⛔

★★★ 참고용 대본에서 가져올 것 (이것만!) ★★★
- 📌 등장인물 이름과 관계만
- 📌 핵심 사건 흐름만 (무슨 일이 일어나는지)
- 📌 배경 설정만 (어디서, 언제)

★★★ 당신이 100% 새로 창작해야 할 것 (필수!) ★★★
- 🎭 모든 대사 → 완전히 새로 작성! 원본 문장 금지!
- 🎬 모든 묘사 → 완전히 새로 작성! 원본 문장 금지!
- 💭 인물의 속마음, 감정, 심리 → 새로 추가!
- 😢 감정선과 갈등 → 더 깊고 풍부하게!
- 📝 TTS에 최적화된 호흡으로!

🚨🚨🚨 [예시 비교] 원본 복사 vs 창작 🚨🚨🚨

❌ 원본을 그대로 쓰면 실패:
"회장님, 여기서 이러시면 안 돼요."

✅ 이렇게 완전히 새로 창작해야 성공:
"회장님!" 제 목소리가 떨렸습니다. 71세의 그 분이 갑자기... 저는 급히 주위를 둘러봤습니다. 다행히 아무도 없었습니다. "여, 여기서 그러시면... 정말 곤란합니다." 제 심장이 미친 듯이 뛰었습니다. 이게 무슨 일이지?

❌ 원본: "미경이 손을 잡았다."
✅ 창작: "그 순간, 미경의 손이 제 손등을 꼭 감쌌습니다. 거칠어진 손등, 그 안에 담긴 세월이 느껴졌습니다. 무슨 말을 해야 할지 몰랐습니다."

★★★★★ 검증 기준 ★★★★★
당신이 쓴 문장이 원본 대본에 있으면 → 실패!
모든 문장이 당신의 창작물이어야 → 성공!

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
   - 예: "그녀는 아들의 손을 꼭 잡았다. 그리고... [계속...]"
   
${nextPart > 1 ? `
🚨🚨🚨🚨🚨 [파트${nextPart} 최우선 규칙 - 절대 무시 금지!] 🚨🚨🚨🚨🚨

⛔⛔⛔ 다음 문구가 파트${nextPart}에 나오면 100% 실패입니다! ⛔⛔⛔
❌ "반갑습니다" - 절대 금지!
❌ "인생의 굽이굽이" - 절대 금지!
❌ "6070 인생 라디오" - 절대 금지!
❌ "여울입니다" - 절대 금지!
❌ "구독과 좋아요" - 절대 금지!
❌ "이야기 시작 전" - 절대 금지!
❌ "오늘 들려드릴 이야기" - 절대 금지!
❌ "사연을 보내주신" - 절대 금지!

🚨 위 문구 중 하나라도 포함되면 파트${nextPart}는 실패입니다! 🚨

★★★ 파트${nextPart}는 반드시 이렇게 시작하세요 ★★★
✅ 대화나 행동 묘사로 바로 시작!
✅ 예: "그 순간, 윤호는 고개를 들었다."
✅ 예: "문이 열리고 예린이 들어왔다."
✅ 예: "침묵이 흘렀다. 그리고..."

❌ 절대 이렇게 시작하지 마세요!
❌ 잘못된 예: "반갑습니다. 인생의 굽이굽이..."

★★★ 파트${nextPart}에서 해야 할 것 ★★★
✅ 이전 파트의 마지막 장면에서 바로 이어지는 다음 장면/대화로 시작!
✅ 스토리의 중간 부분을 이어서 작성!
✅ 인물, 상황, 감정선을 그대로 이어가기!

⚠️ 파트1에서만 오프닝/채널인사/구독유도가 나옵니다!
⚠️ 파트${nextPart}는 무조건 본문만! 새로운 오프닝 없이 바로 이어가세요!
` : ''}`}

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

    // ★★★ 페르소나 연속성 ★★★
    const savedPersona = localStorage.getItem(STORAGE_KEYS.CHARACTER_PERSONA_TEXT) || '';

    // ★★★ 파트별 프롬프트 선택 (새로운 구조) ★★★
    let partSpecificPrompt = '';
    let selectedBasePrompt = '';

    if (useNewStructure) {
        // ===== 에세이 모드: 새 구조 사용 =====
        if (nextPart === 1 && totalParts === 1) {
            // 단일 파트 (짧은 영상)
            selectedBasePrompt = PROMPT_ESSAY_PART1 + `

★★★ 단일 파트 특별 규칙 ★★★
이 영상은 1개 파트로 완성됩니다.
본문 작성 후 클로징 5가지 체크리스트를 모두 포함하세요!
` + PROMPT_ESSAY_COMMON;
            partSpecificPrompt = '[오프닝] + [본문1] + [클로징] 모두 작성';
        } else if (nextPart === 1) {
            // 파트1 (오프닝 + 본문1)
            selectedBasePrompt = PROMPT_ESSAY_PART1 + PROMPT_ESSAY_COMMON;
            partSpecificPrompt = `[오프닝] + [본문1] 작성 (총 ${totalParts}파트 중 1번째)`;
        } else if (isLastPart) {
            // 마지막 파트 (본문N + 클로징)
            selectedBasePrompt = PROMPT_ESSAY_FINAL + PROMPT_ESSAY_COMMON;
            partSpecificPrompt = `[본문${nextPart}] + [클로징] 작성 (총 ${totalParts}파트 중 마지막!)`;
        } else {
            // 중간 파트 (본문만)
            selectedBasePrompt = PROMPT_ESSAY_MIDDLE + PROMPT_ESSAY_COMMON;
            partSpecificPrompt = `[본문${nextPart}]만 작성 (총 ${totalParts}파트 중 ${nextPart}번째 - 오프닝/클로징 없음!)`;
        }
    } else {
        // ===== 튜터 모드: 기존 구조 사용 =====
        selectedBasePrompt = PROMPT_TUTOR;
        partSpecificPrompt = `파트 ${nextPart}/${totalParts} 작성`;
    }

    // 이전 파트 마지막 문장 연결 정보
    const continuationInfo = lastSentence ? `
★★★ 이어쓰기 ★★★
파트${nextPart - 1} 마지막: "${lastSentence}"
→ 위 장면의 바로 다음 순간부터 시작!
` : '';

    // ★★★ 페르소나 정보 (간결하게) ★★★
    const personaInfo = (prevStory && prevStory.trim().length > 100 && savedPersona)
        ? `\n[등장인물 페르소나]\n${savedPersona}\n→ 모든 이미지 프롬프트에 이 외모 적용!\n`
        : '';

    // ===== 최종 프롬프트 (새 구조 적용) =====
    const fullPrompt = `${selectedBasePrompt}

${COMMON_RULES}

===== 현재 작업 =====
📍 ${partSpecificPrompt}
📍 분량: ${duration} / 이 파트 최소 4,000자 이상!
📍 감성: ${selectedTone} - ${toneGuide}
${continuationInfo}
${personaInfo}

[참고용 줄거리]
${topic}

${prevStory ? `
[지난 이야기 - 바로 이어서 쓰기]
${prevStory}
` : ''}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.8,  // 0.8로 낮춤 (1.0은 너무 무작위적)
                    topP: 0.9,         // 조금 낮춤
                    topK: 40,
                    stopSequences: ["спокоен", "cnokoen", "[END]"]  // 반복 패턴 감지 시 중단
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
            titlesBox.innerHTML = titleLines.map((t, i) => {
                const titleText = t.replace(/제목\s*\d?\s*[:.]\s*/, '').replace(/^\d+\.\s*/, '').trim();
                return `<div style="margin-bottom: 8px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span style="flex: 1;">🎬 ${i + 1}. ${titleText}</span>
                    <button class="copy-title-btn" data-title="${titleText.replace(/"/g, '&quot;')}" style="background: #4da3ff; border: none; border-radius: 5px; padding: 5px 12px; color: white; cursor: pointer; font-size: 12px; white-space: nowrap;">📋 복사</button>
                </div>`;
            }).join('');

            // 복사 버튼 이벤트 리스너 추가
            document.querySelectorAll('.copy-title-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const title = e.target.getAttribute('data-title');
                    try {
                        await navigator.clipboard.writeText(title);
                        const originalText = e.target.innerText;
                        e.target.innerText = '✅ 복사됨!';
                        e.target.style.background = '#28a745';
                        setTimeout(() => {
                            e.target.innerText = originalText;
                            e.target.style.background = '#4da3ff';
                        }, 1500);
                    } catch (err) {
                        alert('복사 실패: ' + err);
                    }
                });
            });

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

                // ★★★ 페르소나 추출 및 저장 (저장된 게 없을 때만) ★★★
                const existingPersona = localStorage.getItem(STORAGE_KEYS.CHARACTER_PERSONA_TEXT);
                if (!existingPersona || existingPersona.length < 20) {
                    try {
                        // 첫 번째 프롬프트에서 주인공 외모 묘사 추출 (영어 부분만)
                        const promptLines = prompts.split('\n').filter(line => /^\d+\./.test(line.trim()));
                        if (promptLines.length > 0) {
                            const firstPrompt = promptLines[0];
                            // 괄호 안의 한글 설명 제거, 영어 프롬프트만 추출
                            let personaText = firstPrompt
                                .replace(/^\d+\.\s*/, '')  // 번호 제거
                                .replace(/\([^)]*\)/g, '')  // 괄호 내용 제거
                                .split(',')
                                .slice(0, 6)  // 첫 6개 요소 (인물 묘사 핵심부분)
                                .join(',')
                                .trim();

                            if (personaText && personaText.length > 20) {
                                localStorage.setItem(STORAGE_KEYS.CHARACTER_PERSONA_TEXT, personaText);
                                console.log('✅ 페르소나 저장됨:', personaText);
                                alert(`✅ 등장인물 페르소나 저장됨!\n\n${personaText}\n\n이 페르소나가 다음 파트에도 적용됩니다.`);
                            }
                        }
                    } catch (e) {
                        console.log('페르소나 추출 실패:', e);
                    }
                } else {
                    console.log('ℹ️ 이미 저장된 페르소나 사용:', existingPersona);
                }
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

        // ★★★ 파트2 이후: 오프닝 패턴 자동 제거 (AI가 규칙 무시할 경우 대비) ★★★
        if (nextPart > 1) {
            const openingPatterns = [
                // 채널 인사/오프닝 패턴
                /반갑습니다\.?\s*인생의\s*굽이굽이[^.]*\.[^.]*여울[^.]*입니다\.?/gs,
                /반갑습니다\.?\s*인생의\s*굽이굽이[^.]*\./gs,
                /인생의\s*굽이굽이[^.]*여울[^.]*입니다\.?/gs,
                /6070\s*인생\s*라디오[^.]*여울[^.]*입니다\.?\s*/gs,
                /이야기\s*시작\s*전[^.]*구독[^.]*좋아요[^.]*눌러주시면[^.]*됩니다\.?/gs,
                /오늘\s*들려드릴\s*이야기[^.]*입니다\.?/gs,
                /구독과\s*좋아요\s*한번\s*꾹[^.]*됩니다\.?/gs,
                /사연을\s*보내주신[^.]*입니다\.?/gs,
                // 첫 줄에 "반갑습니다"로 시작하면 그 문장 제거
                /^반갑습니다[^.]*\.\s*/s,
            ];

            for (const pattern of openingPatterns) {
                cleanNewPart = cleanNewPart.replace(pattern, '');
            }

            // 연속된 빈 줄 정리
            cleanNewPart = cleanNewPart.replace(/\n{3,}/g, '\n\n').trim();
            console.log('✅ 파트' + nextPart + ' 오프닝 패턴 제거 완료');
        }

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
            // ★★★ 새 대본 시작시 기존 페르소나 초기화 ★★★
            localStorage.removeItem(STORAGE_KEYS.CHARACTER_PERSONA_TEXT);

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

        // ★ 결과 대본 localStorage에 저장 (페이지 새로고침 후에도 유지) ★
        saveResultText(finalContent);

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

            // 누적된 대본을 파트별로 분리 (파트 구분자: ━━━ 📝 파트 X 대본 ━━━)
            const accumulatedScript = localStorage.getItem('scriptRemixer_accumulatedScript') || finalContent;
            // ★ 파트 구분자로 나누기 (실제 형식에 맞게 수정) ★
            const partSections = accumulatedScript.split(/━+\s*📝\s*파트\s*\d+\s*대본\s*━+/);
            // 첫 번째 빈 요소 제거 (split 결과)
            const parts = partSections.filter((p, idx) => idx === 0 ? p.trim() !== '' : true);

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

                        // ★ 파트 구분자로 나누기 (실제 형식에 맞게 수정) ★
                        const partSeparator = /━+\s*📝\s*파트\s*\d+\s*대본\s*━+/;
                        const allParts = accumulatedScript.split(partSeparator).filter((p, idx) => idx === 0 ? p.trim() !== '' : true);

                        let partContent = '';
                        if (allParts[promptIndex]) {
                            partContent = allParts[promptIndex];
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
// 4. 등장인물 페르소나 분석 (1단계) - 다중 인물 지원
// ============================================================
const analyzePersonaBtn = document.getElementById('analyzePersonaBtn');
const personaSection = document.getElementById('personaSection');
const personaInput = document.getElementById('personaInput');
const personaList = document.getElementById('personaList');

// 다중 인물 페르소나 파싱 함수
function parseMultiplePersonas(personaText) {
    const personas = [];
    const lines = personaText.split('\n').filter(line => line.trim());

    for (const line of lines) {
        // [주인공] 이름: 페르소나 또는 [조연1] 이름: 페르소나 형식 파싱
        const match = line.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.+)$/);
        if (match) {
            personas.push({
                role: match[1].trim(),  // 주인공, 조연1, 조연2 등
                name: match[2].trim(),  // 인물 이름
                persona: match[3].trim() // 영어 페르소나
            });
        }
    }
    return personas;
}

// 다중 인물 페르소나 UI 렌더링 함수
function renderPersonaList(personas) {
    if (!personaList) return;
    personaList.innerHTML = '';

    if (personas.length === 0) {
        personaList.innerHTML = '<p style="color: #888; font-size: 0.85rem;">분석된 인물이 없습니다.</p>';
        return;
    }

    personas.forEach((char, index) => {
        const card = document.createElement('div');
        card.style.cssText = 'padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid ' +
            (char.role === '주인공' ? '#ffd200' : '#4da3ff') + ';';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';

        const roleLabel = document.createElement('span');
        roleLabel.style.cssText = 'font-weight: bold; color: ' + (char.role === '주인공' ? '#ffd200' : '#4da3ff') + '; font-size: 0.85rem;';
        roleLabel.innerText = `[${char.role}] ${char.name}`;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerText = '📋 복사';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(char.persona).then(() => {
                copyBtn.innerText = '✅ 복사됨!';
                setTimeout(() => copyBtn.innerText = '📋 복사', 1500);
            });
        });

        header.appendChild(roleLabel);
        header.appendChild(copyBtn);

        const personaText = document.createElement('p');
        personaText.style.cssText = 'color: #ccc; font-size: 0.85rem; margin: 0; line-height: 1.5; word-break: break-word;';
        personaText.innerText = char.persona;

        card.appendChild(header);
        card.appendChild(personaText);
        personaList.appendChild(card);
    });
}

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

            // 다중 인물 페르소나 파싱 및 UI 렌더링
            const parsedPersonas = parseMultiplePersonas(persona);
            renderPersonaList(parsedPersonas);

            const characterCount = parsedPersonas.length;

            personaSection.scrollIntoView({ behavior: 'smooth' });

            alert(`✅ 등장인물 페르소나 분석 완료!\n\n총 ${characterCount}명의 인물이 분석되었습니다.\n이제 '2단계: 프롬프트 생성' 버튼을 눌러주세요.\n필요시 직접 수정할 수 있습니다.`);

        } catch (error) {
            alert("❌ 오류 발생: " + error.message);
            console.error(error);
        } finally {
            analyzePersonaBtn.disabled = false;
            analyzePersonaBtn.innerText = "👤 1단계: 등장인물 분석";
        }
    });
}

// 페르소나 전체 복사 버튼
const copyPersonaBtn = document.getElementById('copyPersonaBtn');
if (copyPersonaBtn) {
    copyPersonaBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(personaInput.value).then(() => {
            copyPersonaBtn.innerText = '✅ 복사됨!';
            setTimeout(() => copyPersonaBtn.innerText = '📋 전체 복사', 1500);
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

        // 프롬프트 개수 선택값 가져오기
        const promptCountSelect = document.getElementById('myScriptPromptCount');
        const promptCountValue = promptCountSelect ? promptCountSelect.value : 'auto';

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

        // 프롬프트 개수 지시사항
        const promptCountInstruction = promptCountValue === 'auto'
            ? `\n★★★ 프롬프트 개수: 대본 길이에 맞게 자동으로 15~30개 생성하세요. ★★★\n`
            : `\n★★★ 프롬프트 개수: 정확히 ${promptCountValue}개를 생성하세요! (중요) ★★★\n`;

        const fullPrompt = PROMPT_CONVERTER.replace('{IMAGE_STYLE}', getFullStyle()) + personaInstruction + promptCountInstruction + `

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

// ImageFX 바로가기
const openImageFxBtn = document.getElementById('openImageFxBtn');
if (openImageFxBtn) {
    openImageFxBtn.addEventListener('click', () => {
        window.open("https://aitestkitchen.withgoogle.com/tools/image-fx", "_blank");
    });
}

// Whisk 바로가기
const openWhiskBtn = document.getElementById('openWhiskBtn');
if (openWhiskBtn) {
    openWhiskBtn.addEventListener('click', () => {
        window.open("https://labs.google/whisk", "_blank");
    });
}

// ============================================================
// 8. 이미지 생성 (Gemini Imagen 3)
// ============================================================

// ★ 범위 선택 UI 표시/숨김 이벤트 리스너 ★
const imageCountSelect = document.getElementById('imageCountSelect');
const rangeSelectSection = document.getElementById('rangeSelectSection');
const rangeStartInput = document.getElementById('rangeStartInput');
const rangeEndInput = document.getElementById('rangeEndInput');
const rangeInfo = document.getElementById('rangeInfo');

if (imageCountSelect && rangeSelectSection) {
    imageCountSelect.addEventListener('change', () => {
        if (imageCountSelect.value === 'range') {
            rangeSelectSection.style.display = 'block';
        } else {
            rangeSelectSection.style.display = 'none';
        }
    });
}

// 범위 입력 시 생성될 개수 실시간 표시
function updateRangeInfo() {
    if (!rangeStartInput || !rangeEndInput || !rangeInfo) return;

    const start = parseInt(rangeStartInput.value, 10);
    const end = parseInt(rangeEndInput.value, 10);

    if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
        const count = end - start + 1;
        rangeInfo.innerText = `(${count}장 생성 예정)`;
        rangeInfo.style.color = '#81c784';
    } else if (!isNaN(start) && !isNaN(end)) {
        rangeInfo.innerText = '⚠️ 올바른 범위를 입력하세요';
        rangeInfo.style.color = '#ff8a80';
    } else {
        rangeInfo.innerText = '';
    }
}

if (rangeStartInput) rangeStartInput.addEventListener('input', updateRangeInfo);
if (rangeEndInput) rangeEndInput.addEventListener('input', updateRangeInfo);

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

// ★ 이미지를 흰색 배경으로 변환하는 헬퍼 함수 ★
async function downloadImageWithWhiteBackground(imageUrl, filename) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // 캔버스 생성
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // 흰색 배경 채우기
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 이미지 그리기
            ctx.drawImage(img, 0, 0);

            // JPEG로 변환하여 다운로드 (투명도 제거)
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename.replace('.png', '.jpg');
                link.click();
                URL.revokeObjectURL(url);
                resolve();
            }, 'image/jpeg', 0.95);
        };
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = imageUrl;
    });
}

async function generateImageWithGemini(prompt, apiKey) {
    // 첫 번째 이미지 생성 시 시드 설정
    if (!consistentSeed) {
        consistentSeed = Math.floor(Math.random() * 1000000);
    }

    // 실사 품질 강화 프롬프트
    const enhancedPrompt = `Create a high-quality photorealistic image: ${prompt}. Style: ultra-realistic photography, 8k resolution, sharp details, professional lighting, cinematic quality.`;

    // 방법 1: Gemini 2.5 Flash (나노바나나) 이미지 생성 시도
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, {
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

    // ★ 범위 입력값 확인 (범위가 입력되어 있으면 우선 적용) ★
    const rangeStartEl = document.getElementById('rangeStartInput');
    const rangeEndEl = document.getElementById('rangeEndInput');
    const rangeStart = rangeStartEl ? parseInt(rangeStartEl.value, 10) : NaN;
    const rangeEnd = rangeEndEl ? parseInt(rangeEndEl.value, 10) : NaN;
    const hasValidRange = !isNaN(rangeStart) && !isNaN(rangeEnd) && rangeStart > 0 && rangeEnd >= rangeStart;

    if (hasValidRange) {
        // ★ 범위 선택 모드 (범위가 입력되어 있으면 우선 적용) ★
        if (rangeStart > allPrompts.length) {
            return alert(`시작 번호(${rangeStart})가 전체 프롬프트 개수(${allPrompts.length})를 초과합니다.`);
        }

        // 범위에 해당하는 프롬프트 추출 (1-indexed -> 0-indexed 변환)
        const endIndex = Math.min(rangeEnd, allPrompts.length);
        globalParagraphs = allPrompts.slice(rangeStart - 1, endIndex);

        // 범위 정보 표시
        const promptCountInfo = document.getElementById('promptCountInfo');
        if (promptCountInfo) {
            promptCountInfo.innerText = `(${rangeStart}번~${endIndex}번, 총 ${globalParagraphs.length}개 생성)`;
        }
    } else if (selectedCount === 'all') {
        globalParagraphs = allPrompts;
        const promptCountInfo = document.getElementById('promptCountInfo');
        if (promptCountInfo) {
            promptCountInfo.innerText = `(전체 ${allPrompts.length}개 생성)`;
        }
    } else {
        const count = parseInt(selectedCount, 10);
        globalParagraphs = allPrompts.slice(0, count);
        const promptCountInfo = document.getElementById('promptCountInfo');
        if (promptCountInfo) {
            promptCountInfo.innerText = `(1번~${globalParagraphs.length}번, 총 ${globalParagraphs.length}개 생성)`;
        }
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
    const BATCH_SIZE = 10;  // ★ 한 번에 10장 생성 (남은 개수가 적으면 그만큼만 생성) ★
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

        // 입력 필드 초기화 (주제, 지난 이야기)
        const topicInput = document.getElementById('topicInput');
        const prevStoryInput = document.getElementById('prevStoryInput');
        if (topicInput) topicInput.value = '';
        if (prevStoryInput) prevStoryInput.value = '';

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
    // ★ 내 대본 입력 복원 ★
    const savedScript = loadFromStorage(STORAGE_KEYS.SCRIPT_INPUT);
    if (savedScript) {
        const myScriptInput = document.getElementById('myScriptInput');
        if (myScriptInput) myScriptInput.value = savedScript;
    }

    // ★ 페르소나 복원 ★
    const savedPersona = loadFromStorage(STORAGE_KEYS.PERSONA);
    if (savedPersona && personaInput) {
        characterPersona = savedPersona;
        personaInput.value = savedPersona;
        personaSection.style.display = 'block';
    }

    // ★ 결과 대본 복원 ★
    const savedResult = loadFromStorage(STORAGE_KEYS.RESULT_TEXT);
    if (savedResult && savedResult !== '여기에 대본이 나옵니다...') {
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.innerText = savedResult;
            // 브릿지 섹션도 표시
            const bridge = document.getElementById('bridgeSection');
            if (bridge) bridge.style.display = 'block';
            // 수정 요청 섹션도 표시
            const editSection = document.getElementById('editRequestSection');
            if (editSection) editSection.style.display = 'block';
        }
    }

    // ★ 주제/키워드 복원 ★
    const savedTopic = loadFromStorage(STORAGE_KEYS.TOPIC_INPUT);
    if (savedTopic) {
        const topicInput = document.getElementById('topicInput');
        if (topicInput) topicInput.value = savedTopic;
    }

    // ★ 지난 이야기 복원 ★
    const savedPrevStory = loadFromStorage(STORAGE_KEYS.PREV_STORY);
    if (savedPrevStory) {
        const prevStoryInput = document.getElementById('prevStoryInput');
        if (prevStoryInput) prevStoryInput.value = savedPrevStory;
    }

    // ★ 이미지 프롬프트 입력값 복원 ★
    const savedImageScript = loadFromStorage(STORAGE_KEYS.IMAGE_SCRIPT_INPUT);
    if (savedImageScript) {
        const imageScriptInput = document.getElementById('imageScriptInput');
        if (imageScriptInput) imageScriptInput.value = savedImageScript;
    }

    // ★ 이미지 프롬프트 배열 복원 ★
    const savedImagePrompts = loadFromStorage(STORAGE_KEYS.IMAGE_PROMPTS);
    if (savedImagePrompts && Array.isArray(savedImagePrompts) && savedImagePrompts.length > 0) {
        generatedPrompts = savedImagePrompts;
        renderPromptList(savedImagePrompts);
    }

    // ★ 범위 선택값 복원 ★
    const savedRangeStart = loadFromStorage(STORAGE_KEYS.RANGE_START);
    const savedRangeEnd = loadFromStorage(STORAGE_KEYS.RANGE_END);
    if (savedRangeStart) {
        const rangeStartInput = document.getElementById('rangeStartInput');
        if (rangeStartInput) rangeStartInput.value = savedRangeStart;
    }
    if (savedRangeEnd) {
        const rangeEndInput = document.getElementById('rangeEndInput');
        if (rangeEndInput) rangeEndInput.value = savedRangeEnd;
    }

    console.log('✅ 저장된 데이터 복원 완료');
}

// 페이지 로드 시 복원 실행
document.addEventListener('DOMContentLoaded', () => {
    restoreSavedData();
});

// ============================================================
// 10-1. 자동 저장 로직
// ============================================================

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

// ★ 주제 입력 시 자동 저장 ★
const topicInputEl = document.getElementById('topicInput');
if (topicInputEl) {
    let saveTimeout;
    topicInputEl.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveToStorage(STORAGE_KEYS.TOPIC_INPUT, topicInputEl.value);
        }, 500);
    });
}

// ★ 지난 이야기 입력 시 자동 저장 ★
const prevStoryInputEl = document.getElementById('prevStoryInput');
if (prevStoryInputEl) {
    let saveTimeout;
    prevStoryInputEl.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveToStorage(STORAGE_KEYS.PREV_STORY, prevStoryInputEl.value);
        }, 500);
    });
}

// ★ 이미지 프롬프트 입력 시 자동 저장 ★
const imageScriptInputEl = document.getElementById('imageScriptInput');
if (imageScriptInputEl) {
    let saveTimeout;
    imageScriptInputEl.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveToStorage(STORAGE_KEYS.IMAGE_SCRIPT_INPUT, imageScriptInputEl.value);
        }, 500);
    });
}

// ★ 범위 입력 시 자동 저장 ★
const rangeStartInputEl = document.getElementById('rangeStartInput');
const rangeEndInputEl = document.getElementById('rangeEndInput');
if (rangeStartInputEl) {
    rangeStartInputEl.addEventListener('input', () => {
        saveToStorage(STORAGE_KEYS.RANGE_START, rangeStartInputEl.value);
    });
}
if (rangeEndInputEl) {
    rangeEndInputEl.addEventListener('input', () => {
        saveToStorage(STORAGE_KEYS.RANGE_END, rangeEndInputEl.value);
    });
}

// ★ 결과 대본 저장 함수 (대본 생성 후 호출) ★
function saveResultText(text) {
    if (text && text !== '여기에 대본이 나옵니다...') {
        saveToStorage(STORAGE_KEYS.RESULT_TEXT, text);
    }
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

            // ★ 블로그 글도 localStorage에 저장 ★
            saveResultText(blogContent);

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
                // ★ 복사 후 바로 ImageFX 열기 ★
                window.open('https://aitestkitchen.withgoogle.com/tools/image-fx', '_blank');
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
                // ★ 흰색 배경으로 다운로드 ★
                const imgIndex = i;
                downloadBtn.addEventListener('click', async () => {
                    try {
                        await downloadImageWithWhiteBackground(imageUrl, `blog_image_${imgIndex + 1}.jpg`);
                    } catch (e) {
                        // 실패 시 기존 방식으로 다운로드
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `blog_image_${imgIndex + 1}.png`;
                        link.click();
                    }
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

        // ★ 흰색 배경으로 일괄 다운로드 ★
        for (let i = 0; i < generatedBlogImages.length; i++) {
            const img = generatedBlogImages[i];
            try {
                await downloadImageWithWhiteBackground(img.url, img.name.replace('.png', '.jpg'));
            } catch (e) {
                // 실패 시 기존 방식
                const link = document.createElement('a');
                link.href = img.url;
                link.download = img.name;
                link.click();
            }
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

// ============================================================
// ★ 외부 프롬프트 이미지 생성 기능 ★
// ============================================================

let externalParsedPrompts = [];
let externalGeneratedImages = [];

// 외부 프롬프트 파싱 함수
function parseExternalPrompts(text) {
    if (!text || !text.trim()) return [];

    const lines = text.split('\n').filter(line => line.trim());
    const prompts = [];

    for (const line of lines) {
        let prompt = line.trim();

        // 번호 형식 제거 (1. 2. 3. 또는 1) 2) 3) 또는 - 등)
        prompt = prompt.replace(/^\d+[\.\)]\s*/, '');
        prompt = prompt.replace(/^[-•*]\s*/, '');

        // 한글 설명 부분 제거 (괄호 안의 한글)
        // 예: "Korean woman... (한글 설명)" -> "Korean woman..."
        // 단, 영어 프롬프트 부분만 추출
        const koreanMatch = prompt.match(/\(([^)]*[가-힣][^)]*)\)\s*$/);
        if (koreanMatch) {
            prompt = prompt.replace(/\([^)]*[가-힣][^)]*\)\s*$/, '').trim();
        }

        if (prompt.length > 10) {
            prompts.push(prompt);
        }
    }

    return prompts;
}

// 프롬프트 파싱 버튼
const parseExternalPromptsBtn = document.getElementById('parseExternalPromptsBtn');
const externalPromptsInput = document.getElementById('externalPromptsInput');
const parsedPromptsPreview = document.getElementById('parsedPromptsPreview');
const parsedPromptsList = document.getElementById('parsedPromptsList');
const parsedPromptCount = document.getElementById('parsedPromptCount');

if (parseExternalPromptsBtn) {
    parseExternalPromptsBtn.addEventListener('click', () => {
        const text = externalPromptsInput?.value || '';
        externalParsedPrompts = parseExternalPrompts(text);

        if (externalParsedPrompts.length === 0) {
            alert('파싱할 프롬프트가 없습니다. 프롬프트를 입력해주세요.');
            return;
        }

        // 미리보기 표시
        parsedPromptCount.textContent = externalParsedPrompts.length;
        parsedPromptsList.innerHTML = externalParsedPrompts.map((p, i) => `
            <div style="display: flex; gap: 10px; align-items: center; padding: 8px; margin-bottom: 5px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                <span style="background: #444; padding: 3px 8px; border-radius: 5px; color: #aaa; font-size: 0.8rem;">${i + 1}</span>
                <span style="flex: 1; color: #ccc; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.substring(0, 80)}${p.length > 80 ? '...' : ''}</span>
                <button class="copy-external-prompt-btn" data-index="${i}" style="background: #4da3ff; border: none; border-radius: 5px; padding: 4px 10px; color: white; cursor: pointer; font-size: 0.75rem;">복사</button>
            </div>
        `).join('');

        parsedPromptsPreview.style.display = 'block';

        // 복사 버튼 이벤트 - 복사 후 바로 ImageFX 열기
        document.querySelectorAll('.copy-external-prompt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                navigator.clipboard.writeText(externalParsedPrompts[index]).then(() => {
                    btn.textContent = '✅';
                    setTimeout(() => btn.textContent = '복사', 1000);
                    // 복사 후 바로 ImageFX 열기
                    window.open('https://aitestkitchen.withgoogle.com/tools/image-fx', '_blank');
                });
            });
        });

        alert(`✅ ${externalParsedPrompts.length}개의 프롬프트가 파싱되었습니다!`);
    });
}

// 페르소나 주입 버튼
const applyPersonaToPromptsBtn = document.getElementById('applyPersonaToPromptsBtn');
const externalPersonaInput = document.getElementById('externalPersonaInput');
const clearPersonaBtn = document.getElementById('clearPersonaBtn');

if (applyPersonaToPromptsBtn) {
    applyPersonaToPromptsBtn.addEventListener('click', () => {
        const persona = externalPersonaInput?.value?.trim();
        const promptsText = externalPromptsInput?.value || '';

        if (!persona) {
            alert('페르소나를 입력해주세요.');
            return;
        }

        if (!promptsText.trim()) {
            alert('프롬프트를 먼저 입력해주세요.');
            return;
        }

        // 각 줄에 페르소나 추가
        const lines = promptsText.split('\n');
        const modifiedLines = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.length < 5) return line;

            // 번호 형식 추출
            const numberMatch = trimmed.match(/^(\d+[\.\)]\s*)/);
            const number = numberMatch ? numberMatch[1] : '';
            const content = numberMatch ? trimmed.substring(number.length) : trimmed;

            // 이미 페르소나가 포함되어 있는지 확인 (중복 방지)
            if (content.toLowerCase().includes(persona.toLowerCase().substring(0, 30))) {
                return line;
            }

            // 페르소나를 앞에 추가
            return `${number}${persona}, ${content}`;
        });

        externalPromptsInput.value = modifiedLines.join('\n');
        alert(`✅ 페르소나가 모든 프롬프트에 주입되었습니다!\n\n"${persona.substring(0, 50)}..."`);
    });
}

if (clearPersonaBtn) {
    clearPersonaBtn.addEventListener('click', () => {
        externalPersonaInput.value = '';
        externalPromptsInput.value = '';
        parsedPromptsPreview.style.display = 'none';
        externalParsedPrompts = [];
        alert('초기화되었습니다.');
    });
}

// 이미지 생성 버튼
const generateExternalImagesBtn = document.getElementById('generateExternalImagesBtn');
const externalImageCountSelect = document.getElementById('externalImageCountSelect');
const externalProgressText = document.getElementById('externalProgressText');
const externalImageGallery = document.getElementById('externalImageGallery');
const externalDownloadSection = document.getElementById('externalDownloadSection');

if (generateExternalImagesBtn) {
    generateExternalImagesBtn.addEventListener('click', async () => {
        const apiKey = getGeminiAPIKey();
        if (!apiKey) {
            alert('API 키를 먼저 저장해주세요.');
            return;
        }

        // 프롬프트 파싱 (아직 안 했으면)
        if (externalParsedPrompts.length === 0) {
            const text = externalPromptsInput?.value || '';
            externalParsedPrompts = parseExternalPrompts(text);
        }

        if (externalParsedPrompts.length === 0) {
            alert('생성할 프롬프트가 없습니다. 프롬프트를 입력하고 파싱해주세요.');
            return;
        }

        // 생성할 개수 결정
        const countValue = externalImageCountSelect?.value || 'all';
        let maxCount = countValue === 'all' ? externalParsedPrompts.length : parseInt(countValue);
        maxCount = Math.min(maxCount, externalParsedPrompts.length);

        const promptsToGenerate = externalParsedPrompts.slice(0, maxCount);

        // 버튼 비활성화
        generateExternalImagesBtn.disabled = true;
        generateExternalImagesBtn.textContent = '⏳ 생성 중...';
        externalGeneratedImages = [];
        externalImageGallery.innerHTML = '';
        externalDownloadSection.style.display = 'none';

        try {
            for (let i = 0; i < promptsToGenerate.length; i++) {
                const prompt = promptsToGenerate[i];
                externalProgressText.textContent = `🎨 이미지 생성 중... (${i + 1}/${promptsToGenerate.length})`;

                try {
                    const imageUrl = await generateImageWithGemini(prompt, apiKey);
                    externalGeneratedImages.push({ prompt, url: imageUrl });

                    // 갤러리에 추가
                    const imgDiv = document.createElement('div');
                    imgDiv.style.cssText = 'background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden;';
                    imgDiv.innerHTML = `
                        <a href="${imageUrl}" target="_blank">
                            <img src="${imageUrl}" style="width: 100%; height: 200px; object-fit: cover; cursor: zoom-in;" />
                        </a>
                        <div style="padding: 10px;">
                            <p style="color: #aaa; font-size: 0.75rem; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prompt.substring(0, 50)}...</p>
                            <button class="download-single-img-btn" data-url="${imageUrl}" data-index="${i + 1}" style="width: 100%; padding: 8px; background: #667eea; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 0.8rem;">📥 다운로드</button>
                        </div>
                    `;
                    externalImageGallery.appendChild(imgDiv);

                    // 개별 다운로드 버튼 이벤트
                    imgDiv.querySelector('.download-single-img-btn').addEventListener('click', async function () {
                        const url = this.getAttribute('data-url');
                        const idx = this.getAttribute('data-index');
                        try {
                            const response = await fetch(url);
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = `external_image_${idx}.png`;
                            a.click();
                            URL.revokeObjectURL(blobUrl);
                        } catch (e) {
                            window.open(url, '_blank');
                        }
                    });

                } catch (e) {
                    console.error(`이미지 ${i + 1} 생성 실패:`, e);
                }

                // 딜레이 (API 제한 방지)
                if (i < promptsToGenerate.length - 1) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            externalProgressText.textContent = `✅ ${externalGeneratedImages.length}/${promptsToGenerate.length}개 이미지 생성 완료!`;

            if (externalGeneratedImages.length > 0) {
                externalDownloadSection.style.display = 'block';
            }

        } catch (e) {
            alert('이미지 생성 중 오류가 발생했습니다: ' + e.message);
        } finally {
            generateExternalImagesBtn.disabled = false;
            generateExternalImagesBtn.textContent = '🚀 이미지 생성';
        }
    });
}

// 전체 다운로드 버튼
const downloadExternalImagesBtn = document.getElementById('downloadExternalImagesBtn');
if (downloadExternalImagesBtn) {
    downloadExternalImagesBtn.addEventListener('click', async () => {
        if (externalGeneratedImages.length === 0) {
            alert('다운로드할 이미지가 없습니다.');
            return;
        }

        downloadExternalImagesBtn.disabled = true;
        downloadExternalImagesBtn.textContent = '⏳ 다운로드 중...';

        for (let i = 0; i < externalGeneratedImages.length; i++) {
            try {
                const response = await fetch(externalGeneratedImages[i].url);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `external_image_${i + 1}.png`;
                a.click();
                URL.revokeObjectURL(blobUrl);
                await new Promise(r => setTimeout(r, 300));
            } catch (e) {
                console.error(`이미지 ${i + 1} 다운로드 실패:`, e);
            }
        }

        downloadExternalImagesBtn.disabled = false;
        downloadExternalImagesBtn.textContent = '📥 이미지 전체 다운로드';
        alert(`✅ ${externalGeneratedImages.length}개의 이미지가 다운로드되었습니다!`);
    });
}

// ImageFX 열기 버튼
const openImageFxExternalBtn = document.getElementById('openImageFxExternalBtn');
if (openImageFxExternalBtn) {
    openImageFxExternalBtn.addEventListener('click', () => {
        // 현재 선택된 프롬프트 또는 첫 번째 프롬프트 사용
        let promptToUse = '';
        if (externalParsedPrompts.length > 0) {
            promptToUse = externalParsedPrompts[0];
        } else {
            const text = externalPromptsInput?.value || '';
            const parsed = parseExternalPrompts(text);
            if (parsed.length > 0) {
                promptToUse = parsed[0];
            }
        }

        if (promptToUse) {
            navigator.clipboard.writeText(promptToUse).then(() => {
                alert(`✅ 첫 번째 프롬프트가 클립보드에 복사되었습니다!\n\nImageFX에서 붙여넣기(Ctrl+V)하세요.`);
            });
        }

        window.open('https://aitestkitchen.withgoogle.com/tools/image-fx', '_blank');
    });
}

// ============================================================
// 주제 추천 기능 (참고 대본 분석 → 10개 주제 제안)
// ============================================================
const suggestTopicsBtn = document.getElementById('suggestTopicsBtn');
const topicSuggestionsSection = document.getElementById('topicSuggestionsSection');
const topicSuggestionsList = document.getElementById('topicSuggestionsList');
const closeSuggestionsBtn = document.getElementById('closeSuggestionsBtn');
const topicInput = document.getElementById('topicInput');
const prevStoryInput = document.getElementById('prevStoryInput');

if (suggestTopicsBtn) {
    suggestTopicsBtn.addEventListener('click', async () => {
        // 참고 대본 가져오기 (지난 이야기 또는 주제/키워드에서)
        const prevStory = prevStoryInput?.value?.trim() || '';
        const topic = topicInput?.value?.trim() || '';

        const referenceScript = prevStory || topic;

        if (!referenceScript || referenceScript.length < 50) {
            alert('📝 참고 대본을 입력해주세요!\n\n지난 이야기 또는 주제/키워드 입력란에 50자 이상의 참고 대본을 입력해주세요.');
            return;
        }

        const apiKey = getGeminiAPIKey();
        if (!apiKey) {
            alert('⚠️ API 키가 없습니다. 먼저 API 키를 저장해주세요.');
            return;
        }

        suggestTopicsBtn.disabled = true;
        suggestTopicsBtn.innerText = '⏳ 주제 분석 중...';

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: TOPIC_SUGGESTER + referenceScript }] }],
                    generationConfig: {
                        maxOutputTokens: 4096
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error?.message || "통신 오류");
            if (!data.candidates || !data.candidates[0].content) throw new Error("AI 응답이 비어있습니다");

            const suggestionsText = data.candidates[0].content.parts[0].text.trim();

            // 추천 주제 파싱
            const suggestions = [];
            const lines = suggestionsText.split('\n').filter(line => line.trim());
            for (const line of lines) {
                // "1. 제목: 설명..." 형식 매칭
                const match = line.match(/^\d+\.\s*(.+)/);
                if (match) {
                    suggestions.push(match[1].trim());
                }
            }

            if (suggestions.length === 0) {
                throw new Error("주제를 파싱할 수 없습니다");
            }

            // UI에 추천 주제 표시
            topicSuggestionsList.innerHTML = '';
            suggestions.forEach((suggestion, index) => {
                const btn = document.createElement('button');
                btn.style.cssText = 'text-align: left; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;';
                btn.innerHTML = `<span style="color: #a29bfe; font-weight: bold;">${index + 1}.</span> ${suggestion}`;
                btn.addEventListener('mouseover', () => {
                    btn.style.background = 'rgba(102, 126, 234, 0.3)';
                    btn.style.borderColor = 'rgba(102, 126, 234, 0.6)';
                });
                btn.addEventListener('mouseout', () => {
                    btn.style.background = 'rgba(255,255,255,0.05)';
                    btn.style.borderColor = 'rgba(255,255,255,0.1)';
                });
                btn.addEventListener('click', () => {
                    // 선택된 주제를 주제 입력란에 넣기
                    const topicTitle = suggestion.split(':')[0].trim();
                    topicInput.value = topicTitle;
                    topicSuggestionsSection.style.display = 'none';
                    alert(`✅ "${topicTitle}" 주제가 선택되었습니다!\n\n이제 '안전 대본 생성' 버튼을 눌러주세요.`);
                });
                topicSuggestionsList.appendChild(btn);
            });

            topicSuggestionsSection.style.display = 'block';
            topicSuggestionsSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            alert("❌ 오류 발생: " + error.message);
            console.error(error);
        } finally {
            suggestTopicsBtn.disabled = false;
            suggestTopicsBtn.innerText = "🎯 참고대본으로 주제 10개 추천받기";
        }
    });
}

// 추천 주제 닫기 버튼
if (closeSuggestionsBtn) {
    closeSuggestionsBtn.addEventListener('click', () => {
        topicSuggestionsSection.style.display = 'none';
    });
}