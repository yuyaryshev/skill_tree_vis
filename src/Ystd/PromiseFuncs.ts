export type MaybePromise<T> = Promise<T> | T;
export type OptionalPromise<T> = Promise<T | undefined> | T | undefined;

export interface SavedPromise<T> {
    promise: Promise<T>;
    resolve: (v: T) => void;
    reject: (err: any) => void;
}

export function makePromise<T>(): SavedPromise<T> {
    let r: SavedPromise<T> = {} as any;
    r.promise = new Promise((resolve, reject) => {
        r.resolve = resolve;
        r.reject = reject;
    });
    return r;
}

export type SavedPromiseArray<T> = Array<SavedPromise<T>>;

export const maybePromiseApply = <S, R>(v: MaybePromise<S>, f: (v: S) => R): MaybePromise<R> => {
    return v instanceof Promise ? (async () => f(await v))() : f(v);
};
