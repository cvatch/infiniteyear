// tests/index.test.js

const InfiniteYear = require('../src/index');

describe('InfiniteYear', () => {
  test('should create an instance', () => {
    const app = new InfiniteYear();
    expect(app).toBeInstanceOf(InfiniteYear);
  });

  test('should have the correct name', () => {
    const app = new InfiniteYear();
    expect(app.name).toBe('Infinite Year');
  });

  test('should greet correctly', () => {
    const app = new InfiniteYear();
    expect(app.greet()).toBe('Welcome to Infinite Year!');
  });
});