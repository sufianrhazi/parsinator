declare module "lib/ParserTypes" {
    export interface ParseState {
        input: string;
        offset: number;
    }
    export interface ParseResult<T> {
        value: T;
        state: ParseState;
    }
    export interface Parser<T> {
        (): Generator<number | ParseState, T, ParseState>;
        [Symbol.iterator](): Generator<number | ParseState, T, ParseState>;
        parserName: string;
    }
    export class ParseError extends Error {
        line: number;
        col: number;
        offset: number;
        input: string;
        msg: string;
        state: ParseState;
        constructor(msg: string, line: number, col: number, state: ParseState);
    }
    export function formatState(state: ParseState): string;
}
declare module "lib/ParserHelpers" {
    import { ParseError, ParseState, ParseResult } from "lib/ParserTypes";
    export function resultSuccess<T>(value: T, input: string, offset: number): ParseResult<T>;
    export function resultFailure<T>(msg: string, state: ParseState): ParseError;
}
declare module "lib/Parser" {
    import { Parser, ParseState } from "lib/ParserTypes";
    export function makeParser<V>(generator: () => Generator<number | ParseState, V, ParseState>, parserName: string): Parser<V>;
    /**
     * Produce the full string match from a regular expression.
     *
     * @param regex The regular expression to match
     * @return A parser producing the string matched by the regular expression
     */
    export function regex(regex: RegExp): Parser<string>;
    /**
     * Produce the full match and all groups from a regular expression.
     *
     * Produces a string array; item 0 is the full match.
     *
     * @param regex The regular expression to match
     * @return A parser producing an array of matching groups; item 0 is the full matching string
     */
    export function regexMatch(regex: RegExp): Parser<string[]>;
    /**
     * Produce a string value.
     *
     * @param string the string value to parse
     * @return A parser producing the matched string
     */
    export function str<T extends string>(string: T): Parser<T>;
    /**
     * Produce the return value of the generator, which may yield to sub-parsers.
     *
     * Yielded parsers evaluate to their produced value.
     *
     * @param generator A generator function which yields Parsers and returns value
     * @return A parser producing the returned value
     */
    export function fromGenerator<V>(generator: () => Generator<number | ParseState, V, ParseState>, parserName?: string): Parser<V>;
    /**
     * Return a parser which always fails with a specific error message.
     *
     * @param message the message to fail with
     */
    export function fail<T>(message: string): Parser<T>;
    /**
     * Return a parser which when the wrapped parser fails, provides an alternate error message.
     *
     * @param parser a parser whose error message is inadequate
     * @param wrapper a function to add more information to an error message
     */
    export function wrapFail<T>(parser: Parser<T>, wrapper: (message: string) => string): Parser<T>;
    /**
     * Produce nothing and consume nothing, just log the parser state to a log
     *
     * @param log A logging function
     */
    export function debugTrace(log: (str: string) => void): Parser<undefined>;
    /**
     * @var end A parser which produces null at the end of input and fails if there is more input.
     */
    export const end: Parser<null>;
    /**
     * Run a parser on an input, returning the parser's produced value.
     *
     * The parser does not need to consume the entire input.
     *
     * @param parser The parser to run
     * @param input The input string to run
     * @return The value produced by the parser
     */
    export function run<T>(parser: Parser<T>, input: string): T;
    /**
     * Run a parser on the full input, returning the parser's produced value.
     *
     * Fails if the parser does not consume the entire input.
     *
     * @param parser The parser to run
     * @param input The input string to run
     * @return The value produced by the parser
     */
    export function runToEnd<T>(parser: Parser<T>, input: string): T;
}
declare module "lib/ParserCombinators" {
    import { Parser } from "lib/ParserTypes";
    /**
     * Produce the parser's produced value or null on failure.
     *
     * @param parser the parser to attempt
     * @return a parser producing the wrapped parser's result or null on failure
     */
    export function maybe<P>(parser: Parser<P>): Parser<P | null>;
    /**
     * Produce an array of items from applying a parser any number of times (including zero).
     *
     * @param parser a parser to match multiple times
     * @return a parser producing an array of parsed values
     */
    export function many<P>(parser: Parser<P>): Parser<P[]>;
    /**
     * Produce an array of items from applying a parser at least once.
     *
     * @param parser the parser to execute multiple times
     * @return a parser producing an array of parsed values
     */
    export function many1<P>(parser: Parser<P>): Parser<P[]>;
    /**
     * Produce the first successful result of matching the provided parsers.
     *
     * @param parsers an array of parsers to try
     * @return a parser producing the first succeeding parser's value
     */
    export function choice<V>(parsers: Parser<V>[]): Parser<V>;
    /**
     * Produce a parser which runs the parsers in sequence, returning an array of results.
     *
     * @param parsers the parsers to execute in sequence
     * @return a parser producing an array of parsed values
     */
    export function sequence<V>(parsers: Parser<V>[]): Parser<V[]>;
    /**
     * Produce an array of values from a parser run a specific number of times.
     *
     * @param num the number of times to run the parser
     * @param parser the parser to repeat
     * @return a parser producing an array of parsed values
     */
    export function count<V>(num: number, parser: Parser<V>): Parser<V[]>;
    /**
     * Produce an array of values obtained from a value parser which are each separated by a separator parser.
     *
     * The value parser must match at least once.
     *
     * @param sepParser a parser producing ignored separation values
     * @param valParser a parser producing values desired
     * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
     */
    export function sepBy1<S, V>(sepParser: Parser<S>, valParser: Parser<V>): Parser<V[]>;
    /**
     * Produce an array of values obtained from a value parser which are each separated by a separator parser.
     *
     * The value parser may not match at all.
     *
     * @param sepParser a parser producing ignored separation values
     * @param valParser a parser producing values desired
     * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
     */
    export function sepBy<S, V>(sepParser: Parser<S>, valParser: Parser<V>): Parser<V[]>;
    /**
     * Produce a value by running the parser, but not advancing the parsed state.
     *
     * @param parser a parser producing any value
     * @return a parser producing the wrapped parser's value
     */
    export function peek<P>(parser: Parser<P>): Parser<P>;
    /**
     * Produce the string input consumed until the terminator parser matches.
     *
     * The terminator parser is not consumed.
     *
     * @param terminator A parser that consumes an end token
     * @return A parser producing the string input consumed until the terminator parser.
     */
    export function until<T>(terminator: Parser<T>): Parser<string>;
    /**
     * Produce the string input between the start and end parsers.
     *
     * @param start A parser consuming a start token
     * @param end A parser consuming an end token
     */
    export function between<T>(start: Parser<T>, end: Parser<T>): Parser<string>;
    /**
     * Produce a value transformed by a provided function.
     *
     * @param parser the parser to wrap
     * @param fn function to transform the value produced by the parsed
     */
    export function map<V, W>(parser: Parser<V>, fn: (val: V) => W): Parser<W>;
    /**
     * Produce a value obtained after a prefix parser and before a suffix parser
     *
     * @param left a prefix parser that the produced value is ignored
     * @param val the parser whose produced value is desired
     * @param right a suffix parser that the produced value is ignored
     */
    export function surround<L, T, R>(left: Parser<L>, val: Parser<T>, right: Parser<R>): Parser<T>;
    export type OperatorActionUnary<T> = (val: T) => T;
    export interface OperatorDeclUnary<T> {
        parser: Parser<OperatorActionUnary<T>>;
        fixity: "prefix" | "postfix";
    }
    export type OperatorActionBinary<T> = (left: T, right: T) => T;
    export interface OperatorDeclBinary<T> {
        parser: Parser<OperatorActionBinary<T>>;
        fixity: "infix";
        associativity: "left" | "right";
    }
    export type OperatorDecl<T> = OperatorDeclUnary<T> | OperatorDeclBinary<T>;
    export type OperatorDecls<T> = OperatorDecl<T>[];
    /**
     * Build a parser which parses and produces arbitrary binary and unary expressions.
     *
     * buildExpressionParser deals with the heavy lifting of dealing with operator fixity, precedence, and associativity.
     *
     * As an example, here's a very simple arithmetic parser:
     *
     *     var number = Parser.map(Parser.regex(/[0-9]+/), (str) => parseInt(str, 10));
     *
     *     var operator = (opstr, action) => Parser.map(Parser.str(opstr), () => action);
     *
     *     var negate = operator('-', (val) => -val);
     *     var sum = operator('+', (x, y) => x + y);
     *     var multiply = operator('*', (x, y) => x * y);
     *     var exponent = operator('^', (x, y) => Math.pow(x, y));
     *
     *     var evaluate = Parser.buildExpressionParser([
     *         { fixity: "prefix", parser: negate },
     *         { fixity: "infix", associativity: "right", parser: exponent },
     *         { fixity: "infix", associativity: "left", parser: multiply },
     *         { fixity: "infix", associativity: "left", parser: sum }
     *     ], () => Parser.choice([
     *         Parser.surround(Parser.str("("), evaluate, Parser.str(")")),
     *         number
     *     ]));
     *
     *     Parser.runToEnd(evaluate, "1+2*3+1"); // evaluates to 8
     *     Parser.runToEnd(evaluate, "(1+2)*-(3+1)"); // evaluates to -12
     *     Parser.runToEnd(evaluate, "3^3^3"); // evaluates to 7625597484987
     *
     * @param operators A an array of `OperatorDecl` objects, in precedence order from highest precedence to lowest precedence
     * @param parseTermFactory A factory method that returns a parser which produces the individual terms of an expression; this itself may reference the returned parser, so it can be used to implement parenthetical sub-expressions
     */
    export function buildExpressionParser<T>(operators: OperatorDecls<T>, parseTermFactory: () => Parser<T>): Parser<T>;
}
declare module "Parsinator" {
    export const VERSION: string;
    export { str, regex, regexMatch, end, fail, wrapFail, debugTrace, run, runToEnd, fromGenerator, } from "lib/Parser";
    export { maybe, many, many1, choice, sequence, count, sepBy, sepBy1, peek, until, between, map, surround, OperatorActionUnary, OperatorActionBinary, OperatorDeclBinary, OperatorDeclUnary, OperatorDecl, OperatorDecls, buildExpressionParser, } from "lib/ParserCombinators";
    export { Parser, ParseError, ParseState, ParseResult } from "lib/ParserTypes";
}
declare module "Parsinator.test" { }
