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

export function clamp(low: number, value: number, high: number) {
  return Math.max(low, Math.min(high, value));
}

export function getScrollParent(element: HTMLElement, includeHidden?: boolean) {
  let style = getComputedStyle(element);
  const excludeStaticParent = style.position === "absolute";
  const overflowRegex = includeHidden
    ? /(auto|scroll|hidden)/
    : /(auto|scroll)/;

  if (style.position === "fixed") return document.documentElement;
  let parent = element.parentElement;
  while (parent) {
    style = getComputedStyle(parent);
    if (!(excludeStaticParent && style.position === "static")) {
      if (
        overflowRegex.test(style.overflow + style.overflowY + style.overflowX)
      )
        return parent;
    }
    parent = parent.parentElement;
  }

  return document.documentElement;
}
