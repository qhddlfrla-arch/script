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

// 2. 감성(Tone) 버튼 클릭 로직 (수정됨 - toneGroup 내부만 선택)
let selectedTone = "따뜻한"; // 기본값
const toneButtons = document.querySelectorAll('#toneGroup .tone-btn');

toneButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // toneGroup 내 버튼에서만 active 끄기
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });

        const data = await response.json();

        // ★ 에러 핸들링 추가
        if (!response.ok) {
            throw new Error(`통신 오류 (${response.status}): ${data.error?.message || "알 수 없는 오류"}`);
        }

        if (data.promptFeedback && data.promptFeedback.blockReason) {
            throw new Error(`⚠️ 안전 필터 작동: 주제가 AI 정책에 의해 차단되었습니다. (${data.promptFeedback.blockReason})`);
        }

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("⚠️ AI가 답변을 생성하지 못했습니다. (빈 응답)");
        }

        // ★ content가 없는 경우 (안전 필터 차단) 체크
        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
            const reason = candidate.finishReason || "알 수 없음";
            throw new Error(`⚠️ AI가 응답을 거부했습니다. (사유: ${reason})\n다른 주제로 시도해보세요.`);
        }

        const text = candidate.content.parts[0].text;

        resultDiv.innerText = text;

        // 연결 버튼 보이기
        document.getElementById('bridgeSection').style.display = 'block';

    } catch (error) {
        resultDiv.innerText = "❌ 오류 발생: " + error.message;
    }
});

// 5. 이미지 생성 연결
document.getElementById('sendToImageBtn').addEventListener('click', function () {
    const script = document.getElementById('result').innerText;
    document.getElementById('imageScriptInput').value = script;
    document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });
});

// 6. 이미지 스타일 선택 로직 (★ 새로운 버튼 그룹)
let selectedCharStyle = "cinematic photo, hyperrealistic, 8k";
let selectedBgStyle = "modern, contemporary, sleek";

// 인물 스타일 버튼 처리
const charStyleBtns = document.querySelectorAll('#charStyleGroup .tone-btn');
charStyleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        charStyleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCharStyle = btn.getAttribute('data-value');
        document.getElementById('customCharStyle').value = ''; // 직접 입력 초기화
    });
});

// 배경 스타일 버튼 처리
const bgStyleBtns = document.querySelectorAll('#bgStyleGroup .tone-btn');
bgStyleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        bgStyleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedBgStyle = btn.getAttribute('data-value');
        document.getElementById('customBgStyle').value = ''; // 직접 입력 초기화
    });
});

// 스타일 가져오기 함수
function getImageStyle() {
    const customChar = document.getElementById('customCharStyle').value.trim();
    const customBg = document.getElementById('customBgStyle').value.trim();

    const charStyle = customChar || selectedCharStyle;
    const bgStyle = customBg || selectedBgStyle;

    return `${charStyle}, ${bgStyle}`;
}

// 7. 이미지 생성 로직 (일괄 다운로드 기능 추가)
let currentIndex = 0;
let globalParagraphs = [];
let currentBatchImages = []; // ★ 현재 배치의 이미지 URL과 텍스트 저장
const BATCH_SIZE = 10;

document.getElementById('startImageBtn').addEventListener('click', () => {
    const script = document.getElementById('imageScriptInput').value;
    if (!script.trim()) return alert("대본이 없습니다.");

    globalParagraphs = script.split('\n').filter(l => l.trim().length > 15 && !l.includes('---'));
    if (globalParagraphs.length === 0) return alert("내용이 부족합니다.");

    currentIndex = 0;
    currentBatchImages = [];
    document.getElementById('imageGallery').innerHTML = '';
    document.getElementById('nextImageBtn').style.display = 'inline-block';
    document.getElementById('downloadAllBtn').style.display = 'inline-block';
    generateNextBatch();
});

document.getElementById('nextImageBtn').addEventListener('click', generateNextBatch);

function generateNextBatch() {
    const style = getImageStyle(); // ★ 새로운 스타일 가져오기
    const gallery = document.getElementById('imageGallery');
    const progress = document.getElementById('progressText');
    const nextBtn = document.getElementById('nextImageBtn');

    if (currentIndex >= globalParagraphs.length) {
        nextBtn.style.display = 'none';
        progress.innerText = "✅ 완료";
        return;
    }

    // 새 배치 시작 시 이전 배치 초기화
    currentBatchImages = [];

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
        const imgUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=576&nologo=true&seed=${seed}`;
        img.src = imgUrl;
        img.style.width = '100%'; img.style.borderRadius = '5px'; img.loading = 'lazy';

        // ★ 현재 배치에 이미지 정보 저장
        currentBatchImages.push({ url: imgUrl, text: text, index: currentIndex + i + 1 });

        const a = document.createElement('a');
        a.href = img.src; a.innerText = "💾 저장"; a.target = "_blank"; a.style.display = "block"; a.style.textAlign = "center"; a.style.marginTop = "5px"; a.style.color = "#4da3ff";

        div.appendChild(p); div.appendChild(img); div.appendChild(a);
        gallery.appendChild(div);
    });
    currentIndex = endIndex;
}

// ★ 7. 일괄 다운로드 기능
document.getElementById('downloadAllBtn').addEventListener('click', async () => {
    const downloadBtn = document.getElementById('downloadAllBtn');

    if (currentBatchImages.length === 0) {
        alert("다운로드할 이미지가 없습니다. 먼저 이미지를 생성해주세요!");
        return;
    }

    downloadBtn.innerText = "⏳ 다운로드 준비 중...";
    downloadBtn.disabled = true;

    // 1. 대본 텍스트 파일 다운로드
    const scriptContent = currentBatchImages.map(item =>
        `[이미지 ${item.index}]\n${item.text}\n`
    ).join('\n---\n\n');

    const scriptBlob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const scriptUrl = URL.createObjectURL(scriptBlob);
    const scriptLink = document.createElement('a');
    scriptLink.href = scriptUrl;
    scriptLink.download = `대본_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '-')}.txt`;
    scriptLink.click();
    URL.revokeObjectURL(scriptUrl);

    // 2. 이미지 순차 다운로드 (3초 간격)
    for (let i = 0; i < currentBatchImages.length; i++) {
        const item = currentBatchImages[i];
        downloadBtn.innerText = `📥 이미지 ${i + 1}/${currentBatchImages.length} 다운로드 중...`;

        try {
            const response = await fetch(item.url);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `이미지_${item.index}.jpg`;
            link.click();
            URL.revokeObjectURL(url);

            // 다음 다운로드 전 잠시 대기 (브라우저 제한 방지)
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
            console.error(`이미지 ${item.index} 다운로드 실패:`, error);
        }
    }

    downloadBtn.innerText = "✅ 다운로드 완료!";
    setTimeout(() => {
        downloadBtn.innerText = "📦 이미지 + 대본 일괄 다운로드";
        downloadBtn.disabled = false;
    }, 2000);
});
