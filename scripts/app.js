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
        durationSelect: document.getElementById('duration-select'),
        generateBtn: document.getElementById('generate-btn'),

        // 결과
        resultSection: document.getElementById('result-section'),
        resultTopic: document.getElementById('result-topic'),
        resultScript: document.getElementById('result-script'),

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
        isKeyVisible: false
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

        // 전체 삭제 버튼
        elements.clearHistoryBtn.addEventListener('click', handleClearHistory);

        // 상세 보기 닫기
        elements.closeDetailBtn.addEventListener('click', handleCloseDetail);

        // 복사 버튼들
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', handleCopy);
        });

        // 키보드 단축키 (Ctrl + Enter로 생성)
        elements.originalScript.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                handleGenerate();
            }
        });
    }

    // =====================================================
    // API Key 관련 함수
    // =====================================================

    /**
     * 저장된 API Key 로드
     */
    function loadApiKey() {
        const apiKey = StorageManager.getApiKey();
        if (apiKey) {
            elements.apiKeyInput.value = apiKey;
            updateApiKeyStatus(true);
        } else {
            updateApiKeyStatus(false);
        }
    }

    /**
     * API Key 상태 업데이트
     */
    function updateApiKeyStatus(hasKey) {
        if (hasKey) {
            elements.apiKeyStatus.textContent = '설정됨';
            elements.apiKeyStatus.classList.add('active');
        } else {
            elements.apiKeyStatus.textContent = '미설정';
            elements.apiKeyStatus.classList.remove('active');
        }
    }

    /**
     * 모드 인디케이터 업데이트
     */
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

    /**
     * API Key 저장 핸들러
     */
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

    /**
     * API Key 삭제 핸들러
     */
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

    /**
     * API Key 표시/숨김 토글
     */
    function handleToggleKeyVisibility() {
        currentState.isKeyVisible = !currentState.isKeyVisible;
        elements.apiKeyInput.type = currentState.isKeyVisible ? 'text' : 'password';
        elements.toggleKeyVisibility.textContent = currentState.isKeyVisible ? '🙈' : '👁️';
    }

    // =====================================================
    // 대본 생성 관련 함수
    // =====================================================

    /**
     * 대본 생성 핸들러
     */
    async function handleGenerate() {
        const originalScript = elements.originalScript.value.trim();
        const durationMinutes = parseInt(elements.durationSelect.value, 10);

        // 입력 검증
        if (!originalScript) {
            showToast('대본을 입력해주세요.', 'error');
            elements.originalScript.focus();
            return;
        }

        if (originalScript.length < 10) {
            showToast('대본이 너무 짧습니다. 더 많은 내용을 입력해주세요.', 'error');
            return;
        }

        // 로딩 상태 시작
        setLoadingState(true);
        hideDetailSection();

        const hasApiKey = StorageManager.hasApiKey();

        // 긴 영상 선택 시 안내 메시지
        if (hasApiKey && durationMinutes >= 30) {
            showToast(`${durationMinutes}분 대본 생성 중... 시간이 다소 걸릴 수 있습니다.`, 'info');
        }

        try {
            let result;

            if (hasApiKey) {
                // Gemini API 모드 - 영상 길이 전달
                const apiKey = StorageManager.getApiKey();
                result = await GeminiService.generate(originalScript, apiKey, durationMinutes);
                showToast('Gemini가 새 대본을 생성했습니다! ✨', 'success');
            } else {
                // 시뮬레이션 모드
                showToast('API 키가 없어 시뮬레이션 모드로 실행됩니다.', 'warning');
                result = await ScriptSimulator.generate(originalScript);
            }

            // 결과 표시
            displayResult(result);

            // LocalStorage에 저장
            StorageManager.save({
                topic: result.topic,
                script: result.script,
                originalScript: originalScript
            });

            // 히스토리 리스트 갱신
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

    /**
     * 결과 표시
     */
    function displayResult(result) {
        elements.resultTopic.textContent = result.topic;
        elements.resultScript.textContent = result.script;
        elements.resultSection.classList.add('visible');
    }

    /**
     * 로딩 상태 설정
     */
    function setLoadingState(isLoading) {
        currentState.isLoading = isLoading;
        elements.generateBtn.disabled = isLoading;
        elements.generateBtn.classList.toggle('loading', isLoading);
    }

    /**
     * 히스토리 리스트 렌더링
     */
    function renderHistoryList() {
        const history = StorageManager.getAll();

        // 빈 상태 표시
        if (history.length === 0) {
            elements.historyList.innerHTML = '';
            elements.historyEmpty.style.display = 'flex';
            return;
        }

        elements.historyEmpty.style.display = 'none';

        // 히스토리 항목 렌더링
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

        // 히스토리 항목 클릭 이벤트
        elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 삭제 버튼 클릭 제외
                if (e.target.classList.contains('btn-delete')) {
                    return;
                }
                handleHistoryItemClick(item.dataset.id);
            });
        });

        // 삭제 버튼 클릭 이벤트
        elements.historyList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteItem(btn.dataset.id);
            });
        });
    }

    /**
     * 히스토리 항목 클릭 핸들러
     */
    function handleHistoryItemClick(id) {
        const item = StorageManager.getById(id);

        if (!item) {
            showToast('항목을 찾을 수 없습니다.', 'error');
            return;
        }

        currentState.selectedHistoryId = id;

        // 결과 섹션 숨기고 상세 보기 표시
        elements.resultSection.classList.remove('visible');
        showDetailSection(item);

        // 활성 상태 업데이트
        renderHistoryList();
    }

    /**
     * 상세 보기 표시
     */
    function showDetailSection(item) {
        elements.detailDate.textContent = `생성일: ${StorageManager.formatDate(item.date)}`;
        elements.detailTopic.textContent = item.topic;
        elements.detailScript.textContent = item.script;
        elements.detailOriginal.textContent = item.originalScript;
        elements.detailSection.classList.add('visible');
    }

    /**
     * 상세 보기 숨기기
     */
    function hideDetailSection() {
        elements.detailSection.classList.remove('visible');
        currentState.selectedHistoryId = null;
        renderHistoryList();
    }

    /**
     * 상세 보기 닫기 핸들러
     */
    function handleCloseDetail() {
        hideDetailSection();
    }

    /**
     * 항목 삭제 핸들러
     */
    function handleDeleteItem(id) {
        if (!confirm('이 대본을 삭제하시겠습니까?')) {
            return;
        }

        const success = StorageManager.delete(id);

        if (success) {
            // 현재 보고 있던 항목이면 상세 보기 닫기
            if (currentState.selectedHistoryId === id) {
                hideDetailSection();
            }

            renderHistoryList();
            showToast('대본이 삭제되었습니다.', 'success');
        } else {
            showToast('삭제 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 전체 삭제 핸들러
     */
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

    /**
     * 복사 핸들러
     */
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
     * 토스트 알림 표시
     */
    function showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 표시 애니메이션
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        // 자동 숨김
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * HTML 이스케이프
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 앱 초기화
    init();
});
