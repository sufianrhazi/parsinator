"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ParserTypes_1 = require("./ParserTypes");
const ParserHelpers_1 = require("./ParserHelpers");
function makeParser(generator, parserName) {
    return Object.assign(() => generator(), {
        [Symbol.iterator]: generator,
        parserName,
    });
}
exports.makeParser = makeParser;
/**
 * Produce the full string match from a regular expression.
 *
 * @param regex The regular expression to match
 * @return A parser producing the string matched by the regular expression
 */
function regex(regex) {
    return makeParser(function* () {
        const state = yield 0;
        var remaining = state.input.slice(state.offset);
        var duplicated = new RegExp(regex);
        var result = duplicated.exec(remaining);
        if (result === null || result.index !== 0) {
            throw ParserHelpers_1.resultFailure(`regex /${regex.source}/${regex.flags} doesn't match`, state);
        }
        yield result[0].length;
        return result[0];
    }, `regex:${regex.source}`);
}
exports.regex = regex;
/**
 * Produce the full match and all groups from a regular expression.
 *
 * Produces a string array; item 0 is the full match.
 *
 * @param regex The regular expression to match
 * @return A parser producing an array of matching groups; item 0 is the full matching string
 */
function regexMatch(regex) {
    return makeParser(function* () {
        const state = yield 0;
        var remaining = state.input.slice(state.offset);
        var duplicated = new RegExp(regex);
        var result = duplicated.exec(remaining);
        if (result === null || result.index !== 0) {
            throw ParserHelpers_1.resultFailure(`regex /${regex.source}/${regex.flags} doesn't match`, state);
        }
        yield result[0].length;
        return Array.from(result);
    }, `regexMatch:${regex.source}`);
}
exports.regexMatch = regexMatch;
/**
 * Produce a string value.
 *
 * @param string the string value to parse
 * @return A parser producing the matched string
 */
function str(string) {
    return makeParser(function* () {
        const state = yield 0;
        if (state.input.substr(state.offset, string.length) === string) {
            yield string.length;
            return string;
        }
        else {
            throw ParserHelpers_1.resultFailure(`"${string}" not found`, state);
        }
    }, `str:${string}`);
}
exports.str = str;
/**
 * Produce the return value of the generator, which may yield to sub-parsers.
 *
 * Yielded parsers evaluate to their produced value.
 *
 * @param generator A generator function which yields Parsers and returns value
 * @return A parser producing the returned value
 */
function fromGenerator(generator, parserName) {
    return makeParser(function* () {
        let state = yield 0;
        var iterator = generator();
        while (true) {
            var result = iterator.next(state);
            if (result.done) {
                yield state;
                return result.value;
            }
            else {
                if (typeof result.value === "number") {
                    state = Object.assign(Object.assign({}, state), { offset: state.offset + result.value });
                }
                else {
                    state = result.value;
                }
                yield state;
            }
        }
    }, parserName || generator.name);
}
exports.fromGenerator = fromGenerator;
/**
 * Return a parser which always fails with a specific error message.
 *
 * @param message the message to fail with
 */
function fail(message) {
    return makeParser(function* () {
        const state = yield 0;
        throw ParserHelpers_1.resultFailure(message, state);
    }, `fail:${message}`);
}
exports.fail = fail;
/**
 * Return a parser which when the wrapped parser fails, provides an alternate error message.
 *
 * @param parser a parser whose error message is inadequate
 * @param wrapper a function to add more information to an error message
 */
function wrapFail(parser, wrapper) {
    return makeParser(function* () {
        try {
            return yield* parser;
        }
        catch (e) {
            if (e instanceof ParserTypes_1.ParseError) {
                const message = wrapper(e.msg);
                throw ParserHelpers_1.resultFailure(message, { input: e.input, offset: e.offset });
            }
            throw e;
        }
    }, "wrapFail");
}
exports.wrapFail = wrapFail;
/**
 * Produce nothing and consume nothing, just log the parser state to a log
 *
 * @param log A logging function
 */
function debugTrace(log) {
    return makeParser(function* () {
        const state = yield 0;
        log(ParserTypes_1.formatState(state));
        return undefined;
    }, "debugTrace");
}
exports.debugTrace = debugTrace;
/**
 * @var end A parser which produces null at the end of input and fails if there is more input.
 */
exports.end = makeParser(function* () {
    const state = yield 0;
    if (state.offset >= state.input.length) {
        return null;
    }
    else {
        throw ParserHelpers_1.resultFailure("Not at end of string", state);
    }
}, "end");
function runInner(parser, state) {
    const iter = parser();
    let step = iter.next(state);
    while (!step.done) {
        if (typeof step.value === "number") {
            state = Object.assign(Object.assign({}, state), { offset: state.offset + step.value });
        }
        else {
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
function run(parser, input) {
    const state = {
        input: input,
        offset: 0,
    };
    return runInner(parser, state).value;
}
exports.run = run;
/**
 * Run a parser on the full input, returning the parser's produced value.
 *
 * Fails if the parser does not consume the entire input.
 *
 * @param parser The parser to run
 * @param input The input string to run
 * @return The value produced by the parser
 */
function runToEnd(parser, input) {
    const state = {
        input: input,
        offset: 0,
    };
    const result = runInner(parser, state);
    const next = runInner(exports.end, result.state); // throws on error
    return result.value;
}
exports.runToEnd = runToEnd;
//# sourceMappingURL=Parser.js.map