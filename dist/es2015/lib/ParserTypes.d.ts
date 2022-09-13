export interface ParseState {
    input: string;
    offset: number;
}
export interface ParseResult<T> {
    value: T;
    state: ParseState;
}
export interface Parser<T> {
    (): Generator<number | ParseState, T, ParseState>;
    [Symbol.iterator](): Generator<number | ParseState, T, ParseState>;
    parserName: string;
}
export declare class ParseError extends Error {
    line: number;
    col: number;
    offset: number;
    input: string;
    msg: string;
    state: ParseState;
    constructor(msg: string, line: number, col: number, state: ParseState);
}
export declare function formatState(state: ParseState): string;
