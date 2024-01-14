import React from "react";
import { SegmentedControl } from "../components/SegmentedControl";
import { useNestedViewTransitions } from "../lib/view-transitions";
import styles from "./SegmentedControl.module.css";
import { Link } from "react-router-dom";
import iosStyles from "../components/IosPadding.module.css";

export function SegmentedControlRoute() {
  const { wrapInViewTransition } = useNestedViewTransitions();
  const [value, setValue] = React.useState<string>();
  const handleChange = React.useCallback(
    (value: string) => {
      wrapInViewTransition(() => {
        setValue(value);
      });
    },
    [wrapInViewTransition],
  );
  return (
    <div className={iosStyles.fullPadding}>
      <Link to="/">&lt; Home</Link>
      <h1>Segmented Control demo</h1>

      <SegmentedControl
        selectedBackgroundClassName={styles.selectedSegmentedControl}
        items={items}
        onChange={handleChange}
        value={value}
      />
    </div>
  );
}
const items = [
  {
    label: "Car",
    value: "car",
  },
  {
    label: "Public Transport",
    value: "public_transport",
  },
  {
    label: "Cycle",
    value: "cycle",
  },
];
