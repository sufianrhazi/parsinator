"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ParserTypes_1 = require("./ParserTypes");
function resultSuccess(value, input, offset) {
    return {
        value: value,
        state: {
            input: input,
            offset: offset,
        },
    };
}
exports.resultSuccess = resultSuccess;
function resultFailure(msg, state) {
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
    return new ParserTypes_1.ParseError(msg, line, col, state);
}
exports.resultFailure = resultFailure;
//# sourceMappingURL=ParserHelpers.js.map