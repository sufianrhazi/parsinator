import { Parser, ParseState, ParseResult, ParseError } from './ParserTypes';
import { resultFailure, resultSuccess, ParseErrorDetail, formatState } from './ParserHelpers';

/**
 * Produce the full string match from a regular expression.
 * 
 * @param regex The regular expression to match
 * @return A parser producing the string matched by the regular expression
 */
export function regex(regex: RegExp): Parser<string> {
    return (state: ParseState): ParseResult<string> => {
        var remaining = state.input.slice(state.offset);
        var duplicated = new RegExp(regex);
        var result = duplicated.exec(remaining);
        if (result === null || result.index !== 0) {
            throw resultFailure(`regex /${regex.source}/${regex.flags} doesn't match`, state, ParseErrorDetail);
        }
        return resultSuccess(result[0], state.input, state.offset + result[0].length);
    };
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
    return (state: ParseState): ParseResult<string[]> => {
        var remaining = state.input.slice(state.offset);
        var duplicated = new RegExp(regex);
        var result = duplicated.exec(remaining);
        if (result === null || result.index !== 0) {
            throw resultFailure(`regex /${regex.source}/${regex.flags} doesn't match`, state, ParseErrorDetail);
        }
        return resultSuccess(Array.from(result), state.input, state.offset + result[0].length);
    };
}

/**
 * Produce a string value.
 * 
 * @param string the string value to parse
 * @return A parser producing the matched string
 */
export function str(string: string): Parser<typeof string> {
    return (state: ParseState): ParseResult<typeof string> => {
        if (state.input.substr(state.offset, string.length) === string) {
            return resultSuccess(string, state.input, state.offset + string.length);
        } else {
            throw resultFailure(`"${string}" not found`, state, ParseErrorDetail);
        }
    };
}

/**
 * Produce the return value of the generator, which may yield to sub-parsers.
 * 
 * Yielded parsers evaluate to their produced value.
 * 
 * @param generator A generator function which yields Parsers and returns value
 * @return A parser producing the returned value
 */
export function fromGenerator<P,V>(generator: () => Iterator<Parser<P>|V>): Parser<V> {
    return (state: ParseState) => {
        var lastValue: any = undefined;
        var iterator: Iterator<Parser<P>|V> = generator();
        while (true) {
            var result = iterator.next(lastValue);
            if (result.done) {
                return resultSuccess(result.value as V, state.input, state.offset);
            } else {
                var producedParser = result.value as Parser<P>;
                var stepResult = producedParser(state);
                lastValue = stepResult.value;
                state = stepResult.state;
            }
        }
    };
}

/**
 * Produce nothing and consume nothing, just log the parser state to a log
 * 
 * @param log A logging function
 */
export function debugTrace(log: (str: string) => void): Parser<undefined> {
    return (state) => {
        log(formatState(state));
        return resultSuccess<undefined>(undefined, state.input, state.offset);
    };
}

/**
 * @var end A parser which produces null at the end of input and fails if there is more input. 
 */
export const end: Parser<null> = (state: ParseState) => {
    if (state.offset >= state.input.length) {
        return resultSuccess(null, state.input, state.offset);
    } else {
        throw resultFailure("Not at end of string", state, ParseErrorDetail);
    }
};

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
    var state = {
        input: input,
        offset: 0,
    };
    var result = parser(state);
    return result.value;
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
    return run((state: ParseState) => {
        var result = parser(state);
        end(result.state); // throws on error
        return result;
    }, input);
}