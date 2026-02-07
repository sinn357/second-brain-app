# Nexus Mobile (Expo)

`apps/mobile`는 Second Brain App의 네이티브 앱(iOS/Android) 스캐폴드입니다.

## 현재 상태

- Expo Router 기반 폴더 구조 생성
- React Query 기본 Provider 연결
- 웹과 공유하는 계약 타입/스키마(`packages/contracts`) 참조 준비
- Notes 목록 API 연결 샘플 구현

## 실행 전 준비

아직 이 레포 루트에 워크스페이스 설정이 없으므로, 우선 모바일 앱 디렉토리에서 독립 실행 기준:

```bash
cd apps/mobile
npm install
npm run dev
```

API 주소는 `EXPO_PUBLIC_API_BASE_URL`로 지정:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3004 npm run dev
```

실기기 테스트 시에는 `localhost` 대신 같은 네트워크의 개발 머신 IP를 사용해야 합니다.

## 다음 작업

1. 인증 전략 결정(현재는 무인증 가정)
2. Folder/Tag/Graph 화면 추가
3. 오프라인 캐시 + 쓰기 큐 정책 도입
4. iOS/Android 빌드 파이프라인(EAS) 연결
