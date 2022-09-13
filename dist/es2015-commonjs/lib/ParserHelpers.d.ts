import { ParseError, ParseState, ParseResult } from "./ParserTypes";
export declare function resultSuccess<T>(value: T, input: string, offset: number): ParseResult<T>;
export declare function resultFailure<T>(msg: string, state: ParseState): ParseError;
