import React from "react";
import { HalfSheet } from "../components/HalfSheet";
import { useViewTransitions } from "../lib/view-transitions";
import style from "./HalfSheet.module.css";
import { Link } from "react-router-dom";
import iosStyles from "../components/IosPadding.module.css";

export function HalfSheetRoute() {
  const [visible, setVisible] = React.useState(false);
  const { wrapInViewTransition } = useViewTransitions();
  const toggleVisible = React.useCallback(() => {
    wrapInViewTransition(() => {
      setVisible((visible) => !visible);
    });
  }, [wrapInViewTransition]);

  return (
    <div className={iosStyles.fullPadding}>
      <Link to="/">&lt; Home</Link>
      <h1>Half Sheet demo</h1>

      <button onClick={toggleVisible}>
        Tap this button to make the half sheet appear
      </button>

      {visible && (
        <HalfSheet dialogClassName={style.halfSheet} dismiss={toggleVisible} />
      )}
    </div>
  );
}
