# 🎨 DialoG Frontend

AI 기반 실시간 회의 관리 시스템의 프론트엔드 애플리케이션

---


## 🎯 프로젝트 소개

DialoG Frontend는 실시간 음성 인식과 AI 기반 회의 분석을 제공하는 웹 애플리케이션입니다.

Vanilla JavaScript로 구현되었으며, 컴포넌트 재사용을 통해 일관된 UI/UX를 제공합니다.

---


## 🛠️ 기술 스택

| 카테고리 | 기술 스택 | 용도 |
|---------|----------|------|
| **언어 & 마크업** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) | 웹 애플리케이션 UI/UX 구현 |
| **웹서버** | ![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white) | 정적 파일 서빙, 리버스 프록시 |
| **실시간 통신** | ![WebSocket](https://img.shields.io/badge/WebSocket-010101?logo=socket.io&logoColor=white) ![AudioWorklet](https://img.shields.io/badge/AudioWorklet-FF6F00?logo=web-audio-api&logoColor=white) | 실시간 STT 데이터 전송<br/>고성능 오디오 처리 (48kHz→16kHz) |
| **인증** | ![OAuth 2.0](https://img.shields.io/badge/OAuth_2.0-4285F4?logo=google&logoColor=white) | Google, Kakao 소셜 로그인 |
| **외부 라이브러리** | ![jsPDF](https://img.shields.io/badge/jsPDF-1.5-F40F02?logo=adobe-acrobat-reader&logoColor=white) | 회의록 PDF 내보내기 |
| **컨테이너 & CI/CD** | ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white) | 컨테이너화<br/>자동 빌드 및 배포 |
| **호스팅** | ![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?logo=amazon-aws&logoColor=white) | 프로덕션 서버 호스팅 |

---

## 📋 목차

- [팀원 구성](#-팀원-구성)
- [프로젝트 구조](#-프로젝트-구조)
- [주요 기능](#-주요-기능)
- [페이지 구성](#-페이지-구성)
- [주요 워크플로우](#-주요-워크플로우)
- [핵심 구현 사항](#-핵심-구현-사항)

---

## 👥 팀원 구성

| 이름 | 역할 | 담당 영역 |
|------|------|-----------|
| **김나운, 장문선** | Frontend Lead | 전체 HTML/CSS/JS 기본 구조 설계 및 구현 |
| **김나운** | Real-time STT | 실시간 음성 녹음 및 STT 처리 |
| **장문선** | Chatbot & CI/CD | AI 챗봇, 설정 페이지, 자동 배포 파이프라인 |
| **지승엽** | AI Integration | AI 요약, 할일 추출 기능 |
| **강승훈** | Authentication & Admin | 로그인, 비밀번호 재설정, 관리자 페이지 |
| **박인호** | Calendar | Google Calendar 연동 |

---


## 📁 프로젝트 구조
```
dialog-frontend/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD 파이프라인
│
├── components/                     # 재사용 가능한 컴포넌트
│   ├── chatbot.html               # AI 챗봇 UI
│   └── sidebar.html               # 네비게이션 사이드바
│
├── static/
│   ├── css/                       # 스타일시트
│   │   ├── style.css             # 전역 스타일
│   │   ├── chatbot.css           # 챗봇 스타일
│   │   ├── recording.css         # 녹음 페이지
│   │   ├── meetingDetail.css     # 회의 상세
│   │   ├── meetings.css          # 회의 목록
│   │   └── ...
│   │
│   ├── fonts/                     # 웹 폰트
│   │
│   ├── images/                    # 이미지 리소스
│   │   └── dialog-logo.png
│   │
│   └── js/                        # JavaScript 모듈
│       ├── app.js                # 전역 설정 및 유틸리티
│       ├── chatbot.js            # 챗봇 로직
│       ├── recording.js          # STT 녹음
│       ├── meetingDetail.js      # 회의 상세
│       ├── pcm-processor.js      # AudioWorklet 프로세서
│       └── ...
│
├── 📄 HTML 페이지
│   ├── login.html                # 로그인
│   ├── resetPassword.html        # 비밀번호 재설정
│   ├── home.html                 # 홈 대시보드
│   ├── recordSetting.html        # 회의 설정
│   ├── recording.html            # 실시간 녹음
│   ├── recordFinish.html         # 녹음 완료
│   ├── meetingDetail.html        # 회의 상세
│   ├── meetings.html             # 회의 목록
│   ├── calendar.html             # 일정 관리
│   ├── settings.html             # 설정
│   ├── dashboard.html            # 관리자 대시보드
│   ├── userManagement.html       # 사용자 관리
│   ├── meetingManagement.html    # 회의 관리
│   └── storage.html              # 스토리지 관리
│
├── Dockerfile                     # Docker 이미지 빌드 설정
├── nginx.conf                     # Nginx 웹서버 설정
└── README.md
```

---


## ✨ 주요 기능

### 🎤 실시간 STT (Speech-to-Text)
- WebSocket 기반 실시간 음성 인식
- AudioWorklet API를 활용한 고품질 오디오 처리
- 48kHz → 16kHz 리샘플링 (pcm-processor.js)
- CLOVA Speech API 연동

### 🔐 OAuth 2.0 소셜 로그인
- Google 계정 연동
- Kakao 계정 연동
- 자동 회원가입 및 로그인

### 🤖 AI 챗봇
**회의록 검색 모드**
- 과거 회의 내용 검색
- 참석자, 날짜, 키워드 기반 필터링
- 컨텍스트 기반 대화 (Redis 세션 관리)

**IT 용어사전 모드**
- IT 용어 검색 및 설명
- 3단계 폴백 시스템 (JSON → CLOVA Chatbot → HyperCLOVA X)

### 📅 Google Calendar 동기화
- OAuth 2.0 기반 캘린더 연동
- 회의 일정 자동 등록
- 양방향 동기화

### 👨‍💼 관리자 기능
- 실시간 통계 대시보드
- 사용자 관리 (활성화/비활성화, 직무/직급 수정)
- 회의 관리 (상세 조회, 삭제)
- 스토리지 사용량 모니터링

---


## 📱 페이지 구성

### 인증 (Authentication)
| 페이지 | 파일명 | 설명 |
|--------|--------|------|
| 로그인 | `login.html` | 이메일/소셜 로그인 |
| 비밀번호 재설정 | `resetPassword.html` | 이메일 인증 후 비밀번호 변경 |

### 회의 관리 (Meeting Management)
| 페이지 | 파일명 | 설명 |
|--------|--------|------|
| 회의 설정 | `recordSetting.html` | 제목, 참석자, 키워드 설정 |
| 실시간 녹음 | `recording.html` | STT 실시간 변환 및 표시 |
| 녹음 완료 | `recordFinish.html` | 녹음 종료 및 저장 |
| 회의 상세 | `meetingDetail.html` | AI 요약, 발화 로그, 할일 목록 |
| 회의 목록 | `meetings.html` | 필터링, 정렬, 검색 기능 |

### 기타 (General)
| 페이지 | 파일명 | 설명 |
|--------|--------|------|
| 홈 | `home.html` | 대시보드 및 통계 |
| 캘린더 | `calendar.html` | Google Calendar 연동 |
| 설정 | `settings.html` | 개인정보, 직무/직급 설정 |

### 관리자 (Admin)
| 페이지 | 파일명 | 설명 |
|--------|--------|------|
| 대시보드 | `dashboard.html` | 전체 통계 및 차트 |
| 사용자 관리 | `userManagement.html` | 사용자 CRUD 및 권한 관리 |
| 회의 관리 | `meetingManagement.html` | 모든 회의 조회 및 관리 |
| 스토리지 | `storage.html` | 저장 공간 사용량 확인 |

---

## 🔄 주요 워크플로우

### 회의 진행 플로우
```
사용자 로그인 (OAuth 2.0)
         ↓
회의 설정 (recordSetting.html)
- 제목, 참석자, 키워드 입력
         ↓
실시간 녹음 시작 (recording.html)
- 마이크 권한 획득
- WebSocket 연결
- 실시간 STT 표시
         ↓
녹음 종료 (recordFinish.html)
- 음성 파일 저장 (Object Storage)
- AI 분석 요청 (요약, 할일, 키워드)
         ↓
회의 상세 (meetingDetail.html)
- AI 요약 확인
- 발화 로그 검색
- 할일 관리
- PDF 내보내기
```

### 실시간 STT 처리 플로우
```
마이크 입력 (getUserMedia API)
         ↓
AudioWorklet (pcm-processor.js)
- 48kHz → 16kHz 리샘플링
- Float32 → Int16 변환
- 160샘플 프레임 생성
         ↓
WebSocket 전송 (Binary)
         ↓
Backend → AI Server (gRPC)
         ↓
CLOVA STT 응답
- 발화 텍스트
- 화자 정보
         ↓
실시간 화면 표시
- 화자별 색상 구분
- 타임스탬프 표시
```

---

## 🔧 핵심 구현 사항

### 1. AudioWorklet 기반 실시간 오디오 처리

**pcm-processor.js**
```javascript
// 48kHz → 16kHz 리샘플링 처리
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    this.inputRate = sampleRate;      // 브라우저 샘플레이트 (48kHz)
    this.targetRate = 16000;          // 타겟 샘플레이트 (CLOVA STT 요구)
    this.ratio = this.inputRate / this.targetRate;
  }
  
  process(inputs) {
    // 리샘플링 + Int16 변환 → WebSocket 전송
  }
}
```

**특징**
- 메인 스레드 블로킹 없이 실시간 처리
- 효율적인 버퍼 관리 및 프레임 단위 전송

### 2. 컴포넌트 기반 구조

**사이드바 & 챗봇 동적 로드**
```javascript
// 모든 페이지에서 공통 컴포넌트 fetch
fetch("components/sidebar.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("sidebar-container").innerHTML = html;
    loadCurrentUser(); // 사용자 정보 주입
  });

fetch("components/chatbot.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("chatbot-container").innerHTML = html;
    initializeChatbot(); // 챗봇 초기화
  });
```

### 3. WebSocket 실시간 통신

**recording.js**
```javascript
// STT WebSocket 연결
const ws = new WebSocket(`wss://dialogai.ddns.net/ws/stt`);

ws.onopen = () => {
  // 세션 시작 메시지 전송
  ws.send(JSON.stringify({
    type: "start",
    config: { sampleRate: 16000 }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "transcript") {
    displayTranscript(data.text, data.speaker);
  }
};
```

### 4. OAuth 2.0 인증 플로우

**Google OAuth 예시**
```javascript
// 1. Google 로그인 버튼 클릭
const GOOGLE_OAUTH_URL = `${BACKEND_BASE_URL}/api/auth/oauth2/google`;
window.location.href = GOOGLE_OAUTH_URL;

// 2. 백엔드에서 리다이렉트 → Access Token 발급
// 3. 쿠키에 세션 저장 (HttpOnly)
// 4. home.html로 자동 이동
```

### 5. 챗봇 모드 전환

**chatbot.js**
```javascript
function switchChatMode(mode) {
  currentMode = mode; // 'search' 또는 'faq'
  
  // UI 업데이트
  document.getElementById('searchModeBtn').classList.toggle('active', mode === 'search');
  document.getElementById('faqModeBtn').classList.toggle('active', mode === 'faq');
  
  // 새 대화 시작
  startNewChat();
}
```

### 6. PDF 내보내기

**meetingDetail.js**
```javascript
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // 회의 제목
  doc.setFontSize(18);
  doc.text(meetingTitle, 20, 20);
  
  // AI 요약
  doc.setFontSize(12);
  doc.text("AI 요약", 20, 40);
  doc.text(summaryText, 20, 50);
  
  // 발화 로그
  transcripts.forEach((t, idx) => {
    doc.text(`${t.speaker}: ${t.text}`, 20, 70 + idx * 10);
  });
  
  doc.save(`회의록_${meetingId}.pdf`);
}
```
