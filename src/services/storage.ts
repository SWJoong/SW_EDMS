import type { OU, User, ApprovalDocument, ApprovalStatus } from '../types/approval';
import { INITIAL_OUS, INITIAL_USERS, INITIAL_DOCUMENTS } from './mockData';

const STORAGE_KEYS = {
  OUS: 'sw_edms_ous',
  USERS: 'sw_edms_users',
  DOCUMENTS: 'sw_edms_documents',
  CURRENT_USER_ID: 'sw_edms_current_user_id',
};

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
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'u-4'); // Default to 최사회 (사회복지사)
  }
}

// Reset to initial mock data
export function resetStorageToDefaults(): void {
  localStorage.setItem(STORAGE_KEYS.OUS, JSON.stringify(INITIAL_OUS));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
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

export function createDocument(doc: Omit<ApprovalDocument, 'id' | 'documentNumber' | 'createdAt'>): ApprovalDocument {
  const docs = getDocuments();
  const seq = (docs.length + 1).toString().padStart(3, '0');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const newDoc: ApprovalDocument = {
    ...doc,
    id: `doc-${Date.now()}`,
    documentNumber: `SW-${now.getFullYear()}-${seq}`,
    createdAt: dateStr,
  };

  const updated = [newDoc, ...docs];
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));
  return newDoc;
}

export function updateDocument(doc: ApprovalDocument): ApprovalDocument[] {
  const docs = getDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
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

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const updatedLine = doc.approvalLine.map((step) => {
    if (step.approverId === approverUser.id && step.status === 'PENDING') {
      return {
        ...step,
        status: 'APPROVED' as const,
        comment: comment || step.comment,
        approvedAt: dateStr,
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
  return updatedDoc;
}

export function rejectStep(docId: string, approverUser: User, reason: string): ApprovalDocument | null {
  const docs = getDocuments();
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return null;

  const updatedLine = doc.approvalLine.map((step) => {
    if (step.approverId === approverUser.id) {
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
  return updatedDoc;
}
