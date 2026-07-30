import React, { useState } from 'react';
import { MapPin, Search, Check, X } from 'lucide-react';

interface KakaoMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (placeName: string, address: string, lat: number, lng: number) => void;
}

interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const SAMPLE_PLACES: PlaceResult[] = [
  { name: '관악구 종합사회복지관', address: '서울특별시 관악구 관악로 145', lat: 37.4782, lng: 126.9515 },
  { name: '한국사회복지사협회', address: '서울특별시 영등포구 문래로 164', lat: 37.5165, lng: 126.8998 },
  { name: '서울시 사회복지사협회', address: '서울특별시 금천구 가산디지털1로 145', lat: 37.4812, lng: 126.8821 },
  { name: '강남 종합사회복지관', address: '서울특별시 강남구 광평로 60', lat: 37.4875, lng: 127.0825 },
  { name: '마포구 사회복지협의회', address: '서울특별시 마포구 월드컵북로 21', lat: 37.5562, lng: 126.9182 },
];

export const KakaoMapModal: React.FC<KakaoMapModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(SAMPLE_PLACES[0]);

  if (!isOpen) return null;

  const filteredPlaces = SAMPLE_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedPlace) {
      onSelectLocation(selectedPlace.name, selectedPlace.address, selectedPlace.lat, selectedPlace.lng);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Kakao Map 출장 장소/위치 검색 (연동 인터페이스)</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', gap: '1.5rem', height: '400px' }}>
          {/* Left search & list panel */}
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="목적지 복지관/장소 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingRight: '2rem' }}
              />
              <Search size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              {filteredPlaces.map((place, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPlace(place)}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: selectedPlace?.name === place.name ? 'var(--primary-light)' : 'transparent',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: selectedPlace?.name === place.name ? 'var(--primary)' : 'var(--text-main)' }}>
                    {place.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {place.address}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Map Canvas Simulation */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              flex: 1,
              backgroundColor: '#e2e8f0',
              borderRadius: '8px',
              border: '1px solid var(--border-dark)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: 'radial-gradient(circle, #cbd5e1 10%, #94a3b8 90%)',
            }}>
              {/* Map grid lines background mock */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.15,
                backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />

              {/* Pin indicator */}
              {selectedPlace && (
                <div style={{ textAlign: 'center', zIndex: 10 }}>
                  <div style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    marginBottom: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <MapPin size={14} />
                    {selectedPlace.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#1e293b', backgroundColor: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: '4px' }}>
                    위도: {selectedPlace.lat}, 경도: {selectedPlace.lng}
                  </div>
                </div>
              )}

              <div style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '0.7rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
                Kakao Map API Mode Active
              </div>
            </div>

            {selectedPlace && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>
                선택된 장소: <span style={{ color: 'var(--primary)' }}>{selectedPlace.name}</span> ({selectedPlace.address})
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            <Check size={16} />
            이 장소로 출장지 선택
          </button>
        </div>
      </div>
    </div>
  );
};
