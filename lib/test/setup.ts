// jest-dom matchers (toBeInTheDocument, toBeDisabled, …) for component tests.
// Harmless for the node-environment logic tests, which simply never use them.
import '@testing-library/jest-dom/vitest';

// jsdom implements no media queries, and the booking flow asks for one to pick
// its desktop vs mobile layout. Default to mobile (the primary surface); a test
// that needs desktop can stub a different answer.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
