import { useEffect, useMemo, useState } from 'react';
import { AuthPanel } from './components/AuthPanel';
import { AdSenseAd } from './components/AdSenseAd';
import { DirectionControl } from './components/DirectionControl';
import { GameBoard } from './components/GameBoard';
import { GameStatus } from './components/GameStatus';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { RecentGamesPanel } from './components/RecentGamesPanel';
import { ReplayPage } from './components/ReplayPage';
import { LegalPage, SiteFooter } from './components/LegalPages';
import { MatchmakingPanel } from './components/MatchmakingPanel';
import { ProfilePanel } from './components/ProfilePanel';
import { RoomPanel } from './components/RoomPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { TurnTimer } from './components/TurnTimer';
import { PHASES, PLAYERS } from './game/constants';
import { applyAction, createInitialGame } from './game/engine';
import { hasFirebaseConfig, signInAsGuest, signInWithGoogle, signOutUser, subscribeAuthUser } from './online/firebase';
import { ensureUserProfile, subscribeLeaderboard, subscribeRecentGames, subscribeUserProfile } from './online/profiles';
import { createRoom, forfeitRoom, getMyRole, joinRoom, resetOnlineRoom, submitRoomAction, subscribeRoom } from './online/rooms';
import { reportRoomServer } from './online/serverActions';
import { logEvent } from './online/analytics';
import './styles.css';

export default function App() {
  const [mode, setMode] = useState('local');
  const [localGame, setLocalGame] = useState(() => createInitialGame({ size: 13, winLength: 7 }));
  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [uid, setUid] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(!hasFirebaseConfig());
  const [authError, setAuthError] = useState('');
  const [onlineError, setOnlineError] = useState('');
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [pendingRoomCode, setPendingRoomCode] = useState(null);

  const game = mode === 'online' && room?.game ? room.game : localGame;
  const role = useMemo(() => (mode === 'online' ? getMyRole(room, authUser?.uid ?? uid) : null), [mode, room, uid, authUser]);
  const showLocalResult = mode === 'local' && game.phase === PHASES.GAME_OVER;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('room');
    if (code) setPendingRoomCode(code.toUpperCase());
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      setAuthReady(true);
      return undefined;
    }

    setAuthReady(false);
    const unsubscribe = subscribeAuthUser(
      (user) => {
        setAuthUser(user);
        setUid(user?.uid ?? null);
        setAuthReady(true);
      },
      (error) => {
        setAuthError(error.message);
        setAuthReady(true);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authUser) {
      setProfile(null);
      return undefined;
    }

    let cancelled = false;
    let unsubscribeProfile = null;

    async function loadProfile() {
      try {
        await ensureUserProfile(authUser);
        if (cancelled) return;

        unsubscribeProfile = subscribeUserProfile(
          authUser.uid,
          (nextProfile) => setProfile(nextProfile),
          (error) => setAuthError(error.message),
        );
      } catch (error) {
        setAuthError(error.message);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [authUser]);

  useEffect(() => {
    if (!hasFirebaseConfig()) return undefined;

    return subscribeLeaderboard(
      { count: 20 },
      (rows) => setLeaderboard(rows),
      (error) => setOnlineError(error.message),
    );
  }, []);

  useEffect(() => {
    if (!authUser) {
      setRecentGames([]);
      return undefined;
    }

    return subscribeRecentGames(
      authUser.uid,
      { count: 8 },
      (rows) => setRecentGames(rows),
      (error) => setOnlineError(error.message),
    );
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !pendingRoomCode) return;
    handleJoinRoom(pendingRoomCode);
    setPendingRoomCode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, pendingRoomCode]);

  useEffect(() => {
    if (mode !== 'online' || !roomCode) return undefined;

    const unsubscribe = subscribeRoom(
      roomCode,
      (nextRoom) => {
        setRoom(nextRoom);
        if (!nextRoom) setOnlineError('방을 찾을 수 없습니다.');
      },
      (error) => setOnlineError(error.message),
    );

    return unsubscribe;
  }, [mode, roomCode]);

  const canAct = mode === 'local' || role === game.currentPlayer;
  const canPlace = canAct && game.phase === PHASES.PLACE && !game.winner;
  const canRotate = canAct && game.phase === PHASES.ROTATE && !game.winner;

  function applyLocal(action) {
    try {
      setLocalGame((current) => applyAction(current, action));
    } catch (error) {
      alert(error.message);
    }
  }

  async function applyOnline(action) {
    try {
      setOnlineError('');
      await submitRoomAction(roomCode, action);
      logEvent('submit_move', { action_type: action.type, mode });
    } catch (error) {
      setOnlineError(error.message);
    }
  }

  function handlePlace(row, col) {
    const action = { type: 'PLACE_STONE', row, col };
    if (mode === 'online') applyOnline(action);
    else applyLocal(action);
  }

  function handleRotate(steps) {
    const action = { type: 'ROTATE_DIRECTION', steps };
    if (mode === 'online') applyOnline(action);
    else applyLocal(action);
  }

  function handleNewLocalGame({ size = game.size, winLength = game.winLength } = {}) {
    setMode('local');
    setRoom(null);
    setRoomCode(null);
    setLocalGame(createInitialGame({ size, winLength }));
    history.replaceState(null, '', location.pathname);
  }

  async function handleGoogleLogin() {
    try {
      setAuthError('');
      const user = await signInWithGoogle();
      setAuthUser(user);
      setUid(user.uid);
      await ensureUserProfile(user);
      logEvent('login_google');
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function handleGuestLogin() {
    try {
      setAuthError('');
      const user = await signInAsGuest();
      setAuthUser(user);
      setUid(user.uid);
      await ensureUserProfile(user);
      logEvent('login_guest');
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function handleLogout() {
    try {
      setAuthError('');
      await signOutUser();
      setAuthUser(null);
      setUid(null);
      setProfile(null);
      if (mode === 'online') {
        handleNewLocalGame();
      }
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function handleCreateRoom() {
    try {
      setOnlineError('');
      const result = await createRoom({ size: game.size, winLength: game.winLength });
      setMode('online');
      logEvent('create_room', { size: game.size, win_length: game.winLength });
      setRoomCode(result.code);
      setUid(result.uid);
      history.replaceState(null, '', `?room=${result.code}`);
    } catch (error) {
      setOnlineError(error.message);
    }
  }

  async function handleJoinRoom(code) {
    try {
      setOnlineError('');
      const result = await joinRoom(code);
      setMode('online');
      logEvent('join_room');
      setRoomCode(result.code);
      setUid(result.uid);
      history.replaceState(null, '', `?room=${result.code}`);
    } catch (error) {
      setOnlineError(error.message);
    }
  }

  async function handleResetOnline() {
    try {
      await resetOnlineRoom(roomCode, { size: game.size, winLength: game.winLength });
    } catch (error) {
      setOnlineError(error.message);
    }
  }

  async function handleForfeitRoom() {
    if (!roomCode) return;
    if (!confirm('정말 기권하시겠습니까?')) return;

    try {
      setOnlineError('');
      await forfeitRoom(roomCode);
    } catch (error) {
      setOnlineError(error.message);
    }
  }

  async function handleReportRoom() {
    if (!roomCode) return;
    const reason = prompt('신고 사유를 간단히 적어주세요.');
    if (!reason) return;

    try {
      setOnlineError('');
      await reportRoomServer({ roomCode, reason, detail: '' });
      alert('신고가 접수되었습니다.');
    } catch (error) {
      setOnlineError(error.message);
    }
  }

  function handleMatched(result) {
    setMode('online');
    logEvent('match_found', { range: result.range });
    setRoomCode(result.code);
    setUid(authUser?.uid ?? uid);
    history.replaceState(null, '', `?room=${result.code}`);
  }

  const onlineStatus = mode === 'online'
    ? `${room?.ranked ? '랭크' : '친선'} 방 ${roomCode}`
    : '로컬';

  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path.startsWith('/replay/')) {
    return <ReplayPage roomCode={decodeURIComponent(path.replace('/replay/', ''))} />;
  }
  if (path === '/privacy') return <LegalPage type="privacy" />;
  if (path === '/terms') return <LegalPage type="terms" />;
  if (path === '/ads') return <LegalPage type="ads" />;

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">ROUGH BUILD / COMPASS SHADOWS</p>
          <h1>나침반목</h1>
          <p className="subtitle">
            돌을 놓고, 턴 끝에 방향을 0·1·2칸 시계방향으로 돌립니다.
            실제 돌과 그림자를 합쳐 5목 또는 7목을 만들면 승리합니다.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={() => handleNewLocalGame()}>
            로컬 새 게임
          </button>
          {mode === 'online' && !room?.ranked && (
            <button className="secondary-button" type="button" onClick={handleResetOnline}>
              온라인 새 게임
            </button>
          )}
        </div>
      </section>

      <GameStatus
        game={game}
        role={mode === 'online' ? role : null}
        onlineStatus={onlineStatus}
      />

      <TurnTimer room={room} />

      {showLocalResult && (
        <section className="result-card" aria-live="assertive">
          <div>
            <span className="label">대국 종료</span>
            <strong>{formatGameResultTitle(game)}</strong>
            <p>{formatGameResultDetail(game)}</p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => handleNewLocalGame({ size: game.size, winLength: game.winLength })}
          >
            새 게임
          </button>
        </section>
      )}

      <section className="game-area">
        <div className="left-stack">
          <SettingsPanel game={game} disabled={mode === 'online'} onNewLocalGame={handleNewLocalGame} />
          <AuthPanel
            user={authUser}
            authReady={authReady}
            authError={authError}
            onGoogleLogin={handleGoogleLogin}
            onGuestLogin={handleGuestLogin}
            onLogout={handleLogout}
          />
          <ProfilePanel user={authUser} profile={profile} />
          <MatchmakingPanel
            user={authUser}
            profile={profile}
            game={game}
            mode={mode}
            onMatched={handleMatched}
            onError={setOnlineError}
          />
          <RoomPanel
            mode={mode}
            roomCode={roomCode}
            role={role}
            room={room}
            user={authUser}
            onlineError={onlineError}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onLeaveRoom={handleNewLocalGame}
            onForfeitRoom={handleForfeitRoom}
            onReportRoom={handleReportRoom}
          />
          <RecentGamesPanel rows={recentGames} />
          <LeaderboardPanel rows={leaderboard} />
          <AdSenseAd placement="sidebar" label="광고" />
        </div>

        <GameBoard game={game} canPlace={canPlace} onPlace={handlePlace} />

        <DirectionControl game={game} canRotate={canRotate} onRotate={handleRotate} />
      </section>

      <AdSenseAd placement="footer" label="광고" />

      <section className="log-card">
        <h2>기록</h2>
        {room?.ranked && room?.pendingSettlement && (
          <p className="rating-result">
            서버에서 레이팅을 정산하는 중입니다.
          </p>
        )}
        {room?.ranked && room?.settlementError && (
          <p className="error">
            정산 오류: {room.settlementError}
          </p>
        )}
        {room?.ranked && room?.ratingChange && (
          <p className="rating-result">
            레이팅 변동 — 흑 {formatDelta(room.ratingChange.B.delta)} / 백 {formatDelta(room.ratingChange.W.delta)}
          </p>
        )}
        <ul>
          {game.log.slice(0, 60).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
        </ul>
      </section>

      <SiteFooter />
    </main>
  );
}

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function formatGameResultTitle(game) {
  if (game.winner === 'B' || game.winner === 'W') {
    return `${PLAYERS[game.winner].label} 승리!`;
  }
  if (game.winner === 'BOTH') return '동시 승리!';
  return '무승부!';
}

function formatGameResultDetail(game) {
  if (game.winner === 'B' || game.winner === 'W') {
    const loser = game.winner === 'B' ? 'W' : 'B';
    return `${PLAYERS[loser].label} 패배. 같은 설정으로 바로 다시 시작할 수 있습니다.`;
  }
  if (game.winner === 'BOTH') {
    return '양쪽 모두 목표 목수를 완성했습니다. 같은 설정으로 재대국할 수 있습니다.';
  }
  return '더 이상 둘 곳이 없습니다. 같은 설정으로 새 게임을 시작하세요.';
}
