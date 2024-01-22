function cubicBezier(
  p1x: number,
  _p1y: number,
  p2x: number,
  _p2y: number,
  t: number,
) {
  // https://morethandev.hashnode.dev/demystifying-the-cubic-bezier-function-ft-javascript
  return (
    3 * Math.pow(1 - t, 2) * t * p1x +
    3 * (1 - t) * Math.pow(t, 2) * p2x +
    Math.pow(t, 3)
  );
}
export function ease(t: number) {
  return cubicBezier(0.25, 0.1, 0.25, 1, t);
}
// cubic-bezier(0.25, 0.1, 0.25, 1)
