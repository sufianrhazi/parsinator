import { ParseError } from './ParserTypes';
import { resultFailure, resultSuccess, ParseErrorDetail } from './ParserHelpers';
import { fromGenerator } from './Parser';
/**
 * Produce the parser's produced value or null on failure.
 *
 * @param parser the parser to attempt
 * @return a parser producing the wrapped parser's result or null on failure
 */
export function maybe(parser) {
    return (state) => {
        try {
            return parser(state);
        }
        catch (e) {
            return resultSuccess(null, state.input, state.offset);
        }
    };
}
/**
 * Produce an array of items from applying a parser any number of times (including zero).
 *
 * @param parser a parser to match multiple times
 * @return a parser producing an array of parsed values
 */
export function many(parser) {
    return (state) => {
        var results = [];
        while (true) {
            try {
                var result = parser(state);
            }
            catch (e) {
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
export function many1(parser) {
    return fromGenerator(function* () {
        var one = yield parser;
        var multiple = yield many(parser);
        return [one].concat(multiple);
    });
}
/**
 * Produce the first successful result of matching the provided parsers.
 *
 * @param parsers an array of parsers to try
 * @return a parser producing the first succeeding parser's value
 */
export function choice(parsers) {
    return (state) => {
        var errors = [];
        for (var i = 0; i < parsers.length; ++i) {
            try {
                return parsers[i](state);
            }
            catch (e) {
                errors.push(e.message);
            }
        }
        throw resultFailure('Parse failure; potential matches:\n- ' + errors.join('\n- '), state, ParseError);
    };
}
/**
 * Produce a parser whichruns the parsers in sequence, returning an array of results.
 *
 * @param parsers the parsers to execute in sequence
 * @return a parser producing an array of parsed values
 */
export function sequence(parsers) {
    return fromGenerator(function* () {
        var results = [];
        for (var i = 0; i < parsers.length; ++i) {
            results.push(yield parsers[i]);
        }
        return results;
    });
}
/**
 * Produce an array of values from a parser run a specific number of times.
 *
 * @param num the number of times to run the parser
 * @param parser the parser to repeat
 * @return a parser producing an array of parsed values
 */
export function count(num, parser) {
    return fromGenerator(function* () {
        var results = [];
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
 * @param valParser a parser producing values desired
 * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
 */
export function sepBy1(sepParser, valParser) {
    var maybeSeparator = maybe(sepParser);
    return fromGenerator(function* () {
        var results = [];
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
 * The value parser may not match at all.
 *
 * @param sepParser a parser producing ignored separation values
 * @param valParser a parser producing values desired
 * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
 */
export function sepBy(sepParser, valParser) {
    var maybeSeparator = maybe(sepParser);
    var maybeParser = maybe(valParser);
    return fromGenerator(function* () {
        var results = [];
        var first = yield maybeParser;
        if (first === null) {
            return results;
        }
        else {
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
export function peek(parser) {
    return (state) => {
        var result = parser(state);
        return resultSuccess(result.value, state.input, state.offset);
    };
}
/**
 * Produce the string input consumed until the terminator parser matches.
 *
 * The terminator parser is not consumed.
 *
 * @param terminator A parser that consumes an end token
 * @return A parser producing the string input consumed until the terminator parser.
 */
export function until(terminator) {
    return (state) => {
        for (var i = state.offset; i <= state.input.length; ++i) {
            try {
                terminator({ input: state.input, offset: i });
                return resultSuccess(state.input.slice(state.offset, i), state.input, i);
            }
            catch (e) {
                // ignore and proceed
            }
        }
        throw resultFailure("Didn't find terminator", state, ParseErrorDetail);
    };
}
/**
 * Produce the string input between the start and end parsers.
 *
 * @param start A parser consuming a start token
 * @param end A parser consuming an end token
 */
export function between(start, end) {
    return fromGenerator(function* () {
        yield start;
        var data = yield until(end);
        yield end;
        return data;
    });
}
/**
 * Produce a value transformed by a provided function.
 *
 * @param parser the parser to wrap
 * @param fn function to transform the value produced by the parsed
 */
export function map(parser, fn) {
    return (state) => {
        var result = parser(state);
        return {
            state: result.state,
            value: fn(result.value)
        };
    };
}
//# sourceMappingURL=ParserCombinators.js.map