# 🏢 사회복지기관 E-HR 전자결재 및 행정 관리 시스템 (SW_EDMS)

> **Antigravity AI 개발 프롬프트 가이드 & 웹 어플리케이션 개발 샘플**

본 프로젝트는 **Antigravity AI 코드 에이전트**를 활용하여 단계별(Prompt-driven)로 요구사항을 확장하며 제작한 **사회복지기관 전용 E-HR 전자결재 시스템** 샘플입니다.

---

## 📌 목차 (Table of Contents)
1. [프로젝트 소개](#-프로젝트-소개)
2. [Antigravity AI 프롬프트 기반 앱 제작 가이드](#-antigravity-ai-프롬프트-기반-앱-제작-가이드)
   - [Step 1: `/goal` 프롬프트로 기초 골격 및 MVP 요구사항 정의](#step-1-goal-프롬프트로-기초-골격-및-mvp-요구사항-정의)
   - [Step 2: 추가 프롬프트로 세부 확장 기능 구현](#step-2-추가-프롬프트로-세부-확장-기능-구현)
3. [주요 기능 (Features)](#-주요-기능-features)
4. [기술 스택 (Tech Stack)](#-기술-스택-tech-stack)
5. [프로젝트 구조 (Project Structure)](#-프로젝트-구조-project-structure)
6. [시작하기 (Getting Started)](#-시작하기-getting-started)
7. [배포 및 DB 연동 가이드](#-배포-및-db-연동-가이드)

---

## 🏢 프로젝트 소개

사회복지기관(5~50명 규모)의 특수한 수직적 조직문화 및 행정 절차를 반영한 전자결재 및 E-HR 시스템입니다.
- **직급 및 조직단위(OU)** 기반의 결재선 지정 (센터장/관장, 사무국장, 팀장, 사회복지사 등)
- **도장/날인 첨부** 기능 포함 7가지 핵심 행정 결재 서류 제공
- **카카오맵 API**를 활용한 출장지 검색 및 이동거리/여비 계산
- **구글 캘린더/자원 예약** 및 근태/근무현황 시각화

---

## 🤖 Antigravity AI 프롬프트 기반 앱 제작 가이드

본 시스템은 **Antigravity AI 에이전트**와 대화하며 단계적으로 구축되었습니다. 에이전트를 효율적으로 활용하는 프롬프트 작성 노하우를 소개합니다.

### 🎯 Step 1: `/goal` 프롬프트로 기초 골격 및 MVP 요구사항 정의

> 첫 번째 단계에서는 **도메인 특성, 사용자 수, 수직적 조직 구조, 필수 결재 서류 7종, 날인 첨부 요구사항, 기술 스택 및 배포 계획**을 명확히 정의하여 프로젝트 전체 아키텍처와 기본 UI/UX를 구축합니다.

#### 💬 입력한 프롬프트 (Prompt #1):
```text
/goal 사회복지기관에서 사용할 E-HR 형식의 전자결재 시스템을 제작할 예정입니다. 기관 규모는 최대 5~50명 사이로 잡습니다. 최고 결정권자(센터장, 관장 등), 중간 관리자(사무국장, 과장, 팀장, 주임 등), 실무자(사회복지사) 형식의 수직적 조직문화를 기반으로 하며, OU를 설정할 수 있어야 합니다.
날인 이미지가 문서 내에 첨부 가능해야 합니다.
구현하고자 하는 전자결재 행정 서류는 다음과 같습니다.

1. 연차사용
2. 공가, 병가 등의 특수한 상황에서의 휴가 관리를 위한 '근무상황부2'
3. 출장신청
4. 시간외근무명령
5. 시간외근무확인
6. 교육신청
7. 교육 결과보고

MVP를 제작 후 kakao map api 연동, firebase 또는 supabase DB 연결, vercel 또는 netlify로 배포할 예정입니다.
코드 관리는 github로 할 예정입니다. Implement plan 수립을 진행하고 phase 별 어떤 task 진행 예정인지 안내해주세요.
```

##### 💡 Step 1 프롬프트의 핵심 포인트:
- `/goal` 명령어를 통해 에이전트가 장기 목표를 파악하고 전체 아키텍처 플랜(Implementation Plan)을 수립하도록 유도합니다.
- 조직의 명확한 페르소나 및 요구 서류 목록(7종)을 명시하여 데이터 구조 설계 시 누락이 없도록 합니다.

---

### 🚀 Step 2: 추가 프롬프트로 세부 확장 기능 구현

> 두 번째 단계에서는 MVP 골격이 완성된 후, **실무 편의성을 높이는 연동 기능(캘린더, 자원 예약, 맵 기반 여비 품의, 근태 관리)**을 구체적으로 요청하여 시스템을 고도화합니다.

#### 💬 입력한 프롬프트 (Prompt #2):
```text
이번 구현을 통해서 더 추가하고 싶은 기능이 몇 가지 더 생겼습니다.
1. 구글 캘린더 연동 및 현재 시스템 내에서 각 직원별 근무현황 시각화
2. 각 담당자별 일정에 따른 회의 일정 등 소규모&대규모 미팅 등 예약 시스템(노트북, 회의실 등의 자원 반영 시 예약 제도 생성)
3. 카카오맵 API 등을 활용한 출장 명세(출장지까지의 여비 품의 및 증빙)
4. 근태관리 내역(지각 등의 근태 사항 기록)
```

##### 💡 Step 2 프롬프트의 핵심 포인트:
- 기존에 작성된 코드를 유지하면서 추가 모듈(Google Calendar UI, Resource Booking, Kakao Map, Attendance Log) 형태로 자연스럽게 연동되도록 조립합니다.

---

## ✨ 주요 기능 (Features)

### 📄 1. 전자결재 서류 7종 제공
- **연차사용신청서**: 반차/연차 자동 계산 및 잔여 연차 연동
- **근무상황부2**: 공가, 병가, 경조사 등 특수 휴가 사유 작성 및 증빙 첨부
- **출장신청서**: 카카오맵 기반 출장지 검색, 여비 품의 자동 계산
- **시간외근무명령서**: 사전 시간외 근무 신청 및 승인 프로세스
- **시간외근무확인서**: 실제 근무 시간 검증 및 실적 등록
- **교육신청서**: 직무 교육 신청 및 관련 예산 신청
- **교육결과보고서**: 교육 이수 후 결과 및 소감 보고서 작성

### 🖋️ 2. 전자 날인/도장 서명 기능
- 사용자별 도장/서명 이미지 등록 및 결재 완료 시 결재란에 실시간 반영

### 🏢 3. 수직적 조직도 (OU) & 결재선 지정
- 센터장 / 사무국장 / 팀장 / 사회복지사 등 조직도 계층 트리 조회 및 자동 결재선 지정

### 📅 4. 근무현황 시각화 & 구글 캘린더 연동
- 전체 직원의 출장, 휴가, 시간외 근무 일정을 타임라인/캘린더 뷰로 시각화

### 💻 5. 자원 및 미팅 예약 시스템
- 회의실, 노트북, 기관 차량 등 공용 자원 예약 및 미팅 일정 관리

### 🗺️ 6. 카카오맵 연동 출장 여비 품의
- 출발지/목적지 검색을 통한 경로 및 이동거리 산출, 여비 산정 기능

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS (CSS Modules / Global Theme Design System)
- **Map & External API**: Kakao Map API, Google Calendar API Integration
- **Backend / Database (준비중)**: Supabase (SQL Schema 포함: [docs/supabase_schema.sql](file:///root/SW_EDMS/docs/supabase_schema.sql))
- **Deployment**: Vercel / Netlify 대응 완료 ([docs/deployment_guide.md](file:///root/SW_EDMS/docs/deployment_guide.md))

---

## 📂 프로젝트 구조 (Project Structure)

```text
SW_EDMS/
├── docs/
│   ├── deployment_guide.md      # Vercel/Netlify 배포 가이드
│   └── supabase_schema.sql      # Supabase DB 스키마 파일
├── src/
│   ├── components/
│   │   ├── approval/            # 결재 프로세스 및 결재선 컴포넌트
│   │   ├── dashboard/           # 메인 대시보드 및 캘린더/근태 뷰
│   │   ├── document/            # 결재 문서 목록 및 상세 모달
│   │   ├── forms/               # 서류 7종 Form 컴포넌트
│   │   │   ├── BusinessTripForm.tsx
│   │   │   ├── EducationApplyForm.tsx
│   │   │   ├── EducationReportForm.tsx
│   │   │   ├── LeaveForm.tsx
│   │   │   ├── OvertimeConfirmForm.tsx
│   │   │   ├── OvertimeOrderForm.tsx
│   │   │   └── WorkStatus2Form.tsx
│   │   ├── layout/              # Header, Sidebar 레이아웃
│   │   ├── maps/                # Kakao Map 연동 컴포넌트
│   │   └── org/                 # 조직도(OU) 및 직급 관리
│   ├── services/                # 날인 처리(stampHelper) 및 API 서브모듈
│   ├── styles/                  # 서류 양식 및 인쇄용 CSS
│   ├── types/                   # TypeScript 타입 정의
│   ├── App.tsx                  # 메인 뷰 및 상태 관리
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 🚀 시작하기 (Getting Started)

### 사전 준비 사항
- Node.js (v18 이상 권장)
- npm 또는 yarn

### 설치 및 실행

1. 저장소 클론 (Clone repository)
   ```bash
   git clone https://github.com/SWJoong/SW_EDMS.git
   cd SW_EDMS
   ```

2. 패키지 설치 (Install dependencies)
   ```bash
   npm install
   ```

3. 개발 서버 실행 (Run development server)
   ```bash
   npm run dev
   ```

4. 브라우저 접속
   - `http://localhost:5173` 접속하여 앱 확인

---

## 🌐 배포 및 DB 연동 안내
상세한 연동 가이드는 `docs` 폴더 내 문서를 참고하세요.
- [Vercel & Netlify 배포 가이드](file:///root/SW_EDMS/docs/deployment_guide.md)
- [Supabase 데이터베이스 스키마](file:///root/SW_EDMS/docs/supabase_schema.sql)
