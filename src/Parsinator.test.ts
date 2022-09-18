import * as Parsinator from "./Parsinator";
import { assert } from "chai";

suite("str", function () {
  var parser = Parsinator.str("Hello");
  test("hit", function () {
    assert.strictEqual("Hello", Parsinator.run(parser, "Hello"));
  });

  test("miss", function () {
    assert.throws(
      () => Parsinator.run(parser, "Goodbye"),
      /Parse failure at 1:1: "Hello" not found/
    );
  });
});

suite("regex", function () {
  var parser = Parsinator.regex(/Hello, .*!/);
  test("hit", function () {
    assert.strictEqual(
      "Hello, world!",
      Parsinator.run(parser, "Hello, world!")
    );
    assert.strictEqual(
      "Hello, there!",
      Parsinator.run(parser, "Hello, there!")
    );
  });

  test("miss", function () {
    assert.throws(
      () => Parsinator.run(parser, "Oh! Hello, human!"),
      /Parse failure at 1:1: regex \/Hello, \.\*!\/ doesn't match/
    );
    assert.throws(
      () => Parsinator.run(parser, "Goodbye, world!"),
      /Parse failure at 1:1: regex \/Hello, \.\*!\/ doesn't match/
    );
  });
});

suite("regexMatch", function () {
  var parser = Parsinator.regexMatch(/Hello, (.*)! ([0-9]+)/);
  test("hit", function () {
    assert.deepEqual(
      ["Hello, world! 123", "world", "123"],
      Parsinator.runToEnd(parser, "Hello, world! 123")
    );
    assert.deepEqual(
      [["Hello, world! 123", "world", "123"], "end"],
      Parsinator.runToEnd(
        Parsinator.sequence<string | string[]>([parser, Parsinator.str("end")]),
        "Hello, world! 123end"
      )
    );
  });

  test("miss", function () {
    assert.throws(
      () => Parsinator.run(parser, "Oh! Hello, human!"),
      /Parse failure at 1:1: regex \/Hello, \(\.\*\)! \(\[0-9\]\+\)\/ doesn't match/
    );
    assert.throws(
      () => Parsinator.run(parser, "Goodbye, world!"),
      /Parse failure at 1:1: regex \/Hello, \(\.\*\)! \(\[0-9\]\+\)\/ doesn't match/
    );
  });
});

suite("fromGenerator", function () {
  var parseDivisionExpression = Parsinator.fromGenerator(function* () {
    const numStr = yield* Parsinator.regex(/[0-9]+\.[0-9]+/);
    var numerator = parseFloat(numStr);
    yield* Parsinator.regex(/\s*/);
    yield* Parsinator.str("/");
    yield* Parsinator.regex(/\s*/);
    const denomStr = yield* Parsinator.regex(/[0-9]+\.[0-9]+/);
    var denominator = parseFloat(denomStr);
    return numerator / denominator;
  });

  test("can be used to parse a complex expression", function () {
    assert.equal(
      3.0 / 5.0,
      Parsinator.run(parseDivisionExpression, "3.0 / 5.0")
    );
    assert.equal(
      42.0 / 21.0,
      Parsinator.run(parseDivisionExpression, "42.0/21.0")
    );
    assert.equal(
      3.0 / 5.0,
      Parsinator.run(parseDivisionExpression, "3.0     /       5.0")
    );
  });
});

suite("maybe", function () {
  var parser = Parsinator.maybe(Parsinator.str("Hit"));
  test("hit", function () {
    assert.strictEqual("Hit", Parsinator.run(parser, "Hit"));
  });

  test("miss", function () {
    assert.isNull(Parsinator.run(parser, "Not a hit"));
  });
});

suite("many", function () {
  var parser = Parsinator.many(Parsinator.str("hi"));

  test("hit", function () {
    assert.sameMembers(
      ["hi", "hi", "hi", "hi"],
      Parsinator.run(parser, "hihihihi")
    );
  });

  test("miss succeeds with empty match", function () {
    assert.sameMembers([], Parsinator.run(parser, "nope"));
  });
});

suite("many1", function () {
  var parser = Parsinator.many1(Parsinator.str("hi"));

  test("hit", function () {
    assert.sameMembers(
      ["hi", "hi", "hi", "hi"],
      Parsinator.run(parser, "hihihihi")
    );
  });

  test("miss fails", function () {
    assert.throws(
      () => Parsinator.run(parser, "nope"),
      /Parse failure at 1:1: "hi" not found/
    );
  });
});

suite("choice", function () {
  var choice = Parsinator.choice([
    Parsinator.str("foo"),
    Parsinator.str("bar"),
  ]);

  test("hit", function () {
    assert.strictEqual("foo", Parsinator.run(choice, "foo"));
    assert.strictEqual("bar", Parsinator.run(choice, "bar"));
  });

  test("miss", function () {
    assert.throws(() => Parsinator.run(choice, "baz"), /"foo" not found/);
    assert.throws(() => Parsinator.run(choice, "baz"), /"bar" not found/);
  });
});

suite("sequence", function () {
  var parser = Parsinator.sequence<any | string | string[]>([
    Parsinator.str("foo"),
    Parsinator.many(Parsinator.str("bar")),
    Parsinator.str("baz"),
  ]);

  test("hit", function () {
    assert.deepEqual(["foo", [], "baz"], Parsinator.run(parser, "foobaz"));
    assert.deepEqual(
      ["foo", ["bar"], "baz"],
      Parsinator.run(parser, "foobarbaz")
    );
    assert.deepEqual(
      ["foo", ["bar", "bar", "bar"], "baz"],
      Parsinator.run(parser, "foobarbarbarbaz")
    );
  });

  test("miss", function () {
    assert.throws(
      () => Parsinator.run(parser, "foobarbar"),
      /Parse failure at 1:10: "baz" not found/
    );
    assert.throws(
      () =>
        Parsinator.run(
          Parsinator.sequence<string | string[]>([
            Parsinator.str("\n"),
            Parsinator.str("foo"),
            Parsinator.many(Parsinator.str("bar")),
            Parsinator.str("baz"),
          ]),
          "\nfoobarbar"
        ),
      /Parse failure at 2:10: "baz" not found/
    );
  });

  test("miss contains line and col info", function () {
    try {
      Parsinator.run(
        Parsinator.sequence<string | (string | string[])[]>([
          Parsinator.str("\n\n"),
          parser,
        ]),
        "\n\nfoobarbar"
      );
    } catch (e) {
      assert.equal(3, e.line);
      assert.equal(10, e.col);
      assert.equal(11, e.offset);
    }
  });

  test("miss pointer is aligned with col", function () {
    assert.throws(
      () =>
        Parsinator.run(
          Parsinator.sequence<string>([
            Parsinator.str("\n"),
            Parsinator.str("foo"),
            Parsinator.str("bar"),
            Parsinator.str("baz"),
          ]),
          "\nfoobar"
        ),
      `Parse failure at 2:7: "baz" not found
-> «·foobar»
           ^`
    );
    assert.throws(
      () =>
        Parsinator.run(
          Parsinator.sequence<string>([
            Parsinator.str("\n"),
            Parsinator.str("foo"),
            Parsinator.str("\n"),
            Parsinator.str("bar"),
            Parsinator.str("\n"),
            Parsinator.str("baz"),
          ]),
          "\nfoo\nbar\nbar"
        ),
      `Parse failure at 4:1: "baz" not found
-> «·foo·bar·bar»
             ^`
    );
  });
});

suite("count", function () {
  var parser = Parsinator.str("ok");
  test("hit", function () {
    assert.deepEqual(
      ["ok", "ok"],
      Parsinator.run(Parsinator.count(2, parser), "okokok")
    );
    assert.deepEqual(
      ["ok"],
      Parsinator.run(Parsinator.count(1, parser), "okokok")
    );
  });
  test("miss", function () {
    assert.throws(
      () => Parsinator.run(Parsinator.count(2, parser), "okno"),
      /Parse failure at 1:3: "ok" not found/
    );
  });
});

suite("end", function () {
  var parser = Parsinator.sequence([
    Parsinator.str("this is the end"),
    Parsinator.end,
  ]);
  test("hit", function () {
    assert.deepEqual(
      ["this is the end", null],
      Parsinator.run(parser, "this is the end")
    );
  });
  test("miss", function () {
    assert.throws(
      () => Parsinator.run(parser, "this is the end, except it's not"),
      /Parse failure at 1:16: Not at end of string/
    );
  });
});

suite("peek", function () {
  var parser = Parsinator.sequence([
    Parsinator.str("foo"),
    Parsinator.peek(Parsinator.str("bar")),
    Parsinator.str("barbaz"),
  ]);
  test("hit", function () {
    assert.deepEqual(
      ["foo", "bar", "barbaz"],
      Parsinator.run(parser, "foobarbaz")
    );
  });
  test("miss", function () {
    assert.throws(
      () => Parsinator.run(parser, "foobazbaz"),
      /Parse failure at 1:4: "bar" not found/
    );
    assert.throws(
      () => Parsinator.run(parser, "foobarbut"),
      /Parse failure at 1:4: "barbaz" not found/
    );
  });
});

suite("sepBy", function () {
  var words = Parsinator.sepBy(
    Parsinator.regex(/\s+/),
    Parsinator.regex(/[a-z]+/)
  );

  test("hit", function () {
    assert.deepEqual(
      ["why", "hello", "there"],
      Parsinator.run(words, "why hello\nthere")
    );
    assert.deepEqual(["why", "hello"], Parsinator.run(words, "why\thello"));
    assert.deepEqual(["why"], Parsinator.run(words, "why"));
    assert.deepEqual([], Parsinator.run(words, "123"));
  });

  test("miss", function () {
    assert.throws(
      () => Parsinator.run(words, "why hello 123"),
      /Parse failure at 1:11: regex \/\[a-z\]\+\/ doesn't match/
    );
  });
});

suite("sepBy1", function () {
  var words = Parsinator.sepBy1(
    Parsinator.regex(/\s+/),
    Parsinator.regex(/[a-z]+/)
  );

  test("hit", function () {
    assert.deepEqual(
      ["why", "hello", "there"],
      Parsinator.run(words, "why hello\nthere")
    );
    assert.deepEqual(["why", "hello"], Parsinator.run(words, "why\thello"));
    assert.deepEqual(["why"], Parsinator.run(words, "why"));
  });

  test("miss", function () {
    assert.throws(
      () => Parsinator.run(words, "123"),
      /Parse failure at 1:1: regex \/\[a-z\]\+\/ doesn't match/
    );
  });
});

suite("map", function () {
  test("basic wrapping", function () {
    var parser = Parsinator.str("hello");
    var excited = Parsinator.map(parser, (str) => str + "!");
    assert.equal("hello!", Parsinator.run(excited, "hello"));
  });
});

suite("failure customization", function () {
  test("force failure", function () {
    var parser = Parsinator.sequence([
      Parsinator.str("Almost"),
      Parsinator.fail("Something descriptive"),
    ]);
    assert.throws(
      () => Parsinator.run(parser, "Almost There"),
      "Parse failure at 1:7: Something descriptive"
    );
  });

  test("wrap failure message", function () {
    var parser = Parsinator.sequence([
      Parsinator.str("A number: "),
      Parsinator.wrapFail(
        Parsinator.regex(/[0-9]/),
        (msg: string) => "Number expected; " + msg
      ),
    ]);
    assert.throws(
      () => Parsinator.run(parser, "A number: hi"),
      "Parse failure at 1:11: Number expected; regex /[0-9]/ doesn't match"
    );
  });
});

suite("surround", function () {
  var whitespace = Parsinator.regex(new RegExp("\\s*"));
  var token = (parser: Parsinator.Parser<any>) =>
    Parsinator.surround(whitespace, parser, whitespace);
  var comma = token(Parsinator.str(","));
  var chars = Parsinator.regex(/[a-zA-Z]+/);
  var listOfWords = Parsinator.surround(
    token(Parsinator.str("(")),
    Parsinator.sepBy(comma, chars),
    token(Parsinator.str(")"))
  );

  test("can be used in combination with sepBy to parse a list of words", function () {
    assert.deepEqual([], Parsinator.run(listOfWords, "()"));
    assert.deepEqual(["foo"], Parsinator.run(listOfWords, "(foo)"));
    assert.deepEqual(
      ["foo", "bar", "baz", "bum", "but"],
      Parsinator.run(listOfWords, "   (foo, bar    ,   baz,bum,but    )   ")
    );
  });

  test("handles failures", function () {
    assert.throws(
      () => Parsinator.run(listOfWords, ""),
      'Parse failure at 1:1: "(" not found'
    );
    assert.throws(
      () => Parsinator.run(listOfWords, "("),
      'Parse failure at 1:2: ")" not found'
    );
    assert.throws(
      () => Parsinator.run(listOfWords, " ( foo , bar,baz  "),
      'Parse failure at 1:19: ")" not found'
    );
  });
});

suite(
  "buildExpressionParser can build a simple arithmetic parser",
  function () {
    var whitespace = Parsinator.regex(/\s*/);
    var token = <T>(parser: Parsinator.Parser<T>): Parsinator.Parser<T> =>
      Parsinator.surround(whitespace, parser, whitespace);
    var operator = <T>(op: string, opFunc: T) =>
      Parsinator.fromGenerator(function* () {
        yield* token(Parsinator.str(op));
        return opFunc;
      });

    var number = Parsinator.map(Parsinator.regex(/[0-9]+/), (str) =>
      parseInt(str)
    );
    var negate: Parsinator.Parser<Parsinator.OperatorActionUnary<number>> =
      operator("-", (val: number) => -val);
    var factorial: Parsinator.Parser<Parsinator.OperatorActionUnary<number>> =
      operator("!", (val: number) => {
        if (val < 0) {
          throw new Error("Cannot evaluate negative factorial");
        }
        var result = 1;
        for (; val > 0; --val) {
          result *= val;
        }
        return result;
      });
    var sum: Parsinator.Parser<Parsinator.OperatorActionBinary<number>> =
      operator("+", (left: number, right: number) => left + right);
    var subtract: Parsinator.Parser<Parsinator.OperatorActionBinary<number>> =
      operator("-", (left: number, right: number) => left - right);
    var multiply: Parsinator.Parser<Parsinator.OperatorActionBinary<number>> =
      operator("*", (left: number, right: number) => left * right);
    var divide: Parsinator.Parser<Parsinator.OperatorActionBinary<number>> =
      operator("/", (left: number, right: number) => left / right);
    var exponent: Parsinator.Parser<Parsinator.OperatorActionBinary<number>> =
      operator("^", (left: number, right: number) => Math.pow(left, right));

    var evaluate: Parsinator.Parser<number> =
      Parsinator.buildExpressionParser<number>(
        [
          { fixity: "prefix", parser: negate },
          { fixity: "postfix", parser: factorial },
          { fixity: "infix", associativity: "right", parser: exponent },
          { fixity: "infix", associativity: "left", parser: multiply },
          { fixity: "infix", associativity: "left", parser: divide },
          { fixity: "infix", associativity: "left", parser: sum },
          { fixity: "infix", associativity: "left", parser: subtract },
        ],
        () =>
          Parsinator.choice([
            Parsinator.surround(
              token(Parsinator.str("(")),
              evaluate,
              token(Parsinator.str(")"))
            ),
            number,
          ])
      );

    test("can build a simple arithmetic parser", function () {
      assert.equal(3, Parsinator.runToEnd(evaluate, "3"));
      assert.equal(3, Parsinator.runToEnd(evaluate, "1 + 2"));
      assert.equal(-1, Parsinator.runToEnd(evaluate, "1 - 2"));
      assert.equal(2, Parsinator.runToEnd(evaluate, "1 * 2"));
      assert.equal(1 / 2, Parsinator.runToEnd(evaluate, "1 / 2"));
      assert.equal(9, Parsinator.runToEnd(evaluate, "3 ^ 2"));
      assert.equal(-5, Parsinator.runToEnd(evaluate, "-3 + -2"));
      assert.equal(5, Parsinator.runToEnd(evaluate, "--5"));
      assert.equal(24, Parsinator.runToEnd(evaluate, "4!"));
      assert.equal(720, Parsinator.runToEnd(evaluate, "3!!"));
      assert.equal(30, Parsinator.runToEnd(evaluate, "4! + 3!"));
    });

    test("order of operations", function () {
      assert.equal(8, Parsinator.runToEnd(evaluate, "1 + 2 * 3 + 1"));
      assert.equal(12, Parsinator.runToEnd(evaluate, "(1 + 2) * (3 + 1)"));
    });

    test("right associtivity", function () {
      assert.equal(7625597484987, Parsinator.runToEnd(evaluate, "3 ^ 3 ^ 3"));
      assert.equal(19683, Parsinator.runToEnd(evaluate, "(3 ^ 3) ^ 3"));
      assert.equal(7625597484987, Parsinator.runToEnd(evaluate, "3 ^ (3 ^ 3)"));
    });

    test("left associvity", function () {
      assert.equal(1, Parsinator.runToEnd(evaluate, "8 / 4 / 2"));
      assert.equal(1, Parsinator.runToEnd(evaluate, "(8 / 4) / 2"));
      assert.equal(4, Parsinator.runToEnd(evaluate, "8 / (4 / 2)"));
    });

    test("complex operation", function () {
      assert.equal(
        120,
        Parsinator.runToEnd(evaluate, "(1 ^ 100 + 2 * 3 / 2 - -1)!")
      );
    });

    test("failure modes", function () {
      assert.throws(
        () => Parsinator.runToEnd(evaluate, "("),
        'Parse failure at 1:2: "(" not found'
      );
      assert.throws(
        () => Parsinator.runToEnd(evaluate, "(3"),
        'Parse failure at 1:3: ")" not found'
      );
      assert.throws(
        () => Parsinator.runToEnd(evaluate, "5 + "),
        "Parse failure at 1:5: regex /[0-9]+/ doesn't match"
      );
    });
  }
);

suite("Documentation", function () {
  test("homepage email string", function () {
    const emailParser = Parsinator.between(
      Parsinator.str("<"),
      Parsinator.str(">")
    );

    const urlParser = Parsinator.between(
      Parsinator.str("("),
      Parsinator.str(")")
    );

    const infoParser = Parsinator.fromGenerator(function* () {
      const name = yield* Parsinator.until(
        Parsinator.choice([
          Parsinator.str("<"),
          Parsinator.str("("),
          Parsinator.end,
        ])
      );

      const email = yield* Parsinator.maybe(emailParser);

      yield* Parsinator.regex(new RegExp("\\s*"));

      const url = yield* Parsinator.maybe(urlParser);

      yield* Parsinator.end;

      return {
        name: name.trim(),
        email: email,
        url: url,
      };
    });

    assert.deepEqual(
      {
        name: "Abba Cadabra",
        email: "abba@cadabra.com",
        url: "http://magic.website",
      },
      Parsinator.run(
        infoParser,
        "Abba Cadabra <abba@cadabra.com> (http://magic.website)"
      )
    );

    assert.deepEqual(
      {
        name: "Béla Bartók",
        email: null,
        url: "https://www.britannica.com/biography/Bela-Bartok",
      },
      Parsinator.run(
        infoParser,
        "Béla Bartók (https://www.britannica.com/biography/Bela-Bartok)"
      )
    );

    assert.deepEqual(
      {
        name: "马云",
        email: "jack@1688.com",
        url: null,
      },
      Parsinator.run(infoParser, "马云 <jack@1688.com>")
    );

    assert.deepEqual(
      {
        name: "Parsinator",
        email: null,
        url: null,
      },
      Parsinator.run(infoParser, "Parsinator")
    );
  });

  test("readme es2015", function () {
    var parseNaturalNumber: Parsinator.Parser<number> = Parsinator.map<
      string,
      number
    >(Parsinator.regex(/[1-9][0-9]*|0/), (str: string): number =>
      parseInt(str, 10)
    );

    var parseSum: Parsinator.Parser<number> = Parsinator.fromGenerator(
      function* () {
        var left = yield* parseNaturalNumber;
        yield* Parsinator.str("+");
        var right = yield* parseNaturalNumber;
        return left + right;
      }
    );

    assert.strictEqual(579, Parsinator.run(parseSum, "123+456"));
    assert.throws(
      () => Parsinator.run(parseSum, "23.5+92"),
      'Parse failure at 1:3: "+" not found'
    );
  });

  test("readme es5", function () {
    var parseNaturalNumber = Parsinator.map(
      Parsinator.regex(/[1-9][0-9]*|0/),
      function (str) {
        return parseInt(str, 10);
      }
    );

    var parseSum = Parsinator.map(
      Parsinator.sequence<number | string>([
        parseNaturalNumber,
        Parsinator.str("+"),
        parseNaturalNumber,
      ]),
      function (items) {
        return (items[0] as number) + (items[2] as number);
      }
    );

    assert.strictEqual(579, Parsinator.run(parseSum, "123+456"));
    assert.throws(
      () => Parsinator.run(parseSum, "23.5+92"),
      'Parse failure at 1:3: "+" not found'
    );
  });

  test("expression docstr", function () {
    var number = Parsinator.map(Parsinator.regex(/[0-9]+/), (str) =>
      parseInt(str, 10)
    );

    var operator = (opstr: string, action: any) =>
      Parsinator.map(Parsinator.str(opstr), () => action);

    var negate = operator("-", (val: number) => -val);
    var sum = operator("+", (x: number, y: number) => x + y);
    var multiply = operator("*", (x: number, y: number) => x * y);
    var exponent = operator("^", (x: number, y: number) => Math.pow(x, y));

    var evaluate: Parsinator.Parser<number> = Parsinator.buildExpressionParser(
      [
        { fixity: "prefix", parser: negate },
        { fixity: "infix", associativity: "right", parser: exponent },
        { fixity: "infix", associativity: "left", parser: multiply },
        { fixity: "infix", associativity: "left", parser: sum },
      ],
      () =>
        Parsinator.choice([
          Parsinator.surround(
            Parsinator.str("("),
            evaluate,
            Parsinator.str(")")
          ),
          number,
        ])
    );

    assert.equal(8, Parsinator.runToEnd(evaluate, "1+2*3+1")); // evaluates to 8
    assert.equal(-12, Parsinator.runToEnd(evaluate, "(1+2)*-(3+1)"));
    assert.equal(7625597484987, Parsinator.runToEnd(evaluate, "3^3^3"));
  });

  test("paren matcher", function () {
    const parenMatcher = Parsinator.fromGenerator(function* () {
      const maybeOpen = Parsinator.maybe(Parsinator.str("("));
      let parenCount = 0;
      let match = yield* maybeOpen;
      while (match !== null) {
        parenCount += 1;
        match = yield* maybeOpen;
      }
      const name = yield* Parsinator.regex(/[a-zA-Z]+/);
      for (let i = 0; i < parenCount; ++i) {
        yield* Parsinator.str(")");
      }
      return name;
    });

    assert.equal("three", Parsinator.run(parenMatcher, "(((three)))"));
    assert.equal("one", Parsinator.run(parenMatcher, "(one)"));
    assert.throws(
      () => Parsinator.run(parenMatcher, "((two)"),
      /Parse failure at 1:7: "\)" not found/
    );
  });
});

suite("JSON example", function () {
  type JsonNumber = { type: "number"; raw: string; value: number };
  type JsonString = { type: "string"; value: string };
  type JsonObject = {
    type: "object";
    items: { key: string; value: JsonValue }[];
  };
  type JsonArray = { type: "array"; items: JsonValue[] };
  type JsonBoolean = { type: "boolean"; value: boolean };
  type JsonNull = { type: "null" };
  type JsonValue =
    | JsonNumber
    | JsonString
    | JsonObject
    | JsonArray
    | JsonBoolean
    | JsonNull;

  const whitespace = Parsinator.regex(/[ \n\r\t]*/);

  const digit = Parsinator.regex(/[0-9]/);
  const hexDigit = Parsinator.regex(/[0-9a-fA-F]/);
  const digits = Parsinator.map(Parsinator.many(digit), (digitsArray) =>
    digitsArray.join("")
  );
  const digit19 = Parsinator.regex(/[1-9]/);

  const fraction = Parsinator.fromGenerator(function* fraction() {
    yield* Parsinator.str(".");
    return yield* digits;
  });

  const exponent = Parsinator.fromGenerator(function* exponent() {
    const ex = yield* Parsinator.regex(/[eE]/);
    const sign = yield* Parsinator.regex(/[+-]?/);
    const num = yield* digits;
    return ex + sign + num;
  });

  const jsonNumber = Parsinator.wrapFail(
    Parsinator.fromGenerator<JsonNumber>(function* jsonNumber() {
      const sign = yield* Parsinator.maybe(Parsinator.str("-"));
      const num = yield* Parsinator.choice([
        Parsinator.str("0"),
        Parsinator.map(
          Parsinator.sequence([digit19, digits]),
          ([d19, ds]) => d19 + ds
        ),
      ]);
      const frac = yield* Parsinator.maybe(fraction);
      const exp = yield* Parsinator.maybe(exponent);
      let numStr = "";
      if (sign) numStr += sign;
      numStr += num;
      if (frac) numStr += "." + frac;
      if (exp) numStr += exp;
      return {
        type: "number" as const,
        raw: numStr,
        value: parseFloat(numStr),
      };
    }),
    () => "expected number"
  );

  const stringChr = Parsinator.fromGenerator(function* stringChr() {
    const chr = yield* Parsinator.peek(Parsinator.regex(/./));
    if (chr === '"') {
      yield* Parsinator.fail("Unexpected end of string");
    }
    if (chr === "\\") {
      yield* Parsinator.str("\\"); // consume backspace
      const escape = yield* Parsinator.regex(/["\\/bfnrtu]/);
      switch (escape) {
        case '"':
        case "\\":
        case "/":
          return escape;
        case "b":
          return "\b";
        case "f":
          return "\f";
        case "n":
          return "\n";
        case "r":
          return "\r";
        case "t":
          return "\t";
      }
      // If we got here, escape === 'u'
      const unicodeHexChars = yield* Parsinator.count(4, hexDigit);
      const unicodeHexCode = parseInt(unicodeHexChars.join(""), 16);
      const code = String.fromCharCode(unicodeHexCode);
      return code;
    }
    return yield* Parsinator.regex(/./);
  });

  const jsonString = Parsinator.wrapFail(
    Parsinator.fromGenerator<JsonString>(function* jsonString() {
      const content = yield* Parsinator.surround(
        Parsinator.str('"'),
        Parsinator.map(Parsinator.many(stringChr), (chrs) => chrs.join("")),
        Parsinator.str('"')
      );
      return { type: "string" as const, value: content };
    }),
    () => "expected quoted string"
  );

  const jsonBoolean = Parsinator.wrapFail(
    Parsinator.fromGenerator<JsonBoolean>(function* jsonBoolean() {
      const which = yield* Parsinator.choice([
        Parsinator.str("true"),
        Parsinator.str("false"),
      ]);
      return {
        type: "boolean" as const,
        value: which === "true" ? true : false,
      };
    }),
    () => "expected boolean"
  );

  const jsonNull = Parsinator.wrapFail(
    Parsinator.fromGenerator<JsonNull>(function* jsonNull() {
      yield* Parsinator.str("null");
      return { type: "null" as const };
    }),
    () => 'expected "null"'
  );

  type ObjectPair = {
    key: string;
    value: JsonValue;
  };
  const objectPair = Parsinator.fromGenerator<ObjectPair>(
    function* objectPair() {
      yield* whitespace;
      const key = yield* jsonString;
      yield* whitespace;
      yield* Parsinator.str(":");
      const value = yield* jsonValue;
      return { key: key.value, value };
    }
  );

  const jsonObject: Parsinator.Parser<JsonObject> =
    Parsinator.fromGenerator<JsonObject>(function* jsonObject() {
      yield* Parsinator.str("{");
      let items = yield* Parsinator.choice<string | ObjectPair[]>([
        Parsinator.sepBy1(Parsinator.str(","), objectPair),
        whitespace,
      ]);
      yield* Parsinator.str("}");
      if (typeof items === "string") items = [];
      return { type: "object" as const, items };
    });

  const jsonArray: Parsinator.Parser<JsonArray> =
    Parsinator.fromGenerator<JsonArray>(function* jsonArray() {
      yield* Parsinator.str("[");
      let items = yield* Parsinator.choice<string | JsonValue[]>([
        Parsinator.sepBy1(Parsinator.str(","), jsonValue),
        whitespace,
      ]);
      yield* Parsinator.str("]");
      if (typeof items === "string") items = [];
      return { type: "array" as const, items: items };
    });

  const jsonValue = Parsinator.fromGenerator<JsonValue>(function* jsonValue() {
    const value = yield* Parsinator.surround(
      whitespace,
      Parsinator.choice<JsonValue>([
        jsonString,
        jsonNumber,
        jsonObject,
        jsonArray,
        jsonBoolean,
        jsonNull,
      ]),
      whitespace
    );
    return value;
  });

  test("string", function () {
    assert.deepEqual<JsonValue>(
      { type: "string", value: "foo" },
      Parsinator.runToEnd(jsonValue, '"foo"')
    );
    assert.deepEqual<JsonValue>(
      { type: "string", value: "" },
      Parsinator.runToEnd(jsonValue, '""')
    );
  });

  test("number", function () {
    assert.deepEqual<JsonValue>(
      { type: "number", raw: "123", value: 123 },
      Parsinator.runToEnd(jsonValue, "123")
    );
    assert.deepEqual<JsonValue>(
      { type: "number", raw: "-123", value: -123 },
      Parsinator.runToEnd(jsonValue, "-123")
    );
    assert.deepEqual<JsonValue>(
      { type: "number", raw: "0", value: 0 },
      Parsinator.runToEnd(jsonValue, "0")
    );
    assert.deepEqual<JsonValue>(
      { type: "number", raw: "0.5324e100", value: 0.5324e100 },
      Parsinator.runToEnd(jsonValue, "0.5324e100")
    );
  });

  test("object", function () {
    assert.deepEqual<JsonValue>(
      {
        type: "object",
        items: [{ key: "foo", value: { type: "string", value: "bar" } }],
      },
      Parsinator.runToEnd(jsonValue, '{ "foo" : "bar" }')
    );

    assert.deepEqual<JsonValue>(
      {
        type: "object",
        items: [],
      },
      Parsinator.runToEnd(jsonValue, "{ }")
    );
  });

  test("complex", function () {
    assert.deepEqual<JsonValue>(
      {
        type: "object",
        items: [
          {
            key: "foo",
            value: {
              type: "object",
              items: [
                { key: "bar", value: { type: "number", raw: "3", value: 3 } },
                {
                  key: "baz",
                  value: {
                    type: "array",
                    items: [
                      { type: "string", value: "bum" },
                      { type: "object", items: [] },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
      Parsinator.runToEnd(jsonValue, '{"foo": {"bar": 3, "baz": ["bum", {}]}}')
    );
  });
});
