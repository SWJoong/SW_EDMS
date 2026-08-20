import React, { useState } from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';

interface IntroScreenProps {
  onClose: () => void;
  onDontShowAgain: () => void;
}

const REPO_URL = 'https://github.com/SWJoong/SW_EDMS';

// 접속 시 첫 화면에 뜨는 안내/디스클레이머.
//  ① 제작 목적  ② 이전 버전의 보안 한계  ③ 목업 ↔ 실제 운영 주의사항
//  ④ 실제 운영 시 무결성 요구 수준별 바이브코딩 관리 가이드
// 배경 문서: docs/SECURITY.md, docs/supabase_schema.sql, README(무결성 등급표)
export const IntroScreen: React.FC<IntroScreenProps> = ({ onClose, onDontShowAgain }) => {
  const [dontShow, setDontShow] = useState(false);

  const handleStart = () => {
    if (dontShow) onDontShowAgain();
    onClose();
  };

  const card: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem 1.4rem',
    boxShadow: 'var(--shadow-sm)',
  };
  const h2: React.CSSProperties = { fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.6rem' };
  const p: React.CSSProperties = { fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 };
  const li: React.CSSProperties = { fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text-muted)', marginBottom: '0.3rem' };
  const th: React.CSSProperties = { textAlign: 'left', padding: '0.6rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-white)', backgroundColor: 'var(--secondary)', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '0.6rem 0.7rem', fontSize: '0.82rem', lineHeight: 1.55, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' };
  const badge = (bg: string): React.CSSProperties => ({ display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, color: '#fff', backgroundColor: bg, whiteSpace: 'nowrap' });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="시스템 소개 및 보안 안내"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(2, 6, 23, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '2.5rem 1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Hero / 제작 목적 */}
        <div style={{ ...card, borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🏢</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              사회복지 E-HR 전자결재 시스템 <span style={{ color: 'var(--primary)' }}>(학습용 샘플)</span>
            </h1>
          </div>
          <p style={p}>
            <strong style={{ color: 'var(--text-main)' }}>제작 목적:</strong> 사회복지기관(5~50인 규모)의 수직적 결재 문화와 7종 행정 서식을
            <strong> 바이브코딩</strong>으로 어떻게 다루는지 배우기 위한 <strong>교육용 샘플</strong>입니다.
            종이에 날인 찍어 근태를 관리하던 흐름을 디지털로 옮겨보는 연습이며,
            이 화면은 “무엇을 배우고, 어디까지 믿고 쓸 수 있는지”를 먼저 알려드리기 위한 안내입니다.
          </p>
        </div>

        {/* ② 이전 버전의 보안 한계 */}
        <div style={{ ...card, backgroundColor: 'var(--primary-light)', borderColor: 'var(--status-rejected)' }}>
          <h2 style={{ ...h2, display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--status-rejected)' }}>
            <ShieldAlert size={18} /> 이전 버전의 보안 한계 (그대로 운영하면 안 되는 이유)
          </h2>
          <p style={{ ...p, marginBottom: '0.6rem' }}>
            처음 만들어진 버전은 “그럴싸하게” 동작했지만, 전자결재가 갖춰야 할 <strong>기록 무결성</strong>이 비어 있었습니다.
            지금은 아래 항목을 스키마·데모·CI로 보완했지만, 목업 자체의 한계는 남아 있습니다.
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li style={li}><strong>인증·권한이 없음</strong> — 값만 바꾸면 누구나 “관장”이 됨(신원 위조 가능).</li>
            <li style={li}><strong>결재 시각이 PC 시계</strong> — 시간을 돌리면 결재 일시가 바뀜.</li>
            <li style={li}><strong>위·변조/삭제 흔적이 없음</strong> — 승인 후 휴가일수·여비를 바꿔치기해도 남지 않음.</li>
            <li style={li}><strong>감사·접속기록 0건</strong> — 민감정보(병가 사유 등)를 봐도 기록이 안 남음.</li>
            <li style={li}><strong>퇴직자 삭제 시 결재 이력 연쇄 소실</strong>(CASCADE), <strong>문서번호 중복</strong>, <strong>도장 이미지 공개 URL</strong> 등.</li>
          </ul>
        </div>

        {/* ③ 목업 ↔ 실제 운영 주의사항 */}
        <div style={card}>
          <h2 style={h2}>🧪 목업 ↔ 실제 운영 주의사항</h2>
          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', padding: '0.8rem 0.9rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--status-pending)', marginBottom: '0.4rem' }}>지금(목업) — 이렇게 동작합니다</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                <li style={li}>데이터는 <strong>내 브라우저(localStorage)</strong>에만 저장됩니다.</li>
                <li style={li}>다른 사람과 <strong>공유되지 않고</strong>, 개발자도구로 <strong>수정·삭제</strong>됩니다.</li>
                <li style={li}>“사용자 전환”은 로그인이 아니라 <strong>화면 시연용</strong>입니다.</li>
              </ul>
            </div>
            <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', padding: '0.8rem 0.9rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '0.4rem' }}>실제 운영 전 — 반드시</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                <li style={li}><strong>실제 개인정보·민감정보(진단명 등) 입력 금지.</strong></li>
                <li style={li}>Supabase <strong>Auth + RLS + RPC</strong>로 인증·권한·감사 확보.</li>
                <li style={li}>도장 버킷 <strong>비공개</strong>, 체인헤드 <strong>외부 앵커링</strong>.</li>
                <li style={li}><code>service_role</code> 키는 <strong>프런트에 절대 금지</strong>(anon 키만).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ④ 무결성 요구 수준별 바이브코딩 관리 가이드 */}
        <div style={card}>
          <h2 style={h2}>🧭 실제 운영 시 — 무결성 요구 수준별 바이브코딩 관리 가이드</h2>
          <p style={{ ...p, marginBottom: '0.7rem' }}>
            모든 프로그램에 같은 보안이 필요하진 않습니다. <strong>“이 기록이 조작·삭제되면 누가 곤란한가”</strong>로 등급을 먼저 정하고,
            등급이 도구를 결정하게 하세요. 바이브코딩은 <strong>낮은 등급(C)부터</strong> 시작하는 게 정석입니다.
          </p>
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
              <thead>
                <tr>
                  <th style={th}>등급</th>
                  <th style={th}>예시 기능</th>
                  <th style={th}>최소 요구사항</th>
                  <th style={th}>바이브코딩 판단</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}><span style={badge('var(--status-rejected)')}>A · 최고</span><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>법정 보존·감사</div></td>
                  <td style={td}><strong>전자결재·근태·회계·인사</strong>, 급여, 개인정보/민감정보 대장, 후원금</td>
                  <td style={td}>위·변조 방지, 서버 시각, append-only+해시체인, 접속기록 2년+, 권한·<strong>보관 주체 분리</strong>, 백업</td>
                  <td style={td}>❌ <strong>자체 제작 지양.</strong> 검증된 상용 도구 우선. 굳이 만들면 강화 스키마+외부 앵커링+<strong>전문가 검토</strong> 필수</td>
                </tr>
                <tr>
                  <td style={td}><span style={badge('var(--status-pending)')}>B · 중간</span><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>내부 운영</div></td>
                  <td style={td}>회의록, 공지·게시판, 자산·비품 대장, 재고, 단순 내부 승인</td>
                  <td style={td}>로그인·권한, DB, 변경 이력, 정기 백업, 민감정보 <strong>배제</strong></td>
                  <td style={td}>△ <strong>조건부 가능.</strong> Auth+DB+백업을 갖추고 시작. 민감정보는 담지 않기</td>
                </tr>
                <tr>
                  <td style={td}><span style={badge('var(--status-approved)')}>C · 낮음</span><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>편의·시각화</div></td>
                  <td style={td}><strong>자원 예약</strong>(회의실·차량), 일정/근무현황 <strong>시각화</strong>, 대시보드, 설문 취합, 안내 페이지</td>
                  <td style={td}>거의 없음(사용 편의 위주)</td>
                  <td style={td}>✅ <strong>적극 권장.</strong> 바이브코딩은 <strong>여기서부터</strong> 시작</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ ...p, marginTop: '0.7rem', fontSize: '0.82rem' }}>
            <strong style={{ color: 'var(--text-main)' }}>3원칙</strong> ① 등급부터 정하고 시작 · ② 민감정보는 애초에 담지 않기 · ③ 만드는 나와 검증하는 장치(해시체인·외부 백업·전문가 리뷰)를 분리.
            &nbsp;자세한 내용은 저장소 <code>docs/SECURITY.md</code> · <code>docs/supabase_schema.sql</code> 참고.
            &nbsp;<a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 700 }}>GitHub 저장소 열기 ↗</a>
          </p>
        </div>

        {/* Footer / actions */}
        <div style={{ ...card, position: 'sticky', bottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
            다음부터 이 안내를 자동으로 표시하지 않기 (헤더의 <strong>‘보안 안내’</strong>로 다시 볼 수 있어요)
          </label>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose} title="닫기">
              <X size={16} /> 닫기
            </button>
            <button className="btn btn-primary" onClick={handleStart}>
              <Check size={16} /> 확인하고 시스템 시작
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
