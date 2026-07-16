export function SettingsPanel({ game, disabled, onNewLocalGame }) {
  return (
    <aside className="rules-card">
      <h2>규칙 / 설정</h2>
      <ol>
        <li>빈 칸에 자기 돌 하나를 둡니다.</li>
        <li>착수 직후 목표 목수가 완성되면 승리합니다.</li>
        <li>승리하지 않았다면 방향을 시계방향 0·1·2칸 중 하나만큼 돌립니다.</li>
        <li>방향 조정 직후에도 목표 목수가 완성되면 승리합니다.</li>
        <li>모든 돌은 현재 방향으로 한 칸짜리 그림자를 만듭니다.</li>
        <li>실제 돌이 있는 칸에는 그림자가 생기지 않습니다.</li>
      </ol>

      <div className="settings-row">
        <label>판 크기</label>
        <select
          defaultValue={game.size}
          disabled={disabled}
          onChange={(event) => onNewLocalGame({ size: Number(event.target.value), winLength: game.winLength })}
        >
          <option value="11">11 × 11</option>
          <option value="13">13 × 13</option>
          <option value="15">15 × 15</option>
        </select>
      </div>

      <div className="settings-row">
        <label>승리 조건</label>
        <select
          defaultValue={game.winLength}
          disabled={disabled}
          onChange={(event) => onNewLocalGame({ size: game.size, winLength: Number(event.target.value) })}
        >
          <option value="5">5목 블리츠</option>
          <option value="7">7목 기본</option>
        </select>
      </div>
    </aside>
  );
}
