import React, { useState } from 'react';
import type { User } from '../../types/approval';
import { generateDefaultStampSvg } from '../../services/stampHelper';
import { saveUser } from '../../services/storage';
import { Stamp, Upload, RefreshCw, Check } from 'lucide-react';

interface StampCanvasProps {
  currentUser: User;
  onUserUpdated: (updatedUser: User) => void;
}

export const StampCanvas: React.FC<StampCanvasProps> = ({ currentUser, onUserUpdated }) => {
  const [customName, setCustomName] = useState(currentUser.name);
  const [currentStamp, setCurrentStamp] = useState(currentUser.stampUrl || generateDefaultStampSvg(currentUser.name));
  const [successMsg, setSuccessMsg] = useState(false);

  const handleRegenerateSeal = () => {
    const newSvg = generateDefaultStampSvg(customName);
    setCurrentStamp(newSvg);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          setCurrentStamp(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updatedUser: User = {
      ...currentUser,
      stampUrl: currentStamp,
    };
    saveUser(updatedUser);
    onUserUpdated(updatedUser);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="card" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <Stamp size={24} style={{ color: 'var(--primary)' }} />
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>전자 직인 및 날인(서명) 설정</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            전자결재 문서 승인 시 적용되는 공식 날인 도장 또는 서명 이미지를 관리합니다.
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: '#d1fae5',
          color: '#065f46',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <Check size={18} />
          전자 직인이 성공적으로 저장되었습니다!
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', margin: '1.5rem 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            현재 날인 도장 미리보기
          </div>
          <div style={{
            width: '120px',
            height: '120px',
            border: '2px dashed var(--border-dark)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '10px',
          }}>
            <img
              src={currentStamp}
              alt="직인 이미지"
              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">직인 표기 성명/이름</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="예: 김관장"
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleRegenerateSeal}
                style={{ whiteSpace: 'nowrap' }}
              >
                <RefreshCw size={16} />
                도장 자동생성
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">보유 직인 이미지 파일 업로드 (PNG, JPG, SVG)</label>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
              <Upload size={16} />
              <span>이미지 파일 선택</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              * 투명 배경 PNG 추천
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Check size={18} />
          직인/날인 저장하기
        </button>
      </div>
    </div>
  );
};
