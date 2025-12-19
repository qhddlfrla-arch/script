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
    PERSONA: 'scriptRemixer_persona'
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

// 🍵 [모드 1] 감성 에세이 작가 (인생 이야기)
const PROMPT_ESSAY = `
당신은 '20년 경력의 시니어 오디오북 작가'입니다. 
사용자의 [주제]에 대해 5070 세대가 깊이 공감하는 감성적인 에세이 형식의 대본을 쓰세요.

★★★ 중요: 반드시 한국어(한글)로 대본을 작성하세요! 영어로 작성하지 마세요! ★★★

[출력 순서] (반드시 이 순서를 지키세요!)
1. 먼저 [SCRIPT] 제목을 쓰고, 그 아래에 한글 대본 전체를 작성하세요.
2. 대본 작성이 완전히 끝난 후에만 [IMAGE_PROMPTS], [YOUTUBE_PACKAGE], [SAFETY_LOG] 섹션을 작성하세요.

[작성 법칙]
1. 오프닝: "안녕하세요" 인사 금지. 5초 안에 귀를 사로잡는 질문이나 문장으로 시작.
2. 어조: 따뜻함, 공감, 위로, 친구 같은 말투.
3. 내용 전개: 잔잔한 도입 -> 깊은 공감과 경험 -> 마음을 울리는 메시지 -> 여운이 남는 마무리.
4. 금지: 기계적인 설명, 딱딱한 정보 전달.
5. 분량: 사용자가 지정한 영상 길이에 맞게 충분한 분량의 대본을 작성하세요.
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
★ 유튜브 안전성 가이드 (수익화 보호): 
   - '자살', '살인', '학대', '충격', '혐오' 등 사용 금지. 
   - 필요시 '극단적 선택', '떠났다', '다툼' 등으로 반드시 순화할 것.

[이미지 프롬프트 작성]
★★★ 중요: 대본을 모두 작성한 후, 맨 마지막에 '[IMAGE_PROMPTS]' 섹션을 한 번만 작성하세요. ★★★
1. 대본 전체를 먼저 완성하세요.
2. 대본이 끝나면 '[IMAGE_PROMPTS]' 제목을 쓰고, 그 아래에 모든 이미지 프롬프트를 정리해서 작성하세요.
3. 대본의 흐름에 맞게 적절한 개수의 프롬프트를 작성하세요.
4. **중요: 모든 인물은 반드시 "Korean"으로 명시하세요.**
5. 스타일: 
   - 에세이: Photorealistic, cinematic lighting, 8k, emotional.
   - 튜터: Close-up of senior's hands holding smartphone, clear screen interface, warm indoor lighting.
6. **형식**: 번호를 붙이고, 영어 프롬프트 뒤에 괄호로 한글 설명을 추가하세요.
7. ★ **일관성 유지**: 
   - 첫 번째 프롬프트에서 주인공의 외모를 상세히 정의하세요.
   - 2번 이후 프롬프트에서도 "same woman" 또는 첫 번째와 동일한 외모 묘사를 반복하세요.

[유튜브 제목 및 태그]
1. '[YOUTUBE_PACKAGE]' 제목을 쓰세요.
2. 영상에 어울리는 매력적인 제목 5개를 추천하세요.
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
1. 대본을 읽고, 주요 장면마다 어울리는 이미지 프롬프트를 영어로 작성하세요.
2. 프롬프트 개수: 대본 길이에 따라 5~20개 (장면 전환, 감정 변화 기준)
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
const newScriptSection = document.getElementById('newScriptSection');
const myScriptSection = document.getElementById('myScriptSection');

if (tabNewScript && tabMyScript) {
    tabNewScript.addEventListener('click', () => {
        tabNewScript.classList.add('active');
        tabMyScript.classList.remove('active');
        newScriptSection.style.display = 'block';
        myScriptSection.style.display = 'none';
    });

    tabMyScript.addEventListener('click', () => {
        tabMyScript.classList.add('active');
        tabNewScript.classList.remove('active');
        myScriptSection.style.display = 'block';
        newScriptSection.style.display = 'none';
        initStyleButtons(); // 탭 전환 시 스타일 버튼 초기화
    });
}

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

    let loadingMsg = "";
    let systemPromptBase = "";

    if (mode === "essay") {
        loadingMsg = "⏳ [감성 에세이] 작가가 인생 이야기를 집필 중입니다...";
        systemPromptBase = PROMPT_ESSAY;
    } else {
        loadingMsg = "⏳ [함께하는60+ 모아]님이 강의 자료를 준비 중입니다...";
        systemPromptBase = PROMPT_TUTOR;
    }

    resultDiv.innerText = `${loadingMsg}\n(안전성 검사 및 미술 감독 대기 중...)`;
    safetyBox.style.display = 'none';
    bridge.style.display = 'none';

    const apiKey = getGeminiAPIKey();
    if (!apiKey) return alert("API 키가 없습니다.");

    const fullPrompt = `${systemPromptBase}\n\n${COMMON_RULES}\n\n[입력 정보]\n- 주제: ${topic}\n- 지난이야기: ${prevStory}\n- 감성: ${selectedTone}\n- 분량: ${duration}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || "통신 오류");
        if (!data.candidates || !data.candidates[0].content) throw new Error("AI 응답이 비어있습니다");

        const fullText = data.candidates[0].content.parts[0].text;

        const splitLog = fullText.split('[SAFETY_LOG]');
        let mainContent = splitLog[0];
        let safetyLog = splitLog.length > 1 ? splitLog[1].trim() : "정보 없음";

        // 유튜브 패키지 파싱
        const youtubePackageBox = document.getElementById('youtubePackageBox');
        const titlesBox = document.getElementById('titlesBox');
        const tagsBox = document.getElementById('tagsBox');

        if (mainContent.includes('[YOUTUBE_PACKAGE]')) {
            const ytParts = mainContent.split('[YOUTUBE_PACKAGE]');
            mainContent = ytParts[0];

            let ytContent = ytParts[1].split('[IMAGE_PROMPTS]')[0].trim();

            const titleLines = ytContent.match(/제목\d?:\s*.+/g) || [];
            titlesBox.innerHTML = titleLines.map((t, i) => `<div>${i + 1}. ${t.replace(/제목\d?:\s*/, '')}</div>`).join('');

            const tagMatch = ytContent.match(/태그:\s*(.+)/);
            if (tagMatch) {
                tagsBox.innerText = tagMatch[1].trim();
            }

            youtubePackageBox.style.display = 'block';
        }

        resultDiv.innerText = mainContent.trim();
        bridge.style.display = 'block';

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
                body: JSON.stringify({ contents: [{ parts: [{ text: PERSONA_ANALYZER + script }] }] })
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
                body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
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
                body: JSON.stringify({ contents: [{ parts: [{ text: editPrompt }] }] })
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

// 순수 대본 다운로드
const downloadScriptBtn = document.getElementById('downloadScriptBtn');
if (downloadScriptBtn) {
    downloadScriptBtn.addEventListener('click', () => {
        const fullText = document.getElementById('result').innerText;

        let pureScript = fullText.split('[IMAGE_PROMPTS]')[0].trim();
        pureScript = pureScript.split('[SAFETY_LOG]')[0].trim();

        const blob = new Blob([pureScript], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const date = new Date().toLocaleDateString('ko-KR').replace(/\./g, '-').replace(/ /g, '');
        link.href = URL.createObjectURL(blob);
        link.download = `대본_${date}.txt`;
        link.click();

        alert("✅ 순수 대본이 다운로드되었습니다!");
    });
}

// 프롬프트 리스트 생성
const sendToImageBtn = document.getElementById('sendToImageBtn');
sendToImageBtn.addEventListener('click', () => {
    const fullText = document.getElementById('result').innerText;
    const promptList = document.getElementById('promptList');
    const imageInput = document.getElementById('imageScriptInput');

    const parts = fullText.split('[IMAGE_PROMPTS]');
    let promptsArray = [];

    if (parts.length > 1) {
        let promptOnly = parts[1].split('[SAFETY_LOG]')[0].trim();
        imageInput.value = promptOnly;
        promptsArray = promptOnly.split('\n').filter(line => line.trim().length > 5);
        generatedPrompts = promptsArray;
        saveToStorage(STORAGE_KEYS.IMAGE_PROMPTS, generatedPrompts);
    } else {
        alert("프롬프트를 찾을 수 없습니다.");
        return;
    }

    renderPromptList(promptsArray);

    alert(`✅ 총 ${promptsArray.length}개의 장면이 추출되었습니다.\n목록에서 [복사] 버튼을 눌러 ImageFX에 사용하세요.`);
    document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });
});

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
                copyBtn.innerText = '✅ 완료';
                setTimeout(() => copyBtn.innerText = '📋 복사', 1500);
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
async function generateImageWithGemini(prompt, apiKey) {
    // 방법 1: Gemini 2.0 Flash 이미지 생성 시도
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Generate an image: " + prompt }]
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
                    instances: [{ prompt: prompt }],
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

    // 방법 3: Pollinations AI (무료 백업)
    console.log("Pollinations AI로 이미지 생성 시도...");
    const encodedPrompt = encodeURIComponent(prompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true`;

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
    if (!script.trim()) {
        // 저장된 프롬프트가 있으면 사용
        if (generatedPrompts.length > 0) {
            globalParagraphs = generatedPrompts;
        } else {
            return alert("프롬프트가 없습니다. 먼저 '삽화 프롬프트 추출하기' 버튼을 눌러주세요.");
        }
    } else {
        globalParagraphs = script.split('\n').filter(l => l.trim().length > 5);
    }

    if (globalParagraphs.length === 0) return alert("내용이 부족합니다.");

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
        const fullPrompt = cleanText + ", " + getFullStyleWithComposition() + ", single scene, no collage";

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

// 초기화
restoreSavedData();