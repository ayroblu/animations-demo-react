export function raceSafe<T>(promises: Promise<T>[]): Promise<T> {
  const rejections: unknown[] = [];
  let isFinished = false;
  return new Promise((resolve, reject) => {
    for (const promise of promises) {
      promise.then(
        (r) => {
          if (!isFinished && r) {
            isFinished = true;
            resolve(r);
          }
        },
        (e) => {
          rejections.push(e);
          if (rejections.length === promises.length) {
            reject(rejections);
          }
        },
      );
    }
  });
}

export function raceSafeAny(promises: Promise<unknown>[]): Promise<void> {
  let isFinished = false;
  return new Promise((resolve) => {
    for (const promise of promises) {
      promise.then(
        () => {
          if (!isFinished) {
            isFinished = true;
            resolve();
          }
        },
        () => {
          if (!isFinished) {
            isFinished = true;
            resolve();
          }
        },
      );
    }
  });
}
export function wait(numMillis: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, numMillis));
}
const debug = true;
export function log(...args: unknown[]) {
  if (debug) {
    setTimeout(() => {
      console.log(...args);
    }, 50);
  }
}
