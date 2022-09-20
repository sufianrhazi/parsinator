declare const BUILD_VERSION: string | undefined;

export const VERSION =
  typeof BUILD_VERSION === undefined ? "debug" : BUILD_VERSION;

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
