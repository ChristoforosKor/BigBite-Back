// DevexFilterToMongoose.test.js
const DevexFilterToMongoose = require('../../../dto/DevexFilterToMongoose');

describe('DevexFilterToMongoose.transform', () => {
  const build = (tokens) => new DevexFilterToMongoose().transform(tokens);

  test('empty tokens -> {}', () => {
    expect(build([])).toEqual({});
    expect(build(null)).toEqual({});
    expect(build(undefined)).toEqual({});
  });

  test('single equals on string (uppercases input, index-friendly)', () => {
    const q = build([['username', '=', 'alex']]);
    expect(q).toEqual({ username: 'ALEX' });
  });

  test('single equals on number (no uppercasing)', () => {
    const q = build([['age', '=', '42']]);
    expect(q).toEqual({ age: 42 });
  });

  test('not equals on string', () => {
    const q = build([['status', '<>', 'blocked']]);
    expect(q).toEqual({ status: { $ne: 'BLOCKED' } });
  });

  test('contains (regex, no /i, uppercased pattern)', () => {
    const q = build([['fullname', 'contains', 'val']]);
    expect(q).toEqual({ fullname: { $regex: 'VAL' } });
  });

  test('startswith (regex ^PAT)', () => {
    const q = build([['username', 'startswith', 'adm']]);
    expect(q).toEqual({ username: { $regex: '^ADM' } });
  });

  test('endswith (regex PAT$)', () => {
    const q = build([['email', 'endswith', '.gr']]);
    expect(q).toEqual({ email: { $regex: '\\.GR$' } }); // dot escaped by escapeRegex
  });

  test('AND group (two terms)', () => {
    const q = build([
      ['username', '=', 'alex'],
      'and',
      ['age', '>=', '18']
    ]);
    expect(q).toEqual({
      $and: [
        { username: 'ALEX' },
        { age: { $gte: 18 } }
      ]
    });
  });

  test('OR of AND groups', () => {
    const q = build([
      ['role', '=', 'admin'],
      'and',
      ['active', '=', '1'],
      'or',
      ['role', '=', 'manager']
    ]);
    expect(q).toEqual({
      $or: [
        { $and: [
          { role: 'ADMIN' },
          { active: loosely('1') } // string stays string unless numeric-only desired; you can change coercion if needed
        ]},
        { role: 'MANAGER' }
      ]
    });
  });

  test('nested group ( (A AND B) OR (C AND D) )', () => {
    const q = build([
      [ ['department', '=', 'sales'], 'and', ['city', 'contains', 'ath'] ],
      'or',
      [ ['department', '=', 'support'], 'and', ['city', 'contains', 'thes'] ]
    ]);
    expect(q).toEqual({
      $or: [
        { $and: [
          { department: 'SALES' },
          { city: { $regex: 'ATH' } }
        ]},
        { $and: [
          { department: 'SUPPORT' },
          { city: { $regex: 'THES' } },
        ]},
      ],
    });
  });

  test('in / anyof (array membership) on strings uppercased', () => {
    const q = build([
      ['role', 'in', ['admin', 'manager']],
    ]);
    expect(q).toEqual({
      role: { $in: ['ADMIN', 'MANAGER'] },
    });

    const q2 = build([
      ['role', 'anyof', ['admin', 'manager']],
    ]);
    expect(q2).toEqual({
      role: { $in: ['ADMIN', 'MANAGER'] },
    });
  });

  test('notin / noneof (array non-membership) on strings uppercased', () => {
    const q = build([
      ['status', 'notin', ['blocked', 'banned']],
    ]);
    expect(q).toEqual({
      status: { $nin: ['BLOCKED', 'BANNED'] },
    });

    const q2 = build([
      ['status', 'noneof', ['blocked', 'banned']],
    ]);
    expect(q2).toEqual({
      status: { $nin: ['BLOCKED', 'BANNED'] },
    });
  });

  test('between (range) for numbers', () => {
    const q = build([
      ['age', 'between', ['18', '65']],
    ]);
    expect(q).toEqual({
      age: { $gte: 18, $lte: 65 },
    });
  });

  test('between (range) for dates - ISO strings', () => {
    const q = build([
      ['createdAt', 'between', ['2024-01-01', '2024-12-31']],
    ]);
    expect(q).toEqual({
      createdAt: {
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-12-31'),
      },
    });
  });

  test('comparisons > >= < <= with numbers', () => {
    const q = build([
      ['score', '>', '10'],
      'and',
      ['score', '<=', '100'],
    ]);
    expect(q).toEqual({
      $and: [
        { score: { $gt: 10 } },
        { score: { $lte: 100 } },
      ],
    });
  });

  test('isnull / isnotnull', () => {
    const q = build([
      ['middleName', 'isnull', null],
      'and',
      ['nickname', 'isnotnull', null],
    ]);
    expect(q).toEqual({
      $and: [
        { middleName: null },
        { nickname: { $ne: null } },
      ],
    });
  });

  test('isblank / isnotblank', () => {
    const q = build([
      ['comment', 'isblank', null],
      'and',
      ['title', 'isnotblank', null],
    ]);
    expect(q).toEqual({
      $and: [
        { comment: { $in: [null, ''] } },
        { title: { $nin: [null, ''] } },
      ],
    });
  });

  test('fallback for unknown op on string -> contains (uppercased)', () => {
    const q = build([
      ['notes', 'weirdop', 'hello.world'],
    ]);
    // dot should be escaped
    expect(q).toEqual({
      notes: { $regex: 'HELLO\\.WORLD' },
    });
  });
});
