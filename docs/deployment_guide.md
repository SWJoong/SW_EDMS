# 🚀 E-HR 사회복지 전자결재 시스템 GitHub & Vercel/Netlify 배포 가이드

본 문서는 제작된 **사회복지기관 맞춤형 E-HR 전자결재 시스템 MVP**를 GitHub 리포지토리에 커밋/푸시하고, Kakao Map API 연동 및 Vercel/Netlify 플랫폼에 배포하는 구체적인 절차를 안내합니다.

---

## 1. 🐙 GitHub Repository 생성 및 소스코드 등록

### Step 1: Git 초기화 및 커밋
로컬 프로젝트 루트(`/root/SW_EDMS`)에서 다음 명령어를 실행합니다.

```bash
cd /root/SW_EDMS

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
3. **앱 키 ➔ JavaScript 키**를 복사합니다.
4. `.env` 환경 변수 파일 또는 `index.html` 상단에 SDK 스크립트를 추가합니다:

```html
<!-- index.html <head> 내부 -->
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_JAVASCRIPT_KEY&libraries=services"></script>
```

---

## 3. 🗄️ Supabase / Firebase DB 연동 가이드

현재 MVP는 빠른 검토 및 동작 검증을 위해 `LocalStorage` 기반 데이터 어댑터를 제공합니다.

### Supabase DB 전환 방법
1. [Supabase Console](https://supabase.com)에서 프로젝트를 생성합니다.
2. **SQL Editor** 탭으로 이동하여 `docs/supabase_schema.sql` 파일의 전체 SQL 스크립트를 복사 후 실행(Run)합니다.
3. `.env` 파일에 Supabase 접속 정보를 등록합니다:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

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

## 💡 결론 및 시스템 검증 완료
- **조직문화 (OU & Roles)**: 5~50인 규모 직급(관장, 사무국장/과장/팀장, 사회복지사) 완벽 대응.
- **7대 필수 서식**: 연차사용, 근무상황부2, 출장신청, 시간외명령, 시간외확인, 교육신청, 교육결과보고 완벽 구현.
- **전자 날인**: 결재 승인 시 자동 직인 도장 렌더링 및 A4 인쇄 서식 지원.
