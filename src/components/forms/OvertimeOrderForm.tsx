import React from 'react';
import type { OvertimeOrderFormData } from '../../types/approval';
import { Info } from 'lucide-react';

interface OvertimeOrderFormProps {
  formData: OvertimeOrderFormData;
  onChange: (data: OvertimeOrderFormData) => void;
}

export const OvertimeOrderForm: React.FC<OvertimeOrderFormProps> = ({ formData, onChange }) => {
  const handleChange = (field: keyof OvertimeOrderFormData, value: any) => {
    const updated = { ...formData, [field]: value };

    if (field === 'startTime' || field === 'endTime') {
      if (updated.startTime && updated.endTime) {
        const [sh, sm] = updated.startTime.split(':').map(Number);
        const [eh, em] = updated.endTime.split(':').map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        if (endMinutes > startMinutes) {
          const hours = (endMinutes - startMinutes) / 60;
          updated.plannedHours = Number(hours.toFixed(1));
        }
      }
    }
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        backgroundColor: '#f1f5f9',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#334155',
        fontSize: '0.875rem',
      }}>
        <Info size={18} />
        <span><strong>시간외근무 사전명령 안내:</strong> 근로기준법 및 기관 규정에 의거하여 시간외근무 시행 1일 전 사전 승인을 완료해야 합니다.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">시간외근무 예정일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.workDate}
            onChange={(e) => handleChange('workDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">시작 시간 *</label>
          <input
            type="time"
            className="form-control"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">종료 시간 *</label>
          <input
            type="time"
            className="form-control"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">예정 인정 시간</label>
          <input
            type="number"
            step="0.5"
            className="form-control"
            value={formData.plannedHours}
            readOnly
            style={{ backgroundColor: 'var(--bg-main)', fontWeight: 700, color: 'var(--primary)' }}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">시간외근무 신청 사유 *</label>
        <input
          type="text"
          className="form-control"
          value={formData.reason}
          onChange={(e) => handleChange('reason', e.target.value)}
          placeholder="예: 2026 희망나눔 바자회 기부물품 분류 및 행사장 설치 작업"
        />
      </div>

      <div className="form-group">
        <label className="form-label">세부 수행 업무 내용 *</label>
        <textarea
          className="form-control"
          rows={3}
          value={formData.workContent}
          onChange={(e) => handleChange('workContent', e.target.value)}
          placeholder="구체적인 업무 내용 및 시간대별 작업 계획을 상세히 기록하세요."
        />
      </div>
    </div>
  );
};
