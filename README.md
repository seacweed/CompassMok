# 나침반목 (Compass Mok)

돌과 그림자가 함께 줄을 만드는 2인용 추상전략 보드게임입니다.

나침반목은 오목의 직관적인 목표에 **방향 전환**과 **그림자 판정**을 더합니다. 플레이어는 돌을 놓은 뒤, 승리가 나지 않았다면 나침반 방향을 0/1/2칸 시계방향으로 돌립니다. 모든 돌은 현재 방향으로 한 칸짜리 그림자를 만들고, 실제 돌과 그림자를 합쳐 목표 목수를 만들면 승리합니다.

## 게임 컨셉

기존 오목은 돌의 위치만으로 판세가 결정됩니다. 나침반목에서는 여기에 현재 방향이 더해집니다.

```text
실제 돌의 위치
+ 현재 그림자 방향
+ 턴 끝의 방향 조작
= 매 턴 달라지는 공격선과 수비선
```

같은 돌 배치라도 방향이 바뀌면 위협이 달라집니다. 플레이어는 지금 당장 돌을 어디에 둘지뿐 아니라, 턴 끝에 방향을 어떻게 넘길지도 함께 계산해야 합니다.

## 핵심 요약

| 항목 | 내용 |
| --- | --- |
| 장르 | 추상전략 보드게임 |
| 플레이 방식 | 로컬 2인 대전 |
| 기본 규칙 | 13x13 보드, 7목 |
| 핵심 메커니즘 | 돌 배치, 그림자, 방향 회전 |
| 확장 구조 | 온라인 방, 랭크 매칭, 서버 검증, 리플레이 |

## 게임 규칙

1. 흑부터 시작합니다.
2. 자기 차례에는 빈 칸에 돌 하나를 둡니다.
3. 착수 직후 목표 목수가 완성되면 즉시 승리합니다.
4. 승리하지 않았다면 현재 그림자 방향을 0, 1, 2칸 중 하나만큼 시계방향으로 돌립니다.
5. 방향 조정 후에도 목표 목수가 완성되면 승리합니다.
6. 모든 돌은 현재 방향으로 한 칸짜리 그림자를 만듭니다.
7. 실제 돌이 있는 칸에는 그림자가 생기지 않습니다.
8. 실제 돌과 그림자가 만든 연속 줄이 목표 목수에 도달하면 승리합니다.

보드 크기는 11x11, 13x13, 15x15를 지원합니다. 승리 조건은 5목 또는 7목으로 선택할 수 있습니다.

## 현재 구현

### 로컬 플레이

- 로컬 2인 대전
- 보드 크기 선택
- 5목/7목 승리 조건 선택
- 현재 그림자 방향 표시
- 0/1/2칸 방향 회전 선택
- 흑/백 돌과 그림자 시각화
- 승리, 동시 승리, 무승부 판정
- 종료 결과 패널과 새 게임 버튼
- 턴 로그 기록

### 온라인 확장

Firebase 설정을 추가하면 온라인 기능을 활성화할 수 있도록 구조가 준비되어 있습니다.

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

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Frontend | React, Vite |
| Game Logic | JavaScript 순수 함수 |
| Styling | CSS |
| Optional Backend | Firebase Auth, Firestore, Cloud Functions |
| Optional Hosting | GitHub Pages, Firebase Hosting |

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

## 빌드와 점검

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

## 배포 방향

정적 데모는 GitHub Pages로 배포할 수 있습니다.

1. Firebase 환경변수 없이 로컬 모드가 정상 동작하는지 확인합니다.
2. Vite 빌드 결과물인 `dist/`를 배포합니다.
3. 저장소 이름이 하위 경로로 붙는 경우 `vite.config.js`의 `base` 값을 저장소 이름에 맞게 설정합니다.
4. 직접 URL 접근이 필요한 `/privacy`, `/terms`, `/ads`, `/replay/:roomCode`는 GitHub Pages 환경에서 fallback 처리가 필요할 수 있습니다.

Firebase Hosting을 사용하면 Firestore, Functions, Auth와 함께 온라인 기능까지 같은 프로젝트에서 배포할 수 있습니다.

## Firebase 확장 메모

온라인 기능을 실제 운영에 사용하려면 다음 항목을 먼저 점검해야 합니다.

- Firestore Rules 최소 권한화
- 매치메이킹과 방 상태 변경의 서버 이전
- Callable Function 입력값 검증 강화
- 시간초과 grace 처리 일관화
- App Check 적용
- 예산 알림과 사용량 모니터링 설정
- 신고/제재 운영 프로세스 정리

Firebase 코드는 온라인 대전 구조를 확장하기 위한 기반입니다. 로컬 게임은 Firebase 없이도 동작합니다.

## 문서

- [운영 체크리스트](docs/OPERATIONS.md)
- [출시 체크리스트](docs/LAUNCH_CHECKLIST.md)
- [AdSense 설정 가이드](docs/ADSENSE_SETUP.md)

## 향후 개선

- GitHub Pages용 라우팅 정리
- 플레이 GIF 또는 스크린샷 추가
- 게임 엔진 단위 테스트 추가
- Firebase 온라인 기능 보안 강화
- AI 상대 또는 튜토리얼 모드 추가
- 모바일 보드 조작성 개선
- 리플레이 턴별 재생 UI
