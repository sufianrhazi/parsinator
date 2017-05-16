import * as Parser from "./ParserCombinator";
import { assert } from "chai";

suite("parseExact", function () {
    var parser = Parser.parseString("Hello");
    test("hit", function () {
        assert.strictEqual("Hello", Parser.run(parser, "Hello"));
    });

    test("miss", function () {
        assert.throws(() => Parser.run(parser, "Goodbye"), /Parse failure at 0:0: "Hello" not found/);
    });
});

suite("parseRegex", function () {
    var parser = Parser.parseRegex(/Hello, .*!/);
    test("hit", function () {
        assert.strictEqual("Hello, world!", Parser.run(parser, "Hello, world!"));
        assert.strictEqual("Hello, there!", Parser.run(parser, "Hello, there!"));
    });

    test("miss", function () {
        assert.throws(() => Parser.run(parser, "Goodbye, world!"), /Parse failure at 0:0: regex \/Hello, \.\*!\/ doesn't match/);
    });
});

suite("parseMaybe", function () {
    var parser = Parser.parseMaybe(Parser.parseString("Hit"));
    test("hit", function () {
        assert.strictEqual("Hit", Parser.run(parser, "Hit"));
    });

    test("miss", function () {
        assert.isNull(Parser.run(parser, "Not a hit"));
    });
});

suite("parseMany", function () {
    var parser = Parser.parseMany(Parser.parseString("hi"));

    test("hit", function () {
        assert.sameMembers(["hi", "hi", "hi", "hi"], Parser.run(parser, "hihihihi"));    
    });

    test("miss succeeds with empty match", function () {
        assert.sameMembers([], Parser.run(parser, "nope"));
    });
});

suite("parseMany1", function () {
    var parser = Parser.parseMany1(Parser.parseString("hi"));

    test("hit", function () {
        assert.sameMembers(["hi", "hi", "hi", "hi"], Parser.run(parser, "hihihihi"));    
    });

    test("miss fails", function () {
        assert.throws(() => Parser.run(parser, "nope"), /Parse failure at 0:0: "hi" not found/);
    });
});


suite("parseChoice", function () {
    var choice = Parser.parseChoice([
        Parser.parseString("foo"),
        Parser.parseString("bar")
    ]);

    test("hit", function () {
        assert.strictEqual("foo", Parser.run(choice, "foo"));
        assert.strictEqual("bar", Parser.run(choice, "bar"));
    });

    test("miss", function () {
        assert.throws(() => Parser.run(choice, "baz"), /"foo" not found/);    
        assert.throws(() => Parser.run(choice, "baz"), /"bar" not found/);    
    });
})

suite("parseChain", function () {
    var parser = Parser.parseChain<string | string[]>([
        Parser.parseString("foo"),
        Parser.parseMany(Parser.parseString("bar")),
        Parser.parseString("baz")
    ]);

    test("hit", function () {
        assert.deepEqual(["foo", [], "baz"], Parser.run(parser, "foobaz"));
        assert.deepEqual(["foo", ["bar"], "baz"], Parser.run(parser, "foobarbaz"));
        assert.deepEqual(["foo", ["bar", "bar", "bar"], "baz"], Parser.run(parser, "foobarbarbarbaz"));
    });

    test("miss", function () {
        assert.throws(() => Parser.run(parser, "foobarbar"), /Parse failure at 0:9: "baz" not found/);
    });
});

suite("parseCount", function () {
    var parser = Parser.parseString("ok");
    test("hit", function () {
        assert.deepEqual(["ok", "ok"], Parser.run(Parser.parseCount(2, parser), "okokok"));
        assert.deepEqual(["ok"], Parser.run(Parser.parseCount(1, parser), "okokok"));
    });
    test("miss", function () {
        assert.throws(() => Parser.run(Parser.parseCount(2, parser), "okno"), /Parse failure at 0:2: "ok" not found/);
    });
});

suite("parseEnd", function () {
    var parser = Parser.parseChain([
        Parser.parseString("this is the end"),
        Parser.parseEnd()
    ]);
    test("hit", function () {
        assert.deepEqual(["this is the end", null], Parser.run(parser, "this is the end"));
    });
    test("miss", function () {
        assert.throws(() => Parser.run(parser, "this is the end, except it's not"), /Parse failure at 0:15: Not at end of string/);
    });
});

/*
 * Remaining tests:
 *   Parser.parseLookAhead
 *   Parser.parseSepBy
 *   Parser.parseSepBy1
 *   Parser.fromIterator
 */