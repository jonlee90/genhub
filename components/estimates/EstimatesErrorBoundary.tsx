"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import AlertCircle from "lucide-react/icons/alert-circle";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class EstimatesErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[EstimatesErrorBoundary] Error caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
            {this.state.error?.message ||
              "An unexpected error occurred in the estimates section."}
          </p>

          <Button
            onClick={this.handleReset}
            className="min-h-[44px] min-w-[44px] px-6 active:scale-95"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
