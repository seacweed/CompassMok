import { siteMeta } from '../ads/adsConfig';

export function LegalPage({ type }) {
  const meta = siteMeta();

  if (type === 'privacy') return <PrivacyPolicy meta={meta} />;
  if (type === 'terms') return <TermsOfService meta={meta} />;
  if (type === 'ads') return <AdsPolicy meta={meta} />;

  return null;
}

function LegalShell({ title, children }) {
  return (
    <main className="app-shell legal-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">SERVICE DOCUMENT</p>
          <h1>{title}</h1>
          <p className="subtitle">나침반목 운영 문서입니다. 실제 출시 전 사업자 정보와 연락처를 정확히 채우세요.</p>
        </div>
        <a className="primary-button nav-button" href="/">게임으로 돌아가기</a>
      </section>
      <article className="legal-card">
        {children}
      </article>
      <SiteFooter />
    </main>
  );
}

function PrivacyPolicy({ meta }) {
  return (
    <LegalShell title="개인정보 처리방침">
      <p><strong>운영자:</strong> {meta.operatorName}</p>
      <p><strong>문의:</strong> {meta.contactEmail}</p>
      <p><strong>시행일:</strong> 2026-07-03</p>

      <h2>1. 수집하는 정보</h2>
      <p>나침반목은 서비스 제공을 위해 Firebase Authentication 식별자, 표시 이름, 프로필 이미지, 게임 전적, 레이팅, 대국 기록, 접속 및 오류 로그를 처리할 수 있습니다.</p>

      <h2>2. Google 로그인과 게스트 입장</h2>
      <p>Google 로그인 시 Firebase Authentication을 통해 Google 계정의 기본 프로필 정보가 사용될 수 있습니다. 게스트 입장은 익명 식별자를 사용하며, 브라우저나 기기가 바뀌면 동일 사용자로 이어지지 않을 수 있습니다.</p>

      <h2>3. 광고와 쿠키</h2>
      <p>이 사이트는 Google AdSense 등 제3자 광고 서비스를 사용할 수 있습니다. 광고 제공자는 쿠키, 기기 식별자, 유사 기술을 사용하여 광고 제공, 빈도 제한, 광고 성과 측정, 부정 트래픽 방지 등을 수행할 수 있습니다.</p>

      <h2>4. 제3자 제공자</h2>
      <p>광고가 활성화된 경우 Google 및 광고 기술 제공자가 사용자의 브라우저나 기기에서 정보를 수집하거나 사용할 수 있습니다. 사용자는 Google 광고 설정과 관련 opt-out 도구를 통해 맞춤 광고를 관리할 수 있습니다.</p>

      <h2>5. 보관 기간</h2>
      <p>계정, 전적, 레이팅 정보는 서비스 운영을 위해 계정 유지 기간 동안 보관될 수 있습니다. 운영자는 법적 의무, 분쟁 대응, 부정 이용 방지를 위해 필요한 기간 동안 일부 기록을 보관할 수 있습니다.</p>

      <h2>6. 사용자 권리</h2>
      <p>사용자는 자신의 개인정보에 대한 열람, 정정, 삭제, 처리 제한을 요청할 수 있습니다. 요청은 위 문의 이메일로 보낼 수 있습니다.</p>

      <h2>7. 주의</h2>
      <p>이 문서는 운영 초안입니다. 실제 출시 전 관할 법률, 광고 정책, 결제/세무 요건에 맞춰 법률 검토를 받는 것을 권장합니다.</p>
    </LegalShell>
  );
}

function TermsOfService({ meta }) {
  return (
    <LegalShell title="이용약관">
      <p><strong>운영자:</strong> {meta.operatorName}</p>
      <p><strong>문의:</strong> {meta.contactEmail}</p>
      <p><strong>시행일:</strong> 2026-07-03</p>

      <h2>1. 서비스</h2>
      <p>나침반목은 웹 기반 추상전략 보드게임입니다. 서비스는 로컬 대전, 온라인 대전, 랭크 매칭, 전적 및 랭킹 기능을 제공할 수 있습니다.</p>

      <h2>2. 계정</h2>
      <p>사용자는 Google 로그인 또는 게스트 입장으로 서비스를 이용할 수 있습니다. 계정 보안과 부정 이용 방지에 대한 책임은 사용자에게 있습니다.</p>

      <h2>3. 금지 행위</h2>
      <p>자동화된 조작, 매칭 큐 스팸, 레이팅 조작, 광고 부정 클릭, 취약점 악용, 다른 사용자 방해 행위를 금지합니다.</p>

      <h2>4. 랭크와 전적</h2>
      <p>레이팅과 전적은 시스템 오류, 부정 이용, 운영상 필요에 따라 조정 또는 초기화될 수 있습니다.</p>

      <h2>5. 광고</h2>
      <p>서비스에는 광고가 표시될 수 있습니다. 사용자는 광고를 인위적으로 클릭하거나 광고 수익을 조작하려는 행위를 해서는 안 됩니다.</p>

      <h2>6. 책임 제한</h2>
      <p>서비스는 개발 중인 게임으로, 오류나 중단이 발생할 수 있습니다. 운영자는 법률이 허용하는 범위에서 서비스 이용으로 인한 간접 손해에 책임을 지지 않습니다.</p>
    </LegalShell>
  );
}

function AdsPolicy({ meta }) {
  return (
    <LegalShell title="광고 안내">
      <p>나침반목은 운영 비용 충당을 위해 Google AdSense 등 광고 네트워크를 사용할 수 있습니다.</p>

      <h2>광고 배치 원칙</h2>
      <p>광고는 게임 조작 버튼, 보드, 방향 컨트롤과 떨어진 위치에 배치하여 실수 클릭을 줄입니다. 광고 영역은 “광고”로 구분됩니다.</p>

      <h2>부정 클릭 금지</h2>
      <p>사용자는 광고를 반복 클릭하거나 클릭을 유도하거나 자동화 도구로 광고 노출/클릭을 발생시켜서는 안 됩니다.</p>

      <h2>문의</h2>
      <p>광고, 개인정보, 부정 트래픽 관련 문의는 {meta.contactEmail}로 보내주세요.</p>
    </LegalShell>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a href="/">게임</a>
      <a href="/privacy">개인정보 처리방침</a>
      <a href="/terms">이용약관</a>
      <a href="/ads">광고 안내</a>
    </footer>
  );
}
