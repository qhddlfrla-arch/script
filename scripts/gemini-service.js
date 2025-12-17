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
     * 영상 길이별 지침 가져오기
     */
    getDurationGuidelines(durationMinutes) {
        const durationMap = {
            10: {
                label: '10분',
                charCount: '약 2,000자',
                guidelines: '간결하면서도 핵심을 담은 대본을 작성하세요. 각 주제는 1-2개 문단으로 구성합니다.'
            },
            20: {
                label: '20분',
                charCount: '약 4,000자',
                guidelines: '적당한 깊이로 주제를 다루되, 각 주제마다 예시를 1-2개씩 포함하세요.'
            },
            30: {
                label: '30분',
                charCount: '약 6,000자',
                guidelines: '심층 분석 수준입니다. 각 챕터마다 구체적인 사례(Case Study)를 3가지 이상 들고, 내용을 깊이 있게 파고드세요. 통계나 연구 결과도 인용하세요.'
            },
            60: {
                label: '1시간',
                charCount: '약 12,000자',
                guidelines: '강의/다큐멘터리급 깊이입니다. 모든 주제에 대해 상세한 배경 설명, 다양한 관점 분석, 실제 사례 5개 이상, 전문가 의견, 그리고 실습 가이드까지 포함하세요. 각 섹션을 여러 하위 주제로 세분화하세요.'
            },
            90: {
                label: '1시간 30분',
                charCount: '약 18,000자',
                guidelines: '풀 버전입니다. 마스터클래스 수준의 완전한 강의 대본을 작성하세요. 역사적 배경, 이론적 기초, 실제 적용 사례 10개 이상, 흔한 실수와 해결책, Q&A 예상 질문, 그리고 심화 학습 자료까지 모두 포함하세요. 최대한 상세하게 작성하되 지루하지 않게 스토리텔링을 활용하세요.'
            }
        };

        return durationMap[durationMinutes] || durationMap[10];
    },

    /**
     * 프롬프트 생성 (영상 길이 반영)
     */
    getPrompt(originalScript, durationMinutes) {
        const duration = this.getDurationGuidelines(durationMinutes);

        return `당신은 유튜브 대본 전문가입니다. 사용자가 입력한 대본을 분석해서 새로운 주제를 추천하고, 유튜브 대본 포맷으로 재작성합니다.

## 🎯 목표 영상 길이
사용자가 선택한 목표 영상 길이는 **${duration.label}** (${duration.charCount})입니다.
이 길이를 채울 수 있도록 대본을 매우 풍성하게 작성하세요.

## 📏 길이별 지침
${duration.guidelines}

단순 요약이 아니라, 실제 말하는 속도(분당 200자 기준)로 읽었을 때 ${duration.label}이 나올 정도의 방대한 텍스트 양을 생성해야 합니다.

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

5. 주제 1: (첫 번째 주제의 상세 내용, 충분한 분량으로)

6. 브릿지 문장: (다음 주제로의 전환)

7. 주제 2: (두 번째 주제의 상세 내용, 충분한 분량으로)

8. 브릿지 문장: (클로징으로의 전환)

9. 클로징:
   - 암시 (요약 & 활용 강조): (핵심 내용 정리 및 적용 방법)
   - 독려 (공감 유도): (시청자 격려 메시지)
   - 구독과 좋아요를 유도하였는가? ✅ (구독/좋아요/댓글 유도 멘트)

## 참고사항
- ${duration.label} 분량을 맞추기 위해 주제 3, 주제 4, 주제 5 등을 추가할 수 있습니다.
- 각 주제 사이에는 브릿지 문장을 넣어 자연스럽게 연결합니다.
- 실제 유튜브 영상에서 바로 읽을 수 있도록 자연스러운 구어체로 작성합니다.
- 30분 이상의 대본은 반드시 구체적인 사례와 예시를 풍부하게 포함하세요.

---

다음은 기존 유튜브 대본입니다. 이 대본을 분석하여 새로운 주제를 추천하고, 위의 형식에 맞춰 **${duration.label} 분량**의 새로운 대본을 작성해주세요.

[기존 대본]
${originalScript}

---

위 대본의 핵심 주제와 스타일을 파악하여, 비슷하지만 새롭고 흥미로운 주제로 **${duration.charCount} 분량**의 대본을 재작성해주세요.`;
    },

    /**
     * Google Gemini API 호출
     */
    async generate(originalScript, apiKey, durationMinutes = 10) {
        try {
            const controller = new AbortController();
            // 긴 대본은 시간이 오래 걸릴 수 있으므로 타임아웃 늘림
            const timeoutMs = durationMinutes >= 30 ? 180000 : 60000; // 30분 이상: 3분, 그 외: 1분
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(this.getEndpoint(apiKey), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: this.getPrompt(originalScript, durationMinutes)
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: durationMinutes >= 60 ? 16000 : 8000,
                        temperature: 0.8
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

            // Gemini API 응답 경로: data.candidates[0].content.parts[0].text
            const generatedText = data.candidates[0].content.parts[0].text;

            // 응답에서 주제 추출
            const topic = this.extractTopic(generatedText, originalScript);

            return {
                topic,
                script: generatedText
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
            }
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
        return apiKey && apiKey.length > 20;
    }
};
