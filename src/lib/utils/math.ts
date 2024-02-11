type Vector = [x: number, y: number] | number[];

export function dot(vec1: Vector, vec2: Vector) {
  return vec1.reduce((sum, next, i) => sum + next * vec2[i], 0);
}
export function dist(vec: Vector) {
  return Math.sqrt(vec.reduce((sum, next) => sum + Math.pow(next, 2), 0));
}
export function avg(vecs: Vector[]): Vector {
  const result = vecs[0].concat() as Vector;
  for (let i = 0; i < result.length; ++i) {
    result[i] = vecs.reduce((sum, next) => sum + next[i], 0) / vecs.length;
  }
  return result;
}
