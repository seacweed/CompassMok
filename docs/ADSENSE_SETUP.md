# AdSense 설정 가이드

## 1. AdSense 신청

1. AdSense 계정 생성
2. 사이트 도메인 등록
3. 사이트 검토 요청
4. 승인 후 publisher ID 확인

publisher ID 예시:

```text
ca-pub-1234567890123456
```

## 2. 환경변수 설정

`.env.local`에 입력합니다.

```env
VITE_ADSENSE_ENABLED=true
VITE_ADSENSE_CLIENT_ID=ca-pub-1234567890123456
VITE_ADSENSE_SIDEBAR_SLOT=1234567890
VITE_ADSENSE_FOOTER_SLOT=0987654321
```

## 3. ads.txt 설정

`public/ads.txt`를 수정합니다.

```text
google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

주의: `ca-pub-`에서 `ca-`를 뺀 `pub-...` 형식을 사용합니다.

## 4. 광고 배치 원칙

- 보드 바로 위에 광고를 두지 않기
- 방향 버튼 주변에 광고를 두지 않기
- 광고를 게임 UI처럼 보이게 만들지 않기
- 광고 클릭을 유도하지 않기
- “광고” 라벨 유지
- 팝업/오버레이 광고는 초기 운영에서 피하기

## 5. 승인 전 주의

AdSense는 사이트 품질, 정책 준수, 충분한 콘텐츠, 개인정보 처리방침, 탐색 가능성 등을 봅니다. 승인 전에는 실제 광고 대신 placeholder가 보이는 상태로 두는 것이 안전합니다.

## 6. EU/UK/Switzerland 트래픽

개인화 광고를 제공하려면 Google-certified CMP가 필요합니다. 이 프로젝트에는 CMP SDK가 포함되어 있지 않습니다. 운영 지역에 따라 Cookiebot, OneTrust 등 Google-certified CMP 적용을 검토하세요.
