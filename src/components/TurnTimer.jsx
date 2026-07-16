import { useEffect, useState } from 'react';

export function TurnTimer({ room }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  if (!room?.timeControl?.enabled || !room.turnDeadlineAtMs || room.status === 'finished') return null;

  const remaining = Math.max(0, room.turnDeadlineAtMs - now);
  const seconds = Math.ceil(remaining / 1000);

  return (
    <section className={`timer-card ${seconds <= 10 ? 'timer-danger' : ''}`}>
      <span>턴 제한 시간</span>
      <strong>{formatSeconds(seconds)}</strong>
      <small>0초가 되면 서버 스케줄러가 시간초과를 처리합니다.</small>
    </section>
  );
}

function formatSeconds(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
