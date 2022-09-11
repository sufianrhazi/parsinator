import { ParseError, ParseState, ParseResult } from "./ParserTypes";

export class ParseErrorDetail extends ParseError {
  constructor(msg: string, line: number, col: number, state: ParseState) {
    super(
      `Parse failure at ${line}:${col}: ${msg}\n${formatState(state)}`,
      line,
      col,
      state
    );
    this.line = line;
    this.col = col;
    this.offset = state.offset;
    this.input = state.input;
  }
}
export function resultSuccess<T>(
  value: T,
  input: string,
  offset: number
): ParseResult<T> {
  return {
    value: value,
    state: {
      input: input,
      offset: offset,
    },
  };
}

export function formatState(state: ParseState): string {
  var startOffset = Math.max(0, state.offset - 10);
  var endOffset = Math.min(state.input.length, state.offset + 10);
  var substr = JSON.stringify(
    (startOffset === 0 ? "" : "...") +
      state.input.slice(startOffset, endOffset) +
      (endOffset === state.input.length ? "" : "...")
  );
  var charsBefore =
    (startOffset === 0 ? 0 : 3) +
    JSON.stringify(state.input.slice(startOffset, state.offset)).length -
    1;
  var marker = new Array(charsBefore + 1).join(" ") + "^";
  return `-> ${substr}\n   ${marker}`;
}

export function resultFailure<T>(
  msg: string,
  state: ParseState,
  ErrorConstructor: new (
    msg: string,
    line: number,
    col: number,
    state: ParseState
  ) => T
): T {
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
  return new ErrorConstructor(msg, line, col, state);
}
