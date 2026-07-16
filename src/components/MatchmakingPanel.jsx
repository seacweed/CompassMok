import { useEffect, useState } from 'react';
import { enterMatchQueue, findRankedMatch, getRatingRange, leaveMatchQueue } from '../online/matchmaking';

export function MatchmakingPanel({
  user,
  profile,
  game,
  mode,
  onMatched,
  onError,
}) {
  const [queued, setQueued] = useState(false);
  const [joinedAt, setJoinedAt] = useState(null);
  const [range, setRange] = useState(100);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!queued) return undefined;

    let cancelled = false;

    async function tick() {
      try {
        const waitedMs = Date.now() - joinedAt;
        setRange(getRatingRange(waitedMs));
        const result = await findRankedMatch({ size: game.size, winLength: game.winLength });
        if (!cancelled && result?.matched) {
          setQueued(false);
          setJoinedAt(null);
          onMatched(result);
        }
      } catch (error) {
        if (!cancelled) onError(error.message);
      }
    }

    tick();
    const timer = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [queued, joinedAt, game.size, game.winLength, onMatched, onError]);

  async function startQueue() {
    try {
      setBusy(true);
      onError('');
      await enterMatchQueue({ size: game.size, winLength: game.winLength });
      setQueued(true);
      setJoinedAt(Date.now());
      setRange(100);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelQueue() {
    try {
      setBusy(true);
      await leaveMatchQueue();
      setQueued(false);
      setJoinedAt(null);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  }

  const disabled = !user || mode === 'online' || busy;
  const waitedSec = joinedAt ? Math.floor((Date.now() - joinedAt) / 1000) : 0;

  return (
    <aside className="rules-card matchmaking-card">
      <h2>랭크 매칭</h2>
      <p>
        내 레이팅 <strong>{profile?.rating ?? 1500}</strong> 기준으로 비슷한 상대를 찾습니다.
        대기 시간이 길어질수록 허용 범위가 넓어집니다.
      </p>
      <p className="muted-line">
        조건: {game.size}×{game.size}, {game.winLength}목
      </p>

      {queued ? (
        <>
          <div className="queue-box">
            <div><span>대기 시간</span><strong>{waitedSec}초</strong></div>
            <div><span>검색 범위</span><strong>±{range}</strong></div>
          </div>
          <button className="ghost-button" type="button" disabled={busy} onClick={cancelQueue}>
            매칭 취소
          </button>
        </>
      ) : (
        <button className="primary-button" type="button" disabled={disabled} onClick={startQueue}>
          빠른 랭크 대전
        </button>
      )}

      {!user && <p className="warning">랭크 매칭은 Google 로그인 또는 게스트 입장 후 사용할 수 있습니다.</p>}
      {mode === 'online' && <p className="warning">이미 온라인 방에 들어와 있습니다.</p>}
    </aside>
  );
}
