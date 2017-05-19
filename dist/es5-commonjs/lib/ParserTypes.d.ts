export interface ParseState {
    input: string;
    offset: number;
}
export interface ParseResult<T> {
    value: T;
    state: ParseState;
}
export declare type Parser<T> = (state: ParseState) => ParseResult<T>;
export declare class ParseError extends Error {
    line: number;
    col: number;
    offset: number;
    input: string;
    constructor(msg: string, line: number, col: number, state: ParseState);
}
