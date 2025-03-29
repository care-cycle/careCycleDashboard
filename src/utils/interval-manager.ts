// Global type declaration
declare global {
  interface Window {
    _intervals: number[];
  }
}

// Initialize the intervals array if it doesn't exist
if (typeof window !== "undefined") {
  window._intervals = window._intervals || [];
}

export const intervalManager = {
  add: (interval: number) => {
    if (typeof window !== "undefined") {
      window._intervals = window._intervals || [];
      window._intervals.push(interval);
    }
  },

  clear: () => {
    if (typeof window !== "undefined") {
      const intervals = window._intervals || [];
      intervals.forEach(clearInterval);
      window._intervals = [];
    }
  },
};
