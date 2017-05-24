"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ParserTypes_1 = require("./ParserTypes");
var ParseErrorDetail = (function (_super) {
    __extends(ParseErrorDetail, _super);
    function ParseErrorDetail(msg, line, col, state) {
        var _this = _super.call(this, "Parse failure at " + line + ":" + col + ": " + msg + "\n" + formatState(state), line, col, state) || this;
        _this.line = line;
        _this.col = col;
        _this.offset = state.offset;
        _this.input = state.input;
        return _this;
    }
    return ParseErrorDetail;
}(ParserTypes_1.ParseError));
exports.ParseErrorDetail = ParseErrorDetail;
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
function formatState(state) {
    var startOffset = Math.max(0, state.offset - 10);
    var endOffset = Math.min(state.input.length, state.offset + 10);
    var substr = JSON.stringify((startOffset === 0 ? '' : '...') + state.input.slice(startOffset, endOffset) + (endOffset === state.input.length ? '' : '...'));
    var charsBefore = (startOffset === 0 ? 0 : 3) + JSON.stringify(state.input.slice(startOffset, state.offset)).length - 1;
    var marker = new Array(charsBefore + 1).join(' ') + '^';
    return "-> " + substr + "\n   " + marker;
}
exports.formatState = formatState;
function resultFailure(msg, state, ErrorConstructor) {
    var lines = 0;
    var lastLineStart = 0;
    for (var i = 0; i < state.offset; ++i) {
        if (state.input[i] === '\n') {
            lines++;
            lastLineStart = i + 1;
        }
    }
    var line = 1 + lines;
    var col = 1 + state.offset - lastLineStart;
    return new ErrorConstructor(msg, line, col, state);
}
exports.resultFailure = resultFailure;
//# sourceMappingURL=ParserHelpers.js.map