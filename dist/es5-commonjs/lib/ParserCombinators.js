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
        throw ParserHelpers_1.resultFailure('Parse failure; potential matches:\n- ' + errors.join('\n- '), state, ParserTypes_1.ParseError);
    };
}
exports.choice = choice;
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
exports.sequence = sequence;
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
exports.between = between;
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
exports.map = map;
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
exports.surround = surround;
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
exports.buildExpressionParser = buildExpressionParser;
//# sourceMappingURL=ParserCombinators.js.map