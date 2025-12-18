import { getGeminiAPIKey, StorageManager } from './storage.js';

// ============================================================
// 1. [핵심] 프롬프트 보관소 (작가 2명)
// ============================================================

// [작가 A] 시니어 라이프 에세이 작가
const PROMPT_ESSAY = `
당신은 '20년 경력의 시니어 오디오북 작가'입니다. 
사용자의 [주제]에 대해 5070 세대가 깊이 공감하는 감성적인 에세이 형식의 대본을 쓰세요.

[작성 법칙]
1. 오프닝: 인사말 생략. 5초 후킹 질문으로 시작.
2. 어조: 감성적, 따뜻함, 공감, 위로.
3. 내용 전개: 경험담 -> 공감 -> 조언 -> 여운이 남는 마무리.
4. TTS 최적화: (웃음) 등 지시문 금지.
`;

// [작가 B] 디지털 튜터 / IT 일타강사
const PROMPT_TUTOR = `
당신은 '시니어 전문 디지털 튜터(IT 강사)'입니다.
어려운 스마트폰, AI, 키오스크 사용법을 5070 눈높이에서 아주 쉽고 친절하게 설명하는 대본을 쓰세요.

[작성 법칙]
1. 오프닝: "이 기능 모르면 손해입니다!" 같은 강력한 이득 강조로 시작. (인사말 생략)
2. 어조: 아주 쉽고, 천천히, 또박또박, 격려하는 말투. (어려운 용어는 쉬운 우리말로 풀어서 설명)
3. 내용 전개: 
   - 왜 배워야 하는가? (동기 부여)
   - 준비물 및 주의사항
   - [1단계] -> [2단계] -> [3단계] 순서로 번호를 매겨서 설명.
   - 자주 하는 실수(꿀팁) 알려주기.
4. 비유 활용: "폴더는 서랍과 같아요", "앱은 도구 상자예요" 같은 적절한 비유 필수.
`;

// ★ [공통 법칙] ★
const COMMON_RULES = `
★ 유튜브 안전성 가이드 (수익화 보호): 
   - '자살', '살인', '학대', '충격', '혐오' 등 부정적 단어 사용 금지.
   - 필요시 '극단적 선택', '떠났다' 등으로 반드시 순화할 것.

[이미지 프롬프트 작성]
1. 대본 끝에 '[IMAGE_PROMPTS]' 제목을 쓰세요.
2. 대본 분량에 맞춰 충분한 개수의 프롬프트를 작성하세요:
   - 10분 = 약 15개
   - 15분 = 약 25개  
   - 30분 = 약 40개
3. **중요: 모든 인물은 반드시 "Korean"으로 명시하세요.**
4. 스타일: Photorealistic, cinematic lighting, 8k, single scene only.
5. ★★★ **절대 콜라주/분할화면/여러 이미지 모음 금지!** 반드시 '한 장의 독립된 장면'으로 묘사하세요. ★★★
6. **형식**: 번호를 붙이고, 영어 프롬프트 뒤에 괄호로 한글 설명을 추가하세요.
   예: 1. A Korean elderly woman sipping tea (차를 마시는 할머니)
7. ★ **[1번 = ImageFX 고화질 썸네일용]** 
   - 시선을 사로잡는 강렬하고 감성적인 장면!
   - 인물 클로즈업 or 상반신 구도 권장.
   - 예: "1. [ImageFX용] Dramatic close-up of a Korean elderly woman looking emotional, warm golden lighting (감성적인 할머니 클로즈업)"
8. **[2번 이후 = Pollinations 일괄 생성용]** - 일반 장면들을 순서대로 작성.

[안전성 검사 리포트]
1. 맨 마지막에 '[SAFETY_LOG]' 제목 작성.
2. 순화한 단어가 있으면 기록, 없으면 "이상 없음".
`;

// ============================================================
// 2. 기능 구현
// ============================================================

// 감성 버튼
let selectedTone = "따뜻한";
const toneButtons = document.querySelectorAll('.tone-btn');
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

// 3. 대본 생성 로직
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
        loadingMsg = "⏳ 감성 작가가 인생 이야기를 집필 중입니다...";
        systemPromptBase = PROMPT_ESSAY;
    } else {
        loadingMsg = "⏳ 디지털 튜터가 강의 대본을 준비 중입니다...";
        systemPromptBase = PROMPT_TUTOR;
    }

    resultDiv.innerText = `${loadingMsg}\n⏳ (안전성 검사 및 미술 감독 대기 중)`;
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

        resultDiv.innerText = mainContent.trim();
        bridge.style.display = 'block';

        safetyBox.style.display = 'block';
        if (safetyLog.includes("이상 없음") || safetyLog.includes("없음")) {
            safetyBox.className = "safe-green";
            safetyBox.innerText = "✅ 유튜브 안전성 검사 통과: 금지어 없음";
        } else {
            safetyBox.className = "safe-warning";
            safetyBox.innerHTML = "⚠️ <b>금지어 순화 리포트:</b><br>" + safetyLog.replace(/\n/g, '<br>');
        }

    } catch (error) {
        resultDiv.innerText = "❌ 오류 발생: " + error.message;
        console.error(error);
    }
});

// 4. 프롬프트 추출
const sendToImageBtn = document.getElementById('sendToImageBtn');
sendToImageBtn.addEventListener('click', () => {
    const fullText = document.getElementById('result').innerText;
    const imageInput = document.getElementById('imageScriptInput');
    const parts = fullText.split('[IMAGE_PROMPTS]');

    if (parts.length > 1) {
        let promptOnly = parts[1].split('[SAFETY_LOG]')[0];
        imageInput.value = promptOnly.trim();
        alert(`✅ 영어 프롬프트 추출 완료! (총 ${promptOnly.split('\n').filter(l => l.length > 5).length}컷 - 대본에 맞춰 적절히 생성됨)`);
    } else {
        imageInput.value = fullText;
    }
    document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });
});

// 5. ImageFX (★ 첫 번째 프롬프트만 + 강력한 부정 프롬프트 추가)
const openImageFxBtn = document.getElementById('openImageFxBtn');
if (openImageFxBtn) {
    openImageFxBtn.addEventListener('click', () => {
        const prompts = document.getElementById('imageScriptInput').value;
        if (!prompts.trim()) return alert("추출된 프롬프트가 없습니다.");

        // 첫 번째 프롬프트만 추출 (번호와 한글 설명 제거)
        const lines = prompts.split('\n').filter(l => l.trim().length > 10);
        let firstPrompt = lines[0] || prompts;

        // 번호 제거 (1. 2. 등)
        firstPrompt = firstPrompt.replace(/^\d+\.\s*/, '');
        // 한글 부분 제거 (괄호 안의 한글)
        firstPrompt = firstPrompt.replace(/\s*\([^)]*[ㄱ-ㅎㅏ-ㅣ가-힣]+[^)]*\)\s*/g, '');

        // ★ 강력한 부정 프롬프트 추가 ★
        const antiCollage = ", single image only, one scene, centered composition, no collage, no grid, no split screen, no multiple images, no montage, no photo collection";
        const finalPrompt = firstPrompt.trim() + antiCollage;

        navigator.clipboard.writeText(finalPrompt).then(() => {
            alert("📋 첫 번째 프롬프트가 복사되었습니다!\n\n⚠️ 콜라주 방지 프롬프트가 자동으로 추가되었습니다.\n\nImageFX에서 Ctrl+V로 붙여넣기 하세요.");
            window.open("https://aitestkitchen.withgoogle.com/tools/image-fx", "_blank");
        }).catch(err => {
            prompt("아래 프롬프트를 복사하세요:", finalPrompt);
            window.open("https://aitestkitchen.withgoogle.com/tools/image-fx", "_blank");
        });
    });
}

// 6. 무료 이미지 생성
let currentIndex = 0;
let globalParagraphs = [];
const startImageBtn = document.getElementById('startImageBtn');
const nextImageBtn = document.getElementById('nextImageBtn');

startImageBtn.addEventListener('click', () => {
    const script = document.getElementById('imageScriptInput').value;
    if (!script.trim()) return alert("대본이 없습니다.");

    globalParagraphs = script.split('\n').filter(l => l.trim().length > 5);
    if (globalParagraphs.length === 0) return alert("내용이 부족합니다.");

    currentIndex = 0;
    document.getElementById('imageGallery').innerHTML = '';
    nextImageBtn.style.display = 'inline-block';
    generateNextBatch();
});

nextImageBtn.addEventListener('click', generateNextBatch);

function generateNextBatch() {
    const style = document.getElementById('imageStyle').value;
    const gallery = document.getElementById('imageGallery');
    const progress = document.getElementById('progressText');
    const BATCH_SIZE = 10;

    if (currentIndex >= globalParagraphs.length) {
        nextImageBtn.style.display = 'none';
        progress.innerText = "✅ 완료";
        return;
    }
    const endIndex = Math.min(currentIndex + BATCH_SIZE, globalParagraphs.length);
    const batch = globalParagraphs.slice(currentIndex, endIndex);
    progress.innerText = `생성 중... (${currentIndex + 1}~${endIndex})`;

    batch.forEach(text => {
        const cleanText = text.replace(/^\d+\.\s*/, '').replace(/- /g, '');
        const div = document.createElement('div');
        div.style.background = '#222'; div.style.padding = '10px'; div.style.borderRadius = '8px';
        const p = document.createElement('p');
        p.innerText = "🎨 " + cleanText.substring(0, 50) + "...";
        p.style.color = "#aaa"; p.style.fontSize = "12px"; p.style.marginBottom = "5px";
        const img = document.createElement('img');
        const seed = Math.floor(Math.random() * 99999);
        const prompt = encodeURIComponent(cleanText + ", " + style);

        // ★ 여기가 핵심! negative_prompt를 추가해서 콜라주를 막았습니다. ★
        img.src = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=576&seed=${seed}&nologo=true&negative_prompt=collage, grid, split screen, multiple images`;
        img.style.width = '100%'; img.style.borderRadius = '5px'; img.loading = 'lazy';

        const a = document.createElement('a');
        a.href = img.src; a.innerText = "💾 저장"; a.target = "_blank"; a.style.display = "block"; a.style.textAlign = "center"; a.style.marginTop = "5px"; a.style.color = "#4da3ff";
        div.appendChild(p); div.appendChild(img); div.appendChild(a);
        gallery.appendChild(div);
    });
    currentIndex = endIndex;
    if (currentIndex >= globalParagraphs.length) nextImageBtn.style.display = 'none';
}

// 7. 초기화 버튼 기능
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (!confirm("모든 이미지와 프롬프트를 초기화할까요?")) return;

        document.getElementById('imageGallery').innerHTML = '';
        document.getElementById('imageScriptInput').value = '';
        document.getElementById('progressText').innerText = '';
        nextImageBtn.style.display = 'none';

        currentIndex = 0;
        globalParagraphs = [];

        alert("✅ 초기화 완료!");
    });
}
