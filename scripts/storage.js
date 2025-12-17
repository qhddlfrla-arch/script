/**
 * storage.js
 * LocalStorage를 사용한 대본 히스토리 및 API Key 관리
 */

const StorageManager = {
    STORAGE_KEY: 'youtube_script_history',
    API_KEY_STORAGE_KEY: 'openai_api_key',

    /**
     * 모든 히스토리 데이터 가져오기
     * @returns {Array} 히스토리 배열
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('히스토리 로드 오류:', error);
            return [];
        }
    },

    /**
     * 새 항목 저장
     * @param {Object} item - { topic, script, originalScript }
     * @returns {Object} 저장된 항목 (id, date 포함)
     */
    save(item) {
        try {
            const history = this.getAll();
            const newItem = {
                id: this.generateId(),
                date: new Date().toISOString(),
                topic: item.topic,
                script: item.script,
                originalScript: item.originalScript
            };

            // 새 항목을 맨 앞에 추가
            history.unshift(newItem);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));

            return newItem;
        } catch (error) {
            console.error('히스토리 저장 오류:', error);
            throw error;
        }
    },

    /**
     * 특정 항목 가져오기
     * @param {string} id - 항목 ID
     * @returns {Object|null} 히스토리 항목
     */
    getById(id) {
        const history = this.getAll();
        return history.find(item => item.id === id) || null;
    },

    /**
     * 특정 항목 삭제
     * @param {string} id - 삭제할 항목 ID
     * @returns {boolean} 삭제 성공 여부
     */
    delete(id) {
        try {
            const history = this.getAll();
            const filtered = history.filter(item => item.id !== id);

            if (filtered.length === history.length) {
                return false; // 항목을 찾지 못함
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('히스토리 삭제 오류:', error);
            return false;
        }
    },

    /**
     * 모든 히스토리 삭제
     */
    clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('히스토리 초기화 오류:', error);
            return false;
        }
    },

    /**
     * 고유 ID 생성
     * @returns {string} UUID 형식 ID
     */
    generateId() {
        return 'script_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 날짜 포맷팅
     * @param {string} isoString - ISO 날짜 문자열
     * @returns {string} 포맷된 날짜 문자열
     */
    formatDate(isoString) {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}.${month}.${day} ${hours}:${minutes}`;
    },

    // =====================================================
    // API Key 관리
    // =====================================================

    /**
     * API Key 저장
     * @param {string} apiKey - OpenAI API Key
     */
    saveApiKey(apiKey) {
        try {
            localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
            return true;
        } catch (error) {
            console.error('API Key 저장 오류:', error);
            return false;
        }
    },

    /**
     * API Key 가져오기
     * @returns {string|null} 저장된 API Key
     */
    getApiKey() {
        try {
            return localStorage.getItem(this.API_KEY_STORAGE_KEY);
        } catch (error) {
            console.error('API Key 로드 오류:', error);
            return null;
        }
    },

    /**
     * API Key 삭제
     */
    clearApiKey() {
        try {
            localStorage.removeItem(this.API_KEY_STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('API Key 삭제 오류:', error);
            return false;
        }
    },

    /**
     * API Key 존재 여부 확인
     * @returns {boolean}
     */
    hasApiKey() {
        const key = this.getApiKey();
        return key && key.length > 0;
    }
};
