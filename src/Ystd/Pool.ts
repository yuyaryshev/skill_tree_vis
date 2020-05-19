import { makePromise, SavedPromise, SavedPromiseArray } from "./";

export interface Poolable {
    pool?: AbstractPool<any>;
    close(forced?: boolean): Promise<void> | void;
}

export interface PoolSettings<T extends Poolable> {
    factory: Factory<T>;
    singleConnection?: boolean;
    maxClients?: number;
    minClients?: number;
    regularWorkRuns?: number;
}

export interface AbstractPool<T extends Poolable> {
    factory: Factory<T>;
    get(): Promise<T> | T;
    release(client: T): void;
    exec(callback: PoolCallback<T>): any;
    close(): void;
    call(funcName: string, ...args: any[]): Promise<any> | any;
}

export type PoolCallback<T extends Poolable> = (resource: T, pool?: AbstractPool<T>) => Promise<any> | any;

export interface Factory<T extends Poolable> {
    produce(): Promise<T> | T;
}

/**
 * Pool stores pool-objects (example - connection to database) allowing reuse of them. This allows to mitigate time needed for
 * pool-object initialization. Pool also limits number of concurrent pool-objects. Example: for database reducing connections number reduces
 * RAM usage and increases queries perfomance.
 */
export abstract class PoolBase<T extends Poolable> {
    factory: Factory<T>;
    closing?: SavedPromise<void>;

    constructor(settings: PoolSettings<T>) {
        this.factory = settings.factory;
    }

    abstract get(): Promise<T> | T;
    abstract release(t: T): void;

    async exec(callback: PoolCallback<T>): Promise<any> {
        let c = await this.get();
        let r;
        try {
            r = await callback(c);
            await this.release(c);
            return r;
        } catch (e) {
            await this.release(c);
            throw e;
        }
    }

    async call(funcName: string, ...args: any[]): Promise<any> {
        let c = await this.get();
        let r;
        try {
            r = await ((await c) as any)[funcName](...args);
            await this.release(c);
        } catch (e) {
            await this.release(c);
            throw e;
        }
        return r;
    }
}

/**
 * Pool stores pool-objects (example - connection to database) allowing reuse of them. This allows to mitigate time needed for
 * pool-object initialization. Pool also limits number of concurrent pool-objects. Example: for database reducing connections number reduces
 * RAM usage and increases queries perfomance.
 */
export class Pool<T extends Poolable> extends PoolBase<T> implements AbstractPool<T> {
    freeClients: T[];
    allClients: T[];
    waitingQueue: SavedPromiseArray<T>;
    maxCount: number;
    minCount: number;
    worksetCount: number;
    regularWorkDelay: number;
    regularWorkScheduled: boolean;
    regularWorkRuns: number;
    regularWorkRunsLeft: number;

    /**
     * Creates a new Pool<T>
     *
     * @param settings - PoolSettings
     */
    constructor(settings: PoolSettings<T>) {
        super(settings);
        this.freeClients = [];
        this.allClients = [];
        this.maxCount = settings.maxClients || 10;
        this.waitingQueue = [];
        this.minCount = settings.minClients || 1;
        this.worksetCount = 0;
        this.regularWorkDelay = 200;
        this.regularWorkRuns = settings.regularWorkRuns || 5;
        this.regularWorkScheduled = false;
        this.regularWorkRunsLeft = 0;
        this.scheduleRegularWork();
    }

    get freeCount() {
        return this.freeClients.length;
    }
    get totalCount() {
        return this.allClients.length;
    }
    get busyCount() {
        return this.allClients.length - this.freeClients.length;
    }

    scheduleRegularWork() {
        this.regularWorkRunsLeft = this.regularWorkRuns;
        if (!this.regularWorkScheduled) {
            setTimeout(() => {
                this._regularWork();
            }, this.regularWorkDelay);
        }
    }

    /**
     * Private. Should not be used directly.
     * Calculates workset and adjusts current pool-object count accordingly, runs periodically on setTimeout.
     * @private
     */
    async _regularWork() {
        if (this.closing) return;

        if (this.busyCount < this.worksetCount) this.worksetCount--;
        else this.worksetCount = this.busyCount;

        while (this.totalCount < this.maxCount && (this.totalCount < this.minCount || this.freeCount < 1)) {
            // TODO_STABILITY если вдруг factory делает throw, то он не перехватывается тут никак!
            let c = await this.factory.produce();
            c.pool = this;
            this.freeClients.push(c);
            this.allClients.push(c);
        }

        while (this.totalCount > this.minCount && this.totalCount > this.worksetCount + 1 && this.freeCount > 1) {
            let c = this.freeClients.pop();
            if (c) {
                await c.close();
            } else break; // Should be unreachable
        }

        if (this.busyCount > 0) this.regularWorkRunsLeft = this.regularWorkRuns;

        if (--this.regularWorkRunsLeft > 0)
            setTimeout(() => {
                this._regularWork();
            }, this.regularWorkDelay);
        else this.regularWorkScheduled = false;
    }

    /**
     * Obtains a pool-object from pool. If no free DbClients available a new one will be created.
     * If connectionLimit is reached - will wait for a free pool-object.
     *
     * UNSAFE! Better use exec(callback)
     *
     * @returns {Promise<T> | T}
     */
    get(): Promise<T> | T {
        this.scheduleRegularWork();
        let c = this.freeClients.pop();
        if (c) return c;

        if (this.allClients.length < this.maxCount) {
            return (async (): Promise<T> => {
                // TODO_STABILITY если вдруг factory делает throw, то он не перехватывается тут никак!
                c = await this.factory.produce();
                c.pool = this;
                this.allClients.push(c);
                return c;
            })();
        }

        let p = makePromise<T>();
        this.waitingQueue.push(p);
        return p.promise;
    }

    release(client: T): void {
        if ((client as any).pool !== this) throw new Error(`Client doesn't belong to this pool`);

        this.scheduleRegularWork();
        if (this.closing) {
            client.close();
            if (!this.allClients.length) this.closing.resolve(undefined);
            for (let item of this.waitingQueue) item.reject(new Error(`Pool have been closed.`));
            this.waitingQueue = [];
            return;
        }
        let r = this.waitingQueue.pop();

        if (r) r.resolve(client);
        else this.freeClients.push(client);
    }

    /**
     * Closes all corresponding pool-objects and the pool
     */
    close(forced: boolean = false): Promise<void> | void {
        this.scheduleRegularWork();
        if (!this.closing) this.closing = makePromise<void>();

        this.maxCount = 0;
        this.minCount = 0;
        this.worksetCount = 0;

        for (let c of this.freeClients) {
            c.close();
            this.freeClients.splice(this.freeClients.indexOf(c), 1);
            this.allClients.splice(this.allClients.indexOf(c), 1);
        }

        if (forced) {
            for (let c of this.allClients) {
                c.close();
                this.allClients.splice(this.allClients.indexOf(c), 1);
            }
            return;
        }

        if (!this.allClients.length) {
            this.closing.resolve(undefined);
            return;
        }

        return this.closing.promise;
    }
}

/**
 * Not really a pool implementation. Uses one and only pool-object, but behaves like a pool.
 */
export class SingleConnectionPool<T extends Poolable> extends PoolBase<T> implements AbstractPool<T> {
    client?: T;
    isFree: boolean;
    waitingQueue: SavedPromiseArray<T>;

    /**
     * Creates a new SingleConnectionPool<T>
     * Not really a pool. Always uses just one pool-object.
     * The pool-object is created on the first get()
     */
    constructor(settings: PoolSettings<T>) {
        super(settings);
        this.waitingQueue = [];
        this.isFree = true;
    }

    /**
     * Obtains a pool-object from pool. If no free DbClients available a new one will be created.
     * If connectionLimit is reached - will wait for a free pool-object.
     *
     * UNSAFE! Better use exec(callback)
     *
     * @returns {Promise<T> | T}
     */
    get(): Promise<T> | T {
        if (!this.client)
            return (async () => {
                // TODO_STABILITY если вдруг factory делает throw, то он не перехватывается тут никак!
                this.client = await this.factory.produce();
                this.client.pool = this;
                return this.get();
            })();

        let client = this.client as T;

        if (this.isFree) {
            this.isFree = false;
            return client;
        }

        let p = makePromise<T>();
        this.waitingQueue.push(p);
        return p.promise;
    }

    release(client: T) {
        if ((client as any).pool !== this) throw new Error(`Client doesn't belong to this pool`);

        if (this.closing) {
            client.close();
            for (let item of this.waitingQueue) item.reject(new Error(`Pool have been closed.`));
            this.waitingQueue = [];
            return;
        }

        let r = this.waitingQueue.pop();
        if (r) r.resolve(client);
        else this.isFree = true;
    }

    /**
     * Closes all corresponding pool-objects and the pool
     */
    close(forced: boolean = false): Promise<void> | void {
        if (!this.closing) this.closing = makePromise<void>();

        if (this.isFree) {
            if (this.client) {
                this.client.close();
                return;
            }
        }

        return this.closing.promise;
    }
}

export const makePool = <T extends Poolable>(settings: PoolSettings<T>): AbstractPool<T> => {
    if (settings.singleConnection || settings.maxClients === 1) {
        return new SingleConnectionPool(settings);
    } else {
        return new Pool(settings);
    }
};
