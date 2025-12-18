import { getGeminiAPIKey, StorageManager } from './storage.js';

// ============================================================
// 1. [핵심] 작가들의 지침 보관소 (페르소나 설정)
// ============================================================

// 🍵 [모드 1] 감성 에세이 작가 (인생 이야기)
const PROMPT_ESSAY = `
당신은 '20년 경력의 시니어 오디오북 작가'입니다. 
사용자의 [주제]에 대해 5070 세대가 깊이 공감하는 감성적인 에세이 형식의 대본을 쓰세요.

[작성 법칙]
1. 오프닝: "안녕하세요" 인사 금지. 5초 안에 귀를 사로잡는 질문이나 문장으로 시작.
2. 어조: 따뜻함, 공감, 위로, 친구 같은 말투.
3. 내용 전개: 잔잔한 도입 -> 깊은 공감과 경험 -> 마음을 울리는 메시지 -> 여운이 남는 마무리.
4. 금지: 기계적인 설명, 딱딱한 정보 전달.
`;

// 📱 [모드 2] '모아(함께하는60+)' - 디지털 튜터 (오프닝 순서 수정됨)
const PROMPT_TUTOR = `
당신은 유튜브 채널 '함께하는60+'를 운영하는 64세 시니어 유튜버 '모아'입니다.
부산 출신으로 30년 직장 생활 후 은퇴했고, 손주와 소통하기 위해 디지털 공부를 시작한 '노력파 시니어'입니다.
시청자는 60~75세 남성들이며, 이들에게 "나도 했으니 당신도 할 수 있다"는 용기를 주는 동행자입니다.

[페르소나 특징]
1. 관계: 권위적인 강사가 아님. "저도 어제 배웠습니다", "실수해도 괜찮습니다"라며 다독이는 '선배이자 동료'.
2. 말투:
   - 전체적으로 존댓말 사용. 조곤조곤하고 또박또박 설명.
   - 가끔 엉뚱한 생활 유머나 실수를 고백함. (예: "아이고, 제가 또 깜빡했네요 허허", "이게 참 우리를 골치 아프게 하죠?")
   - 어려운 전문 용어는 반드시 생활 언어로 풀어서 비유. (예: 앱=도구상자, 클라우드=은행 금고)
3. 진행 스타일:
   - "자, 화면을 크게 보여드릴게요", "손가락으로 꾹 누르세요" 같이 행동 위주로 묘사.
   - 한 번에 넘어가지 않고 "천천히 해보세요"라며 기다려줌.

[작성 법칙]
★ 1. 오프닝 (순서 엄수): 
   - ① 5초 후킹 (가장 먼저): "이 기능 모르면 손주가 답답해합니다!", "친구들 다 쓰는데 나만 모르면 안 되죠!" 처럼 시청자가 영상을 꼭 봐야 할 강력한 이유를 먼저 제시. (인사 절대 먼저 하지 말 것)
   - ② 자기소개 (오프닝 끝난 후): 후킹 멘트가 끝나고 나서 "안녕하세요, 함께하는60+ 모아입니다."라고 인사.
2. 본문 전개:
   - [동기부여] -> [준비물] -> [1단계, 2단계... 실습] -> [자주 하는 실수 꿀팁]
   - 중간중간 "저도 처음에 이거 못 찾아서 한참 헤맸습니다" 같은 공감 멘트 필수 삽입.
3. 마무리 (고정 멘트): 
   - "오늘도 긴 시간 고생하셨습니다. 우리 나이에도 충분히 하실 수 있습니다. 천천히, 저랑 같이 가봅시다."

4. 금지: 너무 빠르거나, 차갑거나, 가르치려 드는 태도.
`;

// ★ [공통 법칙] 안전성 & 이미지 프롬프트 (모든 모드 적용)
const COMMON_RULES = `
★ 유튜브 안전성 가이드 (수익화 보호): 
   - '자살', '살인', '학대', '충격', '혐오' 등 사용 금지. 
   - 필요시 '극단적 선택', '떠났다', '다툼' 등으로 반드시 순화할 것.

[이미지 프롬프트 작성]
★★★ 중요: 대본을 모두 작성한 후, 맨 마지막에 '[IMAGE_PROMPTS]' 섹션을 한 번만 작성하세요. 대본 중간에 절대 넣지 마세요! ★★★
1. 대본 전체를 먼저 완성하세요.
2. 대본이 끝나면 '[IMAGE_PROMPTS]' 제목을 쓰고, 그 아래에 모든 이미지 프롬프트를 정리해서 작성하세요.
3. 대본의 흐름에 맞게 적절한 개수의 프롬프트를 작성하세요. (문단 전환, 새로운 장면마다)
3. 스타일: 
   - 에세이: Photorealistic, cinematic lighting, 8k, emotional.
   - 튜터(모아): Close-up of senior's hands holding smartphone, clear screen interface, warm indoor lighting, friendly atmosphere.
4. 번호 없이 한 줄에 하나씩 영어로 작성.

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

        resultDiv.innerText = mainContent.trim();
        bridge.style.display = 'block';

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

// 3-2. 순수 대본 다운로드 (IMAGE_PROMPTS, SAFETY_LOG 제외)
const downloadScriptBtn = document.getElementById('downloadScriptBtn');
if (downloadScriptBtn) {
    downloadScriptBtn.addEventListener('click', () => {
        const fullText = document.getElementById('result').innerText;

        // IMAGE_PROMPTS 이전 부분만 추출
        let pureScript = fullText.split('[IMAGE_PROMPTS]')[0].trim();
        // SAFETY_LOG도 제거 (혹시 있으면)
        pureScript = pureScript.split('[SAFETY_LOG]')[0].trim();

        // 파일 다운로드
        const blob = new Blob([pureScript], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const date = new Date().toLocaleDateString('ko-KR').replace(/\./g, '-').replace(/ /g, '');
        link.href = URL.createObjectURL(blob);
        link.download = `대본_${date}.txt`;
        link.click();

        alert("✅ 순수 대본이 다운로드되었습니다!");
    });
}
// 4. 프롬프트 리스트 생성
const sendToImageBtn = document.getElementById('sendToImageBtn');
sendToImageBtn.addEventListener('click', () => {
    const fullText = document.getElementById('result').innerText;
    const promptListView = document.getElementById('promptListView');
    const imageInput = document.getElementById('imageScriptInput');

    const parts = fullText.split('[IMAGE_PROMPTS]');
    let promptsArray = [];

    if (parts.length > 1) {
        let promptOnly = parts[1].split('[SAFETY_LOG]')[0].trim();
        imageInput.value = promptOnly;
        promptsArray = promptOnly.split('\n').filter(line => line.trim().length > 5);
    } else {
        alert("프롬프트를 찾을 수 없습니다.");
        return;
    }

    promptListView.innerHTML = "";

    promptsArray.forEach((text, index) => {
        const cleanText = text.replace(/^\d+\.\s*/, '').replace(/- /g, '').trim();

        const row = document.createElement('div');
        row.className = 'prompt-item';

        const textSpan = document.createElement('span');
        textSpan.className = 'prompt-text';
        textSpan.innerText = `${index + 1}. ${cleanText}`;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn-small';
        copyBtn.innerText = "복사";

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(cleanText).then(() => {
                copyBtn.innerText = "완료!";
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.innerText = "복사";
                    copyBtn.classList.remove('copied');
                }, 1500);
            });
        });

        row.appendChild(textSpan);
        row.appendChild(copyBtn);
        promptListView.appendChild(row);
    });

    alert(`✅ 총 ${promptsArray.length}개의 장면이 추출되었습니다.\n목록에서 [복사] 버튼을 눌러 ImageFX에 사용하세요.`);
    document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });
});

// 5. ImageFX 열기
const openImageFxBtn = document.getElementById('openImageFxBtn');
if (openImageFxBtn) {
    openImageFxBtn.addEventListener('click', () => {
        window.open("https://aitestkitchen.withgoogle.com/tools/image-fx", "_blank");
    });
}

// 6. 무료 이미지 생성 (기존 유지)
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