export const VERSION = "1.0.0";

export {
  str,
  regex,
  regexMatch,
  end,
  fail,
  wrapFail,
  debugTrace,
  run,
  runToEnd,
  fromGenerator,
} from "./lib/Parser";

export {
  maybe,
  many,
  many1,
  choice,
  sequence,
  count,
  sepBy,
  sepBy1,
  peek,
  until,
  between,
  map,
  surround,
  OperatorActionUnary,
  OperatorActionBinary,
  OperatorDeclBinary,
  OperatorDeclUnary,
  OperatorDecl,
  OperatorDecls,
  buildExpressionParser,
} from "./lib/ParserCombinators";

export { Parser, ParseError, ParseState, ParseResult } from "./lib/ParserTypes";
