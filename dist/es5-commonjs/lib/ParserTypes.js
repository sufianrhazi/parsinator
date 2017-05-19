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
var ParseError = (function (_super) {
    __extends(ParseError, _super);
    function ParseError(msg, line, col, state) {
        var _this = _super.call(this, msg) || this;
        _this.line = line;
        _this.col = col;
        _this.offset = state.offset;
        _this.input = state.input;
        return _this;
    }
    return ParseError;
}(Error));
exports.ParseError = ParseError;
//# sourceMappingURL=ParserTypes.js.map