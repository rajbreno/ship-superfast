import {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";

const ForegroundRecoveryContext = createContext<number>(0);

/**
 * Detects when the app returns from background after 5+ seconds
 * and increments a recoveryKey to signal components to refetch data.
 *
 * Fixes stale network requests (WebSocket + HTTP) that hang when
 * the JS thread is suspended during backgrounding.
 */
export function ForegroundRecoveryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [recoveryKey, setRecoveryKey] = useState(0);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number>(0);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState.match(/inactive|background/)) {
          backgroundTime.current = Date.now();
        }

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          const duration =
            backgroundTime.current > 0
              ? Date.now() - backgroundTime.current
              : 0;

          if (duration > 5000) {
            setRecoveryKey((k) => k + 1);
          }
        }

        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <ForegroundRecoveryContext.Provider value={recoveryKey}>
      {children}
    </ForegroundRecoveryContext.Provider>
  );
}

/**
 * Returns the current recovery key. Use in useEffect to trigger refetch.
 *
 * @example
 * const recoveryKey = useRecoveryKey();
 * useEffect(() => {
 *   if (recoveryKey > 0) refetchData();
 * }, [recoveryKey]);
 */
export function useRecoveryKey() {
  return useContext(ForegroundRecoveryContext);
}
