export function cn(
  ...args: (string | "" | 0 | false | null | undefined)[]
): string {
  return args.filter((a) => a).join(" ");
}

type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};
export function getTransform(from: Box, to: Box, partial?: number): string {
  const portion = partial ?? 1;
  const translate = `translate(${(to.left - from.left) * portion}px, ${
    (to.top - from.top) * portion
  })`;
  const scale = `scale(${
    1 + ((to.width - from.width) / from.width) * portion
  }, ${1 + ((to.height - from.height) / from.height) * portion})`;
  return `${translate} ${scale}`;
}

type Point = { x: number; y: number };
export function getScrollPosition(el: HTMLElement | Window = window): Point {
  return {
    x: "scrollX" in el ? el.scrollX : el.scrollLeft,
    y: "scrollY" in el ? el.scrollY : el.scrollTop,
  };
}
