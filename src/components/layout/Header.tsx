import React from 'react';
import type { User } from '../../types/approval';
import { UserCheck, Moon, Sun, Stamp, FileText } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenStampModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  darkMode,
  onToggleDarkMode,
  onOpenStampModal,
}) => {
  return (
    <header className="header-nav no-print" style={{
      height: '64px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          backgroundColor: 'var(--primary)',
          color: '#fff',
          padding: '0.4rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <FileText size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            사회복지 E-HR 전자결재 시스템
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            기관 규모 5~50인 수직적 결재 & 행정 서식 관리
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onOpenStampModal}
          className="btn btn-secondary btn-sm"
          title="내 전자 직인/서명 관리"
        >
          <Stamp size={16} />
          <span>내 직인/서명 관리</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-main)', padding: '0.3rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <UserCheck size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>사용자 전환:</span>
          <select
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                [{u.jobTitle}] {u.name} ({u.ouName})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onToggleDarkMode}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.5rem' }}
          title={darkMode ? '라이트 모드' : '다크 모드'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
