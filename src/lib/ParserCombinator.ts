import { Either, left, right, isLeft, isRight } from "./Either";

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

function resultFailure<T>(msg: string, state: ParseState): Either<ParseResult<T>> {
    var lines = 0;
    var lastLineStart = 0;
    for (var i = 0; i < state.offset; ++i) {
        if (state.input[i] === '\n') {
            lines++;
            lastLineStart = i;
        }
    }
    return left(`Parse failure at ${lines}:${state.offset-lastLineStart}: ${msg}`);
}

export function parseRegex(regex: RegExp): Parser<string> {
    return (state: ParseState): Either<ParseResult<string>> => {
        var remaining = state.input.slice(state.offset);
        var duplicated = new RegExp(regex);
        var result = duplicated.exec(remaining);
        if (result === null) {
            return resultFailure<string>(`regex /${regex.source}/${regex.flags} doesn't match`, state);
        }
        return resultSuccess(result[0], state.input, state.offset + result[0].length);
    };
}

export function parseExact(string: string): Parser<typeof string> {
    return (state: ParseState): Either<ParseResult<typeof string>> => {
        if (state.input.substr(state.offset, string.length) === string) {
            return resultSuccess(string, state.input, state.offset + string.length);
        } else {
            return resultFailure<typeof string>(`"${string}" not found`, state);
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

export function parseAny<P>(parser: Parser<P>): Parser<P[]> {
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

export function parseSequence<V>(parsers: Parser<V>[]): Parser<V[]> {
    return (state: ParseState): Either<ParseResult<V[]>> => {
        var results: V[] = [];
        for (var parser of parsers) {
            let result = parser(state);
            if (isLeft(result)) {
                return result;
            }
            results.push(result.val.value);
            state = result.val.state;
        }
        return resultSuccess(results, state.input, state.offset);
    }
}

function isParser<T>(value: any): value is Parser<T> {
    return typeof value === 'function' && value.length === 1; // It's the best we can do :(
}

export function fromIterator<V>(generator: () => Iterator<Parser<any>|V>): Parser<V> {
    return (state: ParseState): Either<ParseResult<V>> => {
        var lastValue: any = undefined;
        var iterator = generator();
        while (true) {
            var result = iterator.next(lastValue);
            if (result.done) {
                return resultSuccess(result.value as V, state.input, state.offset);
            } else {
                if (!isParser<any>(result.value)) {
                    throw new Error('fromIterator must *only* yield Parsers');
                }
                var stepResult = result.value(state);
                if (isLeft(stepResult)) {
                    return stepResult;
                }
                lastValue = stepResult.val.value;
                state = stepResult.val.state;
            }
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