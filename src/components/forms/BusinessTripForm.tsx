import React, { useState } from 'react';
import type { BusinessTripFormData } from '../../types/approval';
import { KakaoMapModal } from '../maps/KakaoMapModal';
import { MapPin } from 'lucide-react';

interface BusinessTripFormProps {
  formData: BusinessTripFormData;
  onChange: (data: BusinessTripFormData) => void;
}

export const BusinessTripForm: React.FC<BusinessTripFormProps> = ({ formData, onChange }) => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleChange = (field: keyof BusinessTripFormData, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  const handleSelectLocation = (placeName: string, address: string, lat: number, lng: number) => {
    onChange({
      ...formData,
      destination: placeName,
      address,
      lat,
      lng,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">출장 구분 *</label>
          <select
            className="form-control"
            value={formData.tripType}
            onChange={(e) => handleChange('tripType', e.target.value as any)}
          >
            <option value="관내출장">관내출장 (관할 구역 내)</option>
            <option value="관외출장">관외출장 (관할 구역 외 타 시/군/구)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">출장 목적지 및 위치 (Kakao Map 연동) *</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              value={formData.destination}
              onChange={(e) => handleChange('destination', e.target.value)}
              placeholder="예: 관악구 종합사회복지관"
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsMapOpen(true)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <MapPin size={16} style={{ color: 'var(--primary)' }} />
              지도 검색
            </button>
          </div>
          {formData.address && (
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
              📍 주소: {formData.address} (위도: {formData.lat}, 경도: {formData.lng})
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">출장 시작일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">출장 종료일 *</label>
          <input
            type="date"
            className="form-control"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">이동 수단 *</label>
          <select
            className="form-control"
            value={formData.transportation}
            onChange={(e) => handleChange('transportation', e.target.value as any)}
          >
            <option value="대중교통">대중교통 (지하철, 버스)</option>
            <option value="기관차량">기관 관용 차량</option>
            <option value="자급차량">개인 차량 (유류비 신청)</option>
            <option value="도보">도보</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">예상 여비 (원) *</label>
          <input
            type="number"
            className="form-control"
            value={formData.budgetEstimate}
            onChange={(e) => handleChange('budgetEstimate', Number(e.target.value))}
            placeholder="예: 25000"
          />
        </div>

        <div className="form-group">
          <label className="form-label">출장 목적 *</label>
          <input
            type="text"
            className="form-control"
            value={formData.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            placeholder="출장 목적 및 수행 예정 업무를 입력하세요."
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">비고 및 기타사항</label>
        <textarea
          className="form-control"
          rows={2}
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="동행자, 주차, 여비 집행 방식 등 특이사항 작성"
        />
      </div>

      <KakaoMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleSelectLocation}
      />
    </div>
  );
};
