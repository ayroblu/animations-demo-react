import React from "react";

type ContextData = {
  notifRefs: (HTMLElement | null)[];
};
export const LockScreenContext = React.createContext<ContextData | null>(null);
export function useLockScreenData(): ContextData {
  const lockScreenData = React.useContext(LockScreenContext);
  if (!lockScreenData) {
    throw new Error(
      "useLockScreenData not called from component inside a Provider",
    );
  }
  return lockScreenData;
}
