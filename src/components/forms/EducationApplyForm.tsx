import React from 'react';
import type { EducationApplyFormData } from '../../types/approval';
import { GraduationCap } from 'lucide-react';

interface EducationApplyFormProps {
  formData: EducationApplyFormData;
  onChange: (data: EducationApplyFormData) => void;
}

export const EducationApplyForm: React.FC<EducationApplyFormProps> = ({ formData, onChange }) => {
  const handleChange = (field: keyof EducationApplyFormData, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        backgroundColor: '#f3e8ff',
        border: '1px solid #e9d5ff',
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#6b21a8',
        fontSize: '0.875rem',
      }}>
        <GraduationCap size={18} />
        <span><strong>직무 교육 신청 안내:</strong> 사회복지사 보수교육, 외부 전문 직무교육, 인권 및 안전 의무교육 참가 신청서입니다.</span>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">교육명 (과정명) *</label>
          <input
            type="text"
            className="form-control"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="예: 고위험 가구 심층 사례관리 실무 심화과정"
          />
        </div>

        <div className="form-group">
          <label className="form-label">교육 구분 *</label>
          <select
            className="form-control"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value as any)}
          >
            <option value="직무교육">직무 전문성 교육</option>
            <option value="의무보수교육">사회복지사 의무 보수교육</option>
            <option value="인권/안전교육">인권 / 시설 안전 교육</option>
            <option value="기타">기타 워크숍 / 세미나</option>
          </select>
        </div>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">교육 주관 기관 *</label>
          <input
            type="text"
            className="form-control"
            value={formData.institution}
            onChange={(e) => handleChange('institution', e.target.value)}
            placeholder="예: 한국사회복지사협회"
          />
        </div>

        <div className="form-group">
          <label className="form-label">교육 시작일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">교육 종료일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">교육 수강료 (원) *</label>
          <input
            type="number"
            className="form-control"
            value={formData.fee}
            onChange={(e) => handleChange('fee', Number(e.target.value))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">교육 참석 목적 및 직무 연관성 *</label>
        <textarea
          className="form-control"
          rows={3}
          value={formData.reason}
          onChange={(e) => handleChange('reason', e.target.value)}
          placeholder="해당 교육 수강을 통한 실무적 활용 기대효과 및 수강 목적을 기술하세요."
        />
      </div>
    </div>
  );
};
