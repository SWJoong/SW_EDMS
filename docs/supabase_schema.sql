-- ====================================================================
-- E-HR Electronic Approval System (사회복지기관 전자결재) Supabase Database Schema
-- Target: PostgreSQL / Supabase DB Migration
-- Scale: 5~50 Members with Vertical Organizational Hierarchy & Seal Attachments
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizational Units (OU / 부서) Table
CREATE TABLE public.ous (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.ous(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Users & Profiles Table
CREATE TYPE public.user_role AS ENUM ('DIRECTOR', 'MIDDLE_MANAGER', 'STAFF');
CREATE TYPE public.job_title AS ENUM ('관장', '센터장', '사무국장', '과장', '팀장', '주임', '사회복지사', '행정원');

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    ou_id UUID REFERENCES public.ous(id) ON DELETE RESTRICT,
    role public.user_role NOT NULL DEFAULT 'STAFF',
    job_title public.job_title NOT NULL DEFAULT '사회복지사',
    phone VARCHAR(30),
    stamp_url TEXT, -- Base64 or Supabase Storage Public URL for electronic seal image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Documents Table
CREATE TYPE public.approval_status AS ENUM ('DRAFT', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED');
CREATE TYPE public.document_category AS ENUM (
    'LEAVE',
    'WORK_STATUS_2',
    'BUSINESS_TRIP',
    'OVERTIME_ORDER',
    'OVERTIME_CONFIRM',
    'EDUCATION_APPLY',
    'EDUCATION_REPORT'
);

CREATE TABLE public.approval_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_number VARCHAR(50) NOT NULL UNIQUE,
    category public.document_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    drafter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    drafter_name VARCHAR(50) NOT NULL,
    drafter_ou VARCHAR(100) NOT NULL,
    drafter_job_title public.job_title NOT NULL,
    status public.approval_status NOT NULL DEFAULT 'PENDING',
    form_data JSONB NOT NULL, -- Flexible document payload (e.g. leave dates, trip address, Kakao Map coords, overtime hours)
    reject_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Approval Steps (Workflow Line) Table
CREATE TABLE public.approval_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.approval_documents(id) ON DELETE CASCADE,
    step_number INT NOT NULL, -- 1: 중간결재자, 2: 최고결정권자
    approver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    approver_name VARCHAR(50) NOT NULL,
    approver_role public.user_role NOT NULL,
    approver_job_title public.job_title NOT NULL,
    status public.approval_status NOT NULL DEFAULT 'PENDING',
    comment TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    stamp_url TEXT, -- Copy of seal image applied at approval time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(document_id, step_number)
);

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.ous ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read OUs and user profiles
CREATE POLICY "Public OUs Read" ON public.ous FOR SELECT USING (true);
CREATE POLICY "Public Users Read" ON public.users FOR SELECT USING (true);

-- Allow drafters & approvers to read documents
CREATE POLICY "Read documents" ON public.approval_documents
    FOR SELECT USING (
        auth.uid() = drafter_id OR
        EXISTS (
            SELECT 1 FROM public.approval_steps
            WHERE document_id = public.approval_documents.id AND approver_id = auth.uid()
        )
    );

-- Allow drafters to insert new documents
CREATE POLICY "Create documents" ON public.approval_documents
    FOR INSERT WITH CHECK (auth.uid() = drafter_id);

-- 7. Initial Seed Data (Matching Mock Data)
INSERT INTO public.ous (id, name, code, description) VALUES
('11111111-1111-1111-1111-111111111111', '기관장실', 'HQ', '최고 결정권자 부서'),
('22222222-2222-2222-2222-222222222222', '사무국', 'EX', '총괄 행정 및 사업 관리'),
('33333333-3333-3333-3333-333333333333', '지역복지1팀', 'CW1', '지역사회 조직 및 주민 복지 서비스'),
('44444444-4444-4444-4444-444444444444', '사례관리2팀', 'CM2', '취약계층 맞춤형 사례 관리'),
('55555555-5555-5555-5555-555555555555', '운영지원팀', 'OP', '회계, 인사, 시설 관리');
