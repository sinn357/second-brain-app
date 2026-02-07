# Mobile App Track (PWA -> Expo)

**작성일**: 2026-02-04  
**목표**: 웹앱 기반을 유지하면서 iOS/Android 네이티브 앱(Expo)으로 확장

## 1) 현재 완료 상태

- PWA 설치/오프라인 기본 지원 완료
  - `app/manifest.ts`
  - `public/sw.js`
  - `public/offline.html`
- 모바일 네비게이션/노트 화면 UX 1차 적용
  - sticky 상단 액션바
  - safe-area 대응
  - 모바일 하단 에디터 툴바
- API/타입 공통화 1차 적용
  - `lib/contracts/entities.ts`
  - `lib/contracts/schemas.ts`
  - `lib/contracts/api.ts`
- 공유 패키지 초안 분리 완료
  - `packages/contracts/src/*`
  - `tsconfig.json` path alias: `@contracts`, `@contracts/*`
- Expo 앱 골격 생성 완료
  - `apps/mobile/app/*`
  - `apps/mobile/src/*`
  - `apps/mobile/package.json`
- Notes 핵심 플로우 1차 연결 완료
  - 목록(`/`)
  - 상세/수정/삭제(`/notes/[id]`)
  - 생성(`/notes/new`)
  - 네트워크 실패 시 메모리 fallback 캐시(목록/상세)

## 2) 모바일 우선 API 계약 (MVP)

모바일 앱 1차 릴리즈에서는 아래 엔드포인트를 우선 고정 계약으로 사용:

| 기능 | Method | Endpoint | 핵심 응답 필드 |
|---|---|---|---|
| 노트 목록 | GET | `/api/notes?folderId=&cursor=&limit=` | `success`, `notes`, `nextCursor`, `hasMore` |
| 노트 상세 | GET | `/api/notes/[id]` | `success`, `note` |
| 노트 생성 | POST | `/api/notes` | `success`, `note` |
| 노트 수정 | PATCH | `/api/notes/[id]` | `success`, `note` |
| 노트 삭제 | DELETE | `/api/notes/[id]` | `success` |
| 폴더 트리 | GET | `/api/folders` | `success`, `folders` |
| 폴더 생성/수정/삭제 | POST/PATCH/DELETE | `/api/folders`, `/api/folders/[id]` | `success`, `folder` |
| 그래프 데이터 | GET | `/api/graph` | `success`, `graph` |
| 태그 목록 | GET | `/api/tags` | `success`, `tags` |

공통 에러 형식:

```json
{
  "success": false,
  "error": "message",
  "details": {}
}
```

## 3) 공통 모듈 구조 (웹/모바일 공유)

현재 기준:

```txt
lib/contracts/
  api.ts         # 하위 호환 re-export
  entities.ts    # 하위 호환 re-export
  schemas.ts     # 하위 호환 re-export
  index.ts       # 하위 호환 re-export

packages/contracts/src/
  api.ts
  entities.ts
  schemas.ts
  index.ts
```

웹 코드는 기존 `@/lib/contracts/*` import를 유지하면서 점진 이전 가능.

## 4) Expo 앱 스캐폴드 초안

예상 디렉토리:

```txt
apps/mobile/
  app/                 # expo-router
  src/
    api/               # fetch client
    features/
      notes/
      folders/
      graph/
    state/             # query client / local store
  package.json
```

## 5) 다음 구현 순서

1. `/api` 응답 형식 점검(핵심 엔드포인트 우선)
2. Folder/Tag/Graph API 연동 화면 추가
3. 모바일 클라이언트에서 `@contracts/*` 전면 사용 전환
4. 오프라인 캐시 정책(읽기 캐시 -> 쓰기 큐) 도입

## 6) 2026-02-04 실행 이슈 해결 로그

### 해결된 항목

- Expo SDK mismatch 해결
  - 문제: Expo Go(SDK 54) vs 프로젝트(SDK 52)
  - 조치: `apps/mobile`를 SDK 54 기준으로 업그레이드
- Babel preset 누락 해결
  - 문제: `Cannot find module 'babel-preset-expo'`
  - 조치: `babel-preset-expo` 설치 및 Babel 설정 정리
- Expo Router deprecated 설정 정리
  - 문제: `expo-router/babel` deprecated warning 반복
  - 조치: `apps/mobile/babel.config.js`에서 `plugins: ['expo-router/babel']` 제거
- 모노레포 패키지 해석 오류 해결
  - 문제: `Unable to resolve "@nexus/contracts/api"`
  - 조치:
    - 모바일 import를 `@nexus/contracts/*`로 통일
    - `apps/mobile/package.json`에 `@nexus/contracts` 로컬 의존성 추가
    - `apps/mobile/metro.config.js` 추가(워크스페이스 watch/symlink 설정)
- 모바일 API 연결 실패 원인 확인
  - 문제: `Network request failed`
  - 원인: 모바일에서 `localhost`는 폰 자기 자신
  - 조치: `EXPO_PUBLIC_API_BASE_URL=http://<맥IP>:3004`로 실행

### 현재 확인된 동작 범위

- 앱 실행/번들링: 정상
- 노트 핵심 플로우: 동작 확인
  - 목록 조회
  - 신규 생성
  - 상세 진입
  - 수정/저장
  - 삭제
- 경고 상태:
  - `SafeAreaView` deprecate warning 존재 (치명도 낮음, 추후 정리)

## 7) 현재 보류/미완료

- 모바일 전체 기능 완성 전
  - Folder / Tag / Graph 화면 및 편집 플로우
  - 오프라인 쓰기 큐(동기화) 정책
- 앱스토어 등록 작업 보류
  - EAS 프로덕션 빌드/제출 전 단계에서 중단
  - 재개 시점에 App Store Connect 세팅 + TestFlight 내부 배포부터 진행

## 8) 재시작 체크리스트 (앱스토어 등록 재개용)

1. 집/개인망에서 백엔드 + 모바일 동시 실행
2. 노트 CRUD 회귀 테스트 1회
3. `eas-cli` 설치/로그인 및 `eas build:configure`
4. iOS 빌드(`eas build -p ios`) 후 TestFlight 업로드(`eas submit -p ios`)
5. App Store Connect 메타데이터/심사 제출
