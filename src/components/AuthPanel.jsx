import { hasFirebaseConfig, userDisplayName } from '../online/firebase';

export function AuthPanel({
  user,
  authReady,
  authError,
  onGoogleLogin,
  onGuestLogin,
  onLogout,
}) {
  const ready = hasFirebaseConfig();

  return (
    <aside className="rules-card auth-card">
      <h2>입장 방식</h2>

      {!ready && (
        <p className="warning">
          Firebase 설정값이 없습니다. `.env.local`을 채우면 Google 로그인과 게스트 입장이 활성화됩니다.
        </p>
      )}

      {user ? (
        <>
          <p>
            <strong>{userDisplayName(user)}</strong>으로 입장했습니다.
            {user.isAnonymous ? ' 현재는 게스트 계정입니다.' : ' Google 계정으로 로그인되어 있습니다.'}
          </p>
          <div className="auth-actions">
            {user.isAnonymous && (
              <button className="primary-button" type="button" disabled={!ready} onClick={onGoogleLogin}>
                Google 계정으로 전환
              </button>
            )}
            <button className="ghost-button" type="button" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </>
      ) : (
        <>
          <p>온라인 방을 만들거나 참가하려면 먼저 입장 방식을 선택하세요.</p>
          <div className="auth-actions">
            <button className="primary-button" type="button" disabled={!ready || !authReady} onClick={onGoogleLogin}>
              Google로 로그인
            </button>
            <button className="secondary-button" type="button" disabled={!ready || !authReady} onClick={onGuestLogin}>
              게스트로 입장
            </button>
          </div>
        </>
      )}

      {authError && <p className="error">{authError}</p>}
    </aside>
  );
}
