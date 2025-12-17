# YouTube Script Remixer 🎬

유튜브 대본을 입력하면 새로운 주제와 대본을 생성해주는 웹 애플리케이션입니다.

## ✨ 주요 기능

- **대본 생성**: 기존 대본을 입력하면 새로운 주제와 대본을 자동 생성
- **히스토리 관리**: 생성된 모든 대본이 자동으로 저장됨
- **영구 저장**: 브라우저를 닫아도 데이터가 유지됨 (LocalStorage)
- **클립보드 복사**: 버튼 한 번으로 결과물 복사

## 🚀 시작하기

### 로컬에서 실행

1. 프로젝트 폴더로 이동
2. `index.html` 파일을 브라우저에서 열기

또는 VS Code의 Live Server 확장 프로그램 사용:
```
1. VS Code에서 프로젝트 폴더 열기
2. index.html 우클릭 → "Open with Live Server"
```

## 📁 프로젝트 구조

```
youtube-script/
├── index.html           # 메인 HTML
├── styles/
│   └── main.css         # 스타일시트 (다크 테마)
├── scripts/
│   ├── app.js           # 메인 앱 로직
│   ├── storage.js       # LocalStorage 관리
│   └── simulator.js     # 대본 생성 시뮬레이터
└── README.md
```

## 🎯 사용 방법

1. **대본 입력**: 기존 유튜브 대본을 입력창에 붙여넣기
2. **생성 버튼 클릭**: "새 주제 및 대본 생성" 버튼 클릭
3. **결과 확인**: 생성된 주제와 대본이 화면에 표시됨
4. **히스토리 확인**: 좌측 사이드바에서 이전 대본들 확인 가능

## 💡 단축키

- `Ctrl + Enter`: 대본 생성 실행

## 🔧 기술 스택

- HTML5
- CSS3 (다크 테마, Glassmorphism)
- Vanilla JavaScript
- LocalStorage API

## 📝 참고사항

현재는 **시뮬레이션 모드**로 동작합니다.
실제 AI 연동 시 `scripts/simulator.js`만 수정하면 됩니다.
