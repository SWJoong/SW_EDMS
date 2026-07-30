import React from 'react';
import type { User } from '../../types/approval';
import {
  LayoutDashboard,
  FilePlus,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Network,
  Stamp,
  ShieldCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'new-doc'
  | 'inbox-pending'
  | 'inbox-progress'
  | 'inbox-approved'
  | 'inbox-rejected'
  | 'org'
  | 'stamps';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  pendingCount,
}) => {
  const getRoleBadgeText = (role: string) => {
    switch (role) {
      case 'DIRECTOR':
        return '최고결정권자';
      case 'MIDDLE_MANAGER':
        return '중간관리자';
      default:
        return '실무자';
    }
  };

  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'new-doc', label: '새 문서 기안', icon: FilePlus, highlight: true },
    { id: 'inbox-pending', label: '결재 대기함', icon: Clock, badge: pendingCount },
    { id: 'inbox-progress', label: '결재 진행함', icon: Send },
    { id: 'inbox-approved', label: '결재 완료함', icon: CheckCircle },
    { id: 'inbox-rejected', label: '반려 문서함', icon: XCircle },
    { id: 'org', label: '조직도 및 OU 관리', icon: Network },
    { id: 'stamps', label: '전자 직인 관리', icon: Stamp },
  ];

  return (
    <aside className="sidebar no-print" style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      color: '#cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 1rem',
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
          }}>
            {currentUser.name.slice(0, 1)}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
              {currentUser.name} {currentUser.jobTitle}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {currentUser.ouName}
            </div>
          </div>
        </div>
        <div style={{
          marginTop: '0.75rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.7rem',
          fontWeight: 600,
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          color: '#60a5fa',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
        }}>
          <ShieldCheck size={12} />
          {getRoleBadgeText(currentUser.role)}
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive
                  ? 'var(--primary)'
                  : item.highlight
                  ? 'rgba(37, 99, 235, 0.15)'
                  : 'transparent',
                color: isActive ? '#ffffff' : item.highlight ? '#60a5fa' : '#cbd5e1',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{
        fontSize: '0.75rem',
        color: '#64748b',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '1rem',
        marginTop: 'auto',
      }}>
        <div>사회복지 행정 E-HR v1.0 MVP</div>
        <div>Kakao Map & Supabase Ready</div>
      </div>
    </aside>
  );
};
