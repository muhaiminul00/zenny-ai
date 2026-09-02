// Vitest setup — runs once before the test suite. Extends expect() with
// jest-dom's DOM matchers (toBeInTheDocument, toHaveTextContent, etc.)
// and cleans up the DOM between tests so components don't leak state.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
