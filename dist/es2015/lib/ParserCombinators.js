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
/**
 * Produce a value obtained after a prefix parser and before a suffix parser
 *
 * @param left a prefix parser that the produced value is ignored
 * @param val the parser whose produced value is desired
 * @param right a suffix parser that the produced value is ignored
 */
export function surround(left, val, right) {
    return fromGenerator(function* () {
        yield left;
        var v = yield val;
        yield right;
        return v;
    });
}
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
export function buildExpressionParser(operators, parseTermFactory) {
    var parseTerm = null;
    var preOps = [];
    var postOps = [];
    var binOps = [];
    for (let i = 0; i < operators.length; ++i) {
        let precedence = operators.length - i;
        let operator = operators[i];
        switch (operator.fixity) {
            case "infix":
                binOps.push({ precedence, associativity: operator.associativity, parser: operator.parser });
                break;
            case "postfix":
                postOps.push(operator.parser);
                break;
            case "prefix":
                preOps.push(operator.parser);
                break;
        }
    }
    var parseExprTerm = fromGenerator(function* () {
        var preFuncs = [];
        var postFuncs = [];
        var f = null;
        do {
            f = yield maybe(choice(preOps));
            if (f !== null) {
                preFuncs.push(f);
            }
        } while (f !== null);
        if (parseTerm === null) {
            parseTerm = parseTermFactory();
        }
        var result = yield parseTerm;
        do {
            f = yield maybe(choice(postOps));
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
    });
    // This uses the precedence climbing/TDOP algorithm
    // See http://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing
    function parseExpressionPrecedence(minPrec) {
        return fromGenerator(function* () {
            var left = yield parseExprTerm;
            while (true) {
                var action = null;
                var associativity;
                var precedence;
                for (var i = 0; i < binOps.length && action === null; ++i) {
                    var op = binOps[i];
                    if (op.precedence >= minPrec) {
                        action = yield maybe(op.parser);
                        associativity = op.associativity;
                        precedence = op.precedence;
                    }
                }
                if (action === null) {
                    return left;
                }
                var nextMinPrec;
                if (associativity === 'left') {
                    nextMinPrec = precedence + 1;
                }
                else {
                    nextMinPrec = precedence;
                }
                var right = yield parseExpressionPrecedence(nextMinPrec);
                left = action(left, right);
            }
        });
    }
    return parseExpressionPrecedence(0);
}
//# sourceMappingURL=ParserCombinators.js.map