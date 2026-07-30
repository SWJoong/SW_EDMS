export type Role = 'DIRECTOR' | 'MIDDLE_MANAGER' | 'STAFF';

export type JobTitle = '관장' | '센터장' | '사무국장' | '과장' | '팀장' | '주임' | '사회복지사' | '행정원';

export interface OU {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  ouId: string;
  ouName: string;
  role: Role;
  jobTitle: JobTitle;
  email: string;
  phone: string;
  stampUrl?: string; // Base64 or image URL of electronic seal
  signatureText?: string; // Standard stamp text (e.g. 홍길동인)
}

export type ApprovalStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';

export type DocumentCategory =
  | 'LEAVE'
  | 'WORK_STATUS_2'
  | 'BUSINESS_TRIP'
  | 'OVERTIME_ORDER'
  | 'OVERTIME_CONFIRM'
  | 'EDUCATION_APPLY'
  | 'EDUCATION_REPORT';

export interface ApprovalStep {
  step: number; // 1: 중간결재자, 2: 최고결정권자
  approverId: string;
  approverName: string;
  approverRole: Role;
  approverJobTitle: JobTitle;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedAt?: string;
  stampUrl?: string;
}

// 1. 연차사용신청서 Data
export interface LeaveFormData {
  leaveType: '연차' | '반차(오전)' | '반차(오후)' | '조퇴';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  emergencyContact: string;
}

// 2. 근무상황부2 Data
export interface WorkStatus2FormData {
  category: '공가' | '병가' | '특별휴가' | '경조사휴가' | '모성보호휴가' | '출산휴가';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  attachmentName?: string;
}

// 3. 출장신청서 Data
export interface BusinessTripFormData {
  tripType: '관내출장' | '관외출장';
  destination: string;
  address?: string;
  lat?: number;
  lng?: number;
  startDate: string;
  endDate: string;
  purpose: string;
  transportation: '대중교통' | '기관차량' | '자급차량' | '도보';
  budgetEstimate: number;
  notes?: string;
}

// 4. 시간외근무명령서 Data
export interface OvertimeOrderFormData {
  workDate: string;
  startTime: string;
  endTime: string;
  plannedHours: number;
  reason: string;
  workContent: string;
}

// 5. 시간외근무확인서 Data
export interface OvertimeConfirmFormData {
  linkedOrderId?: string;
  workDate: string;
  actualStartTime: string;
  actualEndTime: string;
  actualHours: number;
  workDetailReport: string;
}

// 6. 교육신청서 Data
export interface EducationApplyFormData {
  title: string;
  institution: string;
  category: '직무교육' | '인권/안전교육' | '의무보수교육' | '기타';
  startDate: string;
  endDate: string;
  fee: number;
  reason: string;
}

// 7. 교육 결과보고서 Data
export interface EducationReportFormData {
  linkedApplyId?: string;
  title: string;
  institution: string;
  completedDate: string;
  summary: string;
  learnings: string;
  attachmentName?: string;
}

export type DocumentFormData =
  | LeaveFormData
  | WorkStatus2FormData
  | BusinessTripFormData
  | OvertimeOrderFormData
  | OvertimeConfirmFormData
  | EducationApplyFormData
  | EducationReportFormData;

export interface ApprovalDocument {
  id: string;
  documentNumber: string;
  category: DocumentCategory;
  title: string;
  drafterId: string;
  drafterName: string;
  drafterOU: string;
  drafterJobTitle: JobTitle;
  createdAt: string;
  status: ApprovalStatus;
  approvalLine: ApprovalStep[];
  formData: DocumentFormData;
  rejectReason?: string;
}
