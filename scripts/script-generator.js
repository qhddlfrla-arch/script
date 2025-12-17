/**
 * script-generator.js
 * 시니어 오디오북 대본 생성 및 삽화 생성 로직
 */

// ==========================================
// 0. API Key 관리 (storage.js 호환)
// ==========================================
const API_KEY_STORAGE_KEY = 'openai_api_key';

function getGeminiAPIKey() {
    try {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error('API Key 로드 오류:', error);
        return null;
    }
}

function saveGeminiAPIKey(apiKey) {
    try {
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
        return true;
    } catch (error) {
        console.error('API Key 저장 오류:', error);
        return false;
    }
}

function clearGeminiAPIKey() {
    try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('API Key 삭제 오류:', error);
        return false;
    }
}

// API Key UI 초기화
function initApiKeyUI() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiStatus = document.getElementById('apiStatus');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const clearKeyBtn = document.getElementById('clearKeyBtn');
    const toggleKeyBtn = document.getElementById('toggleKeyBtn');

    // 저장된 키 확인
    const savedKey = getGeminiAPIKey();
    if (savedKey) {
        apiKeyInput.value = savedKey;
        apiStatus.textContent = '연결됨';
        apiStatus.classList.add('connected');
    }

    // 저장 버튼
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            alert('API 키를 입력해주세요.');
            return;
        }
        if (saveGeminiAPIKey(key)) {
            apiStatus.textContent = '연결됨';
            apiStatus.classList.add('connected');
            alert('API 키가 저장되었습니다!');
        }
    });

    // 삭제 버튼
    clearKeyBtn.addEventListener('click', () => {
        if (confirm('API 키를 삭제하시겠습니까?')) {
            clearGeminiAPIKey();
            apiKeyInput.value = '';
            apiStatus.textContent = '미설정';
            apiStatus.classList.remove('connected');
        }
    });

    // 표시/숨김 토글
    toggleKeyBtn.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleKeyBtn.textContent = '🙈';
        } else {
            apiKeyInput.type = 'password';
            toggleKeyBtn.textContent = '👁️';
        }
    });
}

// ==========================================
// 1. 대본 생성 로직 (시니어 작가 페르소나)
// ==========================================
const SYSTEM_PROMPT = `
당신은 '20년 경력의 시니어 오디오북 작가'입니다.
사용자가 입력한 주제로 5070 세대가 공감할 수 있는 따뜻하고 깊이 있는 대본을 작성하세요.

[필수 법칙: 자생법 적용]
1. 오프닝: 인사말 없이 5초 후킹 질문으로 시작 -> 30초 공감 빌드업.
2. 본문: 선택한 시간 분량에 맞춰 에피소드 전개. "그렇게 세월이 흘러..." 같은 서술형 전환 사용 (연도 나열 금지).
3. TTS 최적화: 지시문((웃음) 등) 절대 금지. 오직 읽을 텍스트만 출력.
4. 패키지: 본문 끝에 구분선(---) 후 [제목 5개], [태그(쉼표구분)], [썸네일 묘사] 출력.
`;

document.getElementById('generateBtn').addEventListener('click', async () => {
    const topic = document.getElementById('topicInput').value;
    const duration = document.getElementById('durationSelect').value;
    const resultDiv = document.getElementById('result');
    const generateBtn = document.getElementById('generateBtn');

    if (!topic) return alert("주제를 입력해주세요!");

    const apiKey = getGeminiAPIKey();
    if (!apiKey) return alert("API 키가 없습니다. 위에서 키를 저장해주세요.");

    // 버튼 비활성화 및 로딩 표시
    generateBtn.disabled = true;
    generateBtn.textContent = "⏳ 작가가 대본을 구상 중입니다...";
    resultDiv.classList.add('loading');
    resultDiv.innerText = "잠시만 기다려주세요. 대본을 작성하고 있습니다...";

    // 분량 가이드 설정
    let lengthGuide = "A4 3장 (10분)";
    if (duration === "15min") lengthGuide = "A4 4~5장 (15분, 추천)";
    else if (duration === "30min") lengthGuide = "아주 긴 호흡 (30분), 3개의 소주제";
    else if (duration === "60min") lengthGuide = "1시간 분량, 라디오 인생 상담 스타일";

    const fullPrompt = `${SYSTEM_PROMPT}\n[주제]: ${topic}\n[목표 분량]: ${lengthGuide}`;

    // 타임아웃 설정 (긴 대본의 경우 더 오래 기다림)
    const timeoutMs = duration === "60min" ? 180000 : (duration === "30min" ? 120000 : 90000);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    maxOutputTokens: duration === "60min" ? 16000 : (duration === "30min" ? 12000 : 8000),
                    temperature: 0.85,
                    topP: 0.95
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `API 오류: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        resultDiv.classList.remove('loading');
        resultDiv.innerText = text;
        showBridgeButton();

    } catch (error) {
        resultDiv.classList.remove('loading');
        if (error.name === 'AbortError') {
            resultDiv.innerText = "⚠️ 요청 시간이 초과되었습니다. 다시 시도해주세요.";
        } else {
            resultDiv.innerText = "⚠️ 오류 발생: " + error.message;
        }
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "✨ 대본 생성하기";
    }
});

// ==========================================
// 2. 연결 다리 (Bridge)
// ==========================================
function showBridgeButton() {
    const bridge = document.getElementById('bridgeSection');
    bridge.style.display = 'block';

    // 이미지 섹션 활성화
    const imgSec = document.getElementById('imageSection');
    imgSec.classList.remove('disabled');
}

document.getElementById('sendToImageBtn').addEventListener('click', function () {
    const script = document.getElementById('result').innerText;
    // 본문만 가져오기 (---) 이전까지
    const bodyOnly = script.split('---')[0].trim();
    document.getElementById('imageScriptInput').value = bodyOnly;
    document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });
});


// ==========================================
// 3. 이미지 생성 로직 (10장씩 끊기)
// ==========================================
let globalParagraphs = [];
let currentIndex = 0;
const BATCH_SIZE = 10;

document.getElementById('startImageBtn').addEventListener('click', function () {
    const script = document.getElementById('imageScriptInput').value;
    if (!script.trim()) return alert("대본이 비어있습니다!");

    // 문단 나누기 (너무 짧은 줄 제외)
    globalParagraphs = script.split('\n').filter(line => line.trim().length > 15);

    if (globalParagraphs.length === 0) return alert("이미지로 만들 내용이 충분하지 않습니다.");

    currentIndex = 0;
    document.getElementById('imageGallery').innerHTML = '';
    document.getElementById('nextImageBtn').style.display = 'inline-block';

    generateNextBatch();
});

document.getElementById('nextImageBtn').addEventListener('click', generateNextBatch);

function generateNextBatch() {
    const style = document.getElementById('imageStyle').value;
    const gallery = document.getElementById('imageGallery');
    const progressText = document.getElementById('progressText');
    const nextBtn = document.getElementById('nextImageBtn');

    if (currentIndex >= globalParagraphs.length) {
        alert("모든 이미지가 완성되었습니다!");
        nextBtn.style.display = 'none';
        return;
    }

    const endIndex = Math.min(currentIndex + BATCH_SIZE, globalParagraphs.length);
    const batch = globalParagraphs.slice(currentIndex, endIndex);

    progressText.innerText = `⏳ 생성 중... (${currentIndex + 1}~${endIndex} / 총 ${globalParagraphs.length})`;

    batch.forEach((text, i) => {
        const realIndex = currentIndex + i + 1;

        const card = document.createElement('div');
        card.className = 'image-card';

        const p = document.createElement('p');
        p.innerText = `#${realIndex}. ${text.substring(0, 50)}...`;

        const img = document.createElement('img');
        const seed = Math.floor(Math.random() * 99999);
        // 한글을 영문으로 변환하는 것이 더 좋은 결과를 낼 수 있음
        const promptText = text.substring(0, 100) + ", Korean elderly, " + style;
        const prompt = encodeURIComponent(promptText);
        img.src = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=576&nologo=true&seed=${seed}`;
        img.alt = `삽화 ${realIndex}`;
        img.loading = "lazy";

        // 다운로드 링크
        const link = document.createElement('a');
        link.innerText = "💾 이미지 저장";
        link.href = img.src;
        link.target = "_blank";
        link.download = `illustration_${realIndex}.jpg`;

        card.appendChild(p);
        card.appendChild(img);
        card.appendChild(link);
        gallery.appendChild(card);
    });

    currentIndex = endIndex;
    if (currentIndex >= globalParagraphs.length) {
        progressText.innerText = "✅ 모든 이미지 생성 완료!";
        nextBtn.style.display = 'none';
    }
}


// ==========================================
// 4. 초기화 버튼
// ==========================================
document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm("정말 모든 내용을 지우고 새로 시작할까요?")) {
        document.getElementById('topicInput').value = '';
        document.getElementById('result').innerText = '';
        document.getElementById('bridgeSection').style.display = 'none';
        document.getElementById('imageScriptInput').value = '';
        document.getElementById('imageGallery').innerHTML = '';
        document.getElementById('imageSection').classList.add('disabled');
        document.getElementById('nextImageBtn').style.display = 'none';
        document.getElementById('progressText').innerText = '';
        document.getElementById('topicInput').focus();
        globalParagraphs = [];
        currentIndex = 0;
    }
});


// ==========================================
// 5. 초기화
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initApiKeyUI();
});
