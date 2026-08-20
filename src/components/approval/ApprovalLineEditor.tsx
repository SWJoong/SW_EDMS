import React from 'react';
import type { User, ApprovalStep } from '../../types/approval';
import { Shield } from 'lucide-react';

interface ApprovalLineEditorProps {
  allUsers: User[];
  currentUser: User;
  approvalSteps: ApprovalStep[];
  onApprovalStepsChange: (steps: ApprovalStep[]) => void;
}

export const ApprovalLineEditor: React.FC<ApprovalLineEditorProps> = ({
  allUsers,
  currentUser,
  approvalSteps,
  onApprovalStepsChange,
}) => {
  const middleManagers = allUsers.filter(
    (u) => u.role === 'MIDDLE_MANAGER' && u.id !== currentUser.id
  );
  const directors = allUsers.filter(
    (u) => u.role === 'DIRECTOR' && u.id !== currentUser.id
  );

  const handleStep1Change = (approverId: string) => {
    const approver = allUsers.find((u) => u.id === approverId);
    if (!approver) return;

    const newSteps = [...approvalSteps];
    newSteps[0] = {
      step: 1,
      approverId: approver.id,
      approverName: approver.name,
      approverRole: approver.role,
      approverJobTitle: approver.jobTitle,
      status: 'PENDING',
    };
    onApprovalStepsChange(newSteps);
  };

  const handleStep2Change = (approverId: string) => {
    const approver = allUsers.find((u) => u.id === approverId);
    if (!approver) return;

    const newSteps = [...approvalSteps];
    newSteps[1] = {
      step: 2,
      approverId: approver.id,
      approverName: approver.name,
      approverRole: approver.role,
      approverJobTitle: approver.jobTitle,
      status: 'PENDING',
    };
    onApprovalStepsChange(newSteps);
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-main)',
      padding: '1.25rem',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      marginBottom: '1.5rem',
    }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Shield size={18} style={{ color: 'var(--primary)' }} />
        결재선 지정 (수직적 2단계 결재)
      </h3>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>1. 기안자 (신청)</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.25rem' }}>
            [{currentUser.jobTitle}] {currentUser.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser.ouName}</div>
        </div>

        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>2. 중간 결재자 (검토/승인)</div>
          <select
            className="form-control"
            style={{ marginTop: '0.35rem' }}
            value={approvalSteps[0]?.approverId || ''}
            onChange={(e) => handleStep1Change(e.target.value)}
          >
            {middleManagers.map((u) => (
              <option key={u.id} value={u.id}>
                [{u.jobTitle}] {u.name} ({u.ouName})
              </option>
            ))}
          </select>
        </div>

        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>3. 최고 결정권자 (최종승인)</div>
          <select
            className="form-control"
            style={{ marginTop: '0.35rem' }}
            value={approvalSteps[1]?.approverId || ''}
            onChange={(e) => handleStep2Change(e.target.value)}
          >
            {directors.map((u) => (
              <option key={u.id} value={u.id}>
                [{u.jobTitle}] {u.name} ({u.ouName})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
