import * as Parser from "./ParserCombinator";
import { assert } from "chai";

suite("str", function () {
    var parser = Parser.str("Hello");
    test("hit", function () {
        assert.strictEqual("Hello", Parser.run(parser, "Hello"));
    });

    test("miss", function () {
        assert.throws(() => Parser.run(parser, "Goodbye"), /Parse failure at 1:1: "Hello" not found/);
    });
});

suite("regex", function () {
    var parser = Parser.regex(/Hello, .*!/);
    test("hit", function () {
        assert.strictEqual("Hello, world!", Parser.run(parser, "Hello, world!"));
        assert.strictEqual("Hello, there!", Parser.run(parser, "Hello, there!"));
    });

    test("miss", function () {
        assert.throws(() => Parser.run(parser, "Oh! Hello, human!"), /Parse failure at 1:1: regex \/Hello, \.\*!\/ doesn't match/);
        assert.throws(() => Parser.run(parser, "Goodbye, world!"), /Parse failure at 1:1: regex \/Hello, \.\*!\/ doesn't match/);
    });
});

suite("regexMatch", function () {
    var parser = Parser.regexMatch(/Hello, (.*)! ([0-9]+)/);
    test("hit", function () {
        assert.deepEqual(["Hello, world! 123", "world", "123"], Parser.run(parser, "Hello, world! 123"));
    });

    test("miss", function () {
        assert.throws(() => Parser.run(parser, "Oh! Hello, human!"), /Parse failure at 1:1: regex \/Hello, \(\.\*\)! \(\[0-9\]\+\)\/ doesn't match/);
        assert.throws(() => Parser.run(parser, "Goodbye, world!"), /Parse failure at 1:1: regex \/Hello, \(\.\*\)! \(\[0-9\]\+\)\/ doesn't match/);
    });
})

suite("maybe", function () {
    var parser = Parser.maybe(Parser.str("Hit"));
    test("hit", function () {
        assert.strictEqual("Hit", Parser.run(parser, "Hit"));
    });

    test("miss", function () {
        assert.isNull(Parser.run(parser, "Not a hit"));
    });
});

suite("many", function () {
    var parser = Parser.many(Parser.str("hi"));

    test("hit", function () {
        assert.sameMembers(["hi", "hi", "hi", "hi"], Parser.run(parser, "hihihihi"));    
    });

    test("miss succeeds with empty match", function () {
        assert.sameMembers([], Parser.run(parser, "nope"));
    });
});

suite("many1", function () {
    var parser = Parser.many1(Parser.str("hi"));

    test("hit", function () {
        assert.sameMembers(["hi", "hi", "hi", "hi"], Parser.run(parser, "hihihihi"));    
    });

    test("miss fails", function () {
        assert.throws(() => Parser.run(parser, "nope"), /Parse failure at 1:1: "hi" not found/);
    });
});


suite("choice", function () {
    var choice = Parser.choice([
        Parser.str("foo"),
        Parser.str("bar")
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

suite("sequence", function () {
    var parser = Parser.sequence<string | string[]>([
        Parser.str("foo"),
        Parser.many(Parser.str("bar")),
        Parser.str("baz")
    ]);

    test("hit", function () {
        assert.deepEqual(["foo", [], "baz"], Parser.run(parser, "foobaz"));
        assert.deepEqual(["foo", ["bar"], "baz"], Parser.run(parser, "foobarbaz"));
        assert.deepEqual(["foo", ["bar", "bar", "bar"], "baz"], Parser.run(parser, "foobarbarbarbaz"));
    });

    test("miss", function () {
        assert.throws(() => Parser.run(parser, "foobarbar"), /Parse failure at 1:10: "baz" not found/);
    });
});

suite("count", function () {
    var parser = Parser.str("ok");
    test("hit", function () {
        assert.deepEqual(["ok", "ok"], Parser.run(Parser.count(2, parser), "okokok"));
        assert.deepEqual(["ok"], Parser.run(Parser.count(1, parser), "okokok"));
    });
    test("miss", function () {
        assert.throws(() => Parser.run(Parser.count(2, parser), "okno"), /Parse failure at 1:3: "ok" not found/);
    });
});

suite("end", function () {
    var parser = Parser.sequence([
        Parser.str("this is the end"),
        Parser.end
    ]);
    test("hit", function () {
        assert.deepEqual(["this is the end", null], Parser.run(parser, "this is the end"));
    });
    test("miss", function () {
        assert.throws(() => Parser.run(parser, "this is the end, except it's not"), /Parse failure at 1:16: Not at end of string/);
    });
});

suite("peek", function () {
    var parser = Parser.sequence([
        Parser.str("foo"),
        Parser.peek(Parser.str("bar")),
        Parser.str("barbaz")
    ]);
    test("hit", function () {
        assert.deepEqual(["foo", "bar", "barbaz"], Parser.run(parser, "foobarbaz"));
    });
    test("miss", function () {
        assert.throws(() => Parser.run(parser, "foobazbaz"), /Parse failure at 1:4: "bar" not found/);
        assert.throws(() => Parser.run(parser, "foobarbut"), /Parse failure at 1:4: "barbaz" not found/);
    });
});

suite("sepBy", function () {
    var words = Parser.sepBy(
        Parser.regex(/\s+/),
        Parser.regex(/[a-z]+/)
    );

    test("hit", function () {
        assert.deepEqual(["why", "hello", "there"], Parser.run(words, "why hello\nthere"));
        assert.deepEqual(["why", "hello"], Parser.run(words, "why\thello"));
        assert.deepEqual(["why"], Parser.run(words, "why"));
        assert.deepEqual([], Parser.run(words, "123"));
    });
    
    test("miss", function () {
        assert.throws(() => Parser.run(words, "why hello 123"), /Parse failure at 1:11: regex \/\[a-z\]\+\/ doesn't match/);
    });
});

suite("sepBy1", function () {
    var words = Parser.sepBy1(
        Parser.regex(/\s+/),
        Parser.regex(/[a-z]+/)
    );

    test("hit", function () {
        assert.deepEqual(["why", "hello", "there"], Parser.run(words, "why hello\nthere"));
        assert.deepEqual(["why", "hello"], Parser.run(words, "why\thello"));
        assert.deepEqual(["why"], Parser.run(words, "why"));
    });
    
    test("miss", function () {
        assert.throws(() => Parser.run(words, "123"), /Parse failure at 1:1: regex \/\[a-z\]\+\/ doesn't match/);
    });
});

suite("fromGenerator", function () {
    var parseDivisionExpression = Parser.fromGenerator<number|string,number>(function *() {
        var numerator = parseFloat(yield Parser.regex(/[0-9]+\.[0-9]+/));
        yield Parser.regex(/\s*/);
        yield Parser.str("/");
        yield Parser.regex(/\s*/);
        var denominator = parseFloat(yield Parser.regex(/[0-9]+\.[0-9]+/));
        return numerator / denominator;
    });

    test("can be used to parse a complex expression", function () {
        assert.equal(3.0 / 5.0, Parser.run(parseDivisionExpression, "3.0 / 5.0"));
        assert.equal(42.0 / 21.0, Parser.run(parseDivisionExpression, "42.0/21.0"));
        assert.equal(3.0 / 5.0, Parser.run(parseDivisionExpression, "3.0     /       5.0"));
    });
});

suite("Documentation", function () {
    test("email name string", function () {
        const emailParser = Parser.between(Parser.str("<"), Parser.str(">"));

        const urlParser = Parser.between(Parser.str("("), Parser.str(")"));

        const infoParser = Parser.fromGenerator(function *() {
            const name = yield Parser.until(Parser.choice([
                Parser.str("<"),
                Parser.str("("),
                Parser.end
            ]));

            const email = yield Parser.maybe(emailParser);

            yield Parser.regex(/\s*/);

            const url = yield Parser.maybe(urlParser);

            yield Parser.end;

            return {
                name: name.trim(),
                email: email,
                url: url
            };                                                                                                                                    
        });

        assert.deepEqual({
            name: "Abba Cadabra",
            email: "abba@cadabra.com",
            url: "http://magic.website",
        }, Parser.run(infoParser, "Abba Cadabra <abba@cadabra.com> (http://magic.website)"));

        assert.deepEqual({
            name: "Béla Bartók",
            email: null,
            url: "https://www.britannica.com/biography/Bela-Bartok",
        }, Parser.run(infoParser, "Béla Bartók (https://www.britannica.com/biography/Bela-Bartok)"));

        assert.deepEqual({
            name: "马云",
            email: "jack@1688.com",
            url: null,
        }, Parser.run(infoParser, "马云 <jack@1688.com>"));

        assert.deepEqual({
            name: "Parsinator",
            email: null,
            url: null
        }, Parser.run(infoParser, "Parsinator"));
    });
});