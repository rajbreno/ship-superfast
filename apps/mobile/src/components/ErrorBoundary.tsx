import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text } from "react-native";
import { Button } from "heroui-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryClass extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-background px-8">
          <Text className="mb-4 text-lg text-muted">
            Something went wrong
          </Text>
          <Button onPress={() => this.setState({ hasError: false })} size="lg">
            Retry
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

export const ErrorBoundary = ErrorBoundaryClass;
