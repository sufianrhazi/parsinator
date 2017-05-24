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
 * Produce the first successful result of matching the provided parsers.
 *
 * @param parsers an array of parsers to try
 * @return a parser producing the first succeeding parser's value
 */
export declare function choice<V>(parsers: Parser<V>[]): Parser<V>;
/**
 * Produce a parser whichruns the parsers in sequence, returning an array of results.
 *
 * @param parsers the parsers to execute in sequence
 * @return a parser producing an array of parsed values
 */
export declare function sequence<V>(parsers: Parser<V>[]): Parser<V[]>;
/**
 * Produce an array of values from a parser run a specific number of times.
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
 * The value parser may not match at all.
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
 * Produce the string input between the start and end parsers.
 *
 * @param start A parser consuming a start token
 * @param end A parser consuming an end token
 */
export declare function between<T>(start: Parser<T>, end: Parser<T>): Parser<string>;
/**
 * Produce a value transformed by a provided function.
 *
 * @param parser the parser to wrap
 * @param fn function to transform the value produced by the parsed
 */
export declare function map<V, W>(parser: Parser<V>, fn: (val: V) => W): Parser<W>;
/**
 * Produce a value obtained after a prefix parser and before a suffix parser
 *
 * @param left a prefix parser that the produced value is ignored
 * @param val the parser whose produced value is desired
 * @param right a suffix parser that the produced value is ignored
 */
export declare function surround<L, T, R>(left: Parser<L>, val: Parser<T>, right: Parser<R>): Parser<T>;
export declare type OperatorActionUnary<T> = (val: T) => T;
export interface OperatorDeclUnary<T> {
    parser: Parser<OperatorActionUnary<T>>;
    fixity: "prefix" | "postfix";
}
export declare type OperatorActionBinary<T> = (left: T, right: T) => T;
export interface OperatorDeclBinary<T> {
    parser: Parser<OperatorActionBinary<T>>;
    fixity: "infix";
    associativity: "left" | "right";
}
export declare type OperatorDecl<T> = OperatorDeclUnary<T> | OperatorDeclBinary<T>;
export declare type OperatorDecls<T> = OperatorDecl<T>[];
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
export declare function buildExpressionParser<T>(operators: OperatorDecls<T>, parseTermFactory: () => Parser<T>): Parser<T>;
