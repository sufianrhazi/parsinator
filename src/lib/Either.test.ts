import { Either, left, isLeft, right, isRight, fromRight } from "./Either";
import { assert } from 'chai';

test("left is left", function () {
    assert.isTrue(isLeft(left("Error message")));
});

test("left is not right", function () {
    assert.isTrue(!isRight(left("Error message")));
});

test("right is right", function () {
    assert.isTrue(isRight(right(null)));
});

test("right is not left", function () {
    assert.isTrue(!isLeft(right(null)));
});

test("left holds error messages", function () {
    var l = left("Error message");
    assert.strictEqual("Error message", l.value);
});

test("right holds values", function () {
    var val = {};
    var r = right(val);
    assert.strictEqual(val, r.value);
});

test("fromRight produces value", function () {
    var val = {};
    var r = right(val);
    assert.strictEqual(val, fromRight(r));
});

test("fromRight throws with left", function () {
    var thrown = false;
    try {
        fromRight(left("nope"));
    } catch (e) {
        thrown = true;
    }
    assert.isTrue(thrown);
});