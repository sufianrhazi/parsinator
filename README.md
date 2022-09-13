# Parsinator

Parsinator lets you build small well-defined parsers in JavaScript or TypeScript which can be combined together to
accomplish just about any parsing task.


## Installation

Install from the [npm published package](https://www.npmjs.com/package/parsinator):

```bash
npm install parsinator
```


## What it does

Parsinator uses [parser combinators](https://en.wikipedia.org/wiki/Parser_combinator) to build structured data from
string input. Unlike other ways of parsing data, Parser Combinators are:

* **Maintainable**: designed to be read and written by humans, unlike regular expressions which are designed to be
  executable by machines.
* **Reusable**: complex parsers are built from smaller pieces, which are each responsible for parsing individual parts.
* **Debuggable**: parse failures provide a detailed error message which shows what the parser was expecting.
* **Powerful**: can match/extract data which is impossible (like equal nesting) for regular expressions to parse.

Parsinator is inspired by the excellent [parsec](https://github.com/aslatter/parsec) Haskell library.

Parsinator allows you to easily define and combine parsers to produce structured data from string input.


## Example

Here's a small text parser that parses a greeting between a matching number of `<` and `>` characters:

```ts
import * as Parsinator from 'parsinator';

const greeting = Parsinator.fromGenerator(function *() {
    const exclamations = yield* Parsinator.many(Parsinator.str("<"));
    const intro = yield* Parsinator.regex(/[hH]ello, /);
    const who = yield* Parsinator.until(Parsinator.str("!"));
    yield* Parsinator.count(exclamations.length, Parsinator.str(">"));
    return {
        who: who,
        excitement: exclamations.length
    };
});

Parsinator.runToEnd(greeting, "<Hello, Parsinator>");
// { who: "Parsinator", excitement: 1 }
Parsinator.runToEnd(greeting, "<<<<hello, stranger>>>>");
// { who: "stranger", excitement: 4 }
```


## Documentation

The main abstraction is the `Parser<T>` type, which represents a parser which _consumes_ some amount of a string input,
and produces an arbitrary value (of type `T`) as a result of parsing the string text.


### Building blocks

The following building blocks can be used to build both simple and parsers.


#### `function regex(re: RegExp): Parser<string>`

Consume and produce the full string match from a regular expression.


#### `function regexMatch(regex: RegExp): Parser<string[]>;`

Consume and produce the full match and all groups from a regular expression.

Produces a string array; item 0 is the full match, subsequent items are the regular expression matched groups.


#### `function str<T extends string>(string: T): Parser<T>;`

Consume and produce a string value.


#### `function fromGenerator<P, V>(generator: () => Generator<number | ParseState, V, ParseState>): Parser<V>;`

Create a custom parser for a generator function. This is the recommended approach for building parsers. For example,
here's how to parse a word surrounded by any number of matching parenthesis:

```ts
const parenMatcher = Parsinator.fromGenerator(function* () {
  const maybeOpen = Parsinator.maybe(Parsinator.str('('));
  let parenCount = 0;
  let match = yield* maybeOpen;
  while (match !== null) {
    parenCount += 1;
    match = yield* maybeOpen;
  }
  const name = yield* Parsinator.regex(/[a-zA-Z]+/);
  for (let i = 0; i < parenCount; ++i) {
    yield* Parsinator.str(')');
  }
  return match;
});

Parsinator.run(parenMatcher, '(((three)))'); // evaluates to 'three'
Parsinator.run(parenMatcher, '(one)'); // evaluates to 'one'

Parsinator.run(parenMatcher, '((two)'); // Fails with:
// Error: Parse failure at 1:7: ")" not found
//   -> «((two)»
//            ^
```

**Running sub-parsers**

Parsers are executed with a `yield*` expression. The parser is executed and the expression evaluates to the produced
value of the parser.


**Changing parse state**

Parsers may obtain the state of the parser via `yield 0`. Parse state is an object containing:
`{ input: string, offset: number }`.

Parsers may advance the offset by a number of characters via `yield numChars` where `numChars` is a number.

Parsers may reset state to a prior state by `yield priorState`.

If a parser fails, an exception is thrown. Note: the state of the parser is *not* reset after an exception if caught,
it's up to the caller to save and restore parse state.


#### `function fail<T>(message: string): Parser<T>;`

Create a parser which consumes nothing and always fails with a specific error message.


#### `function wrapFail<T>(parser: Parser<T>, wrapper: (message: string) => string): Parser<T>;`

Create a parser which acts like the passed parser, but when fails, provides an alternate error message.


#### `function debugTrace(log: (str: string) => void): Parser<undefined>;`

A parser which consumes nothing and produces `undefined`. Helpful to log inside a parser.


#### `const end: Parser<null>;`

A parser which consumes nothing, but successfully produces `null` when at the end of input and fails if there is more
input.


### Running parsers

Once a parser is created, the parser can be performed via these functions.


#### `function run<T>(parser: Parser<T>, input: string): T;`

Run a parser on an input string, returning the parser's produced value.

Note: the parser does not need to consume the entire input string.


#### `function runToEnd<T>(parser: Parser<T>, input: string): T;`

Run a parser on an input string, returning the parser's produced value.

Fails if the parser does not consume the entire input string.


### Parser combinator helpers

These functions are helpers for common parsers.


#### `function maybe<P>(parser: Parser<P>): Parser<P | null>;`

Create a parser which acts like the provided parser, but produces null if it fails.


#### `function many<P>(parser: Parser<P>): Parser<P[]>;`

Create a parser which produces an array of items by applying the provided parser any number of times (including zero).


#### `function many1<P>(parser: Parser<P>): Parser<P[]>;`

Create a parser which produces an array of items by applying the provided parser one or more times.


#### `function choice<V>(parsers: Parser<V>[]): Parser<V>;`

Create a parser which produces the first successful result of matching the provided parsers.


#### `function sequence<V>(parsers: Parser<V>[]): Parser<V[]>;`

Create a parser which produces an array of results, provided by running the provided parsers in sequence.


#### `function count<V>(num: number, parser: Parser<V>): Parser<V[]>;`

Create a parser which produces an array of values by running the provided parser a specific number of times.


#### `function sepBy1<S, V>(sepParser: Parser<S>, valParser: Parser<V>): Parser<V[]>;`

Create a parser which produces an array of desired values separated discarded separators.

If no values are found, the parser fails.


For example, this parses comma separated words:

```ts
const commaSeparatedDigits = Parsinator.sepBy1(Parsinator.str(','), Parsinator.regex(/[a-z]+/));

Parsinator.runToEnd(commaSeparatedDigits, 'foo,bar,baz'); // evaluates to ['foo', 'bar', 'baz']
```


#### `function sepBy<S, V>(sepParser: Parser<S>, valParser: Parser<V>): Parser<V[]>;`

Create a parser which produces an array of desired values separated discarded separators.

If no values are found, the parser produces an empty array.


#### `function peek<P>(parser: Parser<P>): Parser<P>;`

Create a parser which produces a value by running the provided parser, but does not advance state.

Note: If an error occurs, it will still raise an exception. Use `maybe` in addition to avoid the error.


#### `function until<T>(terminator: Parser<T>): Parser<string>;`

Create a parser which produces a string that spans until the provided terminator is parsed.


#### `function between<T>(start: Parser<T>, end: Parser<T>): Parser<string>;`

Create a parser which produces a string that spans from the provided start parser to the provided end parser.


#### `function map<V, W>(parser: Parser<V>, fn: (val: V) => W): Parser<W>;`

Create a parser which produces a transformed value from a provided parser.


#### `function surround<L, T, R>(left: Parser<L>, val: Parser<T>, right: Parser<R>): Parser<T>;`

Create a parser which produces a value surrounded by a provided prefix and suffix parser.

For example, this parser returns a word surrounded by parenthesis:

```ts
const parenthetical = Parsinator.surround(Parsinator.str('('), Parsinator.regex(/[a-z]+/), Parsinator.str(')'));

Parsinator.run(parenthetical, '(howdy)'); // evaluates to: 'howdy'
```

#### `function buildExpressionParser<T>(operators: OperatorDecls<T>, parseTermFactory: () => Parser<T>): Parser<T>;`

Produce a parser which can parse arbitrary binary and unary expressions.

`buildExpressionParser` deals with the heavy lifting of dealing with operator fixity, precedence, and associativity.

As an example, here's a very simple arithmetic parser:

```ts
var number = Parsinator.map(Parsinator.regex(/[0-9]+/), (str) => parseInt(str, 10));

var operator = (opstr, action) => Parsinator.map(Parsinator.str(opstr), () => action);

var negate = operator('-', (val) => -val);
var sum = operator('+', (x, y) => x + y);
var multiply = operator('*', (x, y) => x * y);
var exponent = operator('^', (x, y) => Math.pow(x, y));

var evaluate = Parsinator.buildExpressionParser([
    { fixity: "prefix", parser: negate },
    { fixity: "infix", associativity: "right", parser: exponent },
    { fixity: "infix", associativity: "left", parser: multiply },
    { fixity: "infix", associativity: "left", parser: sum }
], () => Parsinator.choice([
    Parsinator.surround(Parsinator.str("("), evaluate, Parsinator.str(")")),
    number
]));

Parsinator.runToEnd(evaluate, "1+2*3+1"); // evaluates to 8
Parsinator.runToEnd(evaluate, "(1+2)*-(3+1)"); // evaluates to -12
Parsinator.runToEnd(evaluate, "3^3^3"); // evaluates to 7625597484987
```


## Upgrading from Version 1 to Version 2

Note: Version 2 does not support ES5.

Version 2 uses TypeScript features only available in version 3.6, in order to allow for correct typing of generators.
This required an API change and a language runtime that supports the `yield*` keyword.

To upgrade, change all your `fromGenerator` calls that contain `yield` so that they are `yield*`.

If you wrote custom parsers which take and return state, you must use generators now.
* `yield 0` retrieves the current state
* `yield number` increments the offset by number
* `yield state` sets the state to the new state
