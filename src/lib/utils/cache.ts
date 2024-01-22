export function getCachedValueManager<K, T>() {
  let map = new Map<K, T>();
  function get(key: K, getNewValue: () => T): T {
    const result = map.get(key);
    if (result === undefined) {
      const value = getNewValue();
      map.set(key, value);
      return value;
    }
    return result;
  }
  function reset() {
    map = new Map();
  }
  return {
    get,
    reset,
  };
}
