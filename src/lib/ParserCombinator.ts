export interface ParseState {
    input: string;
    offset: number;
}
export interface ParseResult<T> {
    value: T;
    state: ParseState;
}

export type Parser<T> = (state: ParseState) => ParseResult<T>;

function resultSuccess<T>(value: T, input: string, offset: number): ParseResult<T> {
    return {
        value: value,
        state: {
            input: input,
            offset: offset,
        },
    };
}

function formatState(state: ParseState): string {
    var startOffset = Math.max(0, state.offset - 10);
    var endOffset = Math.min(state.input.length, state.offset + 10);
    var substr = JSON.stringify((startOffset === 0 ? '' : '...') + state.input.slice(startOffset, endOffset) + (endOffset === state.input.length ? '' : '...'));
    var charsBefore = (startOffset === 0 ? 0 : 3) + JSON.stringify(state.input.slice(startOffset, state.offset)).length - 1;
    var marker = new Array(charsBefore + 1).join(' ') + '^';
    return `-> ${substr}\n   ${marker}`;
}

export class ParseError extends Error {
    public line: number;
    public col: number;
    public offset: number;
    public input: string;

    constructor(msg: string, line: number, col: number, state: ParseState) {
        super(msg);
        this.line = line;
        this.col = col;
        this.offset = state.offset;
        this.input = state.input;
    }}

class ParseErrorDetail extends ParseError {
    constructor(msg: string, line: number, col: number, state: ParseState) {
        super(`Parse failure at ${line}:${col}: ${msg}\n${formatState(state)}`, line, col, state);
        this.line = line;
        this.col = col;
        this.offset = state.offset;
        this.input = state.input;
    }
}

function resultFailure<T>(msg: string, state: ParseState, ErrorConstructor: new (msg: string, line: number, col: number, state: ParseState) => T): T {
    var lines = 0;
    var lastLineStart = 0;
    for (var i = 0; i < state.offset; ++i) {
        if (state.input[i] === '\n') {
            lines++;
            lastLineStart = i;
        }
    }
    var line = 1 + lines;
    var col = 1 + state.offset - lastLineStart;
    return new ErrorConstructor(msg, line, col, state);
}

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
 * Produce the parser's produced value or null on failure.
 * 
 * @param parser the parser to attempt
 * @return a parser producing the wrapped parser's result or null on failure
 */
export function maybe<P>(parser: Parser<P>): Parser<P | null> {
    return (state) => {
        try {
            return parser(state);
        } catch (e) {
            return resultSuccess(null, state.input, state.offset);
        }
    }
}

/**
 * Produce an array of items from applying a parser any number of times (including zero).
 * 
 * @param parser a parser to match multiple times
 * @return a parser producing an array of parsed values
 */
export function many<P>(parser: Parser<P>): Parser<P[]> {
    return (state) => {
        var results: P[] = [];
        while (true) {
            try {
                var result = parser(state);
            } catch (e) {
                return resultSuccess(results, state.input, state.offset);
            }
            results.push(result.value);
            state = result.state;
        }
    };
}

/**
 * Produce an array of items from applying a parserat least once.
 * 
 * @param parser the parser to execute multiple times
 * @return a parser producing an array of parsed values
 */
export function many1<P>(parser: Parser<P>): Parser<P[]> {
    return fromGenerator<P|P[],P[]>(function *() {
        var one = yield parser;
        var multiple = yield many(parser);
        return [one].concat(multiple);
    });
}

/**
 * Produce the first successful result of matching the provided parsers
 * 
 * @param parsers an array of parsers to try
 * @return a parser producing the first succeeding parser's value
 */
export function choice<V>(parsers: Parser<V>[]): Parser<V> {
    return (state: ParseState): ParseResult<V> => {
        var errors: string[] = [];
        for (var parser of parsers) {
            try {
                return parser(state);
            } catch (e) {
                errors.push(e.message);
            }
        }
        throw resultFailure('Parse failure; potential matches:\n- ' + errors.join('\n- '), state, ParseError);
    }
}

/**
 * Produce a parser whichruns the parsers in sequence, returning an array of results
 * 
 * @param parsers the parsers to execute in sequence
 * @return a parser producing an array of parsed values
 */
export function sequence<V>(parsers: Parser<V>[]): Parser<V[]> {
    return fromGenerator<V,V[]>(function *() {
        var results: V[] = [];
        for (var parser of parsers) {
            results.push(yield parser);
        }
        return results;
    });
}

/**
 * Produce an array of values from a parser run a specific number of times
 * 
 * @param num the number of times to run the parser
 * @param parser the parser to repeat
 * @return a parser producing an array of parsed values
 */
export function count<V>(num: number, parser: Parser<V>): Parser<V[]> {
    return fromGenerator<V,V[]>(function *() {
        var results: V[] = [];
        for (var i = 0; i < num; ++i) {
            results.push(yield parser);
        }
        return results;
    });
}

/**
 * Produce an array of values obtained from a value parser which are each separated by a separator parser.
 *
 * The value parser must match at least once.
 * 
 * @param sepParser a parser producing ignored separation values
 * @param matParser a parser producing values desired
 * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
 */
export function sepBy1<S,V>(sepParser: Parser<S>, valParser: Parser<V>): Parser<V[]> {
    var maybeSeparator = maybe(sepParser);
    return fromGenerator<S|V|null,V[]>(function *() {
        var results: V[] = [];
        while (true) {
            results.push(yield valParser);
            var sepResult = yield maybeSeparator;
            if (sepResult === null) {
                return results;
            }
        }
    });
}

/**
 * Produce an array of values obtained from a value parser which are each separated by a separator parser.
 * 
 * The value parser may not match at all
 * 
 * @param sepParser a parser producing ignored separation values
 * @param valParser a parser producing values desired
 * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
 */
export function sepBy<S,V>(sepParser: Parser<S>, valParser: Parser<V>): Parser<V[]> {
    var maybeSeparator = maybe(sepParser);
    var maybeParser = maybe(valParser);
    return fromGenerator<S|V|null,V[]>(function *() {
        var results: V[] = [];
        var first = yield maybeParser;
        if (first === null) {
            return results;
        } else {
            results.push(first);
        }
        while (true) {
            var sepResult = yield maybeSeparator;
            if (sepResult === null) {
                return results;
            }
            results.push(yield valParser);
        }
    });
}

/**
 * Produce a value by running the parser, but not advancing the parsed state.
 * 
 * @param parser a parser producing any value
 * @return a parser producing the wrapped parser's value
 */
export function peek<P>(parser: Parser<P>): Parser<P> {
    return (state: ParseState) => {
        var result = parser(state);
        return resultSuccess(result.value, state.input, state.offset);
    }
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
 * Produce the string input consumed until the terminator parser matches.
 * 
 * The terminator parser is not consumed.
 * 
 * @param terminator A parser that consumes an end token
 * @return A parser producing the string input consumed until the terminator parser.
 */
export function until<T>(terminator: Parser<T>): Parser<string> {
    return (state) => {
        for (var i = state.offset; i <= state.input.length; ++i) { // why i <= len? end terminators only match if offset = len. 
            try {
                terminator({ input: state.input, offset: i });
                return resultSuccess(state.input.slice(state.offset, i), state.input, i);
            } catch (e) {
                // ignore and proceed
            }
        }
        throw resultFailure("Didn't find terminator", state, ParseErrorDetail);
    };
}

/**
 * Produce the string input between the start and end parsers
 * @param start A parser consuming a start token 
 * @param end A parser consuming an end token
 */
export function between<T>(start: Parser<T>, end: Parser<T>): Parser<string> {
    return fromGenerator(function *() {
        yield start;
        var data = yield until(end);
        yield end;
        return data;
    })
}

/**
 * @var debugTrace A parser which consumes nothing but logs the parser state to console.log
 */
export function debugTrace(state: ParseState): ParseResult<undefined> {
    console.log(formatState(state));
    return resultSuccess<undefined>(undefined, state.input, state.offset);
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
    return run(sequence([parser, end]), input)[0] as T;
}