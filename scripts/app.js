/**
 * app.js
 * 메인 애플리케이션 로직
 * DOM 조작, 이벤트 핸들링, UI 상태 관리
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 참조
    const elements = {
        // API Key
        apiKeyInput: document.getElementById('api-key-input'),
        apiKeyStatus: document.getElementById('api-key-status'),
        saveApiKeyBtn: document.getElementById('save-api-key-btn'),
        clearApiKeyBtn: document.getElementById('clear-api-key-btn'),
        toggleKeyVisibility: document.getElementById('toggle-key-visibility'),
        modeIndicator: document.getElementById('mode-indicator'),

        // 입력
        originalScript: document.getElementById('original-script'),
        previousStory: document.getElementById('previous-story'),
        toneButtons: document.getElementById('tone-buttons'),
        durationSelect: document.getElementById('duration-select'),
        generateBtn: document.getElementById('generate-btn'),

        // 결과
        resultSection: document.getElementById('result-section'),
        resultTopic: document.getElementById('result-topic'),
        resultScript: document.getElementById('result-script'),
        ttsBtn: document.getElementById('tts-btn'),

        // 히스토리
        historyList: document.getElementById('history-list'),
        historyEmpty: document.getElementById('history-empty'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),

        // 상세 보기
        detailSection: document.getElementById('detail-section'),
        closeDetailBtn: document.getElementById('close-detail-btn'),
        detailDate: document.getElementById('detail-date'),
        detailTopic: document.getElementById('detail-topic'),
        detailScript: document.getElementById('detail-script'),
        detailOriginal: document.getElementById('detail-original')
    };

    // 현재 상태
    let currentState = {
        isLoading: false,
        selectedHistoryId: null,
        isKeyVisible: false,
        isTTSPlaying: false,
        selectedTone: 'warm'
    };

    /**
     * 초기화
     */
    function init() {
        loadApiKey();
        updateModeIndicator();
        renderHistoryList();
        setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // API Key 관련
        elements.saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
        elements.clearApiKeyBtn.addEventListener('click', handleClearApiKey);
        elements.toggleKeyVisibility.addEventListener('click', handleToggleKeyVisibility);

        // 생성 버튼 클릭
        elements.generateBtn.addEventListener('click', handleGenerate);

        // TTS 버튼 클릭
        if (elements.ttsBtn) {
            elements.ttsBtn.addEventListener('click', handleTTS);
        }

        // 순수 본문 복사 버튼 클릭
        const copyPureBtn = document.getElementById('copy-pure-btn');
        if (copyPureBtn) {
            copyPureBtn.addEventListener('click', handleCopyPure);
        }

        // 감성(Tone) 버튼 클릭
        if (elements.toneButtons) {
            elements.toneButtons.querySelectorAll('.tone-btn').forEach(btn => {
                btn.addEventListener('click', () => handleToneSelect(btn));
            });
        }

        // 전체 삭제 버튼
        elements.clearHistoryBtn.addEventListener('click', handleClearHistory);

        // 상세 보기 닫기
        elements.closeDetailBtn.addEventListener('click', handleCloseDetail);

        // 복사 버튼들
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', handleCopy);
        });

        // 초기화 버튼 클릭
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', handleReset);
        }

        // 키보드 단축키 (Ctrl + Enter로 생성)
        elements.originalScript.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                handleGenerate();
            }
        });
    }

    // =====================================================
    // 감성(Tone) 선택 관련 함수
    // =====================================================

    function handleToneSelect(selectedBtn) {
        // 모든 버튼에서 active 제거
        elements.toneButtons.querySelectorAll('.tone-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 선택된 버튼에 active 추가
        selectedBtn.classList.add('active');
        currentState.selectedTone = selectedBtn.dataset.tone;
    }

    function getSelectedTone() {
        return currentState.selectedTone;
    }

    // =====================================================
    // API Key 관련 함수
    // =====================================================

    function loadApiKey() {
        const apiKey = StorageManager.getApiKey();
        if (apiKey) {
            elements.apiKeyInput.value = apiKey;
            updateApiKeyStatus(true);
        } else {
            updateApiKeyStatus(false);
        }
    }

    function updateApiKeyStatus(hasKey) {
        if (hasKey) {
            elements.apiKeyStatus.textContent = '설정됨';
            elements.apiKeyStatus.classList.add('active');
        } else {
            elements.apiKeyStatus.textContent = '미설정';
            elements.apiKeyStatus.classList.remove('active');
        }
    }

    function updateModeIndicator() {
        const badge = elements.modeIndicator.querySelector('.mode-badge');
        if (StorageManager.hasApiKey()) {
            badge.textContent = 'Gemini API 모드';
            badge.classList.remove('simulation');
            badge.classList.add('api');
        } else {
            badge.textContent = '시뮬레이션 모드';
            badge.classList.remove('api');
            badge.classList.add('simulation');
        }
    }

    function handleSaveApiKey() {
        const apiKey = elements.apiKeyInput.value.trim();

        if (!apiKey) {
            showToast('API Key를 입력해주세요.', 'error');
            return;
        }

        if (!GeminiService.isValidKeyFormat(apiKey)) {
            showToast('올바른 API Key 형식이 아닙니다.', 'error');
            return;
        }

        StorageManager.saveApiKey(apiKey);
        updateApiKeyStatus(true);
        updateModeIndicator();
        showToast('API Key가 저장되었습니다! 🔑', 'success');
    }

    function handleClearApiKey() {
        if (!StorageManager.hasApiKey()) {
            showToast('삭제할 API Key가 없습니다.', 'error');
            return;
        }

        if (!confirm('API Key를 삭제하시겠습니까?')) {
            return;
        }

        StorageManager.clearApiKey();
        elements.apiKeyInput.value = '';
        updateApiKeyStatus(false);
        updateModeIndicator();
        showToast('API Key가 삭제되었습니다.', 'success');
    }

    function handleToggleKeyVisibility() {
        currentState.isKeyVisible = !currentState.isKeyVisible;
        elements.apiKeyInput.type = currentState.isKeyVisible ? 'text' : 'password';
        elements.toggleKeyVisibility.textContent = currentState.isKeyVisible ? '🙈' : '👁️';
    }

    // =====================================================
    // 대본 생성 관련 함수
    // =====================================================

    async function handleGenerate() {
        const topic = elements.originalScript.value.trim();
        const previousStory = elements.previousStory ? elements.previousStory.value.trim() : '';
        const tone = getSelectedTone();
        const durationMinutes = parseInt(elements.durationSelect.value, 10);

        if (!topic) {
            showToast('주제 또는 키워드를 입력해주세요.', 'error');
            elements.originalScript.focus();
            return;
        }

        if (topic.length < 2) {
            showToast('주제가 너무 짧습니다. 더 구체적으로 입력해주세요.', 'error');
            return;
        }

        setLoadingState(true);
        hideDetailSection();
        stopTTS();

        const hasApiKey = StorageManager.hasApiKey();

        if (hasApiKey && durationMinutes >= 30) {
            showToast(`${durationMinutes}분 대본 생성 중... 시간이 다소 걸릴 수 있습니다.`, 'info');
        }

        try {
            let result;

            if (hasApiKey) {
                const apiKey = StorageManager.getApiKey();
                result = await GeminiService.generate(topic, apiKey, durationMinutes, tone, previousStory);
                showToast('대본이 생성되었습니다! ✨', 'success');
            } else {
                showToast('API 키가 없어 시뮬레이션 모드로 실행됩니다.', 'warning');
                result = await ScriptSimulator.generate(topic);
            }

            displayResult(result);

            StorageManager.save({
                topic: result.topic,
                script: result.script,
                originalScript: topic
            });

            renderHistoryList();

        } catch (error) {
            console.error('대본 생성 오류:', error);

            if (error.message.includes('시간') || error.message.includes('timeout')) {
                showToast('요청 시간이 초과되었습니다. 다시 시도해주세요.', 'error');
            } else if (error.message.includes('API') || error.message.includes('key')) {
                showToast(`API 오류: ${error.message}`, 'error');
            } else {
                showToast('대본 생성 중 오류가 발생했습니다.', 'error');
            }
        } finally {
            setLoadingState(false);
        }
    }

    function displayResult(result) {
        elements.resultTopic.textContent = result.topic;
        elements.resultScript.textContent = result.script;
        elements.resultSection.classList.add('visible');
    }

    function setLoadingState(isLoading) {
        currentState.isLoading = isLoading;
        elements.generateBtn.disabled = isLoading;
        elements.generateBtn.classList.toggle('loading', isLoading);
    }

    // =====================================================
    // TTS (Text-to-Speech) 관련 함수
    // =====================================================

    function handleTTS() {
        if (currentState.isTTSPlaying) {
            stopTTS();
        } else {
            startTTS();
        }
    }

    function startTTS() {
        const text = elements.resultScript.textContent;

        if (!text || text.trim() === '') {
            showToast('읽을 대본이 없습니다.', 'error');
            return;
        }

        if (!('speechSynthesis' in window)) {
            showToast('이 브라우저는 TTS를 지원하지 않습니다.', 'error');
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        const voices = window.speechSynthesis.getVoices();
        const koreanVoice = voices.find(voice => voice.lang.includes('ko'));
        if (koreanVoice) {
            utterance.voice = koreanVoice;
        }

        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            currentState.isTTSPlaying = true;
            elements.ttsBtn.classList.add('playing');
            showToast('🔊 미리 듣기를 시작합니다...', 'info');
        };

        utterance.onend = () => {
            currentState.isTTSPlaying = false;
            elements.ttsBtn.classList.remove('playing');
        };

        utterance.onerror = (e) => {
            console.error('TTS 오류:', e);
            currentState.isTTSPlaying = false;
            elements.ttsBtn.classList.remove('playing');
            showToast('TTS 재생 중 오류가 발생했습니다.', 'error');
        };

        window.speechSynthesis.speak(utterance);
    }

    function stopTTS() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        currentState.isTTSPlaying = false;
        if (elements.ttsBtn) {
            elements.ttsBtn.classList.remove('playing');
        }
    }

    // =====================================================
    // 히스토리 관련 함수
    // =====================================================

    function renderHistoryList() {
        const history = StorageManager.getAll();

        if (history.length === 0) {
            elements.historyList.innerHTML = '';
            elements.historyEmpty.style.display = 'flex';
            return;
        }

        elements.historyEmpty.style.display = 'none';

        elements.historyList.innerHTML = history.map(item => `
            <li class="history-item ${item.id === currentState.selectedHistoryId ? 'active' : ''}" 
                data-id="${item.id}">
                <div class="history-item-date">${StorageManager.formatDate(item.date)}</div>
                <div class="history-item-topic">${escapeHtml(item.topic)}</div>
                <div class="history-item-actions">
                    <button class="btn-delete" data-id="${item.id}" title="삭제">삭제</button>
                </div>
            </li>
        `).join('');

        elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-delete')) {
                    return;
                }
                handleHistoryItemClick(item.dataset.id);
            });
        });

        elements.historyList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteItem(btn.dataset.id);
            });
        });
    }

    function handleHistoryItemClick(id) {
        const item = StorageManager.getById(id);

        if (!item) {
            showToast('항목을 찾을 수 없습니다.', 'error');
            return;
        }

        currentState.selectedHistoryId = id;
        elements.resultSection.classList.remove('visible');
        showDetailSection(item);
        renderHistoryList();
    }

    function showDetailSection(item) {
        elements.detailDate.textContent = `생성일: ${StorageManager.formatDate(item.date)}`;
        elements.detailTopic.textContent = item.topic;
        elements.detailScript.textContent = item.script;
        elements.detailOriginal.textContent = item.originalScript;
        elements.detailSection.classList.add('visible');
    }

    function hideDetailSection() {
        elements.detailSection.classList.remove('visible');
        currentState.selectedHistoryId = null;
        renderHistoryList();
    }

    function handleCloseDetail() {
        hideDetailSection();
    }

    function handleDeleteItem(id) {
        if (!confirm('이 대본을 삭제하시겠습니까?')) {
            return;
        }

        const success = StorageManager.delete(id);

        if (success) {
            if (currentState.selectedHistoryId === id) {
                hideDetailSection();
            }
            renderHistoryList();
            showToast('대본이 삭제되었습니다.', 'success');
        } else {
            showToast('삭제 중 오류가 발생했습니다.', 'error');
        }
    }

    function handleClearHistory() {
        const history = StorageManager.getAll();

        if (history.length === 0) {
            showToast('삭제할 항목이 없습니다.', 'error');
            return;
        }

        if (!confirm(`저장된 대본 ${history.length}개를 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        StorageManager.clearAll();
        hideDetailSection();
        elements.resultSection.classList.remove('visible');
        renderHistoryList();
        showToast('모든 대본이 삭제되었습니다.', 'success');
    }

    // =====================================================
    // 유틸리티 함수
    // =====================================================

    async function handleCopy(e) {
        const targetId = e.currentTarget.dataset.target;
        const targetElement = document.getElementById(targetId);

        if (!targetElement) return;

        try {
            await navigator.clipboard.writeText(targetElement.textContent);
            showToast('클립보드에 복사되었습니다! 📋', 'success');
        } catch (error) {
            console.error('복사 오류:', error);
            showToast('복사에 실패했습니다.', 'error');
        }
    }

    /**
     * 순수 본문만 복사 (유튜브 패키지 제외)
     */
    async function handleCopyPure() {
        const fullText = elements.resultScript.textContent;

        if (!fullText || fullText.trim() === '') {
            showToast('복사할 대본이 없습니다.', 'error');
            return;
        }

        // "---" 구분선 이전의 본문만 추출
        let pureText = fullText;
        const separatorIndex = fullText.indexOf('---');

        if (separatorIndex !== -1) {
            pureText = fullText.substring(0, separatorIndex).trim();
        }

        try {
            await navigator.clipboard.writeText(pureText);
            showToast('순수 본문만 복사되었습니다! 📜 (TTS용)', 'success');
        } catch (error) {
            console.error('복사 오류:', error);
            showToast('복사에 실패했습니다.', 'error');
        }
    }

    /**
     * 초기화 핸들러 - 모든 입력과 결과를 비움
     */
    function handleReset() {
        if (!confirm('정말 모든 내용을 지우고 새로 시작하시겠습니까?')) {
            return;
        }

        // 주제 입력창 비우기
        elements.originalScript.value = '';

        // 지난 이야기 입력창 비우기
        if (elements.previousStory) {
            elements.previousStory.value = '';
        }

        // 결과 출력창 비우기
        elements.resultTopic.textContent = '';
        elements.resultScript.textContent = '';
        elements.resultSection.classList.remove('visible');

        // 상세 보기 닫기
        hideDetailSection();

        // TTS 중지
        stopTTS();

        // 감성 버튼 초기화 (따뜻한으로)
        if (elements.toneButtons) {
            elements.toneButtons.querySelectorAll('.tone-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const warmBtn = elements.toneButtons.querySelector('[data-tone="warm"]');
            if (warmBtn) warmBtn.classList.add('active');
            currentState.selectedTone = 'warm';
        }

        // 커서를 주제 입력창으로 이동
        elements.originalScript.focus();

        showToast('초기화되었습니다. 새로운 대본을 작성해보세요! 🔄', 'success');
    }

    function showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 앱 초기화
    init();
});
