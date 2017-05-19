var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
define("lib/ParserTypes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ParseError = (function (_super) {
        __extends(ParseError, _super);
        function ParseError(msg, line, col, state) {
            var _this = _super.call(this, msg) || this;
            _this.line = line;
            _this.col = col;
            _this.offset = state.offset;
            _this.input = state.input;
            return _this;
        }
        return ParseError;
    }(Error));
    exports.ParseError = ParseError;
});
define("lib/ParserHelpers", ["require", "exports", "lib/ParserTypes"], function (require, exports, ParserTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ParseErrorDetail = (function (_super) {
        __extends(ParseErrorDetail, _super);
        function ParseErrorDetail(msg, line, col, state) {
            var _this = _super.call(this, "Parse failure at " + line + ":" + col + ": " + msg + "\n" + formatState(state), line, col, state) || this;
            _this.line = line;
            _this.col = col;
            _this.offset = state.offset;
            _this.input = state.input;
            return _this;
        }
        return ParseErrorDetail;
    }(ParserTypes_1.ParseError));
    exports.ParseErrorDetail = ParseErrorDetail;
    function resultSuccess(value, input, offset) {
        return {
            value: value,
            state: {
                input: input,
                offset: offset,
            },
        };
    }
    exports.resultSuccess = resultSuccess;
    function formatState(state) {
        var startOffset = Math.max(0, state.offset - 10);
        var endOffset = Math.min(state.input.length, state.offset + 10);
        var substr = JSON.stringify((startOffset === 0 ? '' : '...') + state.input.slice(startOffset, endOffset) + (endOffset === state.input.length ? '' : '...'));
        var charsBefore = (startOffset === 0 ? 0 : 3) + JSON.stringify(state.input.slice(startOffset, state.offset)).length - 1;
        var marker = new Array(charsBefore + 1).join(' ') + '^';
        return "-> " + substr + "\n   " + marker;
    }
    exports.formatState = formatState;
    function resultFailure(msg, state, ErrorConstructor) {
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
    exports.resultFailure = resultFailure;
});
define("lib/Parser", ["require", "exports", "lib/ParserHelpers"], function (require, exports, ParserHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
});
define("lib/ParserCombinators", ["require", "exports", "lib/ParserTypes", "lib/ParserHelpers", "lib/Parser"], function (require, exports, ParserTypes_2, ParserHelpers_2, Parser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                return ParserHelpers_2.resultSuccess(null, state.input, state.offset);
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
                    return ParserHelpers_2.resultSuccess(results, state.input, state.offset);
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
            for (var i = 0; i < parsers.length; ++i) {
                try {
                    return parsers[i](state);
                }
                catch (e) {
                    errors.push(e.message);
                }
            }
            throw ParserHelpers_2.resultFailure('Parse failure; potential matches:\n- ' + errors.join('\n- '), state, ParserTypes_2.ParseError);
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
            var results, i, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = [];
                        i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(i < parsers.length)) return [3 /*break*/, 4];
                        _b = (_a = results).push;
                        return [4 /*yield*/, parsers[i]];
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
            return ParserHelpers_2.resultSuccess(result.value, state.input, state.offset);
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
                    return ParserHelpers_2.resultSuccess(state.input.slice(state.offset, i), state.input, i);
                }
                catch (e) {
                    // ignore and proceed
                }
            }
            throw ParserHelpers_2.resultFailure("Didn't find terminator", state, ParserHelpers_2.ParseErrorDetail);
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
});
define("Parsinator", ["require", "exports", "lib/Parser", "lib/ParserCombinators", "lib/ParserTypes"], function (require, exports, Parser_2, ParserCombinators_1, ParserTypes_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VERSION = '1.0.0';
    exports.str = Parser_2.str;
    exports.regex = Parser_2.regex;
    exports.regexMatch = Parser_2.regexMatch;
    exports.end = Parser_2.end;
    exports.debugTrace = Parser_2.debugTrace;
    exports.run = Parser_2.run;
    exports.runToEnd = Parser_2.runToEnd;
    exports.fromGenerator = Parser_2.fromGenerator;
    exports.maybe = ParserCombinators_1.maybe;
    exports.many = ParserCombinators_1.many;
    exports.many1 = ParserCombinators_1.many1;
    exports.choice = ParserCombinators_1.choice;
    exports.sequence = ParserCombinators_1.sequence;
    exports.count = ParserCombinators_1.count;
    exports.sepBy = ParserCombinators_1.sepBy;
    exports.sepBy1 = ParserCombinators_1.sepBy1;
    exports.peek = ParserCombinators_1.peek;
    exports.until = ParserCombinators_1.until;
    exports.between = ParserCombinators_1.between;
    exports.ParseError = ParserTypes_3.ParseError;
});
//# sourceMappingURL=parsinator-amd.js.map