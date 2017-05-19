# Parsinator

Parsinator is a TypeScript/JavaScript library that lets you build small well-defined parsers which can be combined together to accomplish just about any parsing task.

## Installation

```bash
npm install parsinator
```

## Usage

TypeScript:

```ts
import * as Parser from 'parsinator';

var parseNaturalNumber: Parser.Parser<number> = Parser.map<string,number>(
    Parser.regex(/[1-9][0-9]*|0/),
    (str: string): number => parseInt(str, 10)
);

var parseSum: Parser.Parser<number> = Parser.fromGenerator(function *() {
    var left = yield parseNaturalNumber;
    yield Parser.str("+");
    var right = yield parseNaturalNumber;
    return left + right;
});

Parser.run(parseSum, "123+456"); // evaluates to: 579
Parser.run(parseSum, "23.5+92"); // throws error:
// Error: Parse failure at 1:3: "+" not found
// -> "23.5+92"
//       ^
```

JavaScript (ES2015):

```js
import * as Parser from 'parsinator';

var parseNaturalNumber = Parser.map(
    Parser.regex(/[1-9][0-9]*|0/),
    (str) => parseInt(str, 10)
);

var parseSum = Parser.fromGenerator(function *() {
    var left = yield parseNaturalNumber;
    yield Parser.str("+");
    var right = yield parseNaturalNumber;
    return left + right;
});

Parser.run(parseSum, "123+456"); // evaluates to: 579
Parser.run(parseSum, "23.5+92"); // throws error:
// Error: Parse failure at 1:3: "+" not found
// -> "23.5+92"
//       ^
```

JavaScript (ES5+commonjs):

```js
var Parser = require('parsinator');

var parseNaturalNumber = Parser.map(
    Parser.regex(/[1-9][0-9]*|0/),
    function (str) {
        return parseInt(str, 10);
    }
);

var parseSum = Parser.map(Parser.sequence([
    parseNaturalNumber,
    Parser.str("+"),
    parseNaturalNumber
]), function (items) {
    return items[0] + items[2];
});

Parser.run(parseSum, "123+456"); // -> 579
Parser.run(parseSum, "23.5+92"); // throws error:
// Error: Parse failure at 1:3: "+" not found
// -> "23.5+92"
//       ^
```