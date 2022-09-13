import {
  Parser,
  ParseState,
  ParseResult,
  ParseError,
  formatState,
} from "./ParserTypes";
import { resultFailure, resultSuccess } from "./ParserHelpers";

export function makeParser<V>(
  generator: () => Generator<number | ParseState, V, ParseState>,
  parserName: string
): Parser<V> {
  return Object.assign(() => generator(), {
    [Symbol.iterator]: generator,
    parserName,
  });
}

/**
 * Produce the full string match from a regular expression.
 *
 * @param regex The regular expression to match
 * @return A parser producing the string matched by the regular expression
 */
export function regex(regex: RegExp): Parser<string> {
  return makeParser(function* () {
    const state: ParseState = yield 0;
    var remaining = state.input.slice(state.offset);
    var duplicated = new RegExp(regex);
    var result = duplicated.exec(remaining);
    if (result === null || result.index !== 0) {
      throw resultFailure(
        `regex /${regex.source}/${regex.flags} doesn't match`,
        state
      );
    }
    yield result[0].length;
    return result[0];
  }, `regex:${regex.source}`);
}

/**
 * Produce the full match and all groups from a regular expression.
 *
 * Produces a string array; item 0 is the full match.
 *
 * @param regex The regular expression to match
 * @return A parser producing an array of matching groups; item 0 is the full matching string
 */
export function regexMatch(regex: RegExp): Parser<string[]> {
  return makeParser(function* () {
    const state: ParseState = yield 0;
    var remaining = state.input.slice(state.offset);
    var duplicated = new RegExp(regex);
    var result = duplicated.exec(remaining);
    if (result === null || result.index !== 0) {
      throw resultFailure(
        `regex /${regex.source}/${regex.flags} doesn't match`,
        state
      );
    }
    yield result[0].length;
    return Array.from(result);
  }, `regexMatch:${regex.source}`);
}

/**
 * Produce a string value.
 *
 * @param string the string value to parse
 * @return A parser producing the matched string
 */
export function str<T extends string>(string: T): Parser<T> {
  return makeParser(function* () {
    const state: ParseState = yield 0;
    if (state.input.substr(state.offset, string.length) === string) {
      yield string.length;
      return string;
    } else {
      throw resultFailure(`"${string}" not found`, state);
    }
  }, `str:${string}`);
}

/**
 * Produce the return value of the generator, which may yield to sub-parsers.
 *
 * Yielded parsers evaluate to their produced value.
 *
 * @param generator A generator function which yields Parsers and returns value
 * @return A parser producing the returned value
 */
export function fromGenerator<V>(
  generator: () => Generator<number | ParseState, V, ParseState>,
  parserName?: string
): Parser<V> {
  return makeParser(function* () {
    let state: ParseState = yield 0;
    var iterator: Iterator<number | ParseState, V, ParseState> = generator();
    while (true) {
      var result = iterator.next(state);
      if (result.done) {
        yield state;
        return result.value;
      } else {
        if (typeof result.value === "number") {
          state = { ...state, offset: state.offset + result.value };
        } else {
          state = result.value;
        }
        yield state;
      }
    }
  }, parserName || generator.name);
}

/**
 * Return a parser which always fails with a specific error message.
 *
 * @param message the message to fail with
 */
export function fail<T>(message: string): Parser<T> {
  return makeParser(function* () {
    const state: ParseState = yield 0;
    throw resultFailure(message, state);
  }, `fail:${message}`);
}

/**
 * Return a parser which when the wrapped parser fails, provides an alternate error message.
 *
 * @param parser a parser whose error message is inadequate
 * @param wrapper a function to add more information to an error message
 */
export function wrapFail<T>(
  parser: Parser<T>,
  wrapper: (message: string) => string
) {
  return makeParser(function* () {
    try {
      return yield* parser;
    } catch (e) {
      if (e instanceof ParseError) {
        const message = wrapper(e.msg);
        throw resultFailure(message, { input: e.input, offset: e.offset });
      }
      throw e;
    }
  }, "wrapFail");
}

/**
 * Produce nothing and consume nothing, just log the parser state to a log
 *
 * @param log A logging function
 */
export function debugTrace(log: (str: string) => void): Parser<undefined> {
  return makeParser(function* () {
    const state: ParseState = yield 0;
    log(formatState(state));
    return undefined;
  }, "debugTrace");
}

/**
 * @var end A parser which produces null at the end of input and fails if there is more input.
 */
export const end: Parser<null> = makeParser(function* () {
  const state: ParseState = yield 0;
  if (state.offset >= state.input.length) {
    return null;
  } else {
    throw resultFailure("Not at end of string", state);
  }
}, "end");

function runInner<T>(parser: Parser<T>, state: ParseState): ParseResult<T> {
  const iter = parser();
  let step = iter.next(state);
  while (!step.done) {
    if (typeof step.value === "number") {
      state = { ...state, offset: state.offset + step.value };
    } else {
      state = step.value;
    }
    step = iter.next(state);
  }
  return {
    value: step.value,
    state: state,
  };
}

/**
 * Run a parser on an input, returning the parser's produced value.
 *
 * The parser does not need to consume the entire input.
 *
 * @param parser The parser to run
 * @param input The input string to run
 * @return The value produced by the parser
 */
export function run<T>(parser: Parser<T>, input: string): T {
  const state = {
    input: input,
    offset: 0,
  };
  return runInner(parser, state).value;
}

/**
 * Run a parser on the full input, returning the parser's produced value.
 *
 * Fails if the parser does not consume the entire input.
 *
 * @param parser The parser to run
 * @param input The input string to run
 * @return The value produced by the parser
 */
export function runToEnd<T>(parser: Parser<T>, input: string): T {
  const state = {
    input: input,
    offset: 0,
  };
  const result = runInner(parser, state);
  const next = runInner(end, result.state); // throws on error
  return result.value;
}
