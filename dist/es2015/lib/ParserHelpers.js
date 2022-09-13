import { ParseError } from "./ParserTypes";
export function resultSuccess(value, input, offset) {
    return {
        value: value,
        state: {
            input: input,
            offset: offset,
        },
    };
}
export function resultFailure(msg, state) {
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
    return new ParseError(msg, line, col, state);
}
//# sourceMappingURL=ParserHelpers.js.map