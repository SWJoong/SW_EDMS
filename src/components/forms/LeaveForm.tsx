import React, { useState } from 'react';
import type { LeaveFormData } from '../../types/approval';
import { Clock } from 'lucide-react';

interface LeaveFormProps {
  formData: LeaveFormData;
  onChange: (data: LeaveFormData) => void;
}

export const LeaveForm: React.FC<LeaveFormProps> = ({ formData, onChange }) => {
  const [remLeave] = useState(15.0);

  const handleChange = (field: keyof LeaveFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    if (field === 'startDate' || field === 'endDate' || field === 'leaveType') {
      if (updated.leaveType.startsWith('반차')) {
        updated.daysCount = 0.5;
      } else if (updated.leaveType === '조퇴') {
        updated.daysCount = 0.25;
      } else if (updated.startDate && updated.endDate) {
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
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#1e40af',
        fontSize: '0.875rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} />
          <span><strong>2026년 잔여 연차:</strong> 총 15.0일 중 <strong>{remLeave - formData.daysCount}일</strong> 남음</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
          신청 차감 연차: {formData.daysCount}일
        </span>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">휴가구분 *</label>
          <select
            className="form-control"
            value={formData.leaveType}
            onChange={(e) => handleChange('leaveType', e.target.value as any)}
          >
            <option value="연차">연차 (전일)</option>
            <option value="반차(오전)">반차 (오전 09:00~13:00)</option>
            <option value="반차(오후)">반차 (오후 14:00~18:00)</option>
            <option value="조퇴">조퇴 (2시간 이하)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">비상 연락처 *</label>
          <input
            type="text"
            className="form-control"
            value={formData.emergencyContact}
            onChange={(e) => handleChange('emergencyContact', e.target.value)}
            placeholder="예: 010-1234-5678"
          />
        </div>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">휴가 시작일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">휴가 종료일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            disabled={formData.leaveType !== '연차'}
          />
        </div>

        <div className="form-group">
          <label className="form-label">신청 일수</label>
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
        <label className="form-label">연차 사용 사유 *</label>
        <textarea
          className="form-control"
          rows={3}
          value={formData.reason}
          onChange={(e) => handleChange('reason', e.target.value)}
          placeholder="연차 사용 사유를 구체적으로 입력하세요 (예: 개인 사유, 가족 행사, 건강검진 등)"
        />
      </div>
    </div>
  );
};
