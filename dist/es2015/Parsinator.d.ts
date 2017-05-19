export declare const VERSION = "1.0.0";
export { str, regex, regexMatch, end, debugTrace, run, runToEnd, fromGenerator } from './lib/Parser';
export { maybe, many, many1, choice, sequence, count, sepBy, sepBy1, peek, until, between, map } from './lib/ParserCombinators';
export { Parser, ParseError, ParseState, ParseResult } from './lib/ParserTypes';
