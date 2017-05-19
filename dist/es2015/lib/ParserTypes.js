export class ParseError extends Error {
    constructor(msg, line, col, state) {
        super(msg);
        this.line = line;
        this.col = col;
        this.offset = state.offset;
        this.input = state.input;
    }
}
//# sourceMappingURL=ParserTypes.js.map