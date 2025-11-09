// Loosely compares by string value (so '1' === 1)
export const loosely = (expected) => ({
  asymmetricMatch: (received) => String(received) === String(expected),
  toAsymmetricMatcher: () => `loosely(${expected})`
});

// Case-insensitive string equality
export const ci = (expected) => ({
  asymmetricMatch: (received) =>
    typeof received === 'string' && typeof expected === 'string' &&
    received.toLowerCase() === expected.toLowerCase(),
  toAsymmetricMatcher: () => `ci(${JSON.stringify(expected)})`
});
