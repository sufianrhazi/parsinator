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
System.register("lib/ParserTypes", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var ParseError;
    return {
        setters: [],
        execute: function () {
            ParseError = (function (_super) {
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
            exports_1("ParseError", ParseError);
        }
    };
});
System.register("lib/ParserHelpers", ["lib/ParserTypes"], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    function resultSuccess(value, input, offset) {
        return {
            value: value,
            state: {
                input: input,
                offset: offset,
            },
        };
    }
    exports_2("resultSuccess", resultSuccess);
    function formatState(state) {
        var startOffset = Math.max(0, state.offset - 10);
        var endOffset = Math.min(state.input.length, state.offset + 10);
        var substr = JSON.stringify((startOffset === 0 ? '' : '...') + state.input.slice(startOffset, endOffset) + (endOffset === state.input.length ? '' : '...'));
        var charsBefore = (startOffset === 0 ? 0 : 3) + JSON.stringify(state.input.slice(startOffset, state.offset)).length - 1;
        var marker = new Array(charsBefore + 1).join(' ') + '^';
        return "-> " + substr + "\n   " + marker;
    }
    exports_2("formatState", formatState);
    function resultFailure(msg, state, ErrorConstructor) {
        var lines = 0;
        var lastLineStart = 0;
        for (var i = 0; i < state.offset; ++i) {
            if (state.input[i] === '\n') {
                lines++;
                lastLineStart = i + 1;
            }
        }
        var line = 1 + lines;
        var col = 1 + state.offset - lastLineStart;
        return new ErrorConstructor(msg, line, col, state);
    }
    exports_2("resultFailure", resultFailure);
    var ParserTypes_1, ParseErrorDetail;
    return {
        setters: [
            function (ParserTypes_1_1) {
                ParserTypes_1 = ParserTypes_1_1;
            }
        ],
        execute: function () {
            ParseErrorDetail = (function (_super) {
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
            exports_2("ParseErrorDetail", ParseErrorDetail);
        }
    };
});
System.register("lib/Parser", ["lib/ParserHelpers"], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
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
    exports_3("regex", regex);
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
    exports_3("regexMatch", regexMatch);
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
    exports_3("str", str);
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
    exports_3("fromGenerator", fromGenerator);
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
    exports_3("fail", fail);
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
    exports_3("wrapFail", wrapFail);
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
    exports_3("debugTrace", debugTrace);
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
    exports_3("run", run);
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
            end(result.state); // throws on error
            return result;
        }, input);
    }
    exports_3("runToEnd", runToEnd);
    var ParserHelpers_1, end;
    return {
        setters: [
            function (ParserHelpers_1_1) {
                ParserHelpers_1 = ParserHelpers_1_1;
            }
        ],
        execute: function () {
            /**
             * @var end A parser which produces null at the end of input and fails if there is more input.
             */
            exports_3("end", end = function (state) {
                if (state.offset >= state.input.length) {
                    return ParserHelpers_1.resultSuccess(null, state.input, state.offset);
                }
                else {
                    throw ParserHelpers_1.resultFailure("Not at end of string", state, ParserHelpers_1.ParseErrorDetail);
                }
            });
        }
    };
});
System.register("lib/ParserCombinators", ["lib/ParserTypes", "lib/ParserHelpers", "lib/Parser"], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
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
    exports_4("maybe", maybe);
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
    exports_4("many", many);
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
    exports_4("many1", many1);
    /**
     * Produce the first successful result of matching the provided parsers.
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
    exports_4("choice", choice);
    /**
     * Produce a parser whichruns the parsers in sequence, returning an array of results.
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
    exports_4("sequence", sequence);
    /**
     * Produce an array of values from a parser run a specific number of times.
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
    exports_4("count", count);
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
    exports_4("sepBy1", sepBy1);
    /**
     * Produce an array of values obtained from a value parser which are each separated by a separator parser.
     *
     * The value parser may not match at all.
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
    exports_4("sepBy", sepBy);
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
    exports_4("peek", peek);
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
    exports_4("until", until);
    /**
     * Produce the string input between the start and end parsers.
     *
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
    exports_4("between", between);
    /**
     * Produce a value transformed by a provided function.
     *
     * @param parser the parser to wrap
     * @param fn function to transform the value produced by the parsed
     */
    function map(parser, fn) {
        return function (state) {
            var result = parser(state);
            return {
                state: result.state,
                value: fn(result.value)
            };
        };
    }
    exports_4("map", map);
    /**
     * Produce a value obtained after a prefix parser and before a suffix parser
     *
     * @param left a prefix parser that the produced value is ignored
     * @param val the parser whose produced value is desired
     * @param right a suffix parser that the produced value is ignored
     */
    function surround(left, val, right) {
        return Parser_1.fromGenerator(function () {
            var v;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, left];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, val];
                    case 2:
                        v = _a.sent();
                        return [4 /*yield*/, right];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, v];
                }
            });
        });
    }
    exports_4("surround", surround);
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
    function buildExpressionParser(operators, parseTermFactory) {
        var parseTerm = null;
        var preOps = [];
        var postOps = [];
        var binOps = [];
        for (var i = 0; i < operators.length; ++i) {
            var precedence = operators.length - i;
            var operator = operators[i];
            switch (operator.fixity) {
                case "infix":
                    binOps.push({ precedence: precedence, associativity: operator.associativity, parser: operator.parser });
                    break;
                case "postfix":
                    postOps.push(operator.parser);
                    break;
                case "prefix":
                    preOps.push(operator.parser);
                    break;
            }
        }
        var parseExprTerm = Parser_1.fromGenerator(function () {
            var preFuncs, postFuncs, f, result, _i, preFuncs_1, f_1, _a, postFuncs_1, f_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        preFuncs = [];
                        postFuncs = [];
                        f = null;
                        _b.label = 1;
                    case 1: return [4 /*yield*/, maybe(choice(preOps))];
                    case 2:
                        f = _b.sent();
                        if (f !== null) {
                            preFuncs.push(f);
                        }
                        _b.label = 3;
                    case 3:
                        if (f !== null) return [3 /*break*/, 1];
                        _b.label = 4;
                    case 4:
                        if (parseTerm === null) {
                            parseTerm = parseTermFactory();
                        }
                        return [4 /*yield*/, parseTerm];
                    case 5:
                        result = _b.sent();
                        _b.label = 6;
                    case 6: return [4 /*yield*/, maybe(choice(postOps))];
                    case 7:
                        f = _b.sent();
                        if (f !== null) {
                            postFuncs.push(f);
                        }
                        _b.label = 8;
                    case 8:
                        if (f !== null) return [3 /*break*/, 6];
                        _b.label = 9;
                    case 9:
                        for (_i = 0, preFuncs_1 = preFuncs; _i < preFuncs_1.length; _i++) {
                            f_1 = preFuncs_1[_i];
                            result = f_1(result);
                        }
                        for (_a = 0, postFuncs_1 = postFuncs; _a < postFuncs_1.length; _a++) {
                            f_2 = postFuncs_1[_a];
                            result = f_2(result);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
        // This uses the precedence climbing/TDOP algorithm
        // See http://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing
        function parseExpressionPrecedence(minPrec) {
            return Parser_1.fromGenerator(function () {
                var left, action, associativity, precedence, i, op, nextMinPrec, right;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, parseExprTerm];
                        case 1:
                            left = _a.sent();
                            _a.label = 2;
                        case 2:
                            if (!true) return [3 /*break*/, 8];
                            action = null;
                            i = 0;
                            _a.label = 3;
                        case 3:
                            if (!(i < binOps.length && action === null)) return [3 /*break*/, 6];
                            op = binOps[i];
                            if (!(op.precedence >= minPrec)) return [3 /*break*/, 5];
                            return [4 /*yield*/, maybe(op.parser)];
                        case 4:
                            action = _a.sent();
                            associativity = op.associativity;
                            precedence = op.precedence;
                            _a.label = 5;
                        case 5:
                            ++i;
                            return [3 /*break*/, 3];
                        case 6:
                            if (action === null) {
                                return [2 /*return*/, left];
                            }
                            if (associativity === 'left') {
                                nextMinPrec = precedence + 1;
                            }
                            else {
                                nextMinPrec = precedence;
                            }
                            return [4 /*yield*/, parseExpressionPrecedence(nextMinPrec)];
                        case 7:
                            right = _a.sent();
                            left = action(left, right);
                            return [3 /*break*/, 2];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        }
        return parseExpressionPrecedence(0);
    }
    exports_4("buildExpressionParser", buildExpressionParser);
    var ParserTypes_2, ParserHelpers_2, Parser_1;
    return {
        setters: [
            function (ParserTypes_2_1) {
                ParserTypes_2 = ParserTypes_2_1;
            },
            function (ParserHelpers_2_1) {
                ParserHelpers_2 = ParserHelpers_2_1;
            },
            function (Parser_1_1) {
                Parser_1 = Parser_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("Parsinator", ["lib/Parser", "lib/ParserCombinators", "lib/ParserTypes"], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var VERSION;
    return {
        setters: [
            function (Parser_2_1) {
                exports_5({
                    "str": Parser_2_1["str"],
                    "regex": Parser_2_1["regex"],
                    "regexMatch": Parser_2_1["regexMatch"],
                    "end": Parser_2_1["end"],
                    "fail": Parser_2_1["fail"],
                    "wrapFail": Parser_2_1["wrapFail"],
                    "debugTrace": Parser_2_1["debugTrace"],
                    "run": Parser_2_1["run"],
                    "runToEnd": Parser_2_1["runToEnd"],
                    "fromGenerator": Parser_2_1["fromGenerator"]
                });
            },
            function (ParserCombinators_1_1) {
                exports_5({
                    "maybe": ParserCombinators_1_1["maybe"],
                    "many": ParserCombinators_1_1["many"],
                    "many1": ParserCombinators_1_1["many1"],
                    "choice": ParserCombinators_1_1["choice"],
                    "sequence": ParserCombinators_1_1["sequence"],
                    "count": ParserCombinators_1_1["count"],
                    "sepBy": ParserCombinators_1_1["sepBy"],
                    "sepBy1": ParserCombinators_1_1["sepBy1"],
                    "peek": ParserCombinators_1_1["peek"],
                    "until": ParserCombinators_1_1["until"],
                    "between": ParserCombinators_1_1["between"],
                    "map": ParserCombinators_1_1["map"],
                    "surround": ParserCombinators_1_1["surround"],
                    "buildExpressionParser": ParserCombinators_1_1["buildExpressionParser"]
                });
            },
            function (ParserTypes_3_1) {
                exports_5({
                    "ParseError": ParserTypes_3_1["ParseError"]
                });
            }
        ],
        execute: function () {
            exports_5("VERSION", VERSION = '1.0.0');
        }
    };
});
//# sourceMappingURL=parsinator-system.js.map