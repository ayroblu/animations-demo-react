import React from "react";
import { SegmentedControl } from "../components/SegmentedControl";
import { Link } from "react-router-dom";

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
      window.requestAnimationFrame(() => {
        // requestAnimationFrame: Not always true, but in this case, needed to
        // wait till element got some height
        const box = element.getBoundingClientRect();
        const scale = prevBox.height / box.height;
        const top = prevBox.top - box.top;
        const left = prevBox.left - box.left;
        const originalTransform = element.style.transform;
        element.style.transform += `translate(${left}px, ${top}px) scale(${scale})`;
        window.requestAnimationFrame(() => {
          element.style.transition = "0.3s transform";
          element.style.transform = originalTransform;
          function removeTransition() {
            element.style.transition = "";
            element.removeEventListener("transitionend", removeTransition);
          }
          element.addEventListener("transitionend", removeTransition);
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
