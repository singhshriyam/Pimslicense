"use client";
import Error403Container from "@/Components/Others/Error/Error403";
import Store from "@/Redux/Store";
import { RootLayoutProps } from "@/Types/Layout.type";
import React, { ErrorInfo } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { Provider } from "react-redux";

interface ErrorBoundaryState {
  hasError: boolean;
}

unstable_batchedUpdates(() => {
  console.error = () => { };
  console.warn = () => { };
});

class ErrorBoundary extends React.Component<RootLayoutProps, ErrorBoundaryState> {
  constructor(props: RootLayoutProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.message.includes("ToastContainer")) {
      return;
    }
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Error403Container />
    }

    return this.props.children;
  }
}

const MainProvider: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <Provider store={Store}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Provider>
  );
};

export default MainProvider;