import { useState } from 'react';
import { hasFirebaseConfig } from '../online/firebase';

export function RoomPanel({
  mode,
  roomCode,
  role,
  room,
  user,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onForfeitRoom,
  onReportRoom,
  onlineError,
}) {
  const [input, setInput] = useState('');
  const ready = hasFirebaseConfig();
  const canUseOnline = ready && Boolean(user);

  const blackName = room?.playerProfiles?.B?.name ?? (room?.players?.B ? '흑 플레이어' : '대기 중');
  const whiteName = room?.playerProfiles?.W?.name ?? (room?.players?.W ? '백 플레이어' : '대기 중');

  return (
    <aside className="rules-card">
      <h2>온라인 대전</h2>

      {!ready && (
        <p className="warning">
          Firebase 설정값이 없습니다. `.env.local`을 채우면 방 만들기와 참가가 활성화됩니다.
        </p>
      )}

      {ready && !user && (
        <p className="warning">
          먼저 Google 로그인 또는 게스트 입장을 선택하세요.
        </p>
      )}

      {mode === 'online' ? (
        <>
          <p><strong>방 코드:</strong> {roomCode}</p>
          <p><strong>내 역할:</strong> {role === 'spectator' ? '관전' : role}</p>
          <p><strong>방 상태:</strong> {room?.status ?? '연결 중'}</p>
          {room?.ranked && <p><strong>매치 유형:</strong> 랭크 매치</p>}
          {room?.ranked && room?.pendingSettlement && <p className="warning">서버 정산 대기 중</p>}
          {room?.ranked && room?.ratingApplied && <p className="rating-result">레이팅 정산 완료</p>}
          <div className="players-box">
            <div><span>흑</span><strong>{blackName}</strong></div>
            <div><span>백</span><strong>{whiteName}</strong></div>
          </div>
          <button className="ghost-button" type="button" onClick={() => navigator.clipboard?.writeText(`${location.origin}?room=${roomCode}`)}>
            초대 링크 복사
          </button>
          <button className="ghost-button" type="button" onClick={onForfeitRoom}>
            기권
          </button>
          <button className="ghost-button" type="button" onClick={onReportRoom}>
            신고
          </button>
          <button className="ghost-button" type="button" onClick={onLeaveRoom}>
            온라인 나가기
          </button>
        </>
      ) : (
        <>
          <p>방을 만들거나 방 코드로 참가합니다. 세 번째 입장자는 관전자가 됩니다.</p>
          <button className="primary-button" type="button" disabled={!canUseOnline} onClick={onCreateRoom}>
            방 만들기
          </button>
          <div className="join-row">
            <input value={input} onChange={(event) => setInput(event.target.value.toUpperCase())} placeholder="방 코드" />
            <button className="secondary-button" type="button" disabled={!canUseOnline || !input.trim()} onClick={() => onJoinRoom(input)}>
              참가
            </button>
          </div>
        </>
      )}

      {onlineError && <p className="error">{onlineError}</p>}
    </aside>
  );
}
