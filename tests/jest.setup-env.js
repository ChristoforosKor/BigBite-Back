

// Asymmetric: loose value equality (e.g., '1' matches 1)
global.loosely = (expected) => ({
        asymmetricMatch: (received) => String(received) === String(expected),
        toAsymmetricMatcher: () => `loosely(${expected})`
    });

// Asymmetric: case-insensitive string equality
global.ci = (expected) => ({
        asymmetricMatch: (received) =>
            typeof received === 'string' &&
                    typeof expected === 'string' &&
                    received.toLowerCase() === expected.toLowerCase(),
        toAsymmetricMatcher: () => `ci(${JSON.stringify(expected)})`
    });

// Optional: symmetric matcher for whole-structure "loose" equality (use sparingly)
expect.extend({
    toLooselyEqual(received, expected) {
        const stringify = (v) =>
            JSON.stringify(v, (_, x) =>
                (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean')
                        ? String(x)
                        : x
            );

        const pass = stringify(received) === stringify(expected);
        return {
            pass,
            message: () =>
                    `Expected (loosely) ${this.utils.printExpected(expected)}\n` +
                        `Received           ${this.utils.printReceived(received)}`
        };
    }
});
