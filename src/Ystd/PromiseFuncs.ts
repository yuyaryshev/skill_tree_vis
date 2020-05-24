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


export interface ReversePromise {
    cpl?: string;
    c: number;
    e?: Error;
    resolveItem: () => void;
    rejectItem: (e: Error) => void;
    promise: Promise<void>;
    resolvePromise: () => void;
    rejectPromise: (e: Error) => void;
}

export interface MakePromiseVoid {
    promise: Promise<void>;
    resolve: () => void;
    reject: (e: Error) => void;
}

export const makePromiseVoid = () => {
    const pthis: MakePromiseVoid = {
        promise: undefined as any,
        resolve: undefined as any,
        reject: undefined as any,
    };
    pthis.promise = new Promise((resolve, reject) => {
        pthis.resolve = resolve;
        pthis.reject = reject;
    });
    return pthis;
};

export const reversePromise = (c: number, cpl?: string) => {
    const pthis: ReversePromise = {
        c,
        promise: undefined as any,
        resolvePromise: undefined as any,
        rejectPromise: undefined as any,
        resolveItem: function resolveItem() {
            pthis.c--;
            if (pthis.c <= 0) {
                if (pthis.e) pthis.rejectPromise(pthis.e);
                else pthis.resolvePromise();
            }
        },
        rejectItem: function rejectItem(e: Error) {
            pthis.c--;
            if (!pthis.e) pthis.e = e;
            if (pthis.c <= 0) {
                if (pthis.e) pthis.rejectPromise(pthis.e);
                else pthis.resolvePromise();
            }
        },
    };

    pthis.promise = new Promise<void>((resolve, reject) => {
        pthis.resolvePromise = resolve;
        pthis.rejectPromise = reject;
    });

    if (c <= 0) pthis.resolvePromise();

    return pthis;
};

export const reversePromiseResolveItem = (reversePromise: ReversePromise | undefined) => {
    if (reversePromise) reversePromise.resolveItem();
};

export const reversePromiseRejectItem = (reversePromise: ReversePromise | undefined, e: Error) => {
    if (reversePromise) reversePromise.rejectItem(e);
    else throw e;
};
