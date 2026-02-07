# Next Session Guide (Mobile -> Store Resume)

**작성일**: 2026-02-04  
**목적**: 모바일 앱스토어 등록 작업을 재개할 때 바로 실행 가능한 체크리스트 제공

## ✅ 현재까지 완료

- Expo SDK 54 업그레이드 완료 (`apps/mobile`)
- Expo Router/Babel 설정 충돌 정리 완료
- 모노레포 contracts 해석 이슈 해결
- 모바일에서 노트 핵심 CRUD(생성/수정/저장/삭제) 동작 확인

## ⚠️ 현재 보류 상태

- 앱스토어 등록은 잠정 보류
- 모바일 전체 기능(폴더/태그/그래프, 오프라인 쓰기 큐)은 미완료

## ▶ 재개 시 바로 할 일

1. 백엔드 실행 (루트)
```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/second-brain-app
npm run dev
```

2. 모바일 실행 (`apps/mobile`)
```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/second-brain-app/apps/mobile
EXPO_PUBLIC_API_BASE_URL=http://<맥IP>:3004 npx expo start -c
```

3. 최소 회귀 테스트
- 노트 목록 로드
- 신규 생성
- 상세/수정/저장
- 삭제
- 앱 재실행 후 데이터 일관성

4. 앱스토어 준비 재개 시
- `eas-cli` 로그인 및 설정
- iOS 빌드: `eas build -p ios`
- TestFlight 제출: `eas submit -p ios`
- App Store Connect 메타데이터/심사 제출

## 📁 참고 문서

- `docs/MOBILE_APP_TRACK.md` (모바일 진행/이슈 로그)

**Status**: 모바일 핵심 플로우 확인 완료, 앱스토어 등록 대기
