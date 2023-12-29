import React from "react";
import { HalfSheet } from "../components/HalfSheet";
import { useViewTransitions } from "../lib/view-transitions";
import style from "./HalfSheet.module.css";

export function HalfSheetRoute() {
  const [visible, setVisible] = React.useState(false);
  const { wrapInViewTransition } = useViewTransitions();
  function toggleVisible() {
    wrapInViewTransition(() => {
      setVisible((visible) => !visible);
    });
  }

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
