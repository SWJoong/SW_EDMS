import React, { useState } from 'react';
import type {
  User,
  DocumentCategory,
  ApprovalStep,
  ApprovalDocument,
  LeaveFormData,
  WorkStatus2FormData,
  BusinessTripFormData,
  OvertimeOrderFormData,
  OvertimeConfirmFormData,
  EducationApplyFormData,
  EducationReportFormData,
} from '../../types/approval';
import { ApprovalLineEditor } from '../approval/ApprovalLineEditor';
import { LeaveForm } from '../forms/LeaveForm';
import { WorkStatus2Form } from '../forms/WorkStatus2Form';
import { BusinessTripForm } from '../forms/BusinessTripForm';
import { OvertimeOrderForm } from '../forms/OvertimeOrderForm';
import { OvertimeConfirmForm } from '../forms/OvertimeConfirmForm';
import { EducationApplyForm } from '../forms/EducationApplyForm';
import { EducationReportForm } from '../forms/EducationReportForm';
import { createDocument } from '../../services/storage';
import { Send, X, FileText } from 'lucide-react';

interface NewDocumentModalProps {
  currentUser: User;
  allUsers: User[];
  initialCategory?: DocumentCategory;
  allDocuments: ApprovalDocument[];
  onClose: () => void;
  onDocumentCreated: (newDoc: ApprovalDocument) => void;
}

export const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
  currentUser,
  allUsers,
  initialCategory = 'LEAVE',
  allDocuments,
  onClose,
  onDocumentCreated,
}) => {
  const [category, setCategory] = useState<DocumentCategory>(initialCategory);
  const [title, setTitle] = useState('');

  const defaultMiddleManager = allUsers.find(
    (u) => u.role === 'MIDDLE_MANAGER' && u.id !== currentUser.id
  ) || allUsers[1];
  const defaultDirector = allUsers.find(
    (u) => u.role === 'DIRECTOR' && u.id !== currentUser.id
  ) || allUsers[0];

  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([
    {
      step: 1,
      approverId: defaultMiddleManager.id,
      approverName: defaultMiddleManager.name,
      approverRole: defaultMiddleManager.role,
      approverJobTitle: defaultMiddleManager.jobTitle,
      status: 'PENDING',
    },
    {
      step: 2,
      approverId: defaultDirector.id,
      approverName: defaultDirector.name,
      approverRole: defaultDirector.role,
      approverJobTitle: defaultDirector.jobTitle,
      status: 'PENDING',
    },
  ]);

  const [leaveData, setLeaveData] = useState<LeaveFormData>({
    leaveType: '연차',
    startDate: '2026-08-01',
    endDate: '2026-08-01',
    daysCount: 1,
    reason: '',
    emergencyContact: currentUser.phone,
  });

  const [workStatus2Data, setWorkStatus2Data] = useState<WorkStatus2FormData>({
    category: '공가',
    startDate: '2026-08-01',
    endDate: '2026-08-01',
    daysCount: 1,
    reason: '',
  });

  const [businessTripData, setBusinessTripData] = useState<BusinessTripFormData>({
    tripType: '관내출장',
    destination: '',
    startDate: '2026-08-01',
    endDate: '2026-08-01',
    purpose: '',
    transportation: '대중교통',
    budgetEstimate: 10000,
  });

  const [overtimeOrderData, setOvertimeOrderData] = useState<OvertimeOrderFormData>({
    workDate: '2026-08-01',
    startTime: '18:00',
    endTime: '21:00',
    plannedHours: 3,
    reason: '',
    workContent: '',
  });

  const [overtimeConfirmData, setOvertimeConfirmData] = useState<OvertimeConfirmFormData>({
    workDate: '2026-08-01',
    actualStartTime: '18:00',
    actualEndTime: '21:00',
    actualHours: 3,
    workDetailReport: '',
  });

  const [educationApplyData, setEducationApplyData] = useState<EducationApplyFormData>({
    title: '',
    institution: '',
    category: '직무교육',
    startDate: '2026-08-05',
    endDate: '2026-08-05',
    fee: 0,
    reason: '',
  });

  const [educationReportData, setEducationReportData] = useState<EducationReportFormData>({
    title: '',
    institution: '',
    completedDate: '2026-08-05',
    summary: '',
    learnings: '',
  });

  const approvedOvertimeOrders = allDocuments.filter(
    (d) => d.category === 'OVERTIME_ORDER' && d.status === 'APPROVED'
  );

  const approvedEducations = allDocuments.filter(
    (d) => d.category === 'EDUCATION_APPLY' && d.status === 'APPROVED'
  );

  const getAutoTitle = (cat: DocumentCategory) => {
    const name = currentUser.name;
    switch (cat) {
      case 'LEAVE': return `연차 사용 신청서 (${name})`;
      case 'WORK_STATUS_2': return `근무상황부(2) 신청서 (${name})`;
      case 'BUSINESS_TRIP': return `관외/관내 출장 신청서 (${name})`;
      case 'OVERTIME_ORDER': return `시간외근무 사전 명령서 (${name})`;
      case 'OVERTIME_CONFIRM': return `시간외근무 이행 실적 확인서 (${name})`;
      case 'EDUCATION_APPLY': return `직무 교육 참가 신청서 (${name})`;
      case 'EDUCATION_REPORT': return `직무 교육 결과보고서 (${name})`;
    }
  };

  const handleCategorySelect = (cat: DocumentCategory) => {
    setCategory(cat);
    if (!title || title === getAutoTitle(category)) {
      setTitle(getAutoTitle(cat));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title || getAutoTitle(category);

    let formDataPayload: any;
    switch (category) {
      case 'LEAVE': formDataPayload = leaveData; break;
      case 'WORK_STATUS_2': formDataPayload = workStatus2Data; break;
      case 'BUSINESS_TRIP': formDataPayload = businessTripData; break;
      case 'OVERTIME_ORDER': formDataPayload = overtimeOrderData; break;
      case 'OVERTIME_CONFIRM': formDataPayload = overtimeConfirmData; break;
      case 'EDUCATION_APPLY': formDataPayload = educationApplyData; break;
      case 'EDUCATION_REPORT': formDataPayload = educationReportData; break;
    }

    const newDoc = createDocument({
      category,
      title: finalTitle,
      drafterId: currentUser.id,
      drafterName: currentUser.name,
      drafterOU: currentUser.ouName,
      drafterJobTitle: currentUser.jobTitle,
      status: 'PENDING',
      approvalLine: approvalSteps,
      formData: formDataPayload,
    });

    onDocumentCreated(newDoc);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '880px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>사회복지 행정 서식 전자결재 기안 작성</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label">1. 행정 서식 종류 선택 (7대 필수 서식)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { id: 'LEAVE', name: '1. 연차사용신청' },
                { id: 'WORK_STATUS_2', name: '2. 근무상황부(2)' },
                { id: 'BUSINESS_TRIP', name: '3. 출장신청서' },
                { id: 'OVERTIME_ORDER', name: '4. 시간외명령서' },
                { id: 'OVERTIME_CONFIRM', name: '5. 시간외확인서' },
                { id: 'EDUCATION_APPLY', name: '6. 교육신청서' },
                { id: 'EDUCATION_REPORT', name: '7. 교육결과보고' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCategorySelect(item.id as DocumentCategory)}
                  style={{
                    padding: '0.6rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: category === item.id ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: category === item.id ? 'var(--primary-light)' : 'var(--bg-card)',
                    color: category === item.id ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: category === item.id ? 700 : 500,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">2. 문서 제목 *</label>
            <input
              type="text"
              className="form-control"
              value={title || getAutoTitle(category)}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문서 제목을 입력하세요."
              required
            />
          </div>

          <ApprovalLineEditor
            allUsers={allUsers}
            currentUser={currentUser}
            approvalSteps={approvalSteps}
            onApprovalStepsChange={setApprovalSteps}
          />

          <div className="card" style={{ marginBottom: 0, backgroundColor: 'var(--bg-card)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              3. 서식 세부 내용 입력
            </h4>

            {category === 'LEAVE' && (
              <LeaveForm formData={leaveData} onChange={setLeaveData} />
            )}
            {category === 'WORK_STATUS_2' && (
              <WorkStatus2Form formData={workStatus2Data} onChange={setWorkStatus2Data} />
            )}
            {category === 'BUSINESS_TRIP' && (
              <BusinessTripForm formData={businessTripData} onChange={setBusinessTripData} />
            )}
            {category === 'OVERTIME_ORDER' && (
              <OvertimeOrderForm formData={overtimeOrderData} onChange={setOvertimeOrderData} />
            )}
            {category === 'OVERTIME_CONFIRM' && (
              <OvertimeConfirmForm
                formData={overtimeConfirmData}
                onChange={setOvertimeConfirmData}
                approvedOrders={approvedOvertimeOrders}
              />
            )}
            {category === 'EDUCATION_APPLY' && (
              <EducationApplyForm formData={educationApplyData} onChange={setEducationApplyData} />
            )}
            {category === 'EDUCATION_REPORT' && (
              <EducationReportForm
                formData={educationReportData}
                onChange={setEducationReportData}
                approvedEducations={approvedEducations}
              />
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <Send size={18} />
            결재 상신 (제출하기)
          </button>
        </div>
      </div>
    </div>
  );
};
