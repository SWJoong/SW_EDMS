import React from 'react';
import type { ApprovalStep, JobTitle } from '../../types/approval';
import { generateDefaultStampSvg } from '../../services/stampHelper';

interface StampBlockProps {
  drafterName: string;
  drafterJobTitle: JobTitle;
  drafterStampUrl?: string;
  approvalLine: ApprovalStep[];
  createdAt: string;
}

export const StampBlock: React.FC<StampBlockProps> = ({
  drafterName,
  drafterJobTitle,
  drafterStampUrl,
  approvalLine,
  createdAt,
}) => {
  const defaultDrafterStamp = drafterStampUrl || generateDefaultStampSvg(drafterName);
  const drafterDateOnly = createdAt.split(' ')[0] || createdAt;

  return (
    <table className="approval-grid-table">
      <tbody>
        <tr>
          <th rowSpan={3} className="approval-header-cell">
            결재
          </th>
          <td className="approval-title-cell">{drafterJobTitle || '기안자'}</td>
          {approvalLine.map((step, idx) => (
            <td key={idx} className="approval-title-cell">
              {step.approverJobTitle}
            </td>
          ))}
        </tr>

        <tr>
          <td className="approval-stamp-cell">
            <div className="stamp-wrapper">
              <img
                src={defaultDrafterStamp}
                alt="기안자 날인"
                className="stamp-image"
              />
              <div className="stamp-date">{drafterDateOnly}</div>
            </div>
          </td>

          {approvalLine.map((step, idx) => (
            <td key={idx} className="approval-stamp-cell">
              {step.status === 'APPROVED' ? (
                <div className="stamp-wrapper">
                  <img
                    src={step.stampUrl || generateDefaultStampSvg(step.approverName)}
                    alt={`${step.approverName} 날인`}
                    className="stamp-image"
                  />
                  <div className="stamp-date">
                    {step.approvedAt ? step.approvedAt.split(' ')[0] : '승인'}
                  </div>
                </div>
              ) : step.status === 'REJECTED' ? (
                <div className="stamp-wrapper">
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '11px' }}>
                    반려
                  </span>
                </div>
              ) : (
                <div className="stamp-wrapper">
                  <span className="stamp-pending-text">대기</span>
                </div>
              )}
            </td>
          ))}
        </tr>

        <tr>
          <td style={{ fontSize: '11px', fontWeight: 600, padding: '2px 4px' }}>
            {drafterName}
          </td>
          {approvalLine.map((step, idx) => (
            <td key={idx} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 4px' }}>
              {step.approverName}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
};
