import { getGeminiAPIKey } from './scripts/storage.js';

// ============================================================
// 1. [핵심] 시니어 오디오북 작가 지침 (선생님의 비법)
// ============================================================
const SYSTEM_PROMPT = `
당신은 '20년 경력의 시니어 오디오북/에세이 작가'이자 '유튜브 알고리즘 전문가'입니다.
사용자가 입력한 키워드나 내용을 바탕으로 5070 세대가 공감할 수 있는 대본을 작성하세요.

[필수 작성 법칙: 자생법]
1. 타겟: 5070 중장년층 (공감, 위로, 지혜)
2. 구조: 
   - [오프닝 5초]: "안녕하세요" 인사 생략. 통념을 깨는 질문이나 공감 멘트로 바로 시작.
   - [오프닝 30초]: 공감 -> 해결책 암시.
   - [본문]: 시간 분량에 맞춘 에피소드 및 정보. (부드러운 구어체)
   - [클로징]: 여운, 다음 영상 예고, 댓글 유도.

[TTS 최적화 및 출력 규칙]
1. 지시문((웃음), (사이) 등) 절대 금지. 오직 낭독할 텍스트만 출력.
2. 특수기호 자제 (따옴표, 물음표 정도만 사용).
3. 쉼표(,)와 마침표(.)를 적절히 사용하여 호흡 조절.
4. **중요: 유튜브 패키지 출력**
   - 대본이 끝난 후 구분선(---) 출력.
   - [추천 제목]: 클릭을 부르는 제목 5개
   - [추천 태그]: **# 기호 절대 쓰지 말고 쉼표(,)로만 구분하여 10개 나열 (예: 노후, 친구, 건강, 인생)**
   - [썸네일 묘사]: 그림 작가를 위한 한 줄 묘사
`;

// ============================================================
// 2. 대본 생성 기능 (Gemini 연결)
// ============================================================
document.getElementById('generateBtn').addEventListener('click', async () => {
    const topic = document.getElementById('topicInput').value;
    const duration = document.getElementById('durationSelect').value;
    const resultDiv = document.getElementById('result');

    if (!topic) return alert("주제를 입력해주세요!");

    // 로딩 중 표시
    resultDiv.innerText = "⏳ 20년 차 작가가 대본을 집필 중입니다... (잠시만 기다려주세요)";

    const apiKey = getGeminiAPIKey();
    if (!apiKey) return alert("API 키가 없습니다. 메인 페이지에서 키를 저장해주세요.");

    // 분량 가이드 설정
    let lengthGuide = "A4 3장 (10분)";
    if (duration === "15min") lengthGuide = "A4 4~5장 (15분, 추천)";
    else if (duration === "30min") lengthGuide = "아주 긴 호흡 (30분), 3개의 소주제로 나누어 깊이 있게 작성";
    else if (duration === "60min") lengthGuide = "1시간 분량, 라디오 인생 상담 스타일로 아주 길게 작성";

    const fullPrompt = `${SYSTEM_PROMPT}\n[주제]: ${topic}\n[목표 분량]: ${lengthGuide}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const text = data.candidates[0].content.parts[0].text;

        resultDiv.innerText = text; // 결과 출력

        // ★ 중요: 대본 생성이 끝나면 연결 버튼을 보여주는 로직 실행
        showBridgeButton();

    } catch (error) {
        resultDiv.innerText = "오류가 발생했습니다: " + error.message;
    }
});

// ============================================================
// 3. 연결 다리 (Bridge) 기능
// ============================================================
function showBridgeButton() {
    // 1. 연결 버튼 영역을 보여줌
    const bridge = document.getElementById('bridgeSection');
    if (bridge) bridge.style.display = 'block';
}

// [이 대본으로 삽화 만들기] 버튼 클릭 시
document.getElementById('sendToImageBtn').addEventListener('click', function () {
    const script = document.getElementById('result').innerText;

    // 대본을 이미지 입력창에 복사
    document.getElementById('imageScriptInput').value = script;

    // 부드럽게 아래로 스크롤 이동
    document.getElementById('imageSection').scrollIntoView({ behavior: 'smooth' });

    // 이미지 입력창 깜빡임 효과 (사용자 시선 유도)
    const textarea = document.getElementById('imageScriptInput');
    textarea.style.backgroundColor = "#333";
    setTimeout(() => { textarea.style.backgroundColor = "#2c2c2c"; }, 300);
});


// ============================================================
// 4. 이미지 생성 로직 (10장씩 끊어 만들기)
// ============================================================
let globalParagraphs = [];
let currentIndex = 0;
const BATCH_SIZE = 10;

document.getElementById('startImageBtn').addEventListener('click', function () {
    const script = document.getElementById('imageScriptInput').value;
    if (!script.trim()) return alert("대본이 비어있습니다!");

    // 문단 나누기 (너무 짧은 줄, 제목, 태그 등 제외하고 본문 위주로)
    globalParagraphs = script.split('\n').filter(line => line.trim().length > 15 && !line.includes('---'));

    if (globalParagraphs.length === 0) return alert("이미지로 만들 만한 긴 문장이 없습니다.");

    // 초기화
    currentIndex = 0;
    document.getElementById('imageGallery').innerHTML = '';
    document.getElementById('nextImageBtn').style.display = 'inline-block';

    generateNextBatch(); // 첫 10장 생성 시작
});

// [다음 10장 더 만들기] 버튼
document.getElementById('nextImageBtn').addEventListener('click', generateNextBatch);

function generateNextBatch() {
    const style = document.getElementById('imageStyle').value;
    const gallery = document.getElementById('imageGallery');
    const progressText = document.getElementById('progressText');
    const nextBtn = document.getElementById('nextImageBtn');

    if (currentIndex >= globalParagraphs.length) {
        alert("모든 이미지가 완성되었습니다!");
        nextBtn.style.display = 'none';
        progressText.innerText = "✅ 전체 완료";
        return;
    }

    const endIndex = Math.min(currentIndex + BATCH_SIZE, globalParagraphs.length);
    const batch = globalParagraphs.slice(currentIndex, endIndex);

    progressText.innerText = `⏳ 생성 중... (${currentIndex + 1} ~ ${endIndex} / 총 ${globalParagraphs.length})`;

    batch.forEach((text, i) => {
        const realIndex = currentIndex + i + 1;

        const card = document.createElement('div');
        card.style.background = '#222';
        card.style.padding = '10px';
        card.style.borderRadius = '8px';
        card.style.border = '1px solid #444';

        // 텍스트 미리보기
        const p = document.createElement('p');
        p.innerText = `#${realIndex}. ${text.substring(0, 40)}...`;
        p.style.fontSize = '12px';
        p.style.color = '#ccc';
        p.style.marginBottom = '5px';

        // 이미지
        const img = document.createElement('img');
        const seed = Math.floor(Math.random() * 99999);
        // 한글 프롬프트 그대로 사용 + 스타일 결합
        const prompt = encodeURIComponent(text.substring(0, 100) + ", " + style);
        img.src = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=576&nologo=true&seed=${seed}`;
        img.style.width = '100%';
        img.style.borderRadius = '5px';
        img.style.minHeight = '150px';
        img.style.backgroundColor = '#000';
        img.loading = "lazy";

        // 다운로드 링크
        const link = document.createElement('a');
        link.innerText = "💾 저장";
        link.href = img.src;
        link.target = "_blank";
        link.style.display = "block";
        link.style.textAlign = "center";
        link.style.color = "#4da3ff";
        link.style.marginTop = "8px";
        link.style.textDecoration = "none";
        link.style.fontWeight = "bold";

        card.appendChild(p);
        card.appendChild(img);
        card.appendChild(link);
        gallery.appendChild(card);
    });

    currentIndex = endIndex;

    // 다 만들었으면 완료 처리
    if (currentIndex >= globalParagraphs.length) {
        progressText.innerText = "✅ 모든 이미지 생성 완료!";
        nextBtn.style.display = 'none';
    }
}


// ============================================================
// 5. 초기화 버튼
// ============================================================
document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm("정말 모든 내용을 지우고 새로 시작할까요?")) {
        document.getElementById('topicInput').value = '';
        document.getElementById('result').innerText = '여기에 생성된 대본이 표시됩니다...';
        document.getElementById('imageScriptInput').value = '';
        document.getElementById('imageGallery').innerHTML = '';
        document.getElementById('progressText').innerText = '';
        document.getElementById('nextImageBtn').style.display = 'none';

        // 커서 이동
        document.getElementById('topicInput').focus();
    }
});
