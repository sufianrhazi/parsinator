import * as Parser from "./ParserCombinator";
import { assert } from "chai";

test("parseExact hit", function () {
    assert.strictEqual("Hello", Parser.run(Parser.parseExact("Hello"), "Hello"));
});

test("parseExact miss", function () {
    assert.throws(() => Parser.run(Parser.parseExact("Hello"), "Goodbye"), /Parse failure at 0:0: "Hello" not found/);
});

test("parseRegex hit", function () {
    var parser = Parser.parseRegex(/Hello, .*!/);
    assert.strictEqual("Hello, world!", Parser.run(parser, "Hello, world!"));
    assert.strictEqual("Hello, there!", Parser.run(parser, "Hello, there!"));
})

test("parseRegex miss", function () {
    assert.throws(() => Parser.run(Parser.parseRegex(/Hello, .*!/), "Goodbye, world!"), /Parse failure at 0:0: regex \/Hello, \.\*!\/ doesn't match/);
})

test("parseMaybe hit", function () {
    assert.strictEqual("Hit", Parser.run(Parser.parseMaybe(Parser.parseExact("Hit")), "Hit"));
});

test("parseMaybe miss", function () {
    assert.isNull(Parser.run(Parser.parseMaybe(Parser.parseExact("Hit")), "Not a hit"));
});

test("parseMany no hits", function () {
    assert.sameMembers([], Parser.run(Parser.parseMany(Parser.parseExact("hi")), "nope"));
});

test("parseMany many hits", function () {
    assert.sameMembers(["hi", "hi", "hi", "hi"], Parser.run(Parser.parseMany(Parser.parseExact("hi")), "hihihihi"));    
})

test("parseChoice hit", function () {
    var choice = Parser.parseChoice([
        Parser.parseExact("foo"),
        Parser.parseExact("bar")
    ]);
    assert.strictEqual("foo", Parser.run(choice, "foo"));
    assert.strictEqual("bar", Parser.run(choice, "bar"));
});

test("parseChoice miss", function () {
    var choice = Parser.parseChoice([
        Parser.parseExact("foo"),
        Parser.parseExact("bar")
    ]);
    assert.throws(() => Parser.run(choice, "baz"), /"foo" not found/);    
    assert.throws(() => Parser.run(choice, "baz"), /"bar" not found/);    
});

test("parseSequence hit", function () {
    var parser = Parser.parseSequence<string | string[]>([
        Parser.parseExact("foo"),
        Parser.parseMany(Parser.parseExact("bar")),
        Parser.parseExact("baz")
    ]);
    assert.deepEqual(["foo", [], "baz"], Parser.run(parser, "foobaz"));
    assert.deepEqual(["foo", ["bar"], "baz"], Parser.run(parser, "foobarbaz"));
    assert.deepEqual(["foo", ["bar", "bar", "bar"], "baz"], Parser.run(parser, "foobarbarbarbaz"));
});