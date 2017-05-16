import { Either, left, right, isLeft, isRight } from "./Either";

const DEBUG = false;

export interface ParseState {
    input: string;
    offset: number;
}
export interface ParseResult<T> {
    value: T;
    state: ParseState;
}

export type Parser<T> = (state: ParseState) => Either<ParseResult<T>>;

function resultSuccess<T>(value: T, input: string, offset: number): Either<ParseResult<T>> {
    return right({ value, state: { input, offset }});
}

function formatState(state: ParseState): string {
    var startOffset = Math.max(0, state.offset - 10);
    var endOffset = Math.min(state.input.length, state.offset + 10);
    var substr = JSON.stringify((startOffset === 0 ? '' : '...') + state.input.slice(startOffset, endOffset) + (endOffset === state.input.length ? '' : '...'));
    var charsBefore = (startOffset === 0 ? 0 : 3) + JSON.stringify(state.input.slice(startOffset, state.offset)).length - 1;
    var marker = new Array(charsBefore + 1).join(' ') + '^';
    return `-> ${substr}\n   ${marker}`;
}

function resultFailure<T>(msg: string, state: ParseState): Either<ParseResult<T>> {
    var lines = 0;
    var lastLineStart = 0;
    for (var i = 0; i < state.offset; ++i) {
        if (state.input[i] === '\n') {
            lines++;
            lastLineStart = i;
        }
    }
    return left(`Parse failure at ${lines}:${state.offset-lastLineStart}: ${msg}\n${formatState(state)}`);
}

export function parseRegex(regex: RegExp): Parser<string> {
    return (state: ParseState): Either<ParseResult<string>> => {
        var remaining = state.input.slice(state.offset);
        var duplicated = new RegExp(regex);
        var result = duplicated.exec(remaining);
        if (result === null || result.index !== 0) {
            return resultFailure<string>(`regex /${regex.source}/${regex.flags} doesn't match`, state);
        }
        return resultSuccess(result[0], state.input, state.offset + result[0].length);
    };
}

export function parseRegexMatch(regex: RegExp): Parser<string[]> {
    return (state: ParseState): Either<ParseResult<string[]>> => {
        var remaining = state.input.slice(state.offset);
        var duplicated = new RegExp(regex);
        var result = duplicated.exec(remaining);
        if (result === null || result.index !== 0) {
            return resultFailure<string[]>(`regex /${regex.source}/${regex.flags} doesn't match`, state);
        }
        return resultSuccess(Array.from(result), state.input, state.offset + result[0].length);
    };
}

export function parseString(string: string): Parser<typeof string> {
    return (state: ParseState): Either<ParseResult<typeof string>> => {
        if (state.input.substr(state.offset, string.length) === string) {
            return resultSuccess(string, state.input, state.offset + string.length);
        } else {
            return resultFailure<typeof string>(`"${string}" not found`, state);
        }
    };
}

export function fromIterator<P,V>(generator: () => Iterator<Parser<P>|V>): Parser<V> {
    return (state: ParseState) => {
        var lastValue: any = undefined;
        var iterator: Iterator<Parser<P>|V> = generator();
        while (true) {
            var result = iterator.next(lastValue);
            if (result.done) {
                if (DEBUG) {
                    console.log(`End value: ${JSON.stringify(result.value)}\nEnd state: ${formatState(state)}\n`);
                }
                return resultSuccess(result.value as V, state.input, state.offset);
            } else {
                var producedParser = result.value as Parser<P>;
                var stepResult = producedParser(state);
                if (isLeft(stepResult)) {
                    return stepResult;
                }
                lastValue = stepResult.val.value;
                if (DEBUG) {
                    console.log(`Before: ${formatState(state)}\nValue: ${JSON.stringify(lastValue)}\nAfter: ${formatState(stepResult.val.state)}\n`);
                }
                state = stepResult.val.state;
            }
        }
    };
}

export function parseMaybe<P>(parser: Parser<P>): Parser<P | null> {
    return (state) => {
        var result = parser(state);
        if (isRight(result)) {
            return result;
        }
        return resultSuccess(null, state.input, state.offset);
    }
}

export function parseMany<P>(parser: Parser<P>): Parser<P[]> {
    return (state) => {
        var results: P[] = [];
        while (true) {
            var result = parser(state);
            if (isLeft(result)) {
                return resultSuccess(results, state.input, state.offset);
            }
            results.push(result.val.value);
            state = result.val.state;
        }
    };
}

export function parseMany1<P>(parser: Parser<P>): Parser<P[]> {
    return fromIterator<P|P[],P[]>(function *() {
        var one = yield parser;
        var many = yield parseMany(parser);
        return [one].concat(many);
    });
}

export function parseChoice<V>(parsers: Parser<V>[]): Parser<V> {
    return (state: ParseState): Either<ParseResult<V>> => {
        var errors: string[] = [];
        for (var parser of parsers) {
            let result = parser(state);
            if (isRight(result)) {
                return result;
            }
            errors.push(result.val);
        }
        return left('Parse failure; potential matches:\n- ' + errors.join('\n- '));
    }
}

export function parseChain<V>(parsers: Parser<V>[]): Parser<V[]> {
    return fromIterator<V,V[]>(function *() {
        var results: V[] = [];
        for (var parser of parsers) {
            results.push(yield parser);
        }
        return results;
    });
}

export function parseCount<V>(count: number, parser: Parser<V>): Parser<V[]> {
    return fromIterator<V,V[]>(function *() {
        var results: V[] = [];
        for (var i = 0; i < count; ++i) {
            results.push(yield parser);
        }
        return results;
    });
}

export function parseSepBy1<S,V>(separator: Parser<S>, parser: Parser<V>): Parser<V[]> {
    var maybeSeparator = parseMaybe(separator);
    return fromIterator<S|V|null,V[]>(function *() {
        var results: V[] = [];
        while (true) {
            results.push(yield parser);
            var sepResult = yield maybeSeparator;
            if (sepResult === null) {
                return results;
            }
        }
    });
}

export function parseSepBy<S,V>(separator: Parser<S>, parser: Parser<V>): Parser<V[]> {
    var maybeSeparator = parseMaybe(separator);
    var maybeParser = parseMaybe(parser);
    return fromIterator<S|V|null,V[]>(function *() {
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
            results.push(yield parser);
        }
    });
}

export function parseLookAhead<P>(parser: Parser<P>): Parser<P> {
    return (state: ParseState) => {
        var result = parser(state);
        if (isLeft(result)) {
            return result;
        } else {
            return resultSuccess(result.val.value, state.input, state.offset);
        }
    }
}

export function parseEnd(): Parser<null> {
    return (state: ParseState) => {
        if (state.offset >= state.input.length) {
            return resultSuccess(null, state.input, state.offset);
        } else {
            return resultFailure<null>("Not at end of string", state);
        }
    };
}

export function run<T>(parser: Parser<T>, input: string): T {
    var state = {
        input: input,
        offset: 0,
    };
    var result = parser(state);
    if (isLeft(result)) {
        throw new Error(result.val);
    }
    return result.val.value;
}

export function runToEnd<T>(parser: Parser<T>, input: string): T {
    return run(parseChain([parser, parseEnd()]), input)[0] as T;
}