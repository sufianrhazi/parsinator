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
}

export class ParseError extends Error {
  public line: number;
  public col: number;
  public offset: number;
  public input: string;

  constructor(msg: string, line: number, col: number, state: ParseState) {
    super(msg);
    this.line = line;
    this.col = col;
    this.offset = state.offset;
    this.input = state.input;
  }
}
