/**
 * gemini-service.js
 * Google Gemini API를 통한 실제 대본 생성 모듈
 */

const GeminiService = {
    MODEL: 'gemini-2.0-flash-lite',

    /**
     * API 엔드포인트 생성
     */
    getEndpoint(apiKey) {
        return `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL}:generateContent?key=${apiKey}`;
    },

    /**
     * 프롬프트 생성
     */
    getPrompt(originalScript) {
        return `당신은 유튜브 대본 전문가입니다. 사용자가 입력한 대본을 분석해서 새로운 주제를 추천하고, 유튜브 대본 포맷으로 재작성합니다.

## 출력 규칙
1. 반드시 아래 형식을 따라 출력하세요.
2. 본문(주제)의 개수는 내용의 길이나 깊이에 따라 유동적으로 1개~5개 사이로 조절합니다.
3. 말투는 친절하고 전문적인 유튜버처럼 작성합니다.
4. 각 섹션은 구체적이고 실용적인 내용으로 채웁니다.

## 출력 형식

1. 이야기꾼: (진행자의 톤/스타일 설명)

2. 오프닝 5초:
   - 강력한 후킹 문장: (시청자의 이목을 끄는 한 줄)

3. 오프닝 30초:
   - 문제 제기 → 기대감 유도: (시청자가 공감할 문제 상황 제시)
   - 시청자 타깃 직접 지목: (이 영상이 누구를 위한 것인지)
   - 콘텐츠 예고: (오늘 다룰 내용 간략 소개)
   - 브릿지 문장: (본문으로 자연스럽게 연결)

4. 하위 주제 1: (첫 번째 소주제 제목)

5. 주제 1: (첫 번째 주제의 상세 내용, 2-3 문단)

6. 브릿지 문장: (다음 주제로의 전환)

7. 주제 2: (두 번째 주제의 상세 내용, 2-3 문단)

8. 브릿지 문장: (클로징으로의 전환)

9. 클로징:
   - 암시 (요약 & 활용 강조): (핵심 내용 정리 및 적용 방법)
   - 독려 (공감 유도): (시청자 격려 메시지)
   - 구독과 좋아요를 유도하였는가? ✅ (구독/좋아요/댓글 유도 멘트)

## 참고사항
- 내용이 길거나 복잡한 경우, 주제 3, 주제 4, 주제 5까지 추가할 수 있습니다.
- 각 주제 사이에는 브릿지 문장을 넣어 자연스럽게 연결합니다.
- 실제 유튜브 영상에서 바로 읽을 수 있도록 자연스러운 구어체로 작성합니다.

---

다음은 기존 유튜브 대본입니다. 이 대본을 분석하여 새로운 주제를 추천하고, 위의 형식에 맞춰 새로운 대본을 작성해주세요.

[기존 대본]
${originalScript}

---

위 대본의 핵심 주제와 스타일을 파악하여, 비슷하지만 새롭고 흥미로운 주제로 대본을 재작성해주세요.`;
    },

    /**
     * Google Gemini API 호출
     */
    async generate(originalScript, apiKey) {
        try {
            const response = await fetch(this.getEndpoint(apiKey), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: this.getPrompt(originalScript)
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API 오류: ${response.status}`);
            }

            const data = await response.json();

            // Gemini API 응답 경로: data.candidates[0].content.parts[0].text
            const generatedText = data.candidates[0].content.parts[0].text;

            // 응답에서 주제 추출
            const topic = this.extractTopic(generatedText, originalScript);

            return {
                topic,
                script: generatedText
            };

        } catch (error) {
            console.error('Gemini API 오류:', error);
            throw error;
        }
    },

    /**
     * 생성된 텍스트에서 주제 추출
     */
    extractTopic(generatedText, originalScript) {
        // 간단한 키워드 추출
        const words = originalScript.split(/\s+/).filter(word => word.length > 2);
        const commonWords = ['안녕하세요', '여러분', '오늘', '영상', '구독', '좋아요', '감사', '이번'];
        const filtered = words.filter(word => !commonWords.includes(word));

        let keyword = '콘텐츠';
        if (filtered.length > 0) {
            keyword = filtered[Math.floor(Math.random() * Math.min(3, filtered.length))];
        }

        // 주제 템플릿
        const templates = [
            `${keyword} 완벽 가이드`,
            `${keyword}의 모든 것`,
            `${keyword} 마스터하기`,
            `${keyword} 실전 활용법`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    },

    /**
     * API 키 유효성 간단 검사
     */
    isValidKeyFormat(apiKey) {
        // Gemini API key는 보통 'AIza'로 시작하고 39자
        return apiKey && apiKey.length > 20;
    }
};
