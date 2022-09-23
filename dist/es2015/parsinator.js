var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/lib/ParserTypes.ts
var ParseError = class extends Error {
  constructor(msg, line, col, state) {
    super(`Parse failure at ${line}:${col}: ${msg}
${formatState(state)}`);
    this.line = line;
    this.col = col;
    this.msg = msg;
    this.state = state;
    this.offset = state.offset;
    this.input = state.input;
  }
};
function formatState(state) {
  var startOffset = Math.max(0, state.offset - 40);
  var endOffset = Math.min(state.input.length, state.offset + 40);
  var substr = (startOffset === 0 ? "" : "...") + state.input.replace(/[\t\r\n\v\f]/g, "\xB7").slice(startOffset, endOffset) + (endOffset === state.input.length ? "" : "...");
  var charsBefore = (startOffset === 0 ? 0 : 3) + state.input.slice(startOffset, state.offset).length;
  var marker = " ".repeat(charsBefore) + "^";
  return `-> \xAB${substr}\xBB
    ${marker} `;
}

// src/lib/ParserHelpers.ts
function resultFailure(msg, state) {
  var lines = 0;
  var lastLineStart = 0;
  for (var i = 0; i < state.offset; ++i) {
    if (state.input[i] === "\n") {
      lines++;
      lastLineStart = i + 1;
    }
  }
  var line = 1 + lines;
  var col = 1 + state.offset - lastLineStart;
  return new ParseError(msg, line, col, state);
}

// src/lib/Parser.ts
function makeParser(generator, parserName) {
  return Object.assign(() => generator(), {
    [Symbol.iterator]: generator,
    parserName
  });
}
function regex(regex2) {
  return makeParser(function* () {
    const state = yield 0;
    var remaining = state.input.slice(state.offset);
    var duplicated = new RegExp(regex2);
    var result = duplicated.exec(remaining);
    if (result === null || result.index !== 0) {
      throw resultFailure(
        `regex /${regex2.source}/${regex2.flags} doesn't match`,
        state
      );
    }
    yield result[0].length;
    return result[0];
  }, `regex:${regex2.source}`);
}
function regexMatch(regex2) {
  return makeParser(function* () {
    const state = yield 0;
    var remaining = state.input.slice(state.offset);
    var duplicated = new RegExp(regex2);
    var result = duplicated.exec(remaining);
    if (result === null || result.index !== 0) {
      throw resultFailure(
        `regex /${regex2.source}/${regex2.flags} doesn't match`,
        state
      );
    }
    yield result[0].length;
    return Array.from(result);
  }, `regexMatch:${regex2.source}`);
}
function str(string) {
  return makeParser(function* () {
    const state = yield 0;
    if (state.input.substr(state.offset, string.length) === string) {
      yield string.length;
      return string;
    } else {
      throw resultFailure(`"${string}" not found`, state);
    }
  }, `str:${string}`);
}
function fromGenerator(generator, parserName) {
  return makeParser(function* () {
    let state = yield 0;
    var iterator = generator();
    while (true) {
      var result = iterator.next(state);
      if (result.done) {
        yield state;
        return result.value;
      } else {
        if (typeof result.value === "number") {
          state = __spreadProps(__spreadValues({}, state), { offset: state.offset + result.value });
        } else {
          state = result.value;
        }
        yield state;
      }
    }
  }, parserName || generator.name);
}
function fail(message) {
  return makeParser(function* () {
    const state = yield 0;
    throw resultFailure(message, state);
  }, `fail:${message}`);
}
function wrapFail(parser, wrapper) {
  return makeParser(function* () {
    try {
      return yield* parser;
    } catch (e) {
      if (e instanceof ParseError) {
        const message = wrapper(e.msg);
        throw resultFailure(message, { input: e.input, offset: e.offset });
      }
      throw e;
    }
  }, "wrapFail");
}
function debugTrace(log) {
  return makeParser(function* () {
    const state = yield 0;
    log(formatState(state));
    return void 0;
  }, "debugTrace");
}
var end = makeParser(function* () {
  const state = yield 0;
  if (state.offset >= state.input.length) {
    return null;
  } else {
    throw resultFailure("Not at end of string", state);
  }
}, "end");
function runInner(parser, state) {
  const iter = parser();
  let step = iter.next(state);
  while (!step.done) {
    if (typeof step.value === "number") {
      state = __spreadProps(__spreadValues({}, state), { offset: state.offset + step.value });
    } else {
      state = step.value;
    }
    step = iter.next(state);
  }
  return {
    value: step.value,
    state
  };
}
function run(parser, input) {
  const state = {
    input,
    offset: 0
  };
  return runInner(parser, state).value;
}
function runToEnd(parser, input) {
  const state = {
    input,
    offset: 0
  };
  const result = runInner(parser, state);
  const next = runInner(end, result.state);
  return result.value;
}

// src/lib/ParserCombinators.ts
function maybe(parser) {
  return fromGenerator(function* maybe2() {
    const startState = yield 0;
    try {
      return yield* parser;
    } catch (e) {
      yield startState;
      return null;
    }
  }, `maybe(${parser.parserName})`);
}
function many(parser) {
  return fromGenerator(function* many2() {
    var results = [];
    while (true) {
      const state = yield 0;
      try {
        var result = yield* parser;
      } catch (e) {
        yield state;
        return results;
      }
      results.push(result);
    }
  }, `many(${parser.parserName})`);
}
function many1(parser) {
  return fromGenerator(function* many12() {
    var one = yield* parser;
    var multiple = yield* many(parser);
    return [one].concat(multiple);
  }, `many1(${parser.parserName})`);
}
function choice(parsers) {
  return fromGenerator(function* choice2() {
    var errors = [];
    const startState = yield 0;
    for (var i = 0; i < parsers.length; ++i) {
      try {
        return yield* parsers[i];
      } catch (e) {
        if (e instanceof ParseError) {
          errors.push(e);
        } else {
          throw e;
        }
        yield startState;
      }
    }
    const state = yield 0;
    yield startState;
    errors.sort((a, b) => b.offset - a.offset);
    throw resultFailure(
      "Multiple choices; potential matches:\n- " + errors.map((error) => error.message.split("\n").join("\n  ")).join("\n- "),
      state
    );
  }, `choice(${parsers.map((parser) => parser.parserName).join(",")})`);
}
function sequence(parsers) {
  return fromGenerator(function* sequence2() {
    var results = [];
    for (var i = 0; i < parsers.length; ++i) {
      const state = yield 0;
      results.push(yield* parsers[i]);
    }
    return results;
  }, `sequence(${parsers.map((parser) => parser.name).join(",")})`);
}
function count(num, parser) {
  return fromGenerator(function* count2() {
    var results = [];
    for (var i = 0; i < num; ++i) {
      results.push(yield* parser);
    }
    return results;
  }, `count(${num},${parser.parserName})`);
}
function sepBy1(sepParser, valParser) {
  var maybeSeparator = maybe(sepParser);
  return fromGenerator(function* sepBy12() {
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
function sepBy(sepParser, valParser) {
  var maybeSeparator = maybe(sepParser);
  var maybeParser = maybe(valParser);
  return fromGenerator(function* sepBy2() {
    var results = [];
    var first = yield* maybeParser;
    if (first === null) {
      return results;
    } else {
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
function peek(parser) {
  return fromGenerator(function* peek2() {
    const startState = yield 0;
    let result;
    try {
      result = yield* parser;
    } catch (e) {
      yield startState;
      throw e;
    }
    yield startState;
    return result;
  }, `peek(${parser.parserName})`);
}
function until(terminator) {
  return fromGenerator(function* until2() {
    let state = yield 0;
    for (var i = state.offset; i <= state.input.length; ++i) {
      const maybeEndState = yield __spreadProps(__spreadValues({}, state), { offset: i });
      try {
        yield* terminator;
        yield maybeEndState;
        return state.input.slice(state.offset, i);
      } catch (e) {
      }
    }
    throw resultFailure("Didn't find terminator", state);
  }, `until(${terminator.parserName})`);
}
function between(start, end2) {
  return fromGenerator(function* between2() {
    yield* start;
    var data = yield* until(end2);
    yield* end2;
    return data;
  }, `between(${start.parserName},${end2.parserName})`);
}
function map(parser, fn) {
  return fromGenerator(function* map2() {
    var result = yield* parser;
    return fn(result);
  }, `map(${parser.parserName})`);
}
function surround(left, val, right) {
  return fromGenerator(function* surround2() {
    yield* left;
    var v = yield* val;
    yield* right;
    return v;
  }, `surround(${left.parserName},${val.parserName},${right.parserName})`);
}
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
          parser: operator.parser
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
  var parseExprTerm = fromGenerator(function* exprParserTerm() {
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
    for (let f2 of preFuncs) {
      result = f2(result);
    }
    for (let f2 of postFuncs) {
      result = f2(result);
    }
    return result;
  }, `expressionParser:term`);
  function parseExpressionPrecedence(minPrec) {
    return fromGenerator(function* exprParserPrecedence() {
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
          return left;
        }
        var nextMinPrec;
        if (associativity === "left") {
          nextMinPrec = precedence + 1;
        } else {
          nextMinPrec = precedence;
        }
        var right = yield* parseExpressionPrecedence(nextMinPrec);
        left = action(left, right);
      }
    }, `expressionParser:precedence`);
  }
  return parseExpressionPrecedence(0);
}

// src/parsinator.ts
var VERSION = false ? "debug" : "2.1.2";
export {
  ParseError,
  VERSION,
  between,
  buildExpressionParser,
  choice,
  count,
  debugTrace,
  end,
  fail,
  fromGenerator,
  many,
  many1,
  map,
  maybe,
  peek,
  regex,
  regexMatch,
  run,
  runToEnd,
  sepBy,
  sepBy1,
  sequence,
  str,
  surround,
  until,
  wrapFail
};
//# sourceMappingURL=parsinator.js.map
