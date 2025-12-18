import { getGeminiAPIKey, StorageManager } from './scripts/storage.js';

// 1. [핵심] 시니어 작가 프롬프트
const SYSTEM_PROMPT = `
당신은 '20년 경력의 시니어 오디오북 작가'입니다. 
사용자의 [주제], [지난 이야기], [원하는 감성]을 반영하여 5070 세대가 공감하는 대본을 쓰세요.

[필수 작성 법칙]
1. 오프닝: 인사말 생략. 5초 후킹 질문으로 시작.
2. 어조: 선택된 '감성(Tone)'에 맞춰서 작성 (예: 따뜻한 위로, 차분한 통찰 등).
3. 연결: '지난 이야기'가 있다면 자연스럽게 내용을 이어가세요.
4. TTS 최적화: (웃음), (사이) 지시문 금지.
5. 출력 포맷:
   - 대본 본문
   - 구분선 (---)
   - [추천 제목 5개]
   - [추천 태그 (쉼표 구분)]
   - [썸네일 묘사]
`;

// 2. 감성(Tone) 버튼 클릭 로직 (추가됨!)
let selectedTone = "따뜻한"; // 기본값
const toneButtons = document.querySelectorAll('.tone-btn');

toneButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 모든 버튼에서 active 끄기
        toneButtons.forEach(b => b.classList.remove('active'));
        // 클릭한 버튼만 active 켜기
        btn.classList.add('active');
        selectedTone = btn.getAttribute('data-value'); // 값 저장
    });
});

// 3. API 키 관리
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const keyStatusText = document.getElementById('keyStatusText');

function checkKeyStatus() {
    const currentKey = getGeminiAPIKey();
    if (currentKey) {
        apiKeyInput.value = currentKey;
        keyStatusText.innerText = "✅ API 키 저장됨";
        keyStatusText.style.color = "#4caf50";
    } else {
        keyStatusText.innerText = "❌ 키가 없습니다";
        keyStatusText.style.color = "#ff5252";
    }
}
checkKeyStatus();

saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) return alert("키를 입력하세요!");
    StorageManager.saveApiKey(key);
    alert("저장되었습니다!");
    checkKeyStatus();
});

// 4. 대본 생성 로직 (지난 이야기, 감성 추가)
document.getElementById('generateBtn').addEventListener('click', async () => {
    const topic = document.getElementById('topicInput').value;
    const prevStory = document.getElementById('prevStoryInput').value; // 추가됨
    const duration = document.getElementById('durationSelect').value;
    const resultDiv = document.getElementById('result');

    if (!topic) return alert("주제를 입력해주세요!");

    resultDiv.innerText = `⏳ 작가가 '${selectedTone}' 감성으로 대본을 구상 중입니다...`;

    const apiKey = getGeminiAPIKey();
    if (!apiKey) return alert("API 키가 없습니다.");

    // 프롬프트 조립
    const fullPrompt = `
    ${SYSTEM_PROMPT}
    
    [입력 정보]
    - 주제: ${topic}
    - 지난 이야기(연결): ${prevStory ? prevStory : "없음 (새로운 에피소드)"}
    - 원하는 감성: ${selectedTone}
    - 목표 길이: ${duration}
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        resultDiv.innerText = text;

        // 연결 버튼 보이기
        document.getElementById('bridgeSection').style.display = 'block';

    } catch (error) {
        resultDiv.innerText = "오류 발생: " + error.message;
    }
});

// 5. 이미지 생성 연결
document.getElementById('sendToImageBtn').addEventListener('click', function () {
    const script = document.getElementById('result').innerText;
    document.getElementById('imageScriptInput').value = script;
    document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });
});

// 6. 이미지 생성 로직 (기존과 동일)
let currentIndex = 0;
let globalParagraphs = [];
const BATCH_SIZE = 10;

document.getElementById('startImageBtn').addEventListener('click', () => {
    const script = document.getElementById('imageScriptInput').value;
    if (!script.trim()) return alert("대본이 없습니다.");

    globalParagraphs = script.split('\n').filter(l => l.trim().length > 15 && !l.includes('---'));
    if (globalParagraphs.length === 0) return alert("내용이 부족합니다.");

    currentIndex = 0;
    document.getElementById('imageGallery').innerHTML = '';
    document.getElementById('nextImageBtn').style.display = 'inline-block';
    generateNextBatch();
});

document.getElementById('nextImageBtn').addEventListener('click', generateNextBatch);

function generateNextBatch() {
    const style = document.getElementById('imageStyle').value;
    const gallery = document.getElementById('imageGallery');
    const progress = document.getElementById('progressText');
    const nextBtn = document.getElementById('nextImageBtn');

    if (currentIndex >= globalParagraphs.length) {
        nextBtn.style.display = 'none';
        progress.innerText = "✅ 완료";
        return;
    }

    const endIndex = Math.min(currentIndex + BATCH_SIZE, globalParagraphs.length);
    const batch = globalParagraphs.slice(currentIndex, endIndex);
    progress.innerText = `생성 중... (${currentIndex + 1}~${endIndex})`;

    batch.forEach((text, i) => {
        const div = document.createElement('div');
        div.style.background = '#222'; div.style.padding = '10px'; div.style.borderRadius = '8px';

        const p = document.createElement('p');
        p.innerText = text.substring(0, 30) + "..."; p.style.color = '#ccc'; p.style.fontSize = '12px';

        const img = document.createElement('img');
        const seed = Math.floor(Math.random() * 9999);
        const prompt = encodeURIComponent(text.substring(0, 100) + ", " + style);
        img.src = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=576&nologo=true&seed=${seed}`;
        img.style.width = '100%'; img.style.borderRadius = '5px'; img.loading = 'lazy';

        const a = document.createElement('a');
        a.href = img.src; a.innerText = "💾 저장"; a.target = "_blank"; a.style.display = "block"; a.style.textAlign = "center"; a.style.marginTop = "5px"; a.style.color = "#4da3ff";

        div.appendChild(p); div.appendChild(img); div.appendChild(a);
        gallery.appendChild(div);
    });
    currentIndex = endIndex;
}
