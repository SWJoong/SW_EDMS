import React from 'react';
import type { EducationReportFormData, ApprovalDocument } from '../../types/approval';
import { FileCheck, Link2, Paperclip } from 'lucide-react';

interface EducationReportFormProps {
  formData: EducationReportFormData;
  onChange: (data: EducationReportFormData) => void;
  approvedEducations: ApprovalDocument[];
}

export const EducationReportForm: React.FC<EducationReportFormProps> = ({
  formData,
  onChange,
  approvedEducations,
}) => {
  const handleChange = (field: keyof EducationReportFormData, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  const handleSelectLinkedApply = (applyId: string) => {
    const applyDoc = approvedEducations.find((d) => d.id === applyId);
    if (applyDoc && applyDoc.category === 'EDUCATION_APPLY') {
      const applyData = applyDoc.formData as any;
      onChange({
        ...formData,
        linkedApplyId: applyId,
        title: applyData.title,
        institution: applyData.institution,
        completedDate: applyData.endDate || applyData.startDate,
        summary: `1일차: ${applyData.title} 기본 이론 및 사회복지 현장 적용 사례 연구.\n2일차: 실습 및 질의응답`,
        learnings: `${applyData.reason}\n\n[실무 시사점 및 공유 계획]\n- 팀 내 월례 회의 시 교육 내용 브리핑 및 자료 공유 예정.`,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        backgroundColor: '#d1fae5',
        border: '1px solid #a7f3d0',
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#065f46',
        fontSize: '0.875rem',
      }}>
        <FileCheck size={18} />
        <span><strong>교육 결과보고 안내:</strong> 승인 완료된 교육신청서를 연동하여 교육 수강 완료 후 7일 이내에 결과보고서 및 이수증을 제출합니다.</span>
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Link2 size={16} style={{ color: 'var(--primary)' }} />
          승인 완료된 사전 교육신청서 연동 (선택)
        </label>
        <select
          className="form-control"
          value={formData.linkedApplyId || ''}
          onChange={(e) => handleSelectLinkedApply(e.target.value)}
        >
          <option value="">-- 사전 교육신청서 직접 선택 --</option>
          {approvedEducations.map((doc) => (
            <option key={doc.id} value={doc.id}>
              [{doc.documentNumber}] {doc.title} ({doc.createdAt})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">이수한 교육명 *</label>
          <input
            type="text"
            className="form-control"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="예: 고위험 가구 심층 사례관리 실무 심화과정"
          />
        </div>

        <div className="form-group">
          <label className="form-label">교육 기관 *</label>
          <input
            type="text"
            className="form-control"
            value={formData.institution}
            onChange={(e) => handleChange('institution', e.target.value)}
            placeholder="예: 한국사회복지사협회"
          />
        </div>

        <div className="form-group">
          <label className="form-label">교육 수료일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.completedDate}
            onChange={(e) => handleChange('completedDate', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">주요 교육 내용 요약 *</label>
        <textarea
          className="form-control"
          rows={3}
          value={formData.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          placeholder="교육 과정에서 학습한 핵심 세부 내용을 요약 작성하세요."
        />
      </div>

      <div className="form-group">
        <label className="form-label">기관 업무 적용 방안 및 시사점 *</label>
        <textarea
          className="form-control"
          rows={3}
          value={formData.learnings}
          onChange={(e) => handleChange('learnings', e.target.value)}
          placeholder="본 교육을 통해 얻은 지식을 실제 소속 팀/기관 복지 사업에 어떻게 적용할 것인지 기술하세요."
        />
      </div>

      <div className="form-group">
        <label className="form-label">교육 이수증 첨부 파일명</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-control"
            value={formData.attachmentName || ''}
            onChange={(e) => handleChange('attachmentName', e.target.value)}
            placeholder="예: 교육이수증_최사회.pdf"
          />
          <label className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <Paperclip size={16} />
            파일 첨부
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                const name = e.target.files?.[0]?.name;
                if (name) handleChange('attachmentName', name);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
