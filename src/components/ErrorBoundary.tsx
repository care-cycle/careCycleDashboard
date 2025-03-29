import { Component, ErrorInfo, ReactNode } from "react";
import { MeshGradientBackground } from "./MeshGradientBackground";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex flex-col items-center justify-center relative">
            <MeshGradientBackground />
            <img
              src="/carecyclelogowhite.svg"
              alt="CareCycle Logo"
              className="w-64 mb-12"
            />
            <div className="text-center text-white">
              <h2 className="text-2xl font-semibold mb-2">
                Something went wrong
              </h2>
              <p>Please try refreshing the page</p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
