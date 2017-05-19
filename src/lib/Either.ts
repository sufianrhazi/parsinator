class Left<T> {
    public readonly value: string;

    constructor(val: string) {
        this.value = val;
    }
}

class Right<T> {
    public readonly value: T;

    constructor(val: T) {
        this.value = val;
    }
}

export type Either<T> = Left<T> | Right<T>;

export function left<T>(val: string): Left<T> {
    return new Left(val);
}

export function isLeft<T>(either: Either<T>): either is Left<T> {
    return either instanceof Left;
}

export function right<T>(val: T): Right<T> {
    return new Right(val);
}

export function isRight<T>(either: Either<T>): either is Right<T> {
    return either instanceof Right;
}

export function fromRight<T>(either: Either<T>): T {
    if (either instanceof Left) {
        throw new Error(either.value);
    }
    return either.value;
}