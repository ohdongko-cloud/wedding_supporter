import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { ShareService } from '../services/shareService'
import DevRequestModal from '../components/DevRequestModal'
import ShareModal from '../components/ShareModal'
import PartnerInviteModal from '../components/PartnerInviteModal'
import {
  NoteIcon, PartnerIcon, LinkIcon, ChatIcon, PrivacyIcon,
  InfoIcon, LogoutIcon, TrashIcon, KeyIcon, WrenchIcon,
} from '../components/icons/AppIcons'

// ── 회원 탈퇴 확인 팝업 ──────────────────────────────────────────
function DeleteConfirmPopup({ nick, onConfirm, onClose }: { nick: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 300, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>초기화 및 삭제</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 6 }}>
          <b style={{ color: 'var(--pk)' }}>{nick}</b> 계정을 삭제하면<br />로그인이 불가능해집니다.
        </div>
        <div style={{ fontSize: 12, color: '#e03060', marginBottom: 18 }}>이 작업은 되돌릴 수 없습니다.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, background: '#e03060', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>삭제</button>
        </div>
      </div>
    </div>
  )
}

// ── 설정 섹션 래퍼 ──────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--gap-md)' }}>
      <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, paddingLeft: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--pk4)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(255,107,157,.07)' }}>
        {children}
      </div>
    </div>
  )
}

// ── 설정 행 ───────────────────────────────────────────────────
function Row({ icon, label, sub, onClick, danger, disabled, last }: {
  icon: React.ReactNode; label: string; sub?: string
  onClick?: () => void; danger?: boolean; disabled?: boolean; last?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 'clamp(13px,3.5vw,15px) clamp(14px,4vw,18px)',
        width: '100%', border: 'none', background: 'none',
        textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
        borderBottom: last ? 'none' : '1px solid var(--gray1)',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span style={{ width: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: danger ? '#e03060' : 'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
      </div>
      {onClick && <span style={{ color: 'var(--gray3)', fontSize: 16 }}>›</span>}
    </button>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const user      = useAuthStore(s => s.user)
  const userData  = useAuthStore(s => s.userData)
  const logout    = useAuthStore(s => s.logout)
  const deleteAccount = useAuthStore(s => s.deleteAccount)

  const isGuest   = user?.nick === '게스트'
  const isAdmin   = user?.nick === 'admin'

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [devRequestOpen, setDevRequestOpen] = useState(false)
  const [shareModal, setShareModal]   = useState(false)
  const [shareUrl, setShareUrl]       = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [partnerModal, setPartnerModal] = useState(false)

  async function handleShare() {
    if (!user || !userData || isGuest) return
    setShareLoading(true)
    const token = await ShareService.createShareLink(user.nick, userData)
    setShareLoading(false)
    if (token) {
      setShareUrl(`${window.location.origin}/view/${token}`)
      setShareModal(true)
    }
  }

  function handleDelete() {
    deleteAccount()
    setDeleteConfirm(false)
    navigate('/auth')
  }

  function handleLogout() {
    logout()
    navigate('/auth')
  }

  return (
    <div>
      {/* ── 모달들 ── */}
      {deleteConfirm  && <DeleteConfirmPopup nick={user?.nick ?? ''} onConfirm={handleDelete} onClose={() => setDeleteConfirm(false)} />}
      {devRequestOpen && <DevRequestModal onClose={() => setDevRequestOpen(false)} />}
      {shareModal     && <ShareModal shareUrl={shareUrl} onClose={() => setShareModal(false)} />}
      {partnerModal   && user && <PartnerInviteModal nick={user.nick} onClose={() => setPartnerModal(false)} />}

      {/* ── 내 정보 카드 ── */}
      {userData && (
        <div style={{
          background: 'linear-gradient(135deg, var(--pk), var(--mn))',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--p-md)',
          color: '#fff',
          marginBottom: 'var(--gap-md)',
          boxShadow: '0 6px 24px rgba(255,107,157,.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 40 }}>{isGuest ? '👤' : '💍'}</div>
            <div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800 }}>
                {user?.nick}{isAdmin ? ' 🔑' : ''}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', opacity: 0.85, marginTop: 2 }}>
                {isGuest
                  ? '게스트 모드 (데이터가 저장되지 않아요)'
                  : userData.weddingDate
                    ? `결혼 예정일 ${userData.weddingDate}`
                    : '결혼 예정일 미설정'}
              </div>
              {!isGuest && userData.venueName && (
                <div style={{ fontSize: 'var(--fs-xs)', opacity: 0.75, marginTop: 1 }}>
                  📍 {userData.venueName}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 기능 ── */}
      <Section title="기능">
        <Row icon={<NoteIcon />} label="내 메모장" onClick={() => navigate('/memo')} />
        {!isGuest && (
          <Row icon={<PartnerIcon />} label="파트너와 함께 사용하기" sub="초대 링크로 파트너 초대" onClick={() => setPartnerModal(true)} />
        )}
        {!isGuest && (
          <Row
            icon={<LinkIcon />}
            label={shareLoading ? '링크 생성 중...' : '결과 공유하기'}
            sub="준비 현황을 링크로 공유"
            onClick={handleShare}
            disabled={shareLoading}
            last
          />
        )}
        {isGuest && (
          <Row icon={<LinkIcon />} label="결과 공유하기" sub="로그인 후 이용 가능" disabled last />
        )}
      </Section>

      {/* ── 지원 ── */}
      <Section title="지원">
        <Row icon={<ChatIcon />} label="개선 요청" sub="불편한 점이나 원하는 기능을 알려주세요" onClick={() => setDevRequestOpen(true)} />
        <Row icon={<PrivacyIcon />} label="개인정보 처리방침" onClick={() => navigate('/privacy')} last />
      </Section>

      {/* ── 앱 정보 ── */}
      <Section title="앱 정보">
        <Row icon={<InfoIcon />} label="버전" sub="v1.1.0" last />
      </Section>

      {/* ── 계정 ── */}
      <Section title="계정">
        {isGuest ? (
          <Row icon={<KeyIcon />} label="로그인 / 회원가입" onClick={() => navigate('/auth')} last />
        ) : (
          <>
            <Row icon={<LogoutIcon />} label="로그아웃" onClick={handleLogout} />
            {!isAdmin && (
              <Row icon={<TrashIcon />} label="초기화 및 삭제" danger onClick={() => setDeleteConfirm(true)} last />
            )}
            {isAdmin && (
              <Row icon={<WrenchIcon />} label="관리자 페이지" onClick={() => navigate('/admin')} last />
            )}
          </>
        )}
      </Section>

      <div style={{ height: 8 }} />
    </div>
  )
}
