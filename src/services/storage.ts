import type { OU, User, ApprovalDocument, ApprovalStatus } from '../types/approval';
import { INITIAL_OUS, INITIAL_USERS, INITIAL_DOCUMENTS } from './mockData';

// ====================================================================
// ⚠️  무결성 한계 고지 (반드시 읽어주세요)
// --------------------------------------------------------------------
// 이 저장소 어댑터는 브라우저 localStorage 를 씁니다. 데모/학습 전용입니다.
// localStorage 는 "그 PC의 그 브라우저"에만 저장되고, 개발자도구로 누구나
// 값을 열어 마음대로 고치거나 지울 수 있습니다. 즉 다음은 원리적으로 불가능합니다.
//   · 서버 시각 고정 (아래 nowClientTime() 은 클라이언트 시계라 조작 가능 — 진짜 해법은 DB now())
//   · 위·변조 방지 / 삭제 흔적 보존 (localStorage 는 그냥 지우면 흔적이 없음)
//   · 사용자 간 데이터 공유 (한 사람 PC 안에서만 존재)
// 아래 코드는 "감사에 견디는 전자결재라면 무엇이 필요한지"를 데모에서 흉내 내되,
// 그 한계를 코드 주석으로 정직하게 드러내는 것이 목적입니다.
// 실제 운영 무결성은 docs/supabase_schema.sql(해시체인·append-only·서버시각·RLS)로만 확보됩니다.
// 배경: docs/SECURITY.md, README 상단 "무결성 등급표" 참고.
// ====================================================================

const STORAGE_KEYS = {
  OUS: 'sw_edms_ous',
  USERS: 'sw_edms_users',
  DOCUMENTS: 'sw_edms_documents',
  CURRENT_USER_ID: 'sw_edms_current_user_id',
  // [보완 6] 문서번호는 문서 개수(docs.length)로 만들지 않는다.
  // 연도별 단조 증가 카운터를 따로 보관해, 문서를 지워도 번호가 되돌아가거나 재사용되지 않게 한다.
  DOC_SEQ: 'sw_edms_doc_seq',
  // [보완 3] append-only 이벤트 로그(데모). 실제 무결성은 DB 해시체인이 담당.
  EVENTS: 'sw_edms_events',
  // 접속 시 첫 화면(보안 안내) 자동 표시 여부. '1' 이면 자동 표시 안 함.
  INTRO_HIDDEN: 'sw_edms_intro_hidden',
};

// 접속 시 보안 안내 첫 화면 자동 표시 여부.
export function isIntroHidden(): boolean {
  return localStorage.getItem(STORAGE_KEYS.INTRO_HIDDEN) === '1';
}
export function setIntroHidden(hidden: boolean): void {
  if (hidden) localStorage.setItem(STORAGE_KEYS.INTRO_HIDDEN, '1');
  else localStorage.removeItem(STORAGE_KEYS.INTRO_HIDDEN);
}

// [보완 3] 결재 이벤트 타입 — 상신/승인/반려/회수/폐기를 "상태값"이 아니라 "쌓이는 기록"으로.
export interface ApprovalEvent {
  seq: number;
  documentId: string;
  eventType: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'WITHDRAW' | 'DISCARD';
  stepNumber?: number;
  actorId: string;
  actorName: string;
  comment?: string;
  // ⚠️ 클라이언트 시각. 실제로는 서버 TIMESTAMPTZ DEFAULT now() 로 박아야 조작을 막는다(보완 4).
  clientTime: string;
}

// [보완 4] 데모 시각 헬퍼. 이름에 'client' 를 박아 "이 값은 신뢰할 수 없다"를 코드로 표시한다.
function nowClientTime(): string {
  const n = new Date();
  const p = (x: number) => x.toString().padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}`;
}

// [보완 3] 이벤트 append (localStorage 에서는 '진짜 append-only'가 불가능함을 주석으로 고지).
export function getEvents(): ApprovalEvent[] {
  const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
  return raw ? JSON.parse(raw) : [];
}

function appendEvent(e: Omit<ApprovalEvent, 'seq' | 'clientTime'>): void {
  const events = getEvents();
  const seq = events.length > 0 ? events[events.length - 1].seq + 1 : 1;
  events.push({ ...e, seq, clientTime: nowClientTime() });
  // NOTE: localStorage 는 트리거로 UPDATE/DELETE 를 막을 수 없다. 이건 '기록을 쌓는 습관'의 데모일 뿐이다.
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

// [보완 6] 채번 카운터를 시드 문서와 정합적으로 맞춘다.
//   시드가 SW-2026-001~007 이므로, 올해분 lastNo 를 시드 최대 번호로 세워 새 문서가 008 부터 나오게 한다.
function seedDocSeq(): void {
  const year = new Date().getFullYear();
  let maxNo = 0;
  for (const d of INITIAL_DOCUMENTS) {
    const m = d.documentNumber.match(/^SW-(\d{4})-(\d+)$/);
    if (m && Number(m[1]) === year) maxNo = Math.max(maxNo, Number(m[2]));
  }
  localStorage.setItem(STORAGE_KEYS.DOC_SEQ, JSON.stringify({ year, lastNo: maxNo }));
}

// Initialize default data if empty
export function initStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.OUS)) {
    localStorage.setItem(STORAGE_KEYS.OUS, JSON.stringify(INITIAL_OUS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOC_SEQ)) {
    seedDocSeq();
  }
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'u-4'); // Default to 최사회 (사회복지사)
  }
}

// Reset to initial mock data
export function resetStorageToDefaults(): void {
  localStorage.setItem(STORAGE_KEYS.OUS, JSON.stringify(INITIAL_OUS));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
  seedDocSeq();
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'u-4');
}

// OU Services
export function getOUs(): OU[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.OUS);
  return raw ? JSON.parse(raw) : INITIAL_OUS;
}

export function saveOU(ou: OU): OU[] {
  const ous = getOUs();
  const existingIdx = ous.findIndex((item) => item.id === ou.id);
  let updated: OU[];
  if (existingIdx >= 0) {
    updated = [...ous];
    updated[existingIdx] = ou;
  } else {
    updated = [...ous, ou];
  }
  localStorage.setItem(STORAGE_KEYS.OUS, JSON.stringify(updated));
  return updated;
}

export function deleteOU(ouId: string): OU[] {
  const ous = getOUs().filter((item) => item.id !== ouId);
  localStorage.setItem(STORAGE_KEYS.OUS, JSON.stringify(ous));
  return ous;
}

// User Services
export function getUsers(): User[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  return raw ? JSON.parse(raw) : INITIAL_USERS;
}

export function saveUser(user: User): User[] {
  const users = getUsers();
  const existingIdx = users.findIndex((u) => u.id === user.id);
  let updated: User[];
  if (existingIdx >= 0) {
    updated = [...users];
    updated[existingIdx] = user;
  } else {
    updated = [...users, user];
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
  return updated;
}

export function getCurrentUser(): User {
  initStorage();
  const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  const users = getUsers();
  return users.find((u) => u.id === currentId) || users[3] || INITIAL_USERS[3];
}

export function setCurrentUserId(userId: string): User {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  const users = getUsers();
  return users.find((u) => u.id === userId) || INITIAL_USERS[0];
}

// Document Services
export function getDocuments(): ApprovalDocument[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
  return raw ? JSON.parse(raw) : INITIAL_DOCUMENTS;
}

// [보완 6] 연도별 단조 증가 채번. (docs.length + 1) 폐기.
//   문서를 지워도 번호가 되돌아가지 않는다 → 결번이 "여기 있던 문서는 어디 갔나"의 증거로 남는다.
//   ⚠️ 진짜 원자적 발급은 DB 시퀀스(app.next_document_number)로만 보장된다(동시 상신 경쟁 조건).
function nextDocumentNumber(): string {
  const year = new Date().getFullYear();
  const raw = localStorage.getItem(STORAGE_KEYS.DOC_SEQ);
  const state: { year: number; lastNo: number } = raw ? JSON.parse(raw) : { year, lastNo: 0 };
  if (state.year !== year) {
    state.year = year;
    state.lastNo = 0;
  }
  state.lastNo += 1;
  localStorage.setItem(STORAGE_KEYS.DOC_SEQ, JSON.stringify(state));
  return `SW-${year}-${state.lastNo.toString().padStart(3, '0')}`;
}

export function createDocument(doc: Omit<ApprovalDocument, 'id' | 'documentNumber' | 'createdAt'>): ApprovalDocument {
  const docs = getDocuments();

  const newDoc: ApprovalDocument = {
    ...doc,
    id: `doc-${Date.now()}`,
    documentNumber: nextDocumentNumber(),
    createdAt: nowClientTime(),
  };

  const updated = [newDoc, ...docs];
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));

  // [보완 3] 상신 이벤트 기록.
  appendEvent({
    documentId: newDoc.id,
    eventType: 'SUBMIT',
    actorId: newDoc.drafterId,
    actorName: newDoc.drafterName,
  });
  return newDoc;
}

// [보완 2] "문서 객체 통째 교체(UPSERT)"의 위험: 결재 완료 후에도 휴가일수·여비·시간외시간을
//   바꿔치기할 수 있다. 데모에서는 최소한의 불변 가드로 이 원리를 보여준다.
//   → 이미 APPROVED 된 문서의 본문(formData)은 이 함수로 바꿀 수 없다.
//   (진짜 해법은 DB 의 append-only 리비전 + 승인이 '리비전 해시'에 묶이는 구조 — supabase_schema.sql)
function isSameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function updateDocument(doc: ApprovalDocument): ApprovalDocument[] {
  const docs = getDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    const prev = docs[idx];
    // 승인 완료 문서의 본문 변조 차단(데모 수준의 불변성 시연).
    if (prev.status === 'APPROVED' && !isSameJson(prev.formData, doc.formData)) {
      throw new Error(
        '승인 완료된 문서의 본문은 수정할 수 없습니다. ' +
        '내용을 바꾸려면 새 문서로 다시 상신하세요. (무결성 보호)'
      );
    }
    const updated = [...docs];
    updated[idx] = doc;
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));
    return updated;
  }
  return docs;
}

export function approveStep(docId: string, approverUser: User, comment?: string): ApprovalDocument | null {
  const docs = getDocuments();
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return null;

  // [보완 4] ⚠️ 클라이언트 시각 — PC 시계를 돌리면 이 값이 바뀐다. 실제로는 서버 now() 여야 한다.
  const dateStr = nowClientTime();

  let approvedStepNo: number | undefined;
  const updatedLine = doc.approvalLine.map((step) => {
    if (step.approverId === approverUser.id && step.status === 'PENDING') {
      approvedStepNo = step.step;
      return {
        ...step,
        status: 'APPROVED' as const,
        comment: comment || step.comment,
        approvedAt: dateStr,
        // [보완 5] ⚠️ stampUrl 은 '주소 참조'다. 데모라 값을 복사할 뿐, 원본 이미지가 바뀌면 과거 결재의 도장도 바뀐다.
        //   실제로는 결재 시점 도장 바이트의 해시(stamp_sha256)를 이벤트에 복사해야 한다(supabase_schema.sql).
        stampUrl: approverUser.stampUrl,
      };
    }
    return step;
  });

  const allApproved = updatedLine.every((s) => s.status === 'APPROVED');
  const newStatus: ApprovalStatus = allApproved ? 'APPROVED' : 'IN_PROGRESS';

  const updatedDoc: ApprovalDocument = {
    ...doc,
    approvalLine: updatedLine,
    status: newStatus,
  };

  updateDocument(updatedDoc);
  // [보완 3] 승인 이벤트 append.
  appendEvent({
    documentId: doc.id,
    eventType: 'APPROVE',
    stepNumber: approvedStepNo,
    actorId: approverUser.id,
    actorName: approverUser.name,
    comment,
  });
  return updatedDoc;
}

export function rejectStep(docId: string, approverUser: User, reason: string): ApprovalDocument | null {
  const docs = getDocuments();
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return null;

  let rejectedStepNo: number | undefined;
  const updatedLine = doc.approvalLine.map((step) => {
    if (step.approverId === approverUser.id) {
      rejectedStepNo = step.step;
      return {
        ...step,
        status: 'REJECTED' as const,
        comment: reason,
      };
    }
    return step;
  });

  const updatedDoc: ApprovalDocument = {
    ...doc,
    approvalLine: updatedLine,
    status: 'REJECTED',
    rejectReason: reason,
  };

  updateDocument(updatedDoc);
  // [보완 3] 반려 이벤트 append.
  appendEvent({
    documentId: doc.id,
    eventType: 'REJECT',
    stepNumber: rejectedStepNo,
    actorId: approverUser.id,
    actorName: approverUser.name,
    comment: reason,
  });
  return updatedDoc;
}
