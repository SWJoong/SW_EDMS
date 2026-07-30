import React, { useState } from 'react';
import type { ApprovalDocument, DocumentCategory, User } from '../../types/approval';
import { Search, Eye } from 'lucide-react';

interface DocumentListProps {
  documents: ApprovalDocument[];
  title: string;
  currentUser: User;
  onSelectDocument: (doc: ApprovalDocument) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  title,
  onSelectDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.drafterName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: DocumentCategory) => {
    switch (category) {
      case 'LEAVE': return '연차신청';
      case 'WORK_STATUS_2': return '근무상황부(2)';
      case 'BUSINESS_TRIP': return '출장신청';
      case 'OVERTIME_ORDER': return '시간외명령';
      case 'OVERTIME_CONFIRM': return '시간외확인';
      case 'EDUCATION_APPLY': return '교육신청';
      case 'EDUCATION_REPORT': return '교육결과보고';
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{title} ({filteredDocs.length}건)</h2>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="문서 제목 / 기안자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: '2.2rem', width: '220px' }}
            />
            <Search size={16} style={{ position: 'absolute', right: '10px', top: '11px', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="ALL">전체 서식 보기</option>
            <option value="LEAVE">1. 연차사용신청서</option>
            <option value="WORK_STATUS_2">2. 근무상황부(2)</option>
            <option value="BUSINESS_TRIP">3. 출장신청서</option>
            <option value="OVERTIME_ORDER">4. 시간외근무명령</option>
            <option value="OVERTIME_CONFIRM">5. 시간외근무확인</option>
            <option value="EDUCATION_APPLY">6. 교육신청서</option>
            <option value="EDUCATION_REPORT">7. 교육결과보고서</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>문서번호</th>
              <th>서식 구분</th>
              <th>문서 제목</th>
              <th>기안자 (소속)</th>
              <th>기안 일시</th>
              <th>결재 상태</th>
              <th>조회</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  해당 조건의 결재 문서가 없습니다.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} onClick={() => onSelectDocument(doc)}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{doc.documentNumber}</td>
                  <td>
                    <span className="badge badge-progress">{getCategoryBadge(doc.category)}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{doc.title}</td>
                  <td>
                    {doc.drafterName} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({doc.drafterOU})</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.createdAt}</td>
                  <td>
                    <span className={`badge ${
                      doc.status === 'APPROVED'
                        ? 'badge-approved'
                        : doc.status === 'REJECTED'
                        ? 'badge-rejected'
                        : 'badge-pending'
                    }`}>
                      {doc.status === 'APPROVED'
                        ? '완료 (승인)'
                        : doc.status === 'REJECTED'
                        ? '반려'
                        : '진행중'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm">
                      <Eye size={14} />
                      보기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
