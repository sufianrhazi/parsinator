import { Parser } from './ParserTypes';
/**
 * Produce the full string match from a regular expression.
 *
 * @param regex The regular expression to match
 * @return A parser producing the string matched by the regular expression
 */
export declare function regex(regex: RegExp): Parser<string>;
/**
 * Produce the full match and all groups from a regular expression.
 *
 * Produces a string array; item 0 is the full match.
 *
 * @param regex The regular expression to match
 * @return A parser producing an array of matching groups; item 0 is the full matching string
 */
export declare function regexMatch(regex: RegExp): Parser<string[]>;
/**
 * Produce a string value.
 *
 * @param string the string value to parse
 * @return A parser producing the matched string
 */
export declare function str(string: string): Parser<typeof string>;
/**
 * Produce the return value of the generator, which may yield to sub-parsers.
 *
 * Yielded parsers evaluate to their produced value.
 *
 * @param generator A generator function which yields Parsers and returns value
 * @return A parser producing the returned value
 */
export declare function fromGenerator<P, V>(generator: () => Iterator<Parser<P> | V>): Parser<V>;
/**
 * Produce nothing and consume nothing, just log the parser state to a log
 *
 * @param log A logging function
 */
export declare function debugTrace(log: (str: string) => void): Parser<undefined>;
/**
 * @var end A parser which produces null at the end of input and fails if there is more input.
 */
export declare const end: Parser<null>;
/**
 * Run a parser on an input, returning the parser's produced value.
 *
 * The parser does not need to consume the entire input.
 *
 * @param parser The parser to run
 * @param input The input string to run
 * @return The value produced by the parser
 */
export declare function run<T>(parser: Parser<T>, input: string): T;
/**
 * Run a parser on the full input, returning the parser's produced value.
 *
 * Fails if the parser does not consume the entire input.
 *
 * @param parser The parser to run
 * @param input The input string to run
 * @return The value produced by the parser
 */
export declare function runToEnd<T>(parser: Parser<T>, input: string): T;
