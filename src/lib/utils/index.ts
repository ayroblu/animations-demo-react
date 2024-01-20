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
