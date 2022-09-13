"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ParseError extends Error {
    constructor(msg, line, col, state) {
        super(`Parse failure at ${line}:${col}: ${msg}\n${formatState(state)}`);
        this.line = line;
        this.col = col;
        this.msg = msg;
        this.state = state;
        this.offset = state.offset;
        this.input = state.input;
    }
}
exports.ParseError = ParseError;
function formatState(state) {
    var startOffset = Math.max(0, state.offset - 40);
    var endOffset = Math.min(state.input.length, state.offset + 40);
    var substr = (startOffset === 0 ? "" : "...") +
        state.input.replace(/[\t\r\n\v\f]/g, "·").slice(startOffset, endOffset) +
        (endOffset === state.input.length ? "" : "...");
    var charsBefore = (startOffset === 0 ? 0 : 3) +
        state.input.slice(startOffset, state.offset).length -
        1;
    var marker = new Array(charsBefore + 1).join(" ") + "^";
    return `-> «${substr}»\n    ${marker} `;
}
exports.formatState = formatState;
//# sourceMappingURL=ParserTypes.js.map