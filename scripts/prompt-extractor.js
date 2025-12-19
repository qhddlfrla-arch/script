import { getGeminiAPIKey, StorageManager } from './storage.js';

// ============================================================
// 대본 → 안전 대본 + 이미지 프롬프트 변환 전용 프롬프트
// ============================================================

const PROMPT_CONVERTER = `
당신은 '20년 경력의 시니어 오디오북 편집 전문가이자 AI 아트 디렉터'입니다.
사용자가 제공하는 대본을 아래 작업에 따라 처리하세요.

★★★ 중요: 반드시 한국어(한글)로 응답하세요! 영어로 응답하지 마세요! ★★★

[작업 1: 안전 대본 변환]
1. 사용자가 제공한 대본을 그대로 유지하되, 유튜브 수익화에 위험할 수 있는 단어만 순화하세요.
2. 순화 대상 예시: '자살' → '극단적 선택', '죽다/죽음' → '떠나다/세상을 떠나다', '살인' → '범죄', '학대' → '상처', '충격적' → '놀라운', '혐오' → '불편한' 등
3. 대본의 전체 흐름, 문체, 톤, 분량은 절대 변경하지 마세요. 오직 위험 단어만 교체하세요.
4. 순화한 단어가 없으면 원본 대본을 그대로 출력하세요.

[작업 2: 이미지 프롬프트 생성]
1. 대본을 읽고, 주요 장면마다 어울리는 이미지 프롬프트를 영어로 작성하세요.
2. 프롬프트 개수: 대본 길이에 따라 5~20개 (장면 전환, 감정 변화 기준)
3. **모든 인물은 반드시 "Korean"으로 명시하세요.**
4. 스타일: {IMAGE_STYLE}
5. ★ **일관성 유지 (매우 중요)**:
   - 첫 번째 프롬프트에서 주인공의 외모를 상세히 정의하세요. (예: "Korean elderly woman, 65 years old, gray short hair, warm smile, cream cardigan")
   - 2번 이후 프롬프트에서도 "same woman" 또는 첫 번째와 동일한 외모 묘사를 반복하세요.
   - 조명/분위기도 통일하세요. (예: warm golden hour lighting, cinematic)
6. 형식: 번호를 붙이고, 영어 프롬프트 뒤에 괄호로 한글 설명을 추가하세요.
   예시:
   1. Korean elderly woman, 65 years old, gray short hair, warm smile, cream cardigan, sipping tea in a cozy living room (거실에서 차를 마시는 할머니)
   2. Same woman looking at an old photo album with nostalgic expression (사진첩을 보는 같은 할머니)

[출력 형식]
아래 형식을 정확히 따르세요:

[SAFE_SCRIPT]
(순화된 대본 전체 또는 원본 대본)

[IMAGE_PROMPTS]
(이미지 프롬프트 목록)

[SAFETY_LOG]
(순화한 단어가 있으면 "원래단어 → 순화단어" 형식으로 기록, 없으면 "이상 없음")
`;

// ============================================================
// 기능 구현
// ============================================================

// 이미지 스타일 선택
let selectedStyle = "Photorealistic, cinematic lighting, 8k, emotional";
const styleButtons = document.querySelectorAll('.style-btn');
styleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        styleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedStyle = btn.getAttribute('data-value');
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
// 메인: 안전 대본 + 이미지 프롬프트 생성
// ============================================================
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const safeScriptResult = document.getElementById('safeScriptResult');
const safetyReportBox = document.getElementById('safetyReportBox');
const promptList = document.getElementById('promptList');

let generatedPrompts = []; // 전역 저장

generateBtn.addEventListener('click', async () => {
    const script = document.getElementById('scriptInput').value.trim();

    if (!script) {
        return alert("대본을 입력해주세요!");
    }

    const apiKey = getGeminiAPIKey();
    if (!apiKey) {
        return alert("API 키가 없습니다. 위에서 API 키를 입력하고 저장하세요.");
    }

    // 로딩 상태
    generateBtn.disabled = true;
    generateBtn.innerText = "⏳ 처리 중... (안전 검사 + 프롬프트 생성)";
    resultSection.style.display = 'none';

    const fullPrompt = PROMPT_CONVERTER.replace('{IMAGE_STYLE}', selectedStyle) + `

[사용자 제공 대본]
${script}
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

        // 결과 표시
        safeScriptResult.innerText = safeScript || script;

        // 안전성 리포트
        safetyReportBox.style.display = 'block';
        if (safetyLog.includes("이상 없음") || safetyLog.includes("없음") || !safetyLog) {
            safetyReportBox.className = "safe-green";
            safetyReportBox.innerText = "✅ 유튜브 안전성 검사 통과 - 순화 필요 없음";
        } else {
            safetyReportBox.className = "safe-warning";
            safetyReportBox.innerHTML = "⚠️ <b>순화된 단어:</b><br>" + safetyLog.replace(/\n/g, '<br>');
        }

        // 이미지 프롬프트 목록 생성
        promptList.innerHTML = "";
        generatedPrompts = imagePrompts.split('\n').filter(line => line.trim().length > 5);

        generatedPrompts.forEach((text, index) => {
            // 영어 프롬프트 (괄호 안의 한글 제거)
            const englishPrompt = text.replace(/^\d+\.\s*/, '').replace(/\s*\([^)]*[ㄱ-ㅎㅏ-ㅣ가-힣]+[^)]*\)\s*/g, '').trim();
            // 한글 설명 추출
            const koreanMatch = text.match(/\(([^)]*[ㄱ-ㅎㅏ-ㅣ가-힣]+[^)]*)\)/);
            const koreanDesc = koreanMatch ? koreanMatch[1] : null;

            const row = document.createElement('div');
            row.className = 'prompt-row';

            const numBadge = document.createElement('span');
            numBadge.innerText = index === 0 ? '🎬1' : (index + 1);
            numBadge.className = index === 0 ? 'prompt-num first' : 'prompt-num';

            const textSpan = document.createElement('span');
            textSpan.className = 'prompt-text';
            textSpan.innerText = koreanDesc || englishPrompt.substring(0, 50) + '...';

            const copyBtn = document.createElement('button');
            copyBtn.innerText = '📋 복사';
            copyBtn.className = 'prompt-copy-btn';

            copyBtn.addEventListener('click', () => {
                const antiCollage = ", single image only, one scene, centered composition, no collage, no grid, no split screen";
                navigator.clipboard.writeText(englishPrompt + antiCollage).then(() => {
                    copyBtn.innerText = '✅ 완료';
                    setTimeout(() => copyBtn.innerText = '📋 복사', 1500);
                });
            });

            row.appendChild(numBadge);
            row.appendChild(textSpan);
            row.appendChild(copyBtn);
            promptList.appendChild(row);
        });

        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        alert("❌ 오류 발생: " + error.message);
        console.error(error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerText = "✨ 안전 대본 + 이미지 프롬프트 생성";
    }
});

// ============================================================
// 복사 버튼들
// ============================================================
document.getElementById('copySafeScriptBtn').addEventListener('click', () => {
    const text = document.getElementById('safeScriptResult').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copySafeScriptBtn');
        btn.innerText = '✅ 복사 완료!';
        setTimeout(() => btn.innerText = '📋 대본 복사', 1500);
    });
});

document.getElementById('copyAllPromptsBtn').addEventListener('click', () => {
    // 영어 프롬프트만 추출하여 전체 복사
    const allEnglish = generatedPrompts.map(text => {
        return text.replace(/^\d+\.\s*/, '').replace(/\s*\([^)]*[ㄱ-ㅎㅏ-ㅣ가-힣]+[^)]*\)\s*/g, '').trim();
    }).join('\n\n');

    navigator.clipboard.writeText(allEnglish).then(() => {
        const btn = document.getElementById('copyAllPromptsBtn');
        btn.innerText = '✅ 복사 완료!';
        setTimeout(() => btn.innerText = '📋 전체 복사', 1500);
    });
});

// ============================================================
// 이미지 생성 (Pollinations)
// ============================================================
let currentIndex = 0;
const startImageBtn = document.getElementById('startImageBtn');
const nextImageBtn = document.getElementById('nextImageBtn');
const imageGallery = document.getElementById('imageGallery');
const progressText = document.getElementById('progressText');

startImageBtn.addEventListener('click', () => {
    if (generatedPrompts.length === 0) {
        return alert("먼저 이미지 프롬프트를 생성하세요.");
    }
    currentIndex = 0;
    imageGallery.innerHTML = '';
    nextImageBtn.style.display = 'inline-block';
    generateNextBatch();
});

nextImageBtn.addEventListener('click', generateNextBatch);

function generateNextBatch() {
    const BATCH_SIZE = 10;

    if (currentIndex >= generatedPrompts.length) {
        nextImageBtn.style.display = 'none';
        progressText.innerText = "✅ 완료";
        return;
    }

    const endIndex = Math.min(currentIndex + BATCH_SIZE, generatedPrompts.length);
    const batch = generatedPrompts.slice(currentIndex, endIndex);
    progressText.innerText = `생성 중... (${currentIndex + 1}~${endIndex})`;

    batch.forEach(text => {
        const cleanText = text.replace(/^\d+\.\s*/, '').replace(/\s*\([^)]*[ㄱ-ㅎㅏ-ㅣ가-힣]+[^)]*\)\s*/g, '').trim();

        const div = document.createElement('div');
        div.style.background = '#222';
        div.style.padding = '10px';
        div.style.borderRadius = '8px';

        const p = document.createElement('p');
        p.innerText = "🎨 " + cleanText.substring(0, 50) + "...";
        p.style.color = "#aaa";
        p.style.fontSize = "12px";
        p.style.marginBottom = "5px";

        const img = document.createElement('img');
        const seed = Math.floor(Math.random() * 99999);
        const prompt = encodeURIComponent(cleanText + ", " + selectedStyle);

        img.src = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=576&seed=${seed}&nologo=true&negative_prompt=collage, grid, split screen, multiple images`;
        img.style.width = '100%';
        img.style.borderRadius = '5px';
        img.loading = 'lazy';

        const a = document.createElement('a');
        a.href = img.src;
        a.innerText = "💾 저장";
        a.target = "_blank";
        a.style.display = "block";
        a.style.textAlign = "center";
        a.style.marginTop = "5px";
        a.style.color = "#4da3ff";

        div.appendChild(p);
        div.appendChild(img);
        div.appendChild(a);
        imageGallery.appendChild(div);
    });

    currentIndex = endIndex;
    if (currentIndex >= generatedPrompts.length) {
        nextImageBtn.style.display = 'none';
    }
}

// ImageFX 열기
document.getElementById('openImageFxBtn').addEventListener('click', () => {
    window.open("https://aitestkitchen.withgoogle.com/tools/image-fx", "_blank");
});

// 초기화
document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm("전체를 초기화할까요?")) return;

    document.getElementById('scriptInput').value = '';
    resultSection.style.display = 'none';
    safeScriptResult.innerText = '';
    safetyReportBox.style.display = 'none';
    promptList.innerHTML = '';
    imageGallery.innerHTML = '';
    progressText.innerText = '';
    nextImageBtn.style.display = 'none';
    generatedPrompts = [];
    currentIndex = 0;

    alert("✅ 초기화 완료!");
});
