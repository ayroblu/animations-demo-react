import React from "react";
import { HalfSheet } from "../components/HalfSheet";
import { useViewTransitions } from "../lib/view-transitions";
import style from "./HalfSheet.module.css";

export function HalfSheetRoute() {
  const [visible, setVisible] = React.useState(false);
  const { wrapInViewTransition } = useViewTransitions();
  const toggleVisible = React.useCallback(() => {
    wrapInViewTransition(() => {
      setVisible((visible) => !visible);
    });
  }, [wrapInViewTransition]);

  return (
    <>
      <h1>Half Sheet demo</h1>

      <button onClick={toggleVisible}>
        Tap this button to make the half sheet appear
      </button>

      {visible && (
        <HalfSheet
          dialogClassName={style.halfSheet}
          onDismiss={toggleVisible}
        />
      )}
    </>
  );
}
