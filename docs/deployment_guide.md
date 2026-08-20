# 🚀 E-HR 사회복지 전자결재 시스템 GitHub & Vercel/Netlify 배포 가이드

본 문서는 제작된 **사회복지기관 맞춤형 E-HR 전자결재 시스템 MVP**를 GitHub 리포지토리에 커밋/푸시하고, Kakao Map API 연동 및 Vercel/Netlify 플랫폼에 배포하는 구체적인 절차를 안내합니다.

---

## 1. 🐙 GitHub Repository 생성 및 소스코드 등록

### Step 1: Git 초기화 및 커밋
로컬 프로젝트 루트에서 다음 명령어를 실행합니다.

```bash
cd <프로젝트_경로>/SW_EDMS

# git 초기화
git init

# 전체 소스코드 스테이징
git add .

# 첫 번째 커밋 생성
git commit -m "feat: Initial commit for Social Welfare E-HR Electronic Approval System MVP"
```

### Step 2: GitHub 원격 리포지토리 연결 및 푸시
1. [GitHub](https://github.com) 로그인 후 `sw-edms` 이름의 새 저장소(Public 또는 Private)를 생성합니다.
2. 아래 명령어로 원격 저장소를 등록하고 `main` 브랜치로 푸시합니다:

```bash
# 기본 브랜치명을 main으로 변경
git branch -M main

# GitHub 리포지토리 URL 연동 (YOUR_GITHUB_USERNAME을 본인 계정으로 변경)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/sw-edms.git

# 소스코드 푸시
git push -u origin main
```

---

## 2. 🗺️ Kakao Map API 연동 안내

본 시스템의 **출장신청서(Business Trip Form)** 모듈에는 Kakao Map 위치 선택 인터페이스가 구현되어 있습니다.

### 카카오 맵 API 키 발급 및 적용 방법
1. [카카오 개발자 센터](https://developers.kakao.com/)에 접속하여 애플리케이션을 등록합니다.
2. **플랫폼 설정 ➔ Web 플랫폼**에 배포 도메인(예: `https://sw-edms.vercel.app`)을 추가합니다.
   > 🔐 **도메인 화이트리스트는 필수입니다.** JavaScript 키는 브라우저에 노출되므로,
   > 등록 도메인을 제한하지 않으면 제3자가 키를 도용해 카카오 API 비용을 발생시킬 수 있습니다.
3. **앱 키 ➔ JavaScript 키**를 복사합니다.
4. 키는 `index.html` 에 하드코딩하지 말고 **환경변수(`VITE_KAKAO_JS_KEY`)** 로 주입하세요.
   `.env.example` 을 복사해 `.env` 를 만들고(커밋 금지), 앱에서 동적으로 SDK 를 로드합니다.

```bash
# .env  (❌ 커밋하지 마세요 — .gitignore 에 이미 제외되어 있습니다)
VITE_KAKAO_JS_KEY=발급받은_JavaScript_키
```

> ℹ️ JavaScript 키는 태생적으로 공개 값이라 노출 자체는 정상입니다. 보호는 "숨기기"가 아니라
> **도메인 제한**으로 합니다. 반면 Supabase `service_role` 키처럼 서버 전용 비밀키는 절대 프런트에 넣지 마세요.

---

## 3. 🗄️ Supabase / Firebase DB 연동 가이드

현재 MVP는 빠른 검토 및 동작 검증을 위해 `LocalStorage` 기반 데이터 어댑터를 제공합니다.

### Supabase DB 전환 방법
1. [Supabase Console](https://supabase.com)에서 프로젝트를 생성합니다.
2. **SQL Editor** 탭으로 이동하여 `docs/supabase_schema.sql`(무결성 강화본) 전체를 복사 후 실행(Run)합니다.
   - 이 스크립트는 RLS 활성화, 직접 DML 회수(REVOKE), append-only 트리거, 해시체인, 접속기록을 포함합니다.
   - 실행 후 **Authentication → Policies** 에서 RLS 가 모든 테이블에 켜져 있는지 확인하세요.
3. `.env` 파일에 접속 정보를 등록합니다. **반드시 anon 키만** 사용합니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key      # ✅ anon(공개) 키만
# VITE_SUPABASE_SERVICE_ROLE=...          # ❌ 절대 금지: 프런트 번들에 실리면 RLS 무력화
```

> 🚨 **`service_role` 키를 `VITE_*` 로 넣지 마세요.** 이 키는 RLS 를 우회하는 마스터 키라,
> 프런트에 실리면 누구나 전 직원 결재·개인정보를 열람·삭제할 수 있습니다. 서버 전용(Edge Function)으로만 쓰고,
> `.github/workflows/security-guard.yml` 가 이 사고를 CI 에서 차단합니다.

### Storage(도장 이미지) 보안 설정 — 필수
1. 도장 버킷을 **Private** 으로 생성합니다(Public URL 금지 — 미인증 도장 수집 방지).
2. 접근은 **Signed URL** 또는 RLS 기반 정책으로만 허용합니다.
3. 파일 경로를 **콘텐츠 해시 기반**(예: `stamps/<sha256>.png`)으로 두어, 같은 경로 덮어쓰기로
   과거 결재 도장이 바뀌는 일을 방지합니다. (스키마 `users.stamp_path` / `stamp_sha256` 참고)

---

## 4. ⚡ Vercel / Netlify 원클릭 배포

### 옵션 A: Vercel 배포 (추천)
1. [Vercel](https://vercel.com) 로그인 후 **"Add New Project"** 클릭.
2. 연결된 GitHub 계정에서 `sw-edms` 저장소 선택.
3. Build & Output Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Deploy** 버튼 클릭 ➔ 약 1분 이내에 배포 URL(`https://sw-edms.vercel.app`) 생성 완료!

### 옵션 B: Netlify 배포
1. [Netlify](https://netlify.com) 로그인 ➔ **"Add new site"** ➔ **"Import an existing project"**.
2. GitHub에서 `sw-edms` 저장소 선택.
3. Build Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. **Deploy site** 클릭 ➔ 배포 완료!

---

## 5. 🛡️ 배포 보안 헤더 (권장)

정적 호스팅에도 기본 보안 헤더를 설정하세요. Vercel 예시(`vercel.json`):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    }
  ]
}
```

> 민감정보(건강 등)를 다루는 화면이 있다면 CSP(Content-Security-Policy)와 접속기록(`access_logs`)을
> 함께 적용하고, **조회·인쇄·내보내기 시 `log_access()` 를 호출**하도록 프런트를 연동하세요.

---

## 💡 결론 및 시스템 검증 완료
- **조직문화 (OU & Roles)**: 5~50인 규모 직급(관장, 사무국장/과장/팀장, 사회복지사) 완벽 대응.
- **7대 필수 서식**: 연차사용, 근무상황부2, 출장신청, 시간외명령, 시간외확인, 교육신청, 교육결과보고 완벽 구현.
- **전자 날인**: 결재 승인 시 자동 직인 도장 렌더링 및 A4 인쇄 서식 지원.
