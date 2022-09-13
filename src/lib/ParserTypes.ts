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

export class ParseError extends Error {
  public line: number;
  public col: number;
  public offset: number;
  public input: string;
  public msg: string;
  public state: ParseState;

  constructor(msg: string, line: number, col: number, state: ParseState) {
    super(`Parse failure at ${line}:${col}: ${msg}\n${formatState(state)}`);
    this.line = line;
    this.col = col;
    this.msg = msg;
    this.state = state;
    this.offset = state.offset;
    this.input = state.input;
  }
}

export function formatState(state: ParseState): string {
  var startOffset = Math.max(0, state.offset - 40);
  var endOffset = Math.min(state.input.length, state.offset + 40);
  var substr =
    (startOffset === 0 ? "" : "...") +
    state.input.replace(/[\t\r\n\v\f]/g, "·").slice(startOffset, endOffset) +
    (endOffset === state.input.length ? "" : "...");
  var charsBefore =
    (startOffset === 0 ? 0 : 3) +
    state.input.slice(startOffset, state.offset).length -
    1;
  var marker = new Array(charsBefore + 1).join(" ") + "^";
  return `-> «${substr}»\n    ${marker} `;
}
