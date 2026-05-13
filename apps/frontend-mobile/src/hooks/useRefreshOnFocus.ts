import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { DependencyList } from "react";

export function useRefreshOnFocus(callback: () => void | Promise<void>, deps: DependencyList) {
  const didMountRef = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useFocusEffect(
    useCallback(() => {
      if (!didMountRef.current) {
        didMountRef.current = true;
        return;
      }

      void callbackRef.current();
    }, deps)
  );
}
