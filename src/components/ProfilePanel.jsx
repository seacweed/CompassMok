import { userDisplayName } from '../online/firebase';

export function ProfilePanel({ user, profile }) {
  return (
    <aside className="rules-card profile-card">
      <h2>프로필 / 레이팅</h2>
      {!user ? (
        <p>로그인하거나 게스트로 입장하면 레이팅과 전적이 표시됩니다.</p>
      ) : (
        <>
          <p><strong>{profile?.displayName ?? userDisplayName(user)}</strong></p>
          <div className="stat-grid">
            <div><span>레이팅</span><strong>{profile?.rating ?? 1500}</strong></div>
            <div><span>전적</span><strong>{profile?.wins ?? 0}-{profile?.losses ?? 0}-{profile?.draws ?? 0}</strong></div>
            <div><span>랭크 게임</span><strong>{profile?.rankedGames ?? 0}</strong></div>
            <div><span>최근 변동</span><strong>{formatDelta(profile?.lastRatingDelta ?? 0)}</strong></div>
          </div>
          {user.isAnonymous && <p className="warning">게스트 전적은 기기/브라우저가 바뀌면 이어지지 않을 수 있습니다.</p>}
        </>
      )}
    </aside>
  );
}

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}
