"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ParserTypes_1 = require("./ParserTypes");
const ParserHelpers_1 = require("./ParserHelpers");
const Parser_1 = require("./Parser");
/**
 * Produce the parser's produced value or null on failure.
 *
 * @param parser the parser to attempt
 * @return a parser producing the wrapped parser's result or null on failure
 */
function maybe(parser) {
    return Parser_1.fromGenerator(function* maybe() {
        const startState = yield 0;
        try {
            return yield* parser;
        }
        catch (e) {
            yield startState;
            return null;
        }
    }, `maybe(${parser.parserName})`);
}
exports.maybe = maybe;
/**
 * Produce an array of items from applying a parser any number of times (including zero).
 *
 * @param parser a parser to match multiple times
 * @return a parser producing an array of parsed values
 */
function many(parser) {
    return Parser_1.fromGenerator(function* many() {
        var results = [];
        while (true) {
            const state = yield 0;
            try {
                var result = yield* parser;
            }
            catch (e) {
                yield state;
                return results;
            }
            results.push(result);
        }
    }, `many(${parser.parserName})`);
}
exports.many = many;
/**
 * Produce an array of items from applying a parser at least once.
 *
 * @param parser the parser to execute multiple times
 * @return a parser producing an array of parsed values
 */
function many1(parser) {
    return Parser_1.fromGenerator(function* many1() {
        var one = yield* parser;
        var multiple = yield* many(parser);
        return [one].concat(multiple);
    }, `many1(${parser.parserName})`);
}
exports.many1 = many1;
/**
 * Produce the first successful result of matching the provided parsers.
 *
 * @param parsers an array of parsers to try
 * @return a parser producing the first succeeding parser's value
 */
function choice(parsers) {
    return Parser_1.fromGenerator(function* choice() {
        var errors = [];
        const startState = yield 0;
        for (var i = 0; i < parsers.length; ++i) {
            try {
                return yield* parsers[i];
            }
            catch (e) {
                if (e instanceof ParserTypes_1.ParseError) {
                    errors.push(e);
                }
                else {
                    throw e;
                }
                yield startState;
            }
        }
        const state = yield 0;
        yield startState;
        errors.sort((a, b) => b.offset - a.offset);
        throw ParserHelpers_1.resultFailure("Multiple choices; potential matches:\n- " +
            errors
                .map((error) => error.message.split("\n").join("\n  "))
                .join("\n- "), state);
    }, `choice(${parsers.map((parser) => parser.parserName).join(",")})`);
}
exports.choice = choice;
/**
 * Produce a parser which runs the parsers in sequence, returning an array of results.
 *
 * @param parsers the parsers to execute in sequence
 * @return a parser producing an array of parsed values
 */
function sequence(parsers) {
    return Parser_1.fromGenerator(function* sequence() {
        var results = [];
        for (var i = 0; i < parsers.length; ++i) {
            const state = yield 0;
            results.push(yield* parsers[i]);
        }
        return results;
    }, `sequence(${parsers.map((parser) => parser.name).join(",")})`);
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
    return Parser_1.fromGenerator(function* count() {
        var results = [];
        for (var i = 0; i < num; ++i) {
            results.push(yield* parser);
        }
        return results;
    }, `count(${num},${parser.parserName})`);
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
    return Parser_1.fromGenerator(function* sepBy1() {
        var results = [];
        while (true) {
            results.push(yield* valParser);
            var sepResult = yield* maybeSeparator;
            if (sepResult === null) {
                return results;
            }
        }
    }, `sepBy1(${sepParser.parserName},${valParser.parserName})`);
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
    return Parser_1.fromGenerator(function* sepBy() {
        var results = [];
        var first = yield* maybeParser;
        if (first === null) {
            return results;
        }
        else {
            results.push(first);
        }
        while (true) {
            var sepResult = yield* maybeSeparator;
            if (sepResult === null) {
                return results;
            }
            results.push(yield* valParser);
        }
    }, `sepBy(${sepParser.parserName},${valParser.parserName})`);
}
exports.sepBy = sepBy;
/**
 * Produce a value by running the parser, but not advancing the parsed state.
 *
 * @param parser a parser producing any value
 * @return a parser producing the wrapped parser's value
 */
function peek(parser) {
    return Parser_1.fromGenerator(function* peek() {
        const startState = yield 0;
        let result;
        try {
            result = yield* parser;
        }
        catch (e) {
            yield startState;
            throw e;
        }
        yield startState;
        return result;
    }, `peek(${parser.parserName})`);
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
    return Parser_1.fromGenerator(function* until() {
        let state = yield 0;
        for (var i = state.offset; i <= state.input.length; ++i) {
            // why i <= len? end terminators only match if offset = len.
            // Try setting state
            const maybeEndState = yield Object.assign(Object.assign({}, state), { offset: i });
            try {
                yield* terminator;
                yield maybeEndState;
                return state.input.slice(state.offset, i);
            }
            catch (e) {
                // ignore and proceed
            }
        }
        throw ParserHelpers_1.resultFailure("Didn't find terminator", state);
    }, `until(${terminator.parserName})`);
}
exports.until = until;
/**
 * Produce the string input between the start and end parsers.
 *
 * @param start A parser consuming a start token
 * @param end A parser consuming an end token
 */
function between(start, end) {
    return Parser_1.fromGenerator(function* between() {
        yield* start;
        var data = yield* until(end);
        yield* end;
        return data;
    }, `between(${start.parserName},${end.parserName})`);
}
exports.between = between;
/**
 * Produce a value transformed by a provided function.
 *
 * @param parser the parser to wrap
 * @param fn function to transform the value produced by the parsed
 */
function map(parser, fn) {
    return Parser_1.fromGenerator(function* map() {
        var result = yield* parser;
        return fn(result);
    }, `map(${parser.parserName})`);
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
    return Parser_1.fromGenerator(function* surround() {
        yield* left;
        var v = yield* val;
        yield* right;
        return v;
    }, `surround(${left.parserName},${val.parserName},${right.parserName})`);
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
    for (let i = 0; i < operators.length; ++i) {
        let precedence = operators.length - i;
        let operator = operators[i];
        switch (operator.fixity) {
            case "infix":
                binOps.push({
                    precedence,
                    associativity: operator.associativity,
                    parser: operator.parser,
                });
                break;
            case "postfix":
                postOps.push(operator.parser);
                break;
            case "prefix":
                preOps.push(operator.parser);
                break;
        }
    }
    var parseExprTerm = Parser_1.fromGenerator(function* exprParserTerm() {
        var preFuncs = [];
        var postFuncs = [];
        var f = null;
        do {
            f = yield* maybe(choice(preOps));
            if (f !== null) {
                preFuncs.push(f);
            }
        } while (f !== null);
        if (parseTerm === null) {
            parseTerm = parseTermFactory();
        }
        var result = yield* parseTerm;
        do {
            f = yield* maybe(choice(postOps));
            if (f !== null) {
                postFuncs.push(f);
            }
        } while (f !== null);
        for (let f of preFuncs) {
            result = f(result);
        }
        for (let f of postFuncs) {
            result = f(result);
        }
        return result;
    }, `expressionParser:term`);
    // This uses the precedence climbing/TDOP algorithm
    // See http://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing
    function parseExpressionPrecedence(minPrec) {
        return Parser_1.fromGenerator(function* exprParserPrecedence() {
            var left = yield* parseExprTerm;
            while (true) {
                var action = null;
                var associativity;
                var precedence;
                for (var i = 0; i < binOps.length && action === null; ++i) {
                    var op = binOps[i];
                    if (op.precedence >= minPrec) {
                        action = yield* maybe(op.parser);
                        associativity = op.associativity;
                        precedence = op.precedence;
                    }
                }
                if (action === null) {
                    // if action is not null, associativity and precedence are both not undefined
                    return left;
                }
                var nextMinPrec;
                if (associativity === "left") {
                    nextMinPrec = precedence + 1;
                }
                else {
                    nextMinPrec = precedence;
                }
                var right = yield* parseExpressionPrecedence(nextMinPrec);
                left = action(left, right);
            }
        }, `expressionParser:precedence`);
    }
    return parseExpressionPrecedence(0);
}
exports.buildExpressionParser = buildExpressionParser;
//# sourceMappingURL=ParserCombinators.js.map