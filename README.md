# Parsinator

Parsinator is a TypeScript/JavaScript library that lets you build small well-defined parsers which can be combined
together to accomplish just about any parsing task.

## Installation

```bash
npm install parsinator
```

## Documentation

Technical documentation is a bit light, so your best bet is to look at the docstrings in the typescript declaration
files: [dist/es5-bundle/parsinator-amd.d.ts](dist/es5-bundle/parsinator-amd.d.ts)

## Usage

### TypeScript

```ts
import * as Parser from 'parsinator';

var parseNaturalNumber: Parser.Parser<number> = Parser.map<string,number>(
    Parser.regex(/[1-9][0-9]*|0/),
    (str: string): number => parseInt(str, 10)
);

var parseSum: Parser.Parser<number> = Parser.fromGenerator(function *() {
    var left = yield* parseNaturalNumber;
    yield* Parser.str("+");
    var right = yield* parseNaturalNumber;
    return left + right;
});

Parser.run(parseSum, "123+456"); // evaluates to: 579
Parser.run(parseSum, "23.5+92"); // throws error:
// Error: Parse failure at 1:3: "+" not found
// -> "23.5+92"
//       ^
```

### JavaScript (ES2015)

```js
import * as Parser from 'parsinator';

var parseNaturalNumber = Parser.map(
    Parser.regex(/[1-9][0-9]*|0/),
    (str) => parseInt(str, 10)
);

var parseSum = Parser.fromGenerator(function *() {
    var left = yield* parseNaturalNumber;
    yield* Parser.str("+");
    var right = yield* parseNaturalNumber;
    return left + right;
});

Parser.run(parseSum, "123+456"); // evaluates to: 579
Parser.run(parseSum, "23.5+92"); // throws error:
// Error: Parse failure at 1:3: "+" not found
// -> "23.5+92"
//       ^
```

### JavaScript (ES5)

Version 2 does not support ES5.


## Upgrading from Version 1 to Version 2

Version 2 uses TypeScript features only available in version 3.6, in order to allow for correct typing of generators.
This required an API change and a language runtime that supports the `yield*` keyword.

To upgrade, change all your `fromGenerator` calls that contain `yield` so that they are `yield*`.

If you wrote custom parsers which take and return state, you must use generators now.
* `yield 0` retrieves the current state
* `yield number` increments the offset by number
* `yield state` sets the state to the new state
