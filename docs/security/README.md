# 🧪 보안 회귀 테스트 (Security Regression Tests)

실제 소스 파일을 구동해 공격 페이로드로 검증하는 테스트입니다. 커밋 전/CI 에서 자동 실행됩니다.

## 실행

```bash
npm run test:security
```

> Node **22 이상**이 필요합니다(`--experimental-strip-types` 로 `.ts` 를 직접 실행).
> `hook.mjs` 는 Vite 스타일의 확장자 없는 import(`./mockData`)를 런타임에서 `.ts` 로 해석해주는
> 테스트 전용 로더입니다. 프로덕션 빌드에는 영향을 주지 않습니다.

## 무엇을 검증하나

| 구역 | 위협 | 검증 내용 |
|------|------|-----------|
| A | **XSS** | 날인 SVG 생성기(`generateDefaultStampSvg`)에 스크립트/이벤트 핸들러 페이로드 주입 → 전체가 `encodeURIComponent` 되어 URI 에 리터럴 `<script>` 가 남지 않음 + `<img src>` 로만 렌더(스크립트 미실행) |
| B | **무결성/불변성** | 악성 문자열이 무해한 데이터로 저장 · 문서번호 단조 증가(삭제 후 재사용 금지) · **승인 완료 문서 본문 변경 차단** · 승인 시 append-only 이벤트 적재 |
| C | **프로토타입 오염** | 조작된 localStorage 의 `__proto__` 페이로드가 `Object.prototype` 을 오염시키지 않음 |
| D | **신원 위조(한계)** | 현재 목업은 클라이언트 값만으로 "관장" 위장 가능함을 **의도적으로 확인**(A등급 공백 — Supabase Auth+RLS 필요) |

## 파일

- `pentest.mts` — 테스트 본문
- `hook.mjs` / `resolver.mjs` — 확장자 없는 `.ts` import 해석용 런타임 로더(테스트 전용)

## SQL 인젝션은?

실행 DB 가 없어 코드 실행 대신 **정적 점검**으로 확인합니다(결과는 [../SECURITY.md](../SECURITY.md) 의
"침투 테스트" 섹션). 요약: 스키마의 모든 쓰기 함수는 **파라미터 바인딩**만 사용하고 동적 문자열 SQL(`EXECUTE '...'`)이
없으며, 모든 `SECURITY DEFINER` 함수가 `SET search_path` 로 고정되어 함수 하이재킹을 방지합니다.
