import React, { useState } from 'react';
import type { OU, User, Role, JobTitle } from '../../types/approval';
import { saveOU, deleteOU, saveUser } from '../../services/storage';
import { Network, Plus, Trash2, Edit3, UserCheck, Building } from 'lucide-react';

interface OrgTreeProps {
  ous: OU[];
  users: User[];
  onRefreshData: () => void;
}

export const OrgTree: React.FC<OrgTreeProps> = ({ ous, users, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'ous' | 'users'>('ous');

  const [newOuName, setNewOuName] = useState('');
  const [newOuCode, setNewOuCode] = useState('');
  const [newOuParentId, setNewOuParentId] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleCreateOU = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOuName || !newOuCode) return;

    const newOu: OU = {
      id: `ou-${Date.now()}`,
      name: newOuName,
      code: newOuCode,
      parentId: newOuParentId || undefined,
    };

    saveOU(newOu);
    setNewOuName('');
    setNewOuCode('');
    setNewOuParentId('');
    onRefreshData();
  };

  const handleDeleteOU = (ouId: string) => {
    if (confirm('정말로 이 조직 부서(OU)를 삭제하시겠습니까?')) {
      deleteOU(ouId);
      onRefreshData();
    }
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      saveUser(editingUser);
      setEditingUser(null);
      onRefreshData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'ous' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('ous')}
          >
            <Building size={18} />
            조직 단위 (OU / 부서) 설정
          </button>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
          >
            <UserCheck size={18} />
            직원 직급 및 권한 설정 (5~50인)
          </button>
        </div>
      </div>

      {activeTab === 'ous' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Network size={20} style={{ color: 'var(--primary)' }} />
              기관 조직 체계 (OU 목록)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ous.map((ou) => {
                const parentOU = ous.find((p) => p.id === ou.parentId);
                const ouUsers = users.filter((u) => u.ouId === ou.id);
                return (
                  <div
                    key={ou.id}
                    style={{
                      padding: '1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {ou.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({ou.code})</span>
                      </div>
                      {parentOU && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                          상위 부서: {parentOU.name}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        소속 직원: {ouUsers.map((u) => `${u.name}(${u.jobTitle})`).join(', ') || '없음'}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDeleteOU(ou.id)}
                      title="부서 삭제"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} style={{ color: 'var(--primary)' }} />
              새 조직 단위(OU) 신설
            </h3>
            <form onSubmit={handleCreateOU} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">부서명 *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newOuName}
                  onChange={(e) => setNewOuName(e.target.value)}
                  placeholder="예: 사회재가복지팀"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">부서 코드 *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newOuCode}
                  onChange={(e) => setNewOuCode(e.target.value)}
                  placeholder="예: HWC"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">상위 부서 선택 (선택사항)</label>
                <select
                  className="form-control"
                  value={newOuParentId}
                  onChange={(e) => setNewOuParentId(e.target.value)}
                >
                  <option value="">-- 최상위 부서 --</option>
                  {ous.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                <Plus size={18} />
                부서 추가 생성
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
            기관 임직원 목록 & 직급/권한 매핑 (총 {users.length}명)
          </h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>소속 부서 (OU)</th>
                  <th>직급/직책</th>
                  <th>결재 권한 그룹</th>
                  <th>이메일 / 연락처</th>
                  <th>직인 상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.name}</td>
                    <td>{u.ouName}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{u.jobTitle}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === 'DIRECTOR'
                          ? 'badge-approved'
                          : u.role === 'MIDDLE_MANAGER'
                          ? 'badge-progress'
                          : 'badge-draft'
                      }`}>
                        {u.role === 'DIRECTOR'
                          ? '최고결정권자 (관장/센터장)'
                          : u.role === 'MIDDLE_MANAGER'
                          ? '중간관리자 (사무국장/팀장)'
                          : '실무자 (사회복지사)'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.email}<br />{u.phone}
                    </td>
                    <td>
                      {u.stampUrl ? (
                        <img src={u.stampUrl} alt="직인" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>미등록</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingUser(u)}
                      >
                        <Edit3 size={14} />
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>직원 정보 및 직급/권한 변경</h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">이름</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">소속 부서 (OU)</label>
                <select
                  className="form-control"
                  value={editingUser.ouId}
                  onChange={(e) => {
                    const ou = ous.find((o) => o.id === e.target.value);
                    if (ou) {
                      setEditingUser({ ...editingUser, ouId: ou.id, ouName: ou.name });
                    }
                  }}
                >
                  {ous.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">직급 / 직책 *</label>
                <select
                  className="form-control"
                  value={editingUser.jobTitle}
                  onChange={(e) => setEditingUser({ ...editingUser, jobTitle: e.target.value as JobTitle })}
                >
                  <option value="관장">관장</option>
                  <option value="센터장">센터장</option>
                  <option value="사무국장">사무국장</option>
                  <option value="과장">과장</option>
                  <option value="팀장">팀장</option>
                  <option value="주임">주임</option>
                  <option value="사회복지사">사회복지사</option>
                  <option value="행정원">행정원</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">결재 권한 그룹 *</label>
                <select
                  className="form-control"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                >
                  <option value="STAFF">실무자 (사회복지사 / 기안 권한)</option>
                  <option value="MIDDLE_MANAGER">중간 관리자 (사무국장/과장/팀장 - 1차 승인)</option>
                  <option value="DIRECTOR">최고 결정권자 (센터장/관장 - 최종 승인)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleUpdateUser}>
                저장 변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
