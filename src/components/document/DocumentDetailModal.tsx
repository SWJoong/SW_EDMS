import React, { useState } from 'react';
import type { ApprovalDocument, User, DocumentCategory } from '../../types/approval';
import { StampBlock } from '../approval/StampBlock';
import { approveStep, rejectStep } from '../../services/storage';
import { Printer, CheckCircle, XCircle, X, Shield, Paperclip } from 'lucide-react';

interface DocumentDetailModalProps {
  document: ApprovalDocument | null;
  currentUser: User;
  onClose: () => void;
  onDocumentUpdated: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  currentUser,
  onClose,
  onDocumentUpdated,
}) => {
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  if (!document) return null;

  const pendingStep = document.approvalLine.find((s) => s.status === 'PENDING');
  const isPendingForMe = pendingStep?.approverId === currentUser.id;

  const handleApprove = () => {
    approveStep(document.id, currentUser, comment);
    onDocumentUpdated();
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason) {
      alert('반려 사유를 필히 입력해 주십시오.');
      return;
    }
    rejectStep(document.id, currentUser, rejectReason);
    onDocumentUpdated();
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const getFormTitle = (category: DocumentCategory) => {
    switch (category) {
      case 'LEAVE': return '연 차 사 용 신 청 서';
      case 'WORK_STATUS_2': return '근 무 상 황 부 ( 2 )';
      case 'BUSINESS_TRIP': return '출 장 신 청 서';
      case 'OVERTIME_ORDER': return '시 간 외 근 무 명 령 서';
      case 'OVERTIME_CONFIRM': return '시 간 외 근 무 확 인 서';
      case 'EDUCATION_APPLY': return '교 육 신 청 서';
      case 'EDUCATION_REPORT': return '교 육 결 과 보 고 서';
    }
  };

  const formData = document.formData as any;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px' }}>
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={`badge ${
              document.status === 'APPROVED'
                ? 'badge-approved'
                : document.status === 'REJECTED'
                ? 'badge-rejected'
                : 'badge-progress'
            }`}>
              {document.status === 'APPROVED'
                ? '결재완료 (보존)'
                : document.status === 'REJECTED'
                ? '반려됨'
                : '결재 진행중'}
            </span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              [{document.documentNumber}] {document.title}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={16} />
              인쇄 / PDF 출력
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: 0, backgroundColor: '#f8fafc' }}>
          <div className="doc-paper">
            <div className="doc-header-grid">
              <div className="doc-title-box">
                <div className="doc-title">{getFormTitle(document.category)}</div>
                <div className="doc-subtitle">사회복지기관 행정 전자결재 표준 서식</div>
              </div>

              <StampBlock
                drafterName={document.drafterName}
                drafterJobTitle={document.drafterJobTitle}
                approvalLine={document.approvalLine}
                createdAt={document.createdAt}
              />
            </div>

            <table className="doc-info-table">
              <tbody>
                <tr>
                  <th>문 서 번 호</th>
                  <td>{document.documentNumber}</td>
                  <th>기 안 일 시</th>
                  <td>{document.createdAt}</td>
                </tr>
                <tr>
                  <th>소 속 부 서</th>
                  <td>{document.drafterOU}</td>
                  <th>기 안 자</th>
                  <td>{document.drafterJobTitle} {document.drafterName}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginBottom: '20px' }}>
              {document.category === 'LEAVE' && (
                <table className="doc-content-table">
                  <tbody>
                    <tr>
                      <th>휴 가 구 분</th>
                      <td colSpan={3}><strong>{formData.leaveType}</strong></td>
                    </tr>
                    <tr>
                      <th>기 간</th>
                      <td>{formData.startDate} ~ {formData.endDate}</td>
                      <th>신청 차감 일수</th>
                      <td><strong style={{ color: '#2563eb' }}>{formData.daysCount} 일</strong></td>
                    </tr>
                    <tr>
                      <th>비상 연락처</th>
                      <td colSpan={3}>{formData.emergencyContact}</td>
                    </tr>
                    <tr>
                      <th>연차 사용 사유</th>
                      <td colSpan={3} style={{ whiteSpace: 'pre-wrap', height: '80px' }}>
                        {formData.reason}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {document.category === 'WORK_STATUS_2' && (
                <table className="doc-content-table">
                  <tbody>
                    <tr>
                      <th>근무상황 구분</th>
                      <td><strong style={{ color: '#d97706' }}>{formData.category}</strong></td>
                      <th>총 일수</th>
                      <td>{formData.daysCount} 일</td>
                    </tr>
                    <tr>
                      <th>기 간</th>
                      <td colSpan={3}>{formData.startDate} ~ {formData.endDate}</td>
                    </tr>
                    <tr>
                      <th>상세 사유</th>
                      <td colSpan={3} style={{ whiteSpace: 'pre-wrap', height: '80px' }}>
                        {formData.reason}
                      </td>
                    </tr>
                    {formData.attachmentName && (
                      <tr>
                        <th>증빙 첨부파일</th>
                        <td colSpan={3}>
                          <Paperclip size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {formData.attachmentName}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {document.category === 'BUSINESS_TRIP' && (
                <table className="doc-content-table">
                  <tbody>
                    <tr>
                      <th>출 장 구 분</th>
                      <td><strong>{formData.tripType}</strong></td>
                      <th>이 동 수 단</th>
                      <td>{formData.transportation}</td>
                    </tr>
                    <tr>
                      <th>목 적 지</th>
                      <td colSpan={3}>
                        <strong>{formData.destination}</strong>
                        {formData.address && <div style={{ fontSize: '11px', color: '#475569' }}>📍 {formData.address} (위도: {formData.lat}, 경도: {formData.lng})</div>}
                      </td>
                    </tr>
                    <tr>
                      <th>출 장 기 간</th>
                      <td>{formData.startDate} ~ {formData.endDate}</td>
                      <th>예상 여비</th>
                      <td><strong>{formData.budgetEstimate?.toLocaleString()} 원</strong></td>
                    </tr>
                    <tr>
                      <th>출 장 목 적</th>
                      <td colSpan={3} style={{ whiteSpace: 'pre-wrap', height: '60px' }}>
                        {formData.purpose}
                      </td>
                    </tr>
                    {formData.notes && (
                      <tr>
                        <th>비 고</th>
                        <td colSpan={3}>{formData.notes}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {(document.category === 'OVERTIME_ORDER' || document.category === 'OVERTIME_CONFIRM') && (
                <table className="doc-content-table">
                  <tbody>
                    <tr>
                      <th>근 무 일 자</th>
                      <td>{formData.workDate}</td>
                      <th>시간외 인정시간</th>
                      <td><strong style={{ color: '#2563eb' }}>{formData.plannedHours || formData.actualHours} 시간</strong></td>
                    </tr>
                    <tr>
                      <th>근 무 시 간</th>
                      <td colSpan={3}>
                        {formData.startTime || formData.actualStartTime} ~ {formData.endTime || formData.actualEndTime}
                      </td>
                    </tr>
                    <tr>
                      <th>{document.category === 'OVERTIME_ORDER' ? '신청 사유' : '실적 수행 보고'}</th>
                      <td colSpan={3} style={{ whiteSpace: 'pre-wrap', height: '90px' }}>
                        {formData.reason || formData.workDetailReport || formData.workContent}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {(document.category === 'EDUCATION_APPLY' || document.category === 'EDUCATION_REPORT') && (
                <table className="doc-content-table">
                  <tbody>
                    <tr>
                      <th>교 육 명</th>
                      <td colSpan={3}><strong>{formData.title}</strong></td>
                    </tr>
                    <tr>
                      <th>주 관 기 관</th>
                      <td>{formData.institution}</td>
                      <th>교 육 일 자</th>
                      <td>{formData.startDate || formData.completedDate} {formData.endDate ? `~ ${formData.endDate}` : ''}</td>
                    </tr>
                    {formData.fee !== undefined && (
                      <tr>
                        <th>수 강 료</th>
                        <td colSpan={3}>{formData.fee.toLocaleString()} 원</td>
                      </tr>
                    )}
                    <tr>
                      <th>{document.category === 'EDUCATION_APPLY' ? '참석 사유 및 목적' : '교육 요약 및 시사점'}</th>
                      <td colSpan={3} style={{ whiteSpace: 'pre-wrap', height: '90px' }}>
                        {formData.reason || `${formData.summary}\n\n[업무시사점]\n${formData.learnings}`}
                      </td>
                    </tr>
                    {formData.attachmentName && (
                      <tr>
                        <th>첨부 이수증</th>
                        <td colSpan={3}>
                          <Paperclip size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {formData.attachmentName}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="doc-footer-statement">
              위와 같이 <strong>{getFormTitle(document.category)}</strong>를(을) 제출하오니 승인하여 주시기 바랍니다.
            </div>

            <div className="doc-footer-date" style={{ textAlign: 'center' }}>
              {document.createdAt.split(' ')[0]}
            </div>

            <div className="doc-footer-signature">
              <span>기안자: {document.drafterJobTitle} {document.drafterName}</span>
              <img
                src={document.approvalLine[0]?.stampUrl || document.approvalLine[1]?.stampUrl || ''}
                alt=""
                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
              />
            </div>

            <div className="doc-footer-orgname">
              사회복지법인 ○○복지재단 ○○종합사회복지관
            </div>
          </div>
        </div>

        {isPendingForMe && (
          <div className="modal-footer no-print" style={{ backgroundColor: '#fff', borderTop: '2px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
              <Shield size={20} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                [{pendingStep?.approverJobTitle}] {currentUser.name} 님의 결재 승인 단계입니다.
              </span>
            </div>

            {!showRejectBox ? (
              <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="결재 검토 의견 (선택사항)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-danger" onClick={() => setShowRejectBox(true)}>
                  <XCircle size={18} />
                  반려
                </button>
                <button className="btn btn-success" onClick={handleApprove}>
                  <CheckCircle size={18} />
                  승인 및 날인 첨부
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="반려 사유를 필히 작성해 주세요..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowRejectBox(false)}>
                    취소
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={handleReject}>
                    반려 처리 확정
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
