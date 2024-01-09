import React from "react";

export function useForceUpdate() {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  return forceUpdate;
}

export function useDimensions() {
  const height = document.body.clientHeight;
  const width = document.body.clientWidth;
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    window.addEventListener("resize", forceUpdate);
  }, [forceUpdate]);
  return {
    width,
    height,
  };
}
