"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ParserTypes_1 = require("./ParserTypes");
var ParserHelpers_1 = require("./ParserHelpers");
var Parser_1 = require("./Parser");
/**
 * Produce the parser's produced value or null on failure.
 *
 * @param parser the parser to attempt
 * @return a parser producing the wrapped parser's result or null on failure
 */
function maybe(parser) {
    return function (state) {
        try {
            return parser(state);
        }
        catch (e) {
            return ParserHelpers_1.resultSuccess(null, state.input, state.offset);
        }
    };
}
exports.maybe = maybe;
/**
 * Produce an array of items from applying a parser any number of times (including zero).
 *
 * @param parser a parser to match multiple times
 * @return a parser producing an array of parsed values
 */
function many(parser) {
    return function (state) {
        var results = [];
        while (true) {
            try {
                var result = parser(state);
            }
            catch (e) {
                return ParserHelpers_1.resultSuccess(results, state.input, state.offset);
            }
            results.push(result.value);
            state = result.state;
        }
    };
}
exports.many = many;
/**
 * Produce an array of items from applying a parserat least once.
 *
 * @param parser the parser to execute multiple times
 * @return a parser producing an array of parsed values
 */
function many1(parser) {
    return Parser_1.fromGenerator(function () {
        var one, multiple;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, parser];
                case 1:
                    one = _a.sent();
                    return [4 /*yield*/, many(parser)];
                case 2:
                    multiple = _a.sent();
                    return [2 /*return*/, [one].concat(multiple)];
            }
        });
    });
}
exports.many1 = many1;
/**
 * Produce the first successful result of matching the provided parsers
 *
 * @param parsers an array of parsers to try
 * @return a parser producing the first succeeding parser's value
 */
function choice(parsers) {
    return function (state) {
        var errors = [];
        for (var _i = 0, parsers_1 = parsers; _i < parsers_1.length; _i++) {
            var parser = parsers_1[_i];
            try {
                return parser(state);
            }
            catch (e) {
                errors.push(e.message);
            }
        }
        throw ParserHelpers_1.resultFailure('Parse failure; potential matches:\n- ' + errors.join('\n- '), state, ParserTypes_1.ParseError);
    };
}
exports.choice = choice;
/**
 * Produce a parser whichruns the parsers in sequence, returning an array of results
 *
 * @param parsers the parsers to execute in sequence
 * @return a parser producing an array of parsed values
 */
function sequence(parsers) {
    return Parser_1.fromGenerator(function () {
        var results, _i, parsers_2, parser, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    results = [];
                    _i = 0, parsers_2 = parsers;
                    _c.label = 1;
                case 1:
                    if (!(_i < parsers_2.length)) return [3 /*break*/, 4];
                    parser = parsers_2[_i];
                    _b = (_a = results).push;
                    return [4 /*yield*/, parser];
                case 2:
                    _b.apply(_a, [_c.sent()]);
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, results];
            }
        });
    });
}
exports.sequence = sequence;
/**
 * Produce an array of values from a parser run a specific number of times
 *
 * @param num the number of times to run the parser
 * @param parser the parser to repeat
 * @return a parser producing an array of parsed values
 */
function count(num, parser) {
    return Parser_1.fromGenerator(function () {
        var results, i, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    results = [];
                    i = 0;
                    _c.label = 1;
                case 1:
                    if (!(i < num)) return [3 /*break*/, 4];
                    _b = (_a = results).push;
                    return [4 /*yield*/, parser];
                case 2:
                    _b.apply(_a, [_c.sent()]);
                    _c.label = 3;
                case 3:
                    ++i;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, results];
            }
        });
    });
}
exports.count = count;
/**
 * Produce an array of values obtained from a value parser which are each separated by a separator parser.
 *
 * The value parser must match at least once.

 *
 * @param sepParser a parser producing ignored separation values
 * @param valParser a parser producing values desired
 * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
 */
function sepBy1(sepParser, valParser) {
    var maybeSeparator = maybe(sepParser);
    return Parser_1.fromGenerator(function () {
        var results, _a, _b, sepResult;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    results = [];
                    _c.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 4];
                    _b = (_a = results).push;
                    return [4 /*yield*/, valParser];
                case 2:
                    _b.apply(_a, [_c.sent()]);
                    return [4 /*yield*/, maybeSeparator];
                case 3:
                    sepResult = _c.sent();
                    if (sepResult === null) {
                        return [2 /*return*/, results];
                    }
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.sepBy1 = sepBy1;
/**
 * Produce an array of values obtained from a value parser which are each separated by a separator parser.
 *
 * The value parser may not match at all
 *
 * @param sepParser a parser producing ignored separation values
 * @param valParser a parser producing values desired
 * @return a parser producing valParser values and consuming valParser/sepParser/valParser/...etc input
 */
function sepBy(sepParser, valParser) {
    var maybeSeparator = maybe(sepParser);
    var maybeParser = maybe(valParser);
    return Parser_1.fromGenerator(function () {
        var results, first, sepResult, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    results = [];
                    return [4 /*yield*/, maybeParser];
                case 1:
                    first = _c.sent();
                    if (first === null) {
                        return [2 /*return*/, results];
                    }
                    else {
                        results.push(first);
                    }
                    _c.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 5];
                    return [4 /*yield*/, maybeSeparator];
                case 3:
                    sepResult = _c.sent();
                    if (sepResult === null) {
                        return [2 /*return*/, results];
                    }
                    _b = (_a = results).push;
                    return [4 /*yield*/, valParser];
                case 4:
                    _b.apply(_a, [_c.sent()]);
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.sepBy = sepBy;
/**
 * Produce a value by running the parser, but not advancing the parsed state.
 *
 * @param parser a parser producing any value
 * @return a parser producing the wrapped parser's value
 */
function peek(parser) {
    return function (state) {
        var result = parser(state);
        return ParserHelpers_1.resultSuccess(result.value, state.input, state.offset);
    };
}
exports.peek = peek;
/**
 * Produce the string input consumed until the terminator parser matches.
 *
 * The terminator parser is not consumed.
 *
 * @param terminator A parser that consumes an end token
 * @return A parser producing the string input consumed until the terminator parser.
 */
function until(terminator) {
    return function (state) {
        for (var i = state.offset; i <= state.input.length; ++i) {
            try {
                terminator({ input: state.input, offset: i });
                return ParserHelpers_1.resultSuccess(state.input.slice(state.offset, i), state.input, i);
            }
            catch (e) {
                // ignore and proceed
            }
        }
        throw ParserHelpers_1.resultFailure("Didn't find terminator", state, ParserHelpers_1.ParseErrorDetail);
    };
}
exports.until = until;
/**
 * Produce the string input between the start and end parsers
 * @param start A parser consuming a start token
 * @param end A parser consuming an end token
 */
function between(start, end) {
    return Parser_1.fromGenerator(function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, start];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, until(end)];
                case 2:
                    data = _a.sent();
                    return [4 /*yield*/, end];
                case 3:
                    _a.sent();
                    return [2 /*return*/, data];
            }
        });
    });
}
exports.between = between;
//# sourceMappingURL=ParserCombinators.js.map