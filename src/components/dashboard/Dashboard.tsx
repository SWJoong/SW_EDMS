import React from 'react';
import type { User, ApprovalDocument, DocumentCategory } from '../../types/approval';
import type { ActiveTab } from '../layout/Sidebar';
import {
  Clock,
  Send,
  CheckCircle2,
  Calendar,
  FilePlus,
  ArrowRight,
  ShieldCheck,
  FileText,
  Briefcase,
} from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  documents: ApprovalDocument[];
  onSelectDocument: (doc: ApprovalDocument) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onStartNewDocument: (category: DocumentCategory) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  documents,
  onSelectDocument,
  onNavigateTab,
  onStartNewDocument,
}) => {
  const pendingForMe = documents.filter(
    (d) =>
      d.status === 'IN_PROGRESS' || d.status === 'PENDING'
  ).filter((d) => {
    const currentStep = d.approvalLine.find((s) => s.status === 'PENDING');
    return currentStep?.approverId === currentUser.id;
  });

  const myDrafts = documents.filter((d) => d.drafterId === currentUser.id);
  const myInProgress = myDrafts.filter((d) => d.status === 'IN_PROGRESS' || d.status === 'PENDING');
  const myApproved = myDrafts.filter((d) => d.status === 'APPROVED');

  const getCategoryName = (cat: DocumentCategory) => {
    switch (cat) {
      case 'LEAVE': return '연차사용신청서';
      case 'WORK_STATUS_2': return '근무상황부(2)';
      case 'BUSINESS_TRIP': return '출장신청서';
      case 'OVERTIME_ORDER': return '시간외근무명령서';
      case 'OVERTIME_CONFIRM': return '시간외근무확인서';
      case 'EDUCATION_APPLY': return '교육신청서';
      case 'EDUCATION_REPORT': return '교육결과보고서';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '1.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '16px',
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(37, 99, 235, 0.3)', color: '#60a5fa', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} />
            {currentUser.ouName} · {currentUser.jobTitle}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
            {currentUser.name} 님, 반가운 하루 되세요!
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            오늘 결재 처리해야 할 미결재 문서가 <strong style={{ color: '#f59e0b' }}>{pendingForMe.length}건</strong> 있습니다.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => onNavigateTab('new-doc')}
          style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', borderRadius: '10px' }}
        >
          <FilePlus size={20} />
          전자결재 작성하기
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div
          className="card"
          style={{ cursor: 'pointer', margin: 0 }}
          onClick={() => onNavigateTab('inbox-pending')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>결재 대기 문서</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--status-pending)', margin: '0.2rem 0' }}>
                {pendingForMe.length}
              </div>
            </div>
            <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.6rem', borderRadius: '10px' }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>지금 승인 필요한 문서 확인</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer', margin: 0 }}
          onClick={() => onNavigateTab('inbox-progress')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>나의 진행중 문서</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', margin: '0.2rem 0' }}>
                {myInProgress.length}
              </div>
            </div>
            <div style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.6rem', borderRadius: '10px' }}>
              <Send size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>상신 완료 결재 현황</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer', margin: 0 }}
          onClick={() => onNavigateTab('inbox-approved')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>최종 승인 완료</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--status-approved)', margin: '0.2rem 0' }}>
                {myApproved.length}
              </div>
            </div>
            <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '0.6rem', borderRadius: '10px' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>완료 및 직인 보존 문서</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>나의 잔여 연차</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', margin: '0.2rem 0' }}>
                12.0 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 15일</span>
              </div>
            </div>
            <div style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.6rem', borderRadius: '10px' }}>
              <Calendar size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            사용 연차: 3.0일 (휴가 규정 준수)
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
          7대 필수 행정 서식 빠른 기안
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onStartNewDocument('LEAVE')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', textAlign: 'left' }}
          >
            <Calendar size={20} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 700 }}>1. 연차사용신청서</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>연차, 반차, 조퇴 신청</div>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onStartNewDocument('WORK_STATUS_2')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', textAlign: 'left' }}
          >
            <FileText size={20} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 700 }}>2. 근무상황부(2)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>공가, 병가, 경조사, 모성보호</div>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onStartNewDocument('BUSINESS_TRIP')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', textAlign: 'left' }}
          >
            <Briefcase size={20} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 700 }}>3. 출장신청서</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kakao Map 지도 검색 & 여비</div>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onStartNewDocument('OVERTIME_ORDER')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', textAlign: 'left' }}
          >
            <Clock size={20} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 700 }}>4. 시간외근무명령</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>사전 시간외근무 승인</div>
          </button>
        </div>
      </div>

      {pendingForMe.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-pending)' }}>
            <Clock size={20} />
            내 결재 대기 문서 목록 ({pendingForMe.length}건)
          </h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>문서번호</th>
                  <th>서식 구분</th>
                  <th>문서 제목</th>
                  <th>기안자</th>
                  <th>기안일시</th>
                  <th>결재 승인</th>
                </tr>
              </thead>
              <tbody>
                {pendingForMe.map((doc) => (
                  <tr key={doc.id} onClick={() => onSelectDocument(doc)}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{doc.documentNumber}</td>
                    <td><span className="badge badge-progress">{getCategoryName(doc.category)}</span></td>
                    <td style={{ fontWeight: 600 }}>{doc.title}</td>
                    <td>{doc.drafterName} ({doc.drafterJobTitle})</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.createdAt}</td>
                    <td>
                      <button className="btn btn-primary btn-sm">
                        상세 및 결재 승인
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
