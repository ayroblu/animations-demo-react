import React from "react";
import { SegmentedControl } from "../components/SegmentedControl";
import { Link } from "react-router-dom";
import { getTransformsManager, transitionWrapper } from "../lib/utils/hooks";
import { getTransform } from "../lib/utils";

export function SegmentedControlOldRoute() {
  const [, setValue] = React.useState<string>();
  const handleChange = React.useCallback((value: string) => {
    setValue(value);
  }, []);
  const { selectedRef } = useSelectedElement();
  return (
    <>
      <Link to="/">&lt; Home</Link>
      <h1>Segmented Control Old demo</h1>

      <p>
        This is "old" in the sense that it uses traditional translate transition
        rather than view transitions api
      </p>

      <SegmentedControl
        selectedRef={selectedRef}
        items={items}
        onChange={handleChange}
      />
    </>
  );
}
function useSelectedElement() {
  const selectedElementRef = React.useRef<HTMLElement | null>(null);
  const selectedRef = React.useCallback((el: HTMLElement | null) => {
    if (selectedElementRef.current && el) {
      const element = el;
      const prevElement = selectedElementRef.current;
      const prevBox = prevElement.getBoundingClientRect();
      const { transformTo, transformReset } = getTransformsManager();
      window.requestAnimationFrame(() => {
        // requestAnimationFrame: Not usually needed, but in this case, needed to
        // wait till element got some height
        const box = element.getBoundingClientRect();
        const transform = getTransform(box, prevBox);
        transformTo(element, transform);

        requestAnimationFrame(() => {
          transitionWrapper(element, () => {
            transformReset(element);
          });
        });
      });
    }
    selectedElementRef.current = el;
  }, []);
  return { selectedRef };
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
