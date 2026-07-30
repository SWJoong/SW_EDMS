import React from 'react';
import type { OvertimeConfirmFormData, ApprovalDocument } from '../../types/approval';
import { CheckSquare, Link2 } from 'lucide-react';

interface OvertimeConfirmFormProps {
  formData: OvertimeConfirmFormData;
  onChange: (data: OvertimeConfirmFormData) => void;
  approvedOrders: ApprovalDocument[];
}

export const OvertimeConfirmForm: React.FC<OvertimeConfirmFormProps> = ({
  formData,
  onChange,
  approvedOrders,
}) => {
  const handleChange = (field: keyof OvertimeConfirmFormData, value: any) => {
    const updated = { ...formData, [field]: value };

    if (field === 'actualStartTime' || field === 'actualEndTime') {
      if (updated.actualStartTime && updated.actualEndTime) {
        const [sh, sm] = updated.actualStartTime.split(':').map(Number);
        const [eh, em] = updated.actualEndTime.split(':').map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        if (endMinutes > startMinutes) {
          const hours = (endMinutes - startMinutes) / 60;
          updated.actualHours = Number(hours.toFixed(1));
        }
      }
    }
    onChange(updated);
  };

  const handleSelectLinkedOrder = (orderId: string) => {
    const orderDoc = approvedOrders.find((d) => d.id === orderId);
    if (orderDoc && orderDoc.category === 'OVERTIME_ORDER') {
      const orderData = orderDoc.formData as any;
      onChange({
        ...formData,
        linkedOrderId: orderId,
        workDate: orderData.workDate,
        actualStartTime: orderData.startTime,
        actualEndTime: orderData.endTime,
        actualHours: orderData.plannedHours,
        workDetailReport: `[사전명령 연동 건]\n명령사유: ${orderData.reason}\n\n실제 수행 실적:\n- ${orderData.workContent}`,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        backgroundColor: '#dbeafe',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#1e40af',
        fontSize: '0.875rem',
      }}>
        <CheckSquare size={18} />
        <span><strong>시간외근무 실적확인 안내:</strong> 승인 완료된 사전 시간외근무명령서를 불러와 실제 이행한 실적 시간을 기록합니다.</span>
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Link2 size={16} style={{ color: 'var(--primary)' }} />
          승인 완료된 사전 시간외근무명령서 연동 (선택)
        </label>
        <select
          className="form-control"
          value={formData.linkedOrderId || ''}
          onChange={(e) => handleSelectLinkedOrder(e.target.value)}
        >
          <option value="">-- 사전 명령서 직접 선택 --</option>
          {approvedOrders.map((order) => (
            <option key={order.id} value={order.id}>
              [{order.documentNumber}] {order.title} ({order.createdAt})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">실제 근무일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.workDate}
            onChange={(e) => handleChange('workDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">실제 시작시간 *</label>
          <input
            type="time"
            className="form-control"
            value={formData.actualStartTime}
            onChange={(e) => handleChange('actualStartTime', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">실제 종료시간 *</label>
          <input
            type="time"
            className="form-control"
            value={formData.actualEndTime}
            onChange={(e) => handleChange('actualEndTime', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">최종 실적 시간</label>
          <input
            type="number"
            step="0.5"
            className="form-control"
            value={formData.actualHours}
            readOnly
            style={{ backgroundColor: 'var(--bg-main)', fontWeight: 700, color: 'var(--status-approved)' }}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">실제 수행 업무 결과 및 실적 보고 *</label>
        <textarea
          className="form-control"
          rows={4}
          value={formData.workDetailReport}
          onChange={(e) => handleChange('workDetailReport', e.target.value)}
          placeholder="시간대별 수행한 실제 업무 내용 및 성과를 상세히 보고합니다."
        />
      </div>
    </div>
  );
};
