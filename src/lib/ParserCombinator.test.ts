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
        assert.throws(() => Parser.run(parser, "Oh! Hello, human!"), /Parse failure at 0:0: regex \/Hello, \.\*!\/ doesn't match/);
        assert.throws(() => Parser.run(parser, "Goodbye, world!"), /Parse failure at 0:0: regex \/Hello, \.\*!\/ doesn't match/);
    });
});

suite("parseRegexMatch", function () {
    var parser = Parser.parseRegexMatch(/Hello, (.*)! ([0-9]+)/);
    test("hit", function () {
        assert.deepEqual(["Hello, world! 123", "world", "123"], Parser.run(parser, "Hello, world! 123"));
    });

    test("miss", function () {
        assert.throws(() => Parser.run(parser, "Oh! Hello, human!"), /Parse failure at 0:0: regex \/Hello, \(\.\*\)! \(\[0-9\]\+\)\/ doesn't match/);
        assert.throws(() => Parser.run(parser, "Goodbye, world!"), /Parse failure at 0:0: regex \/Hello, \(\.\*\)! \(\[0-9\]\+\)\/ doesn't match/);
    });
})

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

suite("parseLookAhead", function () {
    var parser = Parser.parseChain([
        Parser.parseString("foo"),
        Parser.parseLookAhead(Parser.parseString("bar")),
        Parser.parseString("barbaz")
    ]);
    test("hit", function () {
        assert.deepEqual(["foo", "bar", "barbaz"], Parser.run(parser, "foobarbaz"));
    });
    test("miss", function () {
        assert.throws(() => Parser.run(parser, "foobazbaz"), /Parse failure at 0:3: "bar" not found/);
        assert.throws(() => Parser.run(parser, "foobarbut"), /Parse failure at 0:3: "barbaz" not found/);
    });
});

suite("parseSepBy", function () {
    var words = Parser.parseSepBy(
        Parser.parseRegex(/\s+/),
        Parser.parseRegex(/[a-z]+/)
    );

    test("hit", function () {
        assert.deepEqual(["why", "hello", "there"], Parser.run(words, "why hello\nthere"));
        assert.deepEqual(["why", "hello"], Parser.run(words, "why\thello"));
        assert.deepEqual(["why"], Parser.run(words, "why"));
        assert.deepEqual([], Parser.run(words, "123"));
    });
    
    test("miss", function () {
        assert.throws(() => Parser.run(words, "why hello 123"), /Parse failure at 0:10: regex \/\[a-z\]\+\/ doesn't match/);
    });
});

suite("parseSepBy1", function () {
    var words = Parser.parseSepBy1(
        Parser.parseRegex(/\s+/),
        Parser.parseRegex(/[a-z]+/)
    );

    test("hit", function () {
        assert.deepEqual(["why", "hello", "there"], Parser.run(words, "why hello\nthere"));
        assert.deepEqual(["why", "hello"], Parser.run(words, "why\thello"));
        assert.deepEqual(["why"], Parser.run(words, "why"));
    });
    
    test("miss", function () {
        assert.throws(() => Parser.run(words, "123"), /Parse failure at 0:0: regex \/\[a-z\]\+\/ doesn't match/);
    });
});

suite("fromIterator", function () {
    var parseDivisionExpression = Parser.fromIterator<number|string,number>(function *() {
        var numerator = parseFloat(yield Parser.parseRegex(/[0-9]+\.[0-9]+/));
        yield Parser.parseRegex(/\s*/);
        yield Parser.parseString("/");
        yield Parser.parseRegex(/\s*/);
        var denominator = parseFloat(yield Parser.parseRegex(/[0-9]+\.[0-9]+/));
        return numerator / denominator;
    });

    test("can be used to parse a complex expression", function () {
        assert.equal(3.0 / 5.0, Parser.run(parseDivisionExpression, "3.0 / 5.0"));
        assert.equal(42.0 / 21.0, Parser.run(parseDivisionExpression, "42.0/21.0"));
        assert.equal(3.0 / 5.0, Parser.run(parseDivisionExpression, "3.0     /       5.0"));
    });
});

/*
 * Remaining tests:
 *   Parser.fromIterator
 */