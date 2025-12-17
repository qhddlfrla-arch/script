/**
 * gemini-service.js
 * Google Gemini API를 통한 시니어 오디오북 대본 생성
 * 자생법(자연스러운 생성 법칙) + TTS 최적화
 */

const GeminiService = {
    MODEL: 'gemini-2.0-flash-lite',

    /**
     * 시스템 프롬프트 (자생법 + TTS 최적화)
     */
    SYSTEM_PROMPT: `
당신은 '20년 경력의 시니어 오디오북/에세이 작가'입니다.
사용자가 입력한 키워드를 바탕으로 5070 세대가 공감할 수 있는 깊이 있고 편안한 대본을 작성하세요.

[필수 작성 법칙: 자생법(자연스러운 생성 법칙)]

1. 타겟: 산전수전 다 겪은 중장년층. 가르치려 하지 말고, '공감'하고 '위로'하는 태도 유지.

2. 구조:
   - 오프닝 5초: 인사말 없이 바로 시작. 통념을 깨는 질문이나 강렬한 상황 묘사로 후킹.
     (예: "자식에게 재산 미리 주지 마라는 말, 정말 맞을까요?")
   - 오프닝 30초: 문제 제기 → 공감 형성 → 해결책 암시.
   - 본문: 선택한 시간 분량에 맞춰 2~3개의 에피소드/정보 전개.
   - 브릿지: 문단 사이사이에 "그런데 말입니다", "여기서 끝이 아닙니다" 같은 연결 멘트 필수 삽입.
   - 클로징: 따뜻한 여운을 주는 마무리 + 다음 영상 예고 + 댓글 유도 질문.

[TTS(성우) 최적화 출력 규칙 - 매우 중요!]

1. 지시문 금지: (웃음), (한숨), [BGM: 슬픈 음악] 같은 지문은 절대 쓰지 마세요. 오로지 '읽을 텍스트'만 출력하세요.

2. 특수기호 금지: 대본 본문에는 #, *, - 같은 기호를 쓰지 마세요.

3. 호흡 조절: 쉼표(,)와 마침표(.)를 적절히 사용하여 성우가 숨 쉴 틈을 만들어 주세요. 문장은 너무 길지 않게 끊어주세요.

4. 출력 형식:
   - 대본 본문은 쭉 이어서 출력.
   - 본문이 다 끝난 후, 구분선(---)을 긋고 그 아래에 [유튜브 제목 5개], [태그 10개], [썸네일 묘사]를 적어주세요.
`,

    /**
     * API 엔드포인트 생성
     */
    getEndpoint(apiKey) {
        return `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL}:generateContent?key=${apiKey}`;
    },

    /**
     * 영상 길이별 가이드라인
     */
    getDurationGuidelines(durationMinutes) {
        const durationMap = {
            10: {
                label: '10분',
                guide: '분량: A4 3장 내외 (읽었을 때 약 10분), 지루하지 않게 핵심 위주로.'
            },
            15: {
                label: '15분',
                guide: '분량: A4 4~5장 (읽었을 때 약 15분), 가장 추천하는 오디오북 호흡.'
            },
            30: {
                label: '30분',
                guide: '분량: 심층적인 이야기 (읽었을 때 30분), 3개의 소주제로 나누어 깊이 있게.'
            },
            60: {
                label: '1시간',
                guide: '분량: 아주 긴 호흡 (1시간), 라디오 인생 상담처럼 풍부한 사례와 명언 인용.'
            }
        };

        return durationMap[durationMinutes] || durationMap[15];
    },

    /**
     * 감성(Tone) 가이드라인
     */
    getToneGuidelines(tone) {
        const toneMap = {
            warm: {
                label: '따뜻한',
                description: '할머니가 손주에게 이야기하듯 포근하고 다정한 어조.'
            },
            calm: {
                label: '차분한',
                description: '깊은 밤 라디오 DJ처럼 고요하고 안정된 어조.'
            },
            hopeful: {
                label: '희망적',
                description: '내일을 기대하게 만드는 밝고 긍정적인 어조.'
            },
            nostalgic: {
                label: '향수적',
                description: '옛 시절을 회상하는 듯한 아련하고 서정적인 어조.'
            },
            wise: {
                label: '지혜로운',
                description: '인생의 경험에서 우러나온 깊은 통찰이 담긴 어조.'
            }
        };

        return toneMap[tone] || toneMap['warm'];
    },

    /**
     * 사용자 프롬프트 생성
     */
    getUserPrompt(topic, durationMinutes, tone, previousStory) {
        const duration = this.getDurationGuidelines(durationMinutes);
        const toneGuide = this.getToneGuidelines(tone);

        let prompt = `[사용자 입력 정보]

주제/키워드: ${topic}
목표 영상 길이: ${duration.guide}
감성 톤: ${toneGuide.label} - ${toneGuide.description}
`;

        if (previousStory && previousStory.length > 0) {
            prompt += `
지난 이야기 (시리즈 연결):
${previousStory}
※ 위 내용을 자연스럽게 이어받아, "지난 시간에 말씀드린 것처럼..." 등의 연결 문장으로 시작해주세요.
`;
        }

        prompt += `
위 정보를 바탕으로 시니어들이 눈물을 흘리거나 무릎을 치며 공감할 수 있는 최고의 대본을 작성해 주세요.
TTS로 바로 읽을 수 있도록 (웃음), [BGM] 같은 지시문 없이 순수 본문만 출력하세요.`;

        return prompt;
    },

    /**
     * Google Gemini API 호출
     */
    async generate(topic, apiKey, durationMinutes = 15, tone = 'warm', previousStory = '') {
        try {
            const controller = new AbortController();
            const timeoutMs = durationMinutes >= 30 ? 180000 : 90000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(this.getEndpoint(apiKey), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: this.SYSTEM_PROMPT + '\n\n' + this.getUserPrompt(topic, durationMinutes, tone, previousStory)
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: durationMinutes >= 60 ? 16000 : (durationMinutes >= 30 ? 12000 : 8000),
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
            const generatedText = data.candidates[0].content.parts[0].text;

            // 주제 추출
            const extractedTopic = this.extractTopic(generatedText, topic);

            return {
                topic: extractedTopic,
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
    extractTopic(generatedText, originalTopic) {
        // 유튜브 패키지에서 첫 번째 제목 추출 시도
        const titleMatch = generatedText.match(/1\.\s*(.+)/);
        if (titleMatch && titleMatch[1]) {
            let title = titleMatch[1].replace(/[\[\]\"\']/g, '').trim();
            if (title.length > 5 && title.length < 50) {
                return title;
            }
        }

        // 원본 키워드 기반 주제 생성
        return `${originalTopic}에 대한 이야기`;
    },

    /**
     * API 키 유효성 검사
     */
    isValidKeyFormat(apiKey) {
        return apiKey && apiKey.length > 20;
    }
};
