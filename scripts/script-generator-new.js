/**
 * Script Generator V2 - New Workflow
 * 
 * 워크플로우:
 * 탭1: 참고대본 → 안전대본 → 시대/상황선택 → 등장인물 프롬프트 → 대본 프롬프트
 * 탭2: 내대본 → 등장인물 프롬프트 → 대본 프롬프트
 */

import { getGeminiAPIKey, StorageManager } from './storage.js';

// ============================================================
// Storage
// ============================================================

const Storage = {
    save(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { console.error('저장 실패:', e); }
    },
    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) { return defaultValue; }
    }
};

// ============================================================
// Prompts
// ============================================================

const PROMPTS = {
    SAFE_SCRIPT_PART1: `
===== [6070 인생 라디오 '여울'] 안전 대본 작성 =====

당신은 20년 경력의 시니어 라디오 사연 전문 작가입니다.
타겟 청취자: 50대~70대 시니어

★★★ 중요: 유튜브 수익화를 위해 안전한 표현만 사용! ★★★

[순화 규칙]
- 자살/자해 → "극단적 선택", "스스로를 해치다"
- 죽다/죽음 → "떠나다", "세상을 떠나다"
- 폭행/구타 → "다툼", "충돌"
- 우울증 → "마음의 병", "힘든 시간"

[오프닝 구성]
1. 감성 후킹: 가슴 찡한 한 줄로 시작
2. 채널 인사: "6070 인생 라디오 '여울'입니다. 구독과 좋아요 부탁드립니다."
3. 사연 도입: 인물의 이름과 상황 자세히 소개

[본문 작성 지침]
- 자연스러운 구어체, TTS 최적화
- 쉼표와 마침표 자주 사용
- 라벨 금지: [오프닝], (5초) 등
- 대화와 묘사를 풍부하게
- 감정 표현을 구체적으로

★★★★★ [매우 중요] 분량: 최소 4,500자 이상! ★★★★★
★★★ 짧으면 안됩니다! 상세하고 길게 작성하세요! ★★★

[출력 형식]
대본만 작성하세요. [SCRIPT], [SAFETY_LOG] 등 태그 없이 순수 대본만!

★ 분량이 더 필요하면 중간에서 자연스럽게 이어질 수 있도록 끝내세요.
`,

    SAFE_SCRIPT_MIDDLE: `
===== [6070 인생 라디오 '여울'] 중간 파트 이어쓰기 =====

당신은 20년 경력의 시니어 라디오 사연 전문 작가입니다.

★★★ [중요] 이전 내용에 이어서 자연스럽게 계속 작성! ★★★

[이전 이야기]
{PREVIOUS_SCRIPT}

[작성 지침]
- 위 내용에 이어서 바로 계속 작성 (새로운 시작 X)
- [SCRIPT], 제목, 번호 매기기 등 절대 금지
- 순수 대본 내용만 작성
- 최소 4,500자 이상 추가
- 자연스러운 구어체, TTS 최적화
- 대화와 감정 묘사 풍부하게

★★★ 출력: 순수 대본만! 태그/라벨 없이! ★★★
`,

    SAFE_SCRIPT_FINAL: `
===== [6070 인생 라디오 '여울'] 마무리 이어쓰기 =====

당신은 20년 경력의 시니어 라디오 사연 전문 작가입니다.

★★★ [중요] 이전 내용에 이어서 마무리까지 완성! ★★★

[이전 이야기]
{PREVIOUS_SCRIPT}

[작성 지침]
- 위 내용에 이어서 바로 계속 작성 (새로운 시작 X)
- [SCRIPT], 제목, 번호 매기기 등 절대 금지
- 순수 대본 내용만 작성
- 이야기를 감동적으로 마무리
- 자연스러운 구어체, TTS 최적화

★★★ [클로징] 대본 마지막에 자연스럽게 포함 ★★★
- 따뜻한 교훈이나 깨달음으로 마무리
- "여러분도 비슷한 경험이 있으신가요?" 공감 유도
- "이 영상이 좋으셨다면 구독과 좋아요 부탁드립니다."
- "다음에는 더 따뜻한 이야기로 찾아뵙겠습니다."
- "6070 인생 라디오 여울이었습니다. 편안한 하루 되세요."

★★★ 분량: 최소 4,500자 이상 추가! ★★★
★★★ 출력: 순수 대본만! 태그/라벨 없이! ★★★
`,

    CHARACTER_ANALYZER: `
당신은 '시니어 오디오북 일러스트 디렉터'입니다.
대본을 읽고 등장하는 **모든 주요 인물**의 상세한 외모 프롬프트를 생성하세요.

★★★ 반드시 영어로 출력! 이미지 생성 AI에 사용됩니다. ★★★

[필수 포함 요소 - 각 인물마다]
1. 국적: Korean (필수!)
2. 나이: 구체적 숫자 (예: 68 years old)
3. 성별
4. 머리: 길이, 색상, 스타일 (예: short gray permed hair)
5. 얼굴: 특징 (예: warm gentle face, soft wrinkles, kind eyes)
6. 체형: (예: average build)
7. 의상: 구체적으로 (예: comfortable beige cardigan, navy pants)
8. 분위기: (예: warm and motherly atmosphere)

[시대/상황 반영]
{ERA_SITUATION}

[출력 형식 - 줄바꿈으로 구분]
[주인공]
Korean elderly woman, 68 years old, short gray permed hair...

[조연1 - 아들]
Korean middle-aged man, 45 years old, short black hair...

[조연2 - 며느리]
Korean middle-aged woman, 42 years old...

★★★ 주인공 1명 + 주요 조연 2~3명 포함! ★★★
★★★ 각 인물의 역할을 대괄호 안에 표시! ★★★

[대본]
`,

    SCRIPT_PROMPTS: `
당신은 '시니어 오디오북 일러스트 디렉터'입니다.
대본의 각 장면에 맞는 이미지 프롬프트 15~25개를 영어로 작성하세요.

★★★★★ [최중요] 페르소나 일관성 ★★★★★
AI 이미지 생성기는 메모리가 없습니다!
모든 프롬프트의 앞부분에 아래 등장인물 페르소나를 그대로 복사해서 사용하세요:

[등장인물 페르소나]
{CHARACTER_PERSONA}

[시대/상황]
{ERA_SITUATION}

★★★ 규칙 ★★★
1. 모든 프롬프트는 등장인물 페르소나로 시작!
2. 그 뒤에 장면 묘사 추가
3. 스타일: Photorealistic, cinematic lighting, 8k
4. 15~25개 프롬프트 필수!
5. ★★★ 각 프롬프트 끝에 반드시 (한글 설명) 포함! ★★★

[출력 형식 - 반드시 이 형식으로!]
번호. 영어 프롬프트 (한글 설명)

예시:
1. Korean elderly woman, 68 years old, short gray permed hair, warm gentle face, beige cardigan, sitting in cozy living room, looking at old photo album with tearful eyes, soft warm lighting, photorealistic, 8k (옛 사진첩을 보며 눈물짓는 어머니)
2. Korean elderly woman, 68 years old, same appearance, cooking in kitchen, making son's favorite dish, nostalgic expression, warm lighting (아들이 좋아하던 음식을 만들며 그리워하는 모습)

★★★ 반드시 각 프롬프트 마지막에 (한글 설명) 추가! ★★★

[대본]
{SCRIPT}
`,

    BLOG: `
당신은 네이버 블로그 SEO 전문가입니다.
키워드로 정보형 블로그 글을 작성하세요.

★ 금지: 특수문자, HTML, 마크다운, 이모지
★ 줄바꿈: 소제목 앞 빈줄 2개, 문단 사이 빈줄 1개
★ 마무리: "오늘 정보가 도움 되셨다면 공감과 댓글 부탁드려요! 더유니크한이었습니다."
★ 태그: #더유니크한 #더유니크한푸드 #천연벌꿀 포함

[분량] {LENGTH}
[키워드] {KEYWORD}
`
};

// ============================================================
// API
// ============================================================

const API = {
    async callGemini(prompt, options = {}) {
        const apiKey = getGeminiAPIKey();
        if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.');

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options.temperature || 0.9,
                    topP: options.topP || 0.95,
                    maxOutputTokens: options.maxTokens || 8192
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API 호출 실패');
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    getImageUrl(prompt, ratio = '16:9') {
        const dims = {
            '16:9': { w: 1024, h: 576 },
            '9:16': { w: 576, h: 1024 },
            '1:1': { w: 1024, h: 1024 }
        };
        const { w, h } = dims[ratio] || dims['16:9'];
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true`;
    }
};

// ============================================================
// App State
// ============================================================

const state = {
    currentTab: 'newScript',
    mode: 'essay',
    tone: '따뜻한',
    era: '2000s Korea, Y2K aesthetic',
    situation: 'cozy Korean home interior',
    safeScript: '',
    characterPrompt: '',
    scriptPrompts: [],
    imageStyle: 'Photorealistic, 8k, cinematic lighting',
    imageRatio: '16:9'
};

// ============================================================
// UI Helpers
// ============================================================

function $(id) { return document.getElementById(id); }
function $$(selector) { return document.querySelectorAll(selector); }

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        padding: 12px 24px; background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white; border-radius: 8px; font-weight: 500; z-index: 9999;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function setLoading(btn, loading, text) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = text;
}

function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('복사되었습니다!');
}

function parsePrompts(text) {
    if (!text) return [];
    const lines = text.split('\n').filter(l => l.trim());
    const prompts = [];

    for (const line of lines) {
        const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
        const promptOnly = cleaned.replace(/\s*[(\(][^)]*[\)]\s*$/, '').trim();
        if (promptOnly && promptOnly.length > 10 && /[a-zA-Z]/.test(promptOnly)) {
            prompts.push(promptOnly);
        }
    }
    return prompts;
}

function displayPrompts(container, prompts) {
    container.innerHTML = prompts.map((p, i) => {
        // HTML 특수문자 이스케이프
        const safePrompt = p.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `
        <div class="prompt-row">
            <span class="prompt-num ${i === 0 ? 'first' : ''}">${i + 1}</span>
            <span class="prompt-text">${p}</span>
            <button class="copy-btn" data-prompt="${safePrompt}">📋</button>
        </div>
    `}).join('');

    // 이벤트 위임으로 복사 버튼 처리
    container.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const prompt = btn.dataset.prompt.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            try {
                await navigator.clipboard.writeText(prompt);
                showToast('복사 완료! ImageFX로 이동합니다.');
                setTimeout(() => {
                    window.open('https://aitestkitchen.withgoogle.com/tools/image-fx', '_blank');
                }, 500);
            } catch (err) {
                showToast('복사 실패', 'error');
            }
        });
    });
}

async function generateImages(prompts, galleryEl, progressEl, count = 'all', style = '', ratio = '16:9') {
    const targetCount = count === 'all' ? prompts.length : Math.min(parseInt(count), prompts.length);
    galleryEl.innerHTML = '';

    for (let i = 0; i < targetCount; i++) {
        progressEl.textContent = `생성 중... (${i + 1}/${targetCount})`;

        // 스타일 적용
        const finalPrompt = style ? `${prompts[i]}, ${style}` : prompts[i];
        const url = API.getImageUrl(finalPrompt, ratio);

        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <img src="${url}" alt="Generated ${i + 1}" loading="lazy">
            <div class="actions">
                <button class="copy-btn" onclick="window.open('${url}', '_blank')">🔎</button>
                <a class="copy-btn" href="${url}" download="image_${i + 1}.png">💾</a>
            </div>
        `;
        galleryEl.appendChild(card);
        await new Promise(r => setTimeout(r, 500));
    }

    progressEl.textContent = `✅ ${targetCount}개 이미지 생성 완료!`;
}

// ============================================================
// Tab 1: 새 대본 생성
// ============================================================

// 주제 추천 함수
async function analyzeTopics() {
    const reference = $('referenceScriptInput')?.value.trim();

    if (!reference || reference.length < 100) {
        showToast('참고 대본을 먼저 입력해주세요! (최소 100자)', 'error');
        return;
    }

    const btn = $('analyzeTopicsBtn');
    setLoading(btn, true, '분석 중...');

    try {
        const prompt = `
당신은 시니어 대상 유튜브 콘텐츠 기획 전문가입니다.
아래 참고 대본을 분석하고, 비슷한 구조와 감성으로 만들 수 있는 **새로운 주제** 5개를 추천해주세요.

[규칙]
1. 50대~70대 시니어가 공감할 주제
2. 원본과 완전히 다른 새로운 이야기
3. 감동적이거나 따뜻한 인생 이야기
4. 각 주제는 10~20자 이내
5. 다른 설명 없이 주제만 출력
6. 줄바꿈으로 구분

[참고 대본]
${reference.substring(0, 3000)}

[출력 형식]
1. 주제1
2. 주제2
3. 주제3
4. 주제4
5. 주제5
`;

        const result = await API.callGemini(prompt, { temperature: 0.9, maxTokens: 500 });

        // 주제 파싱
        const topics = result.split('\n')
            .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter(line => line.length > 2 && line.length < 50);

        if (topics.length === 0) {
            showToast('주제 추천에 실패했습니다. 다시 시도해주세요.', 'error');
            return;
        }

        // 추천 주제 표시
        const container = $('topicRecommendations');
        container.innerHTML = topics.map((topic, i) => `
            <button class="option-btn topic-btn" data-topic="${topic}" style="flex: 1; min-width: 45%; margin: 3px;">
                ${i === 0 ? '⭐' : '📌'} ${topic}
            </button>
        `).join('');

        // 클릭 이벤트 바인딩
        container.querySelectorAll('.topic-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                $('topicInput').value = btn.dataset.topic;
                showToast(`"${btn.dataset.topic}" 주제가 선택되었습니다!`);
            });
        });

        $('topicRecommendationBox').classList.remove('hidden');
        showToast(`${topics.length}개의 주제가 추천되었습니다!`);
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '🔍 참고 대본 분석 → 주제 추천받기');
    }
}

async function generateSafeScript() {
    const reference = $('referenceScriptInput')?.value.trim();
    const topic = $('topicInput')?.value.trim();
    const prevStory = $('prevStoryInput')?.value.trim();
    const durationSelect = $('durationSelect');
    const selectedOption = durationSelect?.options[durationSelect.selectedIndex];
    const duration = selectedOption?.value || '15min';

    // 영상 길이에 따른 글자 수 설정
    const charCounts = {
        '8min': '2,500자',
        '10min': '3,000자',
        '15min': '4,500자',
        '20min': '6,000자',
        '30min': '9,000자',
        '40min': '12,000자',
        '50min': '15,000자',
        '60min': '18,000자'
    };
    const targetChars = charCounts[duration] || '4,500자';

    if (!topic) {
        showToast('주제를 입력해주세요!', 'error');
        return;
    }

    const btn = $('generateScriptBtn');
    setLoading(btn, true, '대본 생성중...');

    try {
        const prompt = `
===== [6070 인생 라디오 '여울'] 대본 작성 =====

당신은 20년 경력의 시니어 라디오 사연 전문 작가입니다.
타겟 청취자: 50대~70대 시니어

★★★★★ [매우 중요] 분량: ${targetChars} 이상! ★★★★★
★★★ 하나의 완결된 사연을 처음부터 끝까지 작성! ★★★

[유튜브 안전 규칙]
- 자살/자해 → "극단적 선택"
- 죽다/죽음 → "세상을 떠나다"
- 폭행 → "다툼", 우울증 → "마음의 병"

[대본 구성]
1. 오프닝: 감성 후킹 + "6070 인생 라디오 '여울'입니다. 구독과 좋아요 부탁드립니다."
2. 본문: 하나의 인물, 하나의 사연을 깊이있게 전개 (${targetChars} 이상!)
3. 클로징: 따뜻한 마무리 + 구독 유도 + "다음에도 따뜻한 이야기로 찾아뵙겠습니다."

[사용자 입력]
- 주제: ${topic}
- 감성: ${state.tone}
${prevStory ? `- 지난 이야기:\n${prevStory.substring(0, 2000)}` : ''}
${reference ? `\n[참고 대본 (구조만 참고)]:\n${reference.substring(0, 5000)}` : ''}

★★★★★ 중요 ★★★★★
- 오직 하나의 사연만 작성!
- 여러 사연 나열 금지!
- 라디오 방송 형식(광고, 다음 사연 등) 금지!
- 순수 대본만 출력!
- 분량: ${targetChars} 이상!
`;

        const result = await API.callGemini(prompt, { maxTokens: 16384 });
        state.safeScript = result;

        $('safeScriptResult').textContent = result;
        $('step2Section').classList.remove('hidden');

        showToast('대본이 생성되었습니다!');
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '🚀 안전 대본 생성하기');
    }
}

async function analyzeCharacters() {
    if (!state.safeScript) {
        showToast('먼저 안전 대본을 생성해주세요!', 'error');
        return;
    }

    const btn = $('analyzeCharactersBtn');
    setLoading(btn, true, '분석 중...');

    try {
        const eraSituation = `${state.era}, ${state.situation}`;
        const prompt = PROMPTS.CHARACTER_ANALYZER.replace('{ERA_SITUATION}', eraSituation) + state.safeScript.substring(0, 5000);

        const result = await API.callGemini(prompt, { temperature: 0.7, maxTokens: 1000 });

        // 전체 결과 사용 (주인공 + 조연 모두 포함)
        // [주인공], [조연1] 등의 라벨이 있는 형식 그대로 사용
        state.characterPrompt = result.trim();

        $('characterPromptInput').value = state.characterPrompt;
        $('step3Section').classList.remove('hidden');

        // 등장인물 수 카운트
        const characterCount = (result.match(/\[주인공\]|\[조연/g) || []).length || 1;
        showToast(`등장인물 ${characterCount}명 프롬프트 생성 완료!`);
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '👤 등장인물 프롬프트 생성');
    }
}

async function previewCharacterImage() {
    const fullPersona = $('characterPromptInput')?.value.trim() || state.characterPrompt;
    if (!fullPersona) {
        showToast('등장인물 프롬프트가 없습니다!', 'error');
        return;
    }

    // 주인공 프롬프트만 추출 (첫 번째 Korean으로 시작하는 줄)
    const lines = fullPersona.split('\n');
    let mainCharacter = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().startsWith('korean') && trimmed.length > 30) {
            mainCharacter = trimmed;
            break;
        }
    }

    // 주인공을 찾지 못하면 전체 중 첫 번째 긴 줄 사용
    if (!mainCharacter) {
        mainCharacter = lines.find(l => l.trim().length > 30)?.trim() || fullPersona.substring(0, 500);
    }

    const btn = $('previewCharacterBtn');
    setLoading(btn, true, '생성 중...');

    try {
        const url = API.getImageUrl(mainCharacter + ', portrait, soft lighting, photorealistic, 8k');
        $('characterPreviewImg').src = url;
        $('characterImagePreview').classList.remove('hidden');
        showToast('주인공 이미지 미리보기!');
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '🖼️ 등장인물 이미지 미리보기');
    }
}

async function generateScriptPrompts() {
    const persona = $('characterPromptInput')?.value.trim() || state.characterPrompt;

    if (!state.safeScript || !persona) {
        showToast('대본과 등장인물 프롬프트가 필요합니다!', 'error');
        return;
    }

    const btn = $('generateScriptPromptsBtn');
    setLoading(btn, true, '생성 중...');

    try {
        const eraSituation = `${state.era}, ${state.situation}`;
        const prompt = PROMPTS.SCRIPT_PROMPTS
            .replace('{CHARACTER_PERSONA}', persona)
            .replace('{ERA_SITUATION}', eraSituation)
            .replace('{SCRIPT}', state.safeScript.substring(0, 6000));

        const result = await API.callGemini(prompt, { temperature: 0.8, maxTokens: 4096 });

        state.scriptPrompts = parsePrompts(result);

        displayPrompts($('scriptPromptList'), state.scriptPrompts);
        $('promptCount').textContent = state.scriptPrompts.length;
        $('step4Section').classList.remove('hidden');

        // 메인 이미지 섹션에도 복사
        updateMainImageSection();

        showToast(`${state.scriptPrompts.length}개 프롬프트 생성!`);
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '🎨 대본 이미지 프롬프트 생성');
    }
}

async function generateImages1() {
    if (state.scriptPrompts.length === 0) {
        showToast('프롬프트가 없습니다!', 'error');
        return;
    }

    const btn = $('generateImagesBtn');
    setLoading(btn, true, '생성 중...');

    try {
        await generateImages(state.scriptPrompts, $('imageGallery1'), $('progressText1'), 'all', state.imageStyle, state.imageRatio);
        $('downloadSection1').classList.remove('hidden');
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '🚀 이미지 생성');
    }
}

// ============================================================
// Tab 2: 내 대본 프롬프트
// ============================================================

async function myAnalyzeCharacters() {
    const script = $('myScriptInput')?.value.trim();
    if (!script) {
        showToast('대본을 입력해주세요!', 'error');
        return;
    }

    state.safeScript = script;

    // 시대/상황 가져오기
    const eraBtn = document.querySelector('#myEraGroup .option-btn.active');
    const sitBtn = document.querySelector('#mySituationGroup .option-btn.active');
    state.era = eraBtn?.dataset.value || '2000s Korea';
    state.situation = sitBtn?.dataset.value || 'cozy Korean home';

    const btn = $('myAnalyzeCharactersBtn');
    setLoading(btn, true, '분석 중...');

    try {
        const eraSituation = `${state.era}, ${state.situation}`;
        const prompt = PROMPTS.CHARACTER_ANALYZER.replace('{ERA_SITUATION}', eraSituation) + script.substring(0, 5000);

        const result = await API.callGemini(prompt, { temperature: 0.7, maxTokens: 1000 });

        // 전체 결과 사용 (주인공 + 조연 모두 포함)
        state.characterPrompt = result.trim();

        $('myCharacterPromptInput').value = state.characterPrompt;
        $('myStep2Section').classList.remove('hidden');

        const characterCount = (result.match(/\[주인공\]|\[조연/g) || []).length || 1;
        showToast(`등장인물 ${characterCount}명 프롬프트 생성 완료!`);
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '👤 등장인물 프롬프트 생성');
    }
}

async function myGeneratePrompts() {
    const persona = $('myCharacterPromptInput')?.value.trim() || state.characterPrompt;
    const script = $('myScriptInput')?.value.trim();

    if (!script || !persona) {
        showToast('대본과 등장인물 프롬프트가 필요합니다!', 'error');
        return;
    }

    const btn = $('myGeneratePromptsBtn');
    setLoading(btn, true, '생성 중...');

    try {
        const eraSituation = `${state.era}, ${state.situation}`;
        const prompt = PROMPTS.SCRIPT_PROMPTS
            .replace('{CHARACTER_PERSONA}', persona)
            .replace('{ERA_SITUATION}', eraSituation)
            .replace('{SCRIPT}', script.substring(0, 6000));

        const result = await API.callGemini(prompt, { temperature: 0.8, maxTokens: 4096 });

        state.scriptPrompts = parsePrompts(result);

        displayPrompts($('myPromptList'), state.scriptPrompts);
        $('myPromptCount').textContent = state.scriptPrompts.length;
        $('myStep3Section').classList.remove('hidden');

        // 메인 이미지 섹션에도 복사
        updateMainImageSection();

        showToast(`${state.scriptPrompts.length}개 프롬프트 생성!`);
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '🎨 대본 이미지 프롬프트 생성');
    }
}

async function myGenerateImages() {
    if (state.scriptPrompts.length === 0) {
        showToast('프롬프트가 없습니다!', 'error');
        return;
    }

    const btn = $('myGenerateImagesBtn');
    setLoading(btn, true, '생성 중...');

    try {
        await generateImages(state.scriptPrompts, $('imageGallery2'), $('progressText2'), 'all', state.imageStyle, state.imageRatio);
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '🚀 이미지 생성');
    }
}

// ============================================================
// Tab 3: 외부 프롬프트
// ============================================================

async function generateExternalImages() {
    const input = $('externalPromptsInput')?.value.trim();
    if (!input) {
        showToast('프롬프트를 입력해주세요!', 'error');
        return;
    }

    const prompts = parsePrompts(input);
    if (prompts.length === 0) {
        showToast('유효한 프롬프트가 없습니다!', 'error');
        return;
    }

    // 페르소나 주입
    const persona = $('externalPersonaInput')?.value.trim();
    const finalPrompts = persona
        ? prompts.map(p => p.toLowerCase().includes('korean') ? p : `${persona}, ${p}`)
        : prompts;

    const count = $('externalImageCountSelect')?.value || 'all';
    const btn = $('generateExternalImagesBtn');
    setLoading(btn, true, '생성 중...');

    try {
        await generateImages(finalPrompts, $('externalImageGallery'), $('externalProgressText'), count, state.imageStyle, state.imageRatio);
        $('externalDownloadSection').classList.remove('hidden');
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '🚀 이미지 생성');
    }
}

function applyPersona() {
    const persona = $('externalPersonaInput')?.value.trim();
    const input = $('externalPromptsInput')?.value.trim();

    if (!persona || !input) {
        showToast('페르소나와 프롬프트를 모두 입력해주세요!', 'error');
        return;
    }

    const prompts = parsePrompts(input);
    const updated = prompts.map((p, i) => {
        if (p.toLowerCase().includes('korean')) return `${i + 1}. ${p}`;
        return `${i + 1}. ${persona}, ${p}`;
    });

    $('externalPromptsInput').value = updated.join('\n');
    showToast('페르소나가 적용되었습니다!');
}

// ============================================================
// Tab 4: 블로그
// ============================================================

async function generateBlog() {
    const keyword = $('blogKeywordInput')?.value.trim();
    if (!keyword) {
        showToast('키워드를 입력해주세요!', 'error');
        return;
    }

    const lengths = { short: '1500자', medium: '2500자', long: '4000자' };
    const length = $('blogLengthSelect')?.value || 'medium';

    const btn = $('generateBlogBtn');
    setLoading(btn, true, '생성 중...');

    try {
        const prompt = PROMPTS.BLOG
            .replace('{LENGTH}', lengths[length])
            .replace('{KEYWORD}', keyword);

        const result = await API.callGemini(prompt);

        $('blogResult').textContent = result;
        $('blogResultBox').classList.remove('hidden');

        showToast('블로그 글이 생성되었습니다!');
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '✍️ 블로그 글 생성');
    }
}

async function generateBlogTitle() {
    const keyword = $('blogKeywordInput')?.value.trim();
    if (!keyword) {
        showToast('키워드를 입력해주세요!', 'error');
        return;
    }

    const btn = $('generateBlogTitleBtn');
    setLoading(btn, true, '생성 중...');

    try {
        const prompt = `블로그 SEO 전문가로서, "${keyword}" 키워드로 클릭율 높은 제목 3개 추천. 특수문자 없이 줄바꿈으로 구분.`;
        const result = await API.callGemini(prompt, { temperature: 0.8, maxTokens: 300 });

        const titles = result.split('\n').filter(t => t.trim());
        $('blogTitleResult').innerHTML = titles.map((t, i) => `
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                <span style="color: #ffc107; font-weight: bold;">${i + 1}.</span>
                <span style="flex: 1; color: #fff;">${t.replace(/^\d+[\.\)]\s*/, '')}</span>
                <button class="copy-btn" onclick="navigator.clipboard.writeText('${t.replace(/'/g, "\\'")}')">📋</button>
            </div>
        `).join('');
        $('blogTitleResult').classList.remove('hidden');

        showToast('제목이 추천되었습니다!');
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '💡 제목 추천받기');
    }
}

// ============================================================
// Main Image Section
// ============================================================

function updateMainImageSection() {
    const input = $('imageScriptInput');
    const countInfo = $('mainPromptCountInfo');
    const promptList = $('mainPromptList');

    if (input && state.scriptPrompts.length > 0) {
        input.value = state.scriptPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n');
        if (countInfo) countInfo.textContent = `(총 ${state.scriptPrompts.length}개 프롬프트)`;

        if (promptList) {
            displayPrompts(promptList, state.scriptPrompts);
            promptList.classList.remove('hidden');
        }
    }
}

async function mainGenerateImages() {
    const input = $('imageScriptInput')?.value.trim();
    if (!input) {
        showToast('프롬프트를 입력해주세요!', 'error');
        return;
    }

    const prompts = parsePrompts(input);
    if (prompts.length === 0) {
        showToast('유효한 프롬프트가 없습니다!', 'error');
        return;
    }

    const count = $('mainImageCountSelect')?.value || '10';
    const btn = $('mainStartImageBtn');
    setLoading(btn, true, '생성 중...');

    try {
        await generateImages(prompts, $('mainImageGallery'), $('mainProgressText'), count, state.imageStyle, state.imageRatio);
        $('mainDownloadSection').classList.remove('hidden');
    } catch (error) {
        showToast(`오류: ${error.message}`, 'error');
    } finally {
        setLoading(btn, false, '⚡ 이미지 생성');
    }
}

function resetAll() {
    state.safeScript = '';
    state.characterPrompt = '';
    state.scriptPrompts = [];

    // Clear inputs
    const inputs = ['referenceScriptInput', 'topicInput', 'prevStoryInput', 'myScriptInput', 'imageScriptInput'];
    inputs.forEach(id => { if ($(id)) $(id).value = ''; });

    // Hide sections
    const sections = ['step2Section', 'step3Section', 'step4Section', 'myStep2Section', 'myStep3Section',
        'mainPromptList', 'mainDownloadSection', 'characterImagePreview', 'topicRecommendationBox'];
    sections.forEach(id => { if ($(id)) $(id).classList.add('hidden'); });

    // Clear galleries
    const galleries = ['imageGallery1', 'imageGallery2', 'mainImageGallery'];
    galleries.forEach(id => { if ($(id)) $(id).innerHTML = ''; });

    // Clear progress
    const progress = ['progressText1', 'progressText2', 'mainProgressText'];
    progress.forEach(id => { if ($(id)) $(id).textContent = ''; });

    showToast('초기화 완료!');
}

// ============================================================
// Event Binding
// ============================================================

function bindEvents() {
    // Tab switching
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.tab-btn').forEach(b => b.classList.remove('active'));
            $$('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            $(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // Option buttons
    function bindOptionGroup(groupId, stateKey) {
        const group = $(groupId);
        if (!group) return;
        group.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (stateKey) state[stateKey] = btn.dataset.value;
            });
        });
    }

    bindOptionGroup('modeGroup', 'mode');
    bindOptionGroup('toneGroup', 'tone');
    bindOptionGroup('eraGroup', 'era');
    bindOptionGroup('situationGroup', 'situation');
    bindOptionGroup('myEraGroup', null);
    bindOptionGroup('mySituationGroup', null);
    bindOptionGroup('imageStyleGroup', 'imageStyle');

    // Image ratio group (uses data-ratio)
    const ratioGroup = $('imageRatioGroup');
    if (ratioGroup) {
        ratioGroup.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                ratioGroup.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.imageRatio = btn.dataset.ratio || '16:9';
            });
        });
    }

    // API Key
    $('saveKeyBtn')?.addEventListener('click', () => {
        const key = $('apiKeyInput')?.value.trim();
        if (key) {
            StorageManager.saveApiKey(key);
            $('apiKeyInput').value = '';
            checkApiKey();
            showToast('API 키가 저장되었습니다!');
        }
    });

    // Tab 1
    $('analyzeTopicsBtn')?.addEventListener('click', analyzeTopics);
    $('generateScriptBtn')?.addEventListener('click', generateSafeScript);
    $('copyScriptBtn')?.addEventListener('click', () => copyToClipboard($('safeScriptResult')?.textContent));
    $('analyzeCharactersBtn')?.addEventListener('click', analyzeCharacters);
    $('copyCharacterBtn')?.addEventListener('click', () => copyToClipboard($('characterPromptInput')?.value));
    $('previewCharacterBtn')?.addEventListener('click', previewCharacterImage);
    $('generateScriptPromptsBtn')?.addEventListener('click', generateScriptPrompts);
    $('copyAllPromptsBtn')?.addEventListener('click', () => copyToClipboard(state.scriptPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')));
    $('generateImagesBtn')?.addEventListener('click', generateImages1);
    $('openImageFxBtn1')?.addEventListener('click', () => window.open('https://aitestkitchen.withgoogle.com/tools/image-fx', '_blank'));
    $('downloadAllBtn1')?.addEventListener('click', () => downloadImages($('imageGallery1')));

    // Tab 2
    $('myAnalyzeCharactersBtn')?.addEventListener('click', myAnalyzeCharacters);
    $('myCopyCharacterBtn')?.addEventListener('click', () => copyToClipboard($('myCharacterPromptInput')?.value));
    $('myGeneratePromptsBtn')?.addEventListener('click', myGeneratePrompts);
    $('myCopyAllPromptsBtn')?.addEventListener('click', () => copyToClipboard(state.scriptPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')));
    $('myGenerateImagesBtn')?.addEventListener('click', myGenerateImages);
    $('openImageFxBtn2')?.addEventListener('click', () => window.open('https://aitestkitchen.withgoogle.com/tools/image-fx', '_blank'));

    // Tab 3
    $('applyPersonaBtn')?.addEventListener('click', applyPersona);
    $('clearPersonaBtn')?.addEventListener('click', () => { $('externalPersonaInput').value = ''; showToast('초기화!'); });
    $('generateExternalImagesBtn')?.addEventListener('click', generateExternalImages);
    $('downloadExternalImagesBtn')?.addEventListener('click', () => downloadImages($('externalImageGallery')));

    // Tab 4
    $('saveBlogIdBtn')?.addEventListener('click', () => {
        Storage.save('blogId', $('blogIdInput')?.value.trim());
        showToast('블로그 ID 저장!');
    });
    $('generateBlogBtn')?.addEventListener('click', generateBlog);
    $('generateBlogTitleBtn')?.addEventListener('click', generateBlogTitle);
    $('copyBlogBtn')?.addEventListener('click', () => copyToClipboard($('blogResult')?.textContent));

    // Main Image Section
    $('mainStartImageBtn')?.addEventListener('click', mainGenerateImages);
    $('mainOpenImageFxBtn')?.addEventListener('click', () => window.open('https://aitestkitchen.withgoogle.com/tools/image-fx', '_blank'));
    $('mainDownloadAllBtn')?.addEventListener('click', () => downloadImages($('mainImageGallery')));
    $('resetBtn')?.addEventListener('click', resetAll);
}

async function downloadImages(gallery) {
    const images = gallery?.querySelectorAll('img');
    if (!images || images.length === 0) return;

    for (let i = 0; i < images.length; i++) {
        const link = document.createElement('a');
        link.href = images[i].src;
        link.download = `image_${i + 1}.png`;
        link.click();
        await new Promise(r => setTimeout(r, 300));
    }
    showToast('다운로드 시작!');
}

function checkApiKey() {
    const key = getGeminiAPIKey();
    const el = $('keyStatusText');
    if (el) {
        if (key) {
            el.textContent = '✅ API 키 저장됨';
            el.style.color = '#81c784';
        } else {
            el.textContent = '⚠️ API 키를 입력해주세요';
            el.style.color = '#ffc107';
        }
    }
}

// ============================================================
// Init
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    checkApiKey();

    // Load saved blog ID
    const savedBlogId = Storage.load('blogId');
    if (savedBlogId && $('blogIdInput')) {
        $('blogIdInput').value = savedBlogId;
    }
});
