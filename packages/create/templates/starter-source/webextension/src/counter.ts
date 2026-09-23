export interface Counter {
  readonly count: number;
  add: () => void;
}

/*
 * The one piece of state the popup holds, and it holds it in memory: a popup is destroyed every time it closes, so
 * anything that has to outlive that goes in `chrome.storage` and this does not pretend otherwise.
 */
export const createCounter = (onChange: (count: number) => void): Counter => {
  let count = 0;

  onChange(count);

  return {
    get count() {
      return count;
    },
    add: () => {
      count += 1;
      onChange(count);
    },
  };
};
