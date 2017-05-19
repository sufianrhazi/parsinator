import { ParseError, ParseState, ParseResult } from './ParserTypes';
export declare class ParseErrorDetail extends ParseError {
    constructor(msg: string, line: number, col: number, state: ParseState);
}
export declare function resultSuccess<T>(value: T, input: string, offset: number): ParseResult<T>;
export declare function formatState(state: ParseState): string;
export declare function resultFailure<T>(msg: string, state: ParseState, ErrorConstructor: new (msg: string, line: number, col: number, state: ParseState) => T): T;
