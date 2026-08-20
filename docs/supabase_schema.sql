-- ====================================================================
-- E-HR 전자결재 시스템 (사회복지기관) — 무결성 강화 스키마 (Hardened Schema)
-- Target: PostgreSQL / Supabase
-- Scale: 5~50인 규모, 수직적 조직 + 날인 첨부
-- ====================================================================
--
-- ⚠️  이 파일은 "감사·지도점검을 견디는 전자결재"를 목표로 다시 설계되었습니다.
--     기존 MVP 스키마의 구조적 약점 9가지(README / docs/SECURITY.md 참고)를
--     DB 계층에서 보완합니다. 핵심 설계 원칙은 다음과 같습니다.
--
--     (원칙 1) 결재 기록은 UPDATE/DELETE 하지 않는다 — 오직 append(추가)만 한다.
--              헤더(불변) / 본문 리비전(append-only) / 이벤트(append-only, 해시체인)
--     (원칙 2) 시각·번호·해시는 서버가 만든다 — 클라이언트가 넣지 못하게 권한을 뺀다.
--     (원칙 3) 앱(authenticated)은 테이블에 직접 쓰지 못한다 —
--              검증 로직이 든 SECURITY DEFINER 함수(RPC)로만 쓴다.
--     (원칙 4) "완전히 못 막는다"는 것을 인정한다 — 소유자(service_role)는 무엇이든 할 수 있다.
--              그래서 목표를 "조작을 막는다"가 아니라 "조작하면 흔적이 남는다"로 잡고,
--              매일 체인헤드 해시를 외부(메일·별도 저장소)로 앵커링한다.
--
--     ❗ 이 스키마는 학습·설계 참고용입니다. 실제 법정 보존·감사 대상(근태/회계) 기록은
--        검증된 상용 전자결재/문서보존 솔루션 사용을 우선 검토하세요(README 무결성 등급표 참고).
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. 확장(Extensions)
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- digest() = SHA-256 해시 체인용

-- 앱 로직 전용 스키마(공용 API 표면 최소화). 함수는 여기에 둔다.
CREATE SCHEMA IF NOT EXISTS app;

-- ====================================================================
-- 1. 조직 / 사용자
-- ====================================================================

-- 1-1. 부서(OU)
CREATE TABLE public.ous (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    -- 상위 부서 삭제 시 하위를 함께 지우지 않는다(고아 방지 + 이력 보존).
    parent_id UUID REFERENCES public.ous(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1-2. 사용자
--  [보완 1] 퇴직자는 "삭제"하지 않는다. status 를 RETIRED 로 바꾼다.
--          → 결재 이력이 사라지지 않도록 모든 FK 를 ON DELETE RESTRICT 로 건다.
CREATE TYPE public.user_role  AS ENUM ('DIRECTOR', 'MIDDLE_MANAGER', 'STAFF');
CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'RETIRED');
CREATE TYPE public.job_title  AS ENUM ('관장','센터장','사무국장','과장','팀장','주임','사회복지사','행정원');

CREATE TABLE public.users (
    -- Supabase Auth 사용자와 1:1 로 묶는다(로그인 주체 = 결재 주체).
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    ou_id UUID REFERENCES public.ous(id) ON DELETE RESTRICT,
    role public.user_role NOT NULL DEFAULT 'STAFF',
    job_title public.job_title NOT NULL DEFAULT '사회복지사',
    phone VARCHAR(30),
    status public.user_status NOT NULL DEFAULT 'ACTIVE',
    retired_at TIMESTAMPTZ,                    -- 서버가 채운다(퇴직 처리 시)
    -- [보완 5] 날인 이미지는 URL(주소)이 아니라 "콘텐츠"로 관리한다.
    --   stamp_path   : 비공개 버킷 내 경로(공개 URL 아님)
    --   stamp_sha256 : 등록된 도장 바이트의 해시. 결재 시점에 이 해시를 이벤트에 복사한다.
    --   → Storage 의 같은 경로에 다른 이미지를 덮어써도, 과거 결재 이벤트의 stamp_hash 와
    --     달라지므로 "도장이 바뀐 사실"이 드러난다.
    stamp_path TEXT,
    stamp_sha256 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.users.status IS '퇴직=RETIRED 로 전환. 물리 삭제 금지(결재 이력 보존).';

-- ====================================================================
-- 2. 문서 = 헤더(불변) + 본문 리비전(append-only)
--    [보완 2] "문서를 통째로 교체(UPDATE)"하는 구조를 버린다.
--            결재자가 승인하는 것은 "문서"가 아니라 "그 해시를 가진 리비전"이다.
-- ====================================================================

CREATE TYPE public.document_category AS ENUM (
    'LEAVE','WORK_STATUS_2','BUSINESS_TRIP',
    'OVERTIME_ORDER','OVERTIME_CONFIRM','EDUCATION_APPLY','EDUCATION_REPORT'
);

-- 문서의 현재 진행 상태(빠른 조회용 캐시). 진실의 원천은 approval_events 이다.
CREATE TYPE public.document_state AS ENUM (
    'DRAFT','SUBMITTED','IN_PROGRESS','APPROVED','REJECTED','WITHDRAWN','DISCARDED'
);

-- 2-1. 문서 헤더 — 한 번 만들어지면 내용이 바뀌지 않는 불변 레코드.
CREATE TABLE public.approval_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_number VARCHAR(50) NOT NULL UNIQUE,     -- [보완 6] 서버 시퀀스로만 발급
    category public.document_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    -- 기안자: FK 는 RESTRICT(퇴직해도 삭제 불가). 이름/부서/직급은 "기안 시점 스냅샷"으로 별도 보관.
    drafter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    drafter_name VARCHAR(50) NOT NULL,
    drafter_ou VARCHAR(100) NOT NULL,
    drafter_job_title public.job_title NOT NULL,
    -- 현재 상태(캐시). approval_events 로부터 서버 함수가 갱신. 클라이언트 직접 수정 불가.
    state public.document_state NOT NULL DEFAULT 'DRAFT',
    current_revision_id UUID,                        -- 최신 리비전(아래 FK, 순환 참조라 나중에 추가)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2-2. 본문 리비전 — append-only. 수정 = 새 행 추가(이전 행은 그대로 남는다).
CREATE TABLE public.document_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.approval_documents(id) ON DELETE RESTRICT,
    revision_no INT NOT NULL,                        -- 1,2,3...
    form_data JSONB NOT NULL,                        -- 휴가일수/여비/시간외 등 실제 값
    -- 리비전 콘텐츠 해시: 결재자가 승인하는 "그 내용"의 지문.
    -- 승인 후 form_data 를 바꾸려면 새 리비전이 생기고 해시가 달라진다 → 승인은 옛 해시에 묶여 있어 무효화가 드러난다.
    content_sha256 TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(document_id, revision_no)
);

ALTER TABLE public.approval_documents
    ADD CONSTRAINT fk_current_revision
    FOREIGN KEY (current_revision_id) REFERENCES public.document_revisions(id) ON DELETE RESTRICT;

-- ====================================================================
-- 3. 결재선 (스냅샷) — 누가 몇 번째로 결재해야 하는지의 "지정"
--    실제 승인/반려 "행위"는 approval_events 에 append 된다.
-- ====================================================================
CREATE TABLE public.approval_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.approval_documents(id) ON DELETE RESTRICT,
    step_number INT NOT NULL,                        -- 1: 중간결재자, 2: 최고결정권자 ...
    approver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    approver_name VARCHAR(50) NOT NULL,              -- 지정 시점 스냅샷
    approver_role public.user_role NOT NULL,
    approver_job_title public.job_title NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(document_id, step_number)
);

-- ====================================================================
-- 4. 이벤트 로그 (append-only, 해시 체인)  ★ 무결성의 심장
--    [보완 3] 상신·승인·반려·회수·전결·폐기를 "상태값"이 아니라 "이벤트"로 쌓는다.
--    [보완 4] 시각은 서버 now() 로만. 클라이언트가 시각을 못 넣게 컬럼 권한에서 제외.
-- ====================================================================
CREATE TYPE public.event_type AS ENUM (
    'SUBMIT',       -- 상신
    'APPROVE',      -- 승인
    'REJECT',       -- 반려
    'WITHDRAW',     -- 회수(기안자)
    'DELEGATE',     -- 전결/위임 승인
    'DISCARD',      -- 폐기
    'ACCESS'        -- (선택) 민감문서 조회/출력 — 아래 access_logs 로 분리 운영 권장
);

CREATE TABLE public.approval_events (
    -- 전역 순번: 체인의 순서를 정한다(문서 간에도 하나의 사슬로 엮어 통삭제를 탐지).
    seq BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    document_id UUID NOT NULL REFERENCES public.approval_documents(id) ON DELETE RESTRICT,
    event_type public.event_type NOT NULL,
    step_number INT,                                 -- 승인/반려일 때 몇 단계인지
    actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    -- 결재자가 "승인한 그 내용"을 못박는다.
    revision_id UUID REFERENCES public.document_revisions(id) ON DELETE RESTRICT,
    revision_sha256 TEXT,                            -- 승인 시점 본문 해시(복사본)
    stamp_sha256 TEXT,                               -- [보완 5] 결재 시점 도장 해시(복사본)
    comment TEXT,
    -- 시각: 서버가 박는다. 타임존 포함(TIMESTAMPTZ). 클라이언트는 이 컬럼에 값을 못 넣는다(§9 GRANT).
    event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- 해시 체인: this_hash = SHA256(seq || prev_hash || 정규화된 payload)
    prev_hash TEXT NOT NULL,
    this_hash TEXT NOT NULL
);

CREATE INDEX idx_events_document ON public.approval_events(document_id, seq);

-- 4-1. 체인 계산 함수: 직전 행의 this_hash 를 물려 이번 행의 해시를 만든다.
--   중간 한 줄만 손대도(값·시각·순서) 그 이후 구간 해시가 전부 어긋나 조작이 드러난다.
-- 보안 하드닝: search_path 고정(함수 하이재킹 방지) + pgcrypto(digest)가 Supabase 의 extensions
--   스키마에 있어도 찾도록 경로에 포함. (없는 스키마는 무시되므로 자체 호스팅에서도 안전)
CREATE OR REPLACE FUNCTION app.compute_event_hash() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public, app, extensions AS $$
DECLARE
    v_prev TEXT;
    v_payload TEXT;
BEGIN
    SELECT this_hash INTO v_prev
      FROM public.approval_events
      ORDER BY seq DESC
      LIMIT 1;
    IF v_prev IS NULL THEN
        v_prev := repeat('0', 64);                   -- 제네시스(최초 행)
    END IF;

    NEW.event_time := now();                         -- [보완 4] 서버 시각 강제(클라 값 무시)
    NEW.prev_hash  := v_prev;

    -- 정규화된 payload — 어떤 값이 바뀌든 해시가 달라지도록 핵심 필드를 모두 포함.
    v_payload := concat_ws('|',
        NEW.seq::text, v_prev,
        NEW.document_id::text, NEW.event_type::text, coalesce(NEW.step_number::text,''),
        NEW.actor_id::text, coalesce(NEW.revision_id::text,''), coalesce(NEW.revision_sha256,''),
        coalesce(NEW.stamp_sha256,''), coalesce(NEW.comment,''), NEW.event_time::text
    );
    NEW.this_hash := encode(digest(v_payload, 'sha256'), 'hex');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_hash
    BEFORE INSERT ON public.approval_events
    FOR EACH ROW EXECUTE FUNCTION app.compute_event_hash();

-- 4-2. UPDATE/DELETE 원천 차단 트리거 — 이벤트는 오직 append 만 허용.
--   (소유자가 트리거를 DROP 할 수 있음은 §10 에서 정면으로 다룬다.)
CREATE OR REPLACE FUNCTION app.block_mutation() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public, app AS $$
BEGIN
    RAISE EXCEPTION 'append-only 테이블입니다. UPDATE/DELETE 금지 (table=%).', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER trg_events_no_update BEFORE UPDATE ON public.approval_events
    FOR EACH ROW EXECUTE FUNCTION app.block_mutation();
CREATE TRIGGER trg_events_no_delete BEFORE DELETE ON public.approval_events
    FOR EACH ROW EXECUTE FUNCTION app.block_mutation();

-- 리비전도 append-only(수정=새 행). 헤더는 상태 캐시 갱신만 함수로 허용, 사용자 직접 수정 금지(§9).
CREATE TRIGGER trg_revisions_no_update BEFORE UPDATE ON public.document_revisions
    FOR EACH ROW EXECUTE FUNCTION app.block_mutation();
CREATE TRIGGER trg_revisions_no_delete BEFORE DELETE ON public.document_revisions
    FOR EACH ROW EXECUTE FUNCTION app.block_mutation();

-- ====================================================================
-- 5. 접속기록(조회·출력) 로그
--    [보완 7] 근무상황부2의 병가·모성보호 사유는 건강정보(민감정보)일 수 있다.
--    민감정보 처리시스템은 접속기록을 2년 이상 보관·위변조 방지·월 1회 점검이 요구된다.
-- ====================================================================
CREATE TYPE public.access_action AS ENUM ('VIEW','PRINT','EXPORT','DOWNLOAD');

CREATE TABLE public.access_logs (
    seq BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    document_id UUID REFERENCES public.approval_documents(id) ON DELETE RESTRICT,
    action public.access_action NOT NULL,
    ip INET,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()   -- 서버 시각
);
CREATE INDEX idx_access_document ON public.access_logs(document_id, accessed_at);

CREATE TRIGGER trg_access_no_update BEFORE UPDATE ON public.access_logs
    FOR EACH ROW EXECUTE FUNCTION app.block_mutation();
CREATE TRIGGER trg_access_no_delete BEFORE DELETE ON public.access_logs
    FOR EACH ROW EXECUTE FUNCTION app.block_mutation();

-- [보완 7 보강] 병가/모성보호 사유는 "자유 텍스트에 진단명"이 쌓이지 않도록
--   코드값 + 증빙 첨부로 구조화한다. 진단명 원문은 본문(form_data)에 남기지 않는다.
CREATE TABLE public.leave_reason_codes (
    code VARCHAR(20) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    requires_evidence BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO public.leave_reason_codes(code, label, requires_evidence) VALUES
    ('SICK_GENERAL',   '병가(일반 질병·부상)', true),
    ('SICK_HOSPITAL',  '병가(입원)',          true),
    ('MATERNITY_CARE', '모성보호(검진 등)',    true),
    ('FAMILY_EVENT',   '경조사',              true),
    ('OFFICIAL',       '공가(법정 의무 등)',   true),
    ('SPECIAL',        '특별휴가',            false);

-- ====================================================================
-- 6. 문서번호 채번 — 연도별 시퀀스로 원자적 발급 (재사용 금지)
--    [보완 6] (docs.length + 1) 방식 폐기. 결번은 "문서가 사라졌다"의 증거로 남는다.
-- ====================================================================
CREATE TABLE public.document_number_sequences (
    year INT PRIMARY KEY,
    last_no INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION app.next_document_number(p_prefix TEXT DEFAULT 'SW')
RETURNS TEXT
LANGUAGE plpgsql SET search_path = public, app AS $$
DECLARE
    v_year INT := EXTRACT(YEAR FROM now())::int;
    v_no INT;
BEGIN
    -- 원자적 증가: 동시 상신에도 중복/충돌 없음. 번호는 되돌리거나 재사용하지 않는다.
    INSERT INTO public.document_number_sequences(year, last_no)
        VALUES (v_year, 1)
    ON CONFLICT (year) DO UPDATE SET last_no = document_number_sequences.last_no + 1
    RETURNING last_no INTO v_no;

    RETURN format('%s-%s-%s', p_prefix, v_year, lpad(v_no::text, 3, '0'));
END;
$$;

-- ====================================================================
-- 7. 쓰기 경로 = SECURITY DEFINER 함수(RPC)만 허용
--    [보완 2/3/4/8] authenticated 는 테이블에 직접 INSERT/UPDATE/DELETE 하지 못한다(§9).
--    검증 로직을 담은 아래 함수로만 상태가 변한다.
-- ====================================================================

-- 7-1. 상신: 헤더 생성 + 최초 리비전 + SUBMIT 이벤트를 한 트랜잭션에 기록.
CREATE OR REPLACE FUNCTION app.submit_document(
    p_category public.document_category,
    p_title TEXT,
    p_form_data JSONB,
    p_approver_ids UUID[]                              -- 결재선(순서대로)
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app, extensions AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_me public.users%ROWTYPE;
    v_doc_id UUID;
    v_rev_id UUID;
    v_hash TEXT;
    v_i INT;
    v_approver_id UUID;
    v_ap public.users%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION '인증 필요'; END IF;
    SELECT * INTO v_me FROM public.users WHERE id = v_uid;
    IF v_me.status <> 'ACTIVE' THEN RAISE EXCEPTION '비활성 사용자'; END IF;

    v_hash := encode(digest(p_form_data::text, 'sha256'), 'hex');

    INSERT INTO public.approval_documents(document_number, category, title,
        drafter_id, drafter_name, drafter_ou, drafter_job_title, state)
    VALUES (app.next_document_number(), p_category, p_title,
        v_me.id, v_me.name,
        (SELECT name FROM public.ous WHERE id = v_me.ou_id), v_me.job_title, 'SUBMITTED')
    RETURNING id INTO v_doc_id;

    INSERT INTO public.document_revisions(document_id, revision_no, form_data, content_sha256, created_by)
    VALUES (v_doc_id, 1, p_form_data, v_hash, v_me.id)
    RETURNING id INTO v_rev_id;

    UPDATE public.approval_documents SET current_revision_id = v_rev_id WHERE id = v_doc_id;

    -- 결재선 스냅샷 (자기결재 금지: 기안자를 결재선에 넣을 수 없다)
    v_i := 1;
    FOREACH v_approver_id IN ARRAY p_approver_ids LOOP
        IF v_approver_id = v_me.id THEN
            RAISE EXCEPTION '자기결재 금지: 기안자는 결재자가 될 수 없습니다.';
        END IF;
        SELECT * INTO v_ap FROM public.users WHERE id = v_approver_id;
        IF NOT FOUND OR v_ap.status <> 'ACTIVE' THEN
            RAISE EXCEPTION '유효하지 않은 결재자입니다: %', v_approver_id;
        END IF;
        INSERT INTO public.approval_steps(document_id, step_number, approver_id,
            approver_name, approver_role, approver_job_title)
        VALUES (v_doc_id, v_i, v_ap.id, v_ap.name, v_ap.role, v_ap.job_title);
        v_i := v_i + 1;
    END LOOP;

    INSERT INTO public.approval_events(document_id, event_type, actor_id, revision_id, revision_sha256, prev_hash, this_hash)
    VALUES (v_doc_id, 'SUBMIT', v_me.id, v_rev_id, v_hash, '', '');  -- prev/this 는 트리거가 채움
    RETURN v_doc_id;
END;
$$;

-- 7-2. 승인: "특정 리비전 해시"를 승인한다. 도장 해시를 그 시점 값으로 복사.
CREATE OR REPLACE FUNCTION app.approve_step(
    p_document_id UUID,
    p_expected_revision_sha256 TEXT,                  -- 결재자가 화면에서 본 그 내용의 해시
    p_comment TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app, extensions AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_me public.users%ROWTYPE;
    v_step public.approval_steps%ROWTYPE;
    v_cur_rev public.document_revisions%ROWTYPE;
    v_done INT;
    v_total INT;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION '인증 필요'; END IF;
    SELECT * INTO v_me FROM public.users WHERE id = v_uid;

    SELECT * INTO v_step FROM public.approval_steps
        WHERE document_id = p_document_id AND approver_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION '결재 권한 없음'; END IF;

    -- 현재 리비전이 결재자가 본 그 내용과 같은지 확인(승인 후 몰래 바뀐 걸 승인하지 않도록).
    SELECT r.* INTO v_cur_rev FROM public.document_revisions r
        JOIN public.approval_documents d ON d.current_revision_id = r.id
        WHERE d.id = p_document_id;
    IF v_cur_rev.content_sha256 <> p_expected_revision_sha256 THEN
        RAISE EXCEPTION '문서 내용이 변경되었습니다. 다시 확인 후 결재하세요.';
    END IF;

    INSERT INTO public.approval_events(document_id, event_type, step_number, actor_id,
        revision_id, revision_sha256, stamp_sha256, comment, prev_hash, this_hash)
    VALUES (p_document_id, 'APPROVE', v_step.step_number, v_me.id,
        v_cur_rev.id, v_cur_rev.content_sha256, v_me.stamp_sha256, p_comment, '', '');

    -- 상태 캐시 갱신(진실의 원천은 이벤트).
    SELECT count(*) INTO v_total FROM public.approval_steps WHERE document_id = p_document_id;
    SELECT count(DISTINCT step_number) INTO v_done FROM public.approval_events
        WHERE document_id = p_document_id AND event_type = 'APPROVE';
    UPDATE public.approval_documents
        SET state = CASE WHEN v_done >= v_total THEN 'APPROVED'::public.document_state
                         ELSE 'IN_PROGRESS'::public.document_state END
        WHERE id = p_document_id;
END;
$$;

-- 7-3. 반려
CREATE OR REPLACE FUNCTION app.reject_step(p_document_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_step public.approval_steps%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION '인증 필요'; END IF;
    IF coalesce(btrim(p_reason),'') = '' THEN RAISE EXCEPTION '반려 사유 필수'; END IF;
    SELECT * INTO v_step FROM public.approval_steps
        WHERE document_id = p_document_id AND approver_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION '결재 권한 없음'; END IF;

    INSERT INTO public.approval_events(document_id, event_type, step_number, actor_id, comment, prev_hash, this_hash)
    VALUES (p_document_id, 'REJECT', v_step.step_number, v_uid, p_reason, '', '');
    UPDATE public.approval_documents SET state = 'REJECTED' WHERE id = p_document_id;
END;
$$;

-- 7-4. 접속기록 남기기(조회/출력). 클라이언트는 이 함수만 호출 가능.
CREATE OR REPLACE FUNCTION app.log_access(
    p_document_id UUID, p_action public.access_action, p_user_agent TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app AS $$
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION '인증 필요'; END IF;
    INSERT INTO public.access_logs(actor_id, document_id, action, user_agent)
    VALUES (auth.uid(), p_document_id, p_action, p_user_agent);
END;
$$;

-- 7-5. 체인헤드 조회 — 외부 앵커링용. 매일 이 값을 이사장·회계사 메일/별도 저장소로 발송.
CREATE OR REPLACE FUNCTION app.current_chain_head()
RETURNS TABLE(last_seq BIGINT, head_hash TEXT, taken_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT seq, this_hash, now()
    FROM public.approval_events ORDER BY seq DESC LIMIT 1;
$$;

-- 7-6. 체인 검증 — 전체 사슬을 되짚어 끊긴 지점을 찾는다(정기 점검·지도점검 대응).
CREATE OR REPLACE FUNCTION app.verify_event_chain()
RETURNS TABLE(broken_seq BIGINT, reason TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app, extensions AS $$
DECLARE
    r RECORD;
    v_prev TEXT := repeat('0', 64);
    v_calc TEXT;
BEGIN
    FOR r IN SELECT * FROM public.approval_events ORDER BY seq LOOP
        IF r.prev_hash <> v_prev THEN
            broken_seq := r.seq; reason := 'prev_hash 불일치(앞 구간 삭제/변경 의심)'; RETURN NEXT;
        END IF;
        v_calc := encode(digest(concat_ws('|',
            r.seq::text, r.prev_hash, r.document_id::text, r.event_type::text,
            coalesce(r.step_number::text,''), r.actor_id::text, coalesce(r.revision_id::text,''),
            coalesce(r.revision_sha256,''), coalesce(r.stamp_sha256,''), coalesce(r.comment,''),
            r.event_time::text), 'sha256'), 'hex');
        IF r.this_hash <> v_calc THEN
            broken_seq := r.seq; reason := 'this_hash 불일치(행 내용 변조 의심)'; RETURN NEXT;
        END IF;
        v_prev := r.this_hash;
    END LOOP;
END;
$$;

-- ====================================================================
-- 8. 조직 디렉터리 뷰 — 민감/PII 최소 노출
--    (기존 "Public Users Read USING(true)" 는 도장·이메일·전화까지 전원 공개였다.)
-- ====================================================================
CREATE VIEW public.user_directory AS
    SELECT id, name, ou_id, role, job_title, status
    FROM public.users
    WHERE status <> 'RETIRED';                        -- 도장 바이트/연락처/이메일은 제외

-- ====================================================================
-- 9. 권한 (GRANT/REVOKE) — "직접 쓰기"를 회수하고 함수로만 쓰게 한다
--    [보완 4/8] 특히 시각·해시·번호 컬럼은 클라이언트가 넣을 수 없다.
-- ====================================================================

-- 9-1. 기본: authenticated 의 테이블 직접 DML 전면 회수.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- 9-2. 읽기: 필요한 것만 SELECT 허용(행 필터는 아래 RLS 가 담당).
GRANT SELECT ON public.ous, public.user_directory,
    public.approval_documents, public.document_revisions, public.approval_steps,
    public.approval_events, public.leave_reason_codes TO authenticated;
-- access_logs 는 일반 사용자에게 노출하지 않는다(감사 담당만 별도 롤로).

-- 9-3. 함수 실행권한: Postgres 는 함수 EXECUTE 를 기본적으로 PUBLIC 에 부여한다.
--   → 먼저 전부 회수하고(안 그러면 anon 도 감사 함수를 호출할 수 있다), 필요한 것만 명시적으로 준다.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO authenticated;   -- 스키마 접근(함수 호출 전제)

-- 9-4. 쓰기: 오직 아래 RPC 함수로만.
GRANT EXECUTE ON FUNCTION
    app.submit_document(public.document_category, TEXT, JSONB, UUID[]),
    app.approve_step(UUID, TEXT, TEXT),
    app.reject_step(UUID, TEXT),
    app.log_access(UUID, public.access_action, TEXT)
    TO authenticated;

-- 9-5. 체인 검증/헤드 조회는 감사용 — 일반 사용자에게 열지 않는다.
--   위 REVOKE 로 이미 PUBLIC 에서 회수됐다. 감사 담당은 별도 롤을 만들어 부여한다.
--   예: CREATE ROLE auditor;  GRANT USAGE ON SCHEMA app TO auditor;
--       GRANT EXECUTE ON FUNCTION app.verify_event_chain(), app.current_chain_head() TO auditor;

-- ====================================================================
-- 10. RLS (Row Level Security)
-- ====================================================================
ALTER TABLE public.ous                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_revisions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs          ENABLE ROW LEVEL SECURITY;

-- 부서/사용자: 로그인 사용자만 조회.
CREATE POLICY ous_read   ON public.ous   FOR SELECT TO authenticated USING (true);
CREATE POLICY users_self ON public.users FOR SELECT TO authenticated
    USING (id = auth.uid());                          -- 본인 프로필만(도장·연락처 포함). 나머지는 user_directory 뷰로.

-- 문서/리비전/이벤트: 기안자 또는 결재선에 포함된 사람만.
CREATE POLICY doc_read ON public.approval_documents FOR SELECT TO authenticated
    USING (
        drafter_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.approval_steps s
                   WHERE s.document_id = approval_documents.id AND s.approver_id = auth.uid())
    );

CREATE POLICY rev_read ON public.document_revisions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.approval_documents d
                   WHERE d.id = document_revisions.document_id
                     AND (d.drafter_id = auth.uid()
                          OR EXISTS (SELECT 1 FROM public.approval_steps s
                                     WHERE s.document_id = d.id AND s.approver_id = auth.uid()))));

CREATE POLICY step_read ON public.approval_steps FOR SELECT TO authenticated
    USING (approver_id = auth.uid()
           OR EXISTS (SELECT 1 FROM public.approval_documents d
                      WHERE d.id = approval_steps.document_id AND d.drafter_id = auth.uid()));

CREATE POLICY event_read ON public.approval_events FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.approval_documents d
                   WHERE d.id = approval_events.document_id
                     AND (d.drafter_id = auth.uid()
                          OR EXISTS (SELECT 1 FROM public.approval_steps s
                                     WHERE s.document_id = d.id AND s.approver_id = auth.uid()))));

-- access_logs: 일반 SELECT 정책을 만들지 않는다 → RLS 로 사실상 비공개(감사 롤만 별도 부여).

-- ====================================================================
-- 11. ❗ 정직한 한계 (지도점검에서 반드시 설명해야 하는 부분)
-- --------------------------------------------------------------------
--  · 단일 Supabase 프로젝트에서 소유자(service_role)는 트리거를 DROP 하고,
--    RLS 를 우회하며, SQL Editor 로 무엇이든 실행할 수 있다.
--    → 위 트리거/권한은 "일반 사용자·앱 경로"의 조작만 막는다. 소유자 조작은 못 막는다.
--  · 그래서 목표는 "막는다"가 아니라 "지우면 지운 흔적이 남는다"이다:
--      (1) app.current_chain_head() 값을 매일 외부(이사장·회계사 메일 + 별도 저장소)로 발송.
--      (2) DB 를 통째로 되돌려도, 외부에 남은 어제자 head 해시와 오늘 체인이 불일치 → 조작 발각.
--      (3) 진짜 신뢰는 기술이 아니라 "기록을 만드는 주체 ≠ 보관하는 주체" 분리에서 나온다.
--  · service_role 키가 프런트 번들(VITE_*)에 실리는 사고는 CI 에서 차단한다
--    (.github/workflows/security-guard.yml). 프런트에는 anon 키만 사용한다.
--  · 위 사항의 배경·의사결정은 docs/SECURITY.md 참조.
-- ====================================================================

-- ====================================================================
-- 12. 초기 부서 시드 (사용자 시드는 auth.users 생성 후 별도 처리)
-- ====================================================================
INSERT INTO public.ous (id, name, code, description) VALUES
('11111111-1111-1111-1111-111111111111', '기관장실', 'HQ', '최고 결정권자 부서'),
('22222222-2222-2222-2222-222222222222', '사무국', 'EX', '총괄 행정 및 사업 관리'),
('33333333-3333-3333-3333-333333333333', '지역복지1팀', 'CW1', '지역사회 조직 및 주민 복지 서비스'),
('44444444-4444-4444-4444-444444444444', '사례관리2팀', 'CM2', '취약계층 맞춤형 사례 관리'),
('55555555-5555-5555-5555-555555555555', '운영지원팀', 'OP', '회계, 인사, 시설 관리');
