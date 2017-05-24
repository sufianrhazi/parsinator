"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ParserHelpers_1 = require("./ParserHelpers");
/**
 * Produce the full string match from a regular expression.
 *
 * @param regex The regular expression to match
 * @return A parser producing the string matched by the regular expression
 */
function regex(regex) {
    return function (state) {
        var remaining = state.input.slice(state.offset);
        var duplicated = new RegExp(regex);
        var result = duplicated.exec(remaining);
        if (result === null || result.index !== 0) {
            throw ParserHelpers_1.resultFailure("regex /" + regex.source + "/" + regex.flags + " doesn't match", state, ParserHelpers_1.ParseErrorDetail);
        }
        return ParserHelpers_1.resultSuccess(result[0], state.input, state.offset + result[0].length);
    };
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
    return function (state) {
        var remaining = state.input.slice(state.offset);
        var duplicated = new RegExp(regex);
        var result = duplicated.exec(remaining);
        if (result === null || result.index !== 0) {
            throw ParserHelpers_1.resultFailure("regex /" + regex.source + "/" + regex.flags + " doesn't match", state, ParserHelpers_1.ParseErrorDetail);
        }
        return ParserHelpers_1.resultSuccess(Array.from(result), state.input, state.offset + result[0].length);
    };
}
exports.regexMatch = regexMatch;
/**
 * Produce a string value.
 *
 * @param string the string value to parse
 * @return A parser producing the matched string
 */
function str(string) {
    return function (state) {
        if (state.input.substr(state.offset, string.length) === string) {
            return ParserHelpers_1.resultSuccess(string, state.input, state.offset + string.length);
        }
        else {
            throw ParserHelpers_1.resultFailure("\"" + string + "\" not found", state, ParserHelpers_1.ParseErrorDetail);
        }
    };
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
function fromGenerator(generator) {
    return function (state) {
        var lastValue = undefined;
        var iterator = generator();
        while (true) {
            var result = iterator.next(lastValue);
            if (result.done) {
                return ParserHelpers_1.resultSuccess(result.value, state.input, state.offset);
            }
            else {
                var producedParser = result.value;
                var stepResult = producedParser(state);
                lastValue = stepResult.value;
                state = stepResult.state;
            }
        }
    };
}
exports.fromGenerator = fromGenerator;
/**
 * Return a parser which always fails with a specific error message.
 *
 * @param message the message to fail with
 */
function fail(message) {
    return function (state) {
        throw ParserHelpers_1.resultFailure(message, state, ParserHelpers_1.ParseErrorDetail);
    };
}
exports.fail = fail;
/**
 * Return a parser which when the wrapped parser fails, provides an alternate error message.
 *
 * @param parser a parser whose error message is inadequate
 * @param wrapper a function to add more information to an error message
 */
function wrapFail(parser, wrapper) {
    return function (state) {
        try {
            return parser(state);
        }
        catch (e) {
            var index = e.message.indexOf(': ') + 2;
            e.message = e.message.slice(0, index) + wrapper(e.message.slice(index));
            throw e;
        }
    };
}
exports.wrapFail = wrapFail;
/**
 * Produce nothing and consume nothing, just log the parser state to a log
 *
 * @param log A logging function
 */
function debugTrace(log) {
    return function (state) {
        log(ParserHelpers_1.formatState(state));
        return ParserHelpers_1.resultSuccess(undefined, state.input, state.offset);
    };
}
exports.debugTrace = debugTrace;
/**
 * @var end A parser which produces null at the end of input and fails if there is more input.
 */
exports.end = function (state) {
    if (state.offset >= state.input.length) {
        return ParserHelpers_1.resultSuccess(null, state.input, state.offset);
    }
    else {
        throw ParserHelpers_1.resultFailure("Not at end of string", state, ParserHelpers_1.ParseErrorDetail);
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
function run(parser, input) {
    var state = {
        input: input,
        offset: 0,
    };
    var result = parser(state);
    return result.value;
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
    return run(function (state) {
        var result = parser(state);
        exports.end(result.state); // throws on error
        return result;
    }, input);
}
exports.runToEnd = runToEnd;
//# sourceMappingURL=Parser.js.map