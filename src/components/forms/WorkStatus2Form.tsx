import React from 'react';
import type { WorkStatus2FormData } from '../../types/approval';
import { Paperclip, ShieldAlert } from 'lucide-react';

interface WorkStatus2FormProps {
  formData: WorkStatus2FormData;
  onChange: (data: WorkStatus2FormData) => void;
}

export const WorkStatus2Form: React.FC<WorkStatus2FormProps> = ({ formData, onChange }) => {
  const handleChange = (field: keyof WorkStatus2FormData, value: any) => {
    const updated = { ...formData, [field]: value };
    if (field === 'startDate' || field === 'endDate') {
      if (updated.startDate && updated.endDate) {
        const start = new Date(updated.startDate);
        const end = new Date(updated.endDate);
        const diffTime = Math.max(0, end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        updated.daysCount = diffDays;
      }
    }
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #fde68a',
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#92400e',
        fontSize: '0.875rem',
      }}>
        <ShieldAlert size={18} />
        <span><strong>근무상황부(2) 안내:</strong> 공가, 병가, 경조사, 모성보호 등 특수 상황 휴가는 관련 증빙서류(진단서, 참석확인증 등)를 첨부해야 합니다.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">근무상황 구분 (휴가 종류) *</label>
          <select
            className="form-control"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value as any)}
          >
            <option value="공가">공가 (투표, 훈련, 보수교육, 법정 의무 참석 등)</option>
            <option value="병가">병가 (질병, 부상 치료)</option>
            <option value="특별휴가">특별휴가 (기관 규정 특별 부여)</option>
            <option value="경조사휴가">경조사휴가 (결혼, 사망, 회갑 등)</option>
            <option value="모성보호휴가">모성보호휴가 (검진, 유급수유시간 등)</option>
            <option value="출산휴가">출산휴가 (배우자 출산 포함)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">증빙 서류 파일명</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              value={formData.attachmentName || ''}
              onChange={(e) => handleChange('attachmentName', e.target.value)}
              placeholder="예: 사회복지사_보수교육_참석증.pdf"
            />
            <label className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}>
              <Paperclip size={16} />
              첨부
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">시작일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">종료일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">총 일수</label>
          <input
            type="number"
            className="form-control"
            value={formData.daysCount}
            readOnly
            style={{ backgroundColor: 'var(--bg-main)', fontWeight: 700, color: 'var(--primary)' }}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">근무상황 신청 상세 사유 *</label>
        <textarea
          className="form-control"
          rows={3}
          value={formData.reason}
          onChange={(e) => handleChange('reason', e.target.value)}
          placeholder="공가/병가 사유 및 참석 기관, 법적 근거 등을 입력하세요."
        />
      </div>
    </div>
  );
};
