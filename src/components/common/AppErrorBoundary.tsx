import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application error", error, info);
  }

  private retry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-shell not-found app-error-page">
          <h1>페이지 로딩 실패</h1>
          <p>일시적 오류 발생 · 재시도 필요</p>
          <div className="detail-actions">
            <button
              type="button"
              className="primary-button"
              onClick={this.retry}
            >
              다시 시도
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                window.location.href = `${window.location.pathname}#home`;
              }}
            >
              홈으로 이동
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
