# 나침반목 (Compass Mok)

돌과 그림자가 함께 줄을 만드는 추상전략 보드게임입니다.

나침반목은 오목의 직관적인 목표에 **방향 전환**과 **그림자 판정**을 더한 2인용 브라우저 게임입니다. 플레이어는 돌을 놓고, 승리가 나지 않았다면 턴 끝에 나침반 방향을 0/1/2칸 시계방향으로 돌립니다. 모든 돌은 현재 방향으로 한 칸짜리 그림자를 만들며, 실제 돌과 그림자를 합쳐 목표 목수를 만들면 승리합니다.

이 저장소는 코파톤/포트폴리오 제출을 염두에 둔 빌드입니다. 기본 데모는 비용 없이 실행 가능한 로컬 플레이를 중심으로 하고, Firebase 기반 온라인 대전/랭크 시스템은 확장 설계와 구현 흔적으로 함께 포함되어 있습니다.

## 핵심 요약

| 항목 | 내용 |
| --- | --- |
| 프로젝트 유형 | 브라우저 기반 추상전략 보드게임 |
| 주요 차별점 | 돌 배치 + 방향 회전 + 그림자 승리 판정 |
| 기본 데모 | React 로컬 플레이 |
| 확장 기능 | Firebase 온라인 방, 랭크 매칭, 서버 검증, 리플레이 |
| 추천 배포 | GitHub Pages 정적 배포 |

## 게임 규칙

1. 흑부터 시작합니다.
2. 자기 차례에는 빈 칸에 돌 하나를 둡니다.
3. 착수 직후 목표 목수가 완성되면 즉시 승리합니다.
4. 승리하지 않았다면 현재 그림자 방향을 0, 1, 2칸 중 하나만큼 시계방향으로 돌립니다.
5. 방향 조정 후에도 목표 목수가 완성되면 승리합니다.
6. 실제 돌이 있는 칸에는 그림자가 생기지 않습니다.
7. 실제 돌과 그림자가 만든 연속 줄이 목표 목수에 도달하면 승리합니다.

기본 설정은 13x13 보드와 7목입니다. UI에서 11x11, 13x13, 15x15 보드와 5목/7목 규칙을 선택할 수 있습니다.

## 구현된 기능

### 플레이 경험

- 로컬 2인 대전
- 11x11, 13x13, 15x15 보드
- 5목/7목 승리 조건 선택
- 현재 방향과 회전 선택 UI
- 흑/백 돌과 그림자 시각화
- 동시 승리, 무승부, 턴 로그 처리
- 에러 바운더리와 기본 안내 페이지

### 온라인 확장 설계

Firebase 설정값을 넣으면 다음 기능을 활성화할 수 있도록 구성되어 있습니다.

- Google 로그인 / 게스트 로그인
- 친선 방 생성과 참가
- 랭크 매칭 큐
- Callable Function 기반 수 제출
- 서버 규칙 엔진 검증
- 기권과 시간초과 처리
- Elo 레이팅 정산
- 최근 대국과 랭킹
- 수순 저장과 리플레이 페이지
- 신고 접수
- AdSense 자리와 법적 안내 페이지

포트폴리오 데모에서는 Firebase를 반드시 켤 필요가 없습니다. 비용과 운영 리스크를 줄이려면 로컬 플레이 중심으로 GitHub Pages에 올리는 구성이 가장 단순합니다.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Frontend | React, Vite |
| Game Logic | JavaScript 순수 함수 엔진 |
| Styling | CSS |
| Optional Backend | Firebase Auth, Firestore, Cloud Functions |
| Hosting 후보 | GitHub Pages, Firebase Hosting |

## 프로젝트 구조

```text
.
├─ src/
│  ├─ App.jsx
│  ├─ game/
│  │  ├─ constants.js
│  │  └─ engine.js
│  ├─ components/
│  ├─ online/
│  └─ ads/
├─ functions/
│  ├─ package.json
│  └─ src/
│     ├─ index.js
│     ├─ engine.js
│     └─ ratings.js
├─ public/
├─ docs/
├─ firebase.json
├─ firestore.rules
└─ firestore.indexes.json
```

## 로컬 실행

Firebase 설정 없이도 로컬 2인 게임은 바로 실행할 수 있습니다. 온라인 방, 랭크 매칭, 로그인 기능은 `.env.local`에 Firebase 값을 넣었을 때 활성화됩니다.

### 1. 의존성 설치

```bash
npm install
```

Windows PowerShell에서 `npm.ps1` 실행 정책 오류가 나면 `npm.cmd`를 사용합니다.

```powershell
npm.cmd install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

Windows PowerShell에서는 다음처럼 실행해도 됩니다.

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

실행 후 브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:5173/
```

### 3. 로컬 테스트 방법

1. 보드의 빈 칸을 눌러 흑 돌을 둡니다.
2. 오른쪽 방향 조작 패널에서 0/1/2칸 회전을 선택합니다.
3. 같은 방식으로 백 차례를 진행합니다.
4. 승리 또는 무승부가 발생하면 결과 패널과 `새 게임` 버튼이 표시됩니다.
5. 판 크기와 승리 조건은 왼쪽 `규칙 / 설정` 패널에서 바꿀 수 있습니다.

개발 서버를 종료하려면 터미널에서 `Ctrl+C`를 누릅니다.

프로덕션 빌드:

```bash
npm run build
npm run preview
```

문법 점검:

```bash
npm run check:syntax
npm --prefix functions run lint:syntax
```

## GitHub Pages 배포 방향

포트폴리오 목적이라면 GitHub Pages 정적 배포를 추천합니다.

1. Firebase 환경변수 없이 로컬 모드가 정상 동작하는지 확인합니다.
2. Vite 빌드 결과물인 `dist/`를 GitHub Pages에 배포합니다.
3. 저장소 이름이 하위 경로로 붙는 경우 `vite.config.js`의 `base` 값을 저장소 이름에 맞게 설정합니다.
4. 직접 URL 접근이 필요한 `/privacy`, `/terms`, `/ads`, `/replay/:roomCode`는 GitHub Pages 환경에서 fallback 처리가 필요할 수 있습니다.

온라인 기능을 켜지 않아도 핵심 게임성은 브라우저 안에서 바로 확인할 수 있습니다.

## Firebase 운영 메모

Firebase 기반 온라인 기능은 실제 공개 운영 전에 추가 점검이 필요합니다.

- Firestore Rules 최소 권한화
- 매치메이킹과 방 상태 변경의 서버 이전
- Callable Function 입력값 검증 강화
- 시간초과 grace 처리 일관화
- App Check 적용
- 예산 알림과 사용량 모니터링 설정

현재 저장소의 Firebase 코드는 “확장 가능한 온라인 구조”를 보여주는 용도로 가치가 있습니다. 다만 실제 랭크 서비스를 운영하려면 보안 규칙과 서버 검증을 더 단단히 닫아야 합니다.

## 문서

- [운영 체크리스트](docs/OPERATIONS.md)
- [출시 체크리스트](docs/LAUNCH_CHECKLIST.md)
- [AdSense 설정 가이드](docs/ADSENSE_SETUP.md)

## 포트폴리오 포인트

이 프로젝트는 단순한 오목 구현이 아니라, 새로운 룰을 직접 설계하고 그 규칙을 플레이 가능한 UI와 재사용 가능한 게임 엔진으로 구현한 사례입니다.

강조할 수 있는 부분:

- 새로운 게임 규칙 설계
- 순수 함수 기반 게임 엔진
- React 상태 관리와 보드 UI 구성
- 로컬 플레이와 온라인 확장 구조의 분리
- 서버 검증, 레이팅, 리플레이까지 고려한 아키텍처

## 향후 개선

- GitHub Pages용 라우팅 정리
- README용 플레이 GIF 또는 스크린샷 추가
- 게임 엔진 단위 테스트 추가
- Firebase 온라인 기능 보안 강화
- AI 상대 또는 튜토리얼 모드 추가
- 모바일 보드 조작성 개선

## 라이선스

포트폴리오 제출용 프로젝트입니다. 공개 배포 전 라이선스 정책을 확정하세요.
