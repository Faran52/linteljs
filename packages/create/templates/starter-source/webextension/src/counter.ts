export interface Counter {
  readonly count: number;
  add: () => void;
}

// A popup is destroyed every time it closes; state that must outlive it belongs in `chrome.storage`.
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
