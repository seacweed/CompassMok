# 운영 체크리스트

## 출시 전 필수

- [ ] 실제 도메인 연결
- [ ] Firebase Auth: Google / Anonymous 활성화
- [ ] Firestore Rules 배포
- [ ] Firestore Indexes 배포
- [ ] Cloud Functions 배포
- [ ] Firebase App Check 설정
- [ ] 개인정보 처리방침의 운영자/이메일 수정
- [ ] 이용약관의 운영자/이메일 수정
- [ ] AdSense 신청 및 사이트 승인
- [ ] ads.txt의 publisher ID 수정
- [ ] EEA/UK/Switzerland 트래픽 대상 Google-certified CMP 적용
- [ ] Google Analytics 또는 Firebase Analytics 연결 여부 결정
- [ ] 테스트 계정으로 랭크 매칭 2인 검증
- [ ] 레이팅 정산 중복 여부 검증
- [ ] 모바일 UI 확인

## 매일 확인

- [ ] Functions 오류 로그
- [ ] Firestore 사용량
- [ ] Auth 사용자 증가
- [ ] 매칭 큐 stale 문서
- [ ] AdSense 정책 경고
- [ ] 부정 트래픽 경고

## 운영 중 위험 신호

- 같은 IP/사용자 반복 광고 클릭
- 비정상적으로 빠른 대국 종료
- 큐 진입/취소 스팸
- 특정 계정 간 승패 주고받기
- Functions 정산 실패 증가
- Firestore 비용 급증

## 다음 개발 우선순위

1. moves 서브컬렉션 저장
2. 서버 replay 검증
3. 기권/시간초과
4. 신고/차단
5. 시즌제 랭킹
6. 리플레이 페이지
7. 관리자 대시보드
