import { getGeminiAPIKey, StorageManager } from './storage.js';

// ============================================================
// 1. [핵심] 시니어 작가 프롬프트 (선생님의 지침 완벽 적용)
// ============================================================
const SYSTEM_PROMPT = `
당신은 '20년 경력의 시니어 오디오북 작가'입니다. 
사용자의 [주제], [지난 이야기], [원하는 감성]을 반영하여 5070 세대가 공감하는 대본을 쓰세요.

[필수 작성 법칙]
1. 오프닝: 인사말 생략. 5초 후킹 질문으로 시작.
2. 어조: 선택된 '감성(Tone)'에 맞춰서 작성.
3. 연결: '지난 이야기'가 있다면 자연스럽게 내용을 이어가세요.
4. TTS 최적화: (웃음), (사이) 지시문 절대 금지.
5. 출력 포맷:
   - 대본 본문
   - 구분선 (---)
   - [추천 제목 5개]
   - [추천 태그 (쉼표로만 구분, # 사용 금지)]
   - [썸네일 묘사]
`;

// ============================================================
// 2. 기능 구현 (감성 버튼, API, 대본/이미지 생성)
// ============================================================

// 2-1. 감성(Tone) 버튼 클릭 로직
let selectedTone = "따뜻한"; // 기본값
const toneButtons = document.querySelectorAll('.tone-btn');

if (toneButtons) {
    toneButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toneButtons.forEach(b => b.classList.remove('active')); // 기존 선택 해제
            btn.classList.add('active'); // 클릭한 것 선택
            selectedTone = btn.getAttribute('data-value');
        });
    });
}

// 2-2. API 키 관리
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const keyStatusText = document.getElementById('keyStatusText');

function checkKeyStatus() {
    const currentKey = getGeminiAPIKey();
    if (keyStatusText) {
        if (currentKey) {
            if (apiKeyInput) apiKeyInput.value = currentKey;
            keyStatusText.innerText = "✅ API 키가 저장되어 있습니다. (준비 완료)";
            keyStatusText.style.color = "#4caf50";
        } else {
            keyStatusText.innerText = "❌ 저장된 키가 없습니다. 키를 입력하고 저장해주세요.";
            keyStatusText.style.color = "#ff5252";
        }
    }
}
checkKeyStatus(); // 시작 시 자동 체크

if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) return alert("API 키를 입력해주세요!");
        StorageManager.saveApiKey(key);
        alert("API 키가 안전하게 저장되었습니다!");
        checkKeyStatus();
    });
}

// 2-3. 대본 생성 로직
const generateBtn = document.getElementById('generateBtn');
if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        const topic = document.getElementById('topicInput').value;
        // 지난 이야기가 없으면 빈칸 처리
        const prevStoryElement = document.getElementById('prevStoryInput');
        const prevStory = prevStoryElement ? prevStoryElement.value : "";
        const duration = document.getElementById('durationSelect').value;
        const resultDiv = document.getElementById('result');

        if (!topic) return alert("주제를 입력해주세요!");

        resultDiv.innerText = `⏳ 20년 차 작가가 '${selectedTone}' 감성으로 집필 중입니다...`;

        const apiKey = getGeminiAPIKey();
        if (!apiKey) return alert("API 키가 없습니다. 상단에 키를 입력하고 [저장]을 눌러주세요.");

        const fullPrompt = `
        ${SYSTEM_PROMPT}
        
        [입력 정보]
        - 주제: ${topic}
        - 지난 이야기: ${prevStory ? prevStory : "없음"}
        - 원하는 감성: ${selectedTone}
        - 목표 분량: ${duration}
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error.message);

            if (data.candidates && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                resultDiv.innerText = text;

                // 연결 버튼 보이기
                const bridge = document.getElementById('bridgeSection');
                if (bridge) bridge.style.display = 'block';
            } else {
                throw new Error("AI 응답을 가져올 수 없습니다.");
            }

        } catch (error) {
            resultDiv.innerText = "오류 발생: " + error.message;
        }
    });
}

// 2-4. 이미지 생성기로 연결
const sendToImageBtn = document.getElementById('sendToImageBtn');
if (sendToImageBtn) {
    sendToImageBtn.addEventListener('click', function () {
        const script = document.getElementById('result').innerText;
        const imgInput = document.getElementById('imageScriptInput');
        const imgSection = document.getElementById('imageSection');

        imgInput.value = script;
        imgSection.scrollIntoView({ behavior: 'smooth' });

        // 깜빡임 효과
        imgInput.style.backgroundColor = "#333";
        setTimeout(() => { imgInput.style.backgroundColor = ""; }, 300);
    });
}

// 2-5. 이미지 생성 로직
let currentIndex = 0;
let globalParagraphs = [];
const BATCH_SIZE = 10;

const startImageBtn = document.getElementById('startImageBtn');
const nextImageBtn = document.getElementById('nextImageBtn');

if (startImageBtn) {
    startImageBtn.addEventListener('click', () => {
        const script = document.getElementById('imageScriptInput').value;
        if (!script.trim()) return alert("대본 내용이 없습니다.");

        globalParagraphs = script.split('\n').filter(l => l.trim().length > 15 && !l.includes('---'));
        if (globalParagraphs.length === 0) return alert("이미지로 만들 긴 문장이 부족합니다.");

        currentIndex = 0;
        document.getElementById('imageGallery').innerHTML = '';
        if (nextImageBtn) nextImageBtn.style.display = 'inline-block';
        generateNextBatch();
    });
}

if (nextImageBtn) {
    nextImageBtn.addEventListener('click', generateNextBatch);
}

function generateNextBatch() {
    const style = document.getElementById('imageStyle').value;
    const gallery = document.getElementById('imageGallery');
    const progress = document.getElementById('progressText');

    if (currentIndex >= globalParagraphs.length) {
        if (nextImageBtn) nextImageBtn.style.display = 'none';
        if (progress) progress.innerText = "✅ 전체 완료";
        return;
    }

    const endIndex = Math.min(currentIndex + BATCH_SIZE, globalParagraphs.length);
    const batch = globalParagraphs.slice(currentIndex, endIndex);

    if (progress) progress.innerText = `생성 중... (${currentIndex + 1} ~ ${endIndex})`;

    batch.forEach((text, i) => {
        const div = document.createElement('div');
        div.className = 'gallery-card';
        div.style.padding = '10px'; div.style.background = '#222'; div.style.borderRadius = '8px';

        const p = document.createElement('p');
        p.innerText = text.substring(0, 40) + "...";
        p.style.color = '#ccc'; p.style.fontSize = '12px'; p.style.marginBottom = '5px';

        const img = document.createElement('img');
        const seed = Math.floor(Math.random() * 99999);
        const prompt = encodeURIComponent(text.substring(0, 100) + ", " + style);
        img.src = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=576&nologo=true&seed=${seed}`;
        img.style.width = '100%'; img.style.borderRadius = '5px'; img.loading = 'lazy';

        const a = document.createElement('a');
        a.href = img.src; a.innerText = "💾 저장"; a.target = "_blank";
        a.style.display = "block"; a.style.textAlign = "center"; a.style.marginTop = "8px"; a.style.color = "#4da3ff"; a.style.textDecoration = "none";

        div.appendChild(p); div.appendChild(img); div.appendChild(a);
        gallery.appendChild(div);
    });
    currentIndex = endIndex;

    if (currentIndex >= globalParagraphs.length) {
        if (progress) progress.innerText = "✅ 모든 이미지 생성 완료!";
        if (nextImageBtn) nextImageBtn.style.display = 'none';
    }
}