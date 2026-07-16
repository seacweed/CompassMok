import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App error boundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app-shell">
          <section className="hero">
            <div>
              <p className="eyebrow">ERROR</p>
              <h1>문제가 발생했습니다</h1>
              <p className="subtitle">페이지를 새로고침하거나 잠시 후 다시 시도하세요.</p>
            </div>
            <button className="primary-button" type="button" onClick={() => location.reload()}>
              새로고침
            </button>
          </section>
          <section className="log-card">
            <h2>오류 정보</h2>
            <p>{this.state.error.message}</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
