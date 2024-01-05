function createGlobalResizeObserver() {
  type Callback = (entry: ResizeObserverEntry) => void;

  const callbacks = new Map<Element, Callback>();
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const callback = callbacks.get(entry.target);
      if (callback) callback(entry);
    }
  });

  function observe(target: HTMLElement, callback: Callback) {
    resizeObserver.observe(target);
    callbacks.set(target, callback);
    return () => {
      callbacks.delete(target);
      resizeObserver.unobserve(target);
    };
  }
  return { observe };
}

export const globalResizeObserver = createGlobalResizeObserver();
