import { Parser } from './ParserTypes';
/**
 * Produce the parser's produced value or null on failure.
 *
 * @param parser the parser to attempt
 * @return a parser producing the wrapped parser's result or null on failure
 */
export declare function maybe<P>(parser: Parser<P>): Parser<P | null>;
/**
 * Produce an array of items from applying a parser any number of times (including zero).
 *
 * @param parser a parser to match multiple times
 * @return a parser producing an array of parsed values
 */
export declare function many<P>(parser: Parser<P>): Parser<P[]>;
/**
 * Produce an array of items from applying a parserat least once.
 *
 * @param parser the parser to execute multiple times
 * @return a parser producing an array of parsed values
 */
export declare function many1<P>(parser: Parser<P>): Parser<P[]>;
/**
 * Produce the first successful result of matching the provided parsers
 *
 * @param parsers an array of parsers to try
 * @return a parser producing the first succeeding parser's value
 */
export declare function choice<V>(parsers: Parser<V>[]): Parser<V>;
/**
 * Produce a parser whichruns the parsers in sequence, returning an array of results
 *
 * @param parsers the parsers to execute in sequence
 * @return a parser producing an array of parsed values
 */
export declare function sequence<V>(parsers: Parser<V>[]): Parser<V[]>;
/**
 * Produce an array of values from a parser run a specific number of times
 *
 * @param num the number of times to run the parser
 * @param parser the parser to repeat
 * @return a parser producing an array of parsed values
 */
export declare function count<V>(num: number, parser: Parser<V>): Parser<V[]>;
/**
 * Produce an array of values obtained from a value parser which are each separated by a separator parser.
 *
 * The value parser must match at least once.

 *
 * @param sepParser a parser producing ignored separation values
 * @param valParser a parser producing values desired
 * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
 */
export declare function sepBy1<S, V>(sepParser: Parser<S>, valParser: Parser<V>): Parser<V[]>;
/**
 * Produce an array of values obtained from a value parser which are each separated by a separator parser.
 *
 * The value parser may not match at all
 *
 * @param sepParser a parser producing ignored separation values
 * @param valParser a parser producing values desired
 * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
 */
export declare function sepBy<S, V>(sepParser: Parser<S>, valParser: Parser<V>): Parser<V[]>;
/**
 * Produce a value by running the parser, but not advancing the parsed state.
 *
 * @param parser a parser producing any value
 * @return a parser producing the wrapped parser's value
 */
export declare function peek<P>(parser: Parser<P>): Parser<P>;
/**
 * Produce the string input consumed until the terminator parser matches.
 *
 * The terminator parser is not consumed.
 *
 * @param terminator A parser that consumes an end token
 * @return A parser producing the string input consumed until the terminator parser.
 */
export declare function until<T>(terminator: Parser<T>): Parser<string>;
/**
 * Produce the string input between the start and end parsers
 * @param start A parser consuming a start token
 * @param end A parser consuming an end token
 */
export declare function between<T>(start: Parser<T>, end: Parser<T>): Parser<string>;
