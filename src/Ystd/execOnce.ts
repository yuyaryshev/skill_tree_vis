interface ExecOnceRecord {
    running: boolean;
    promise: Promise<void>;
}
const execOnceMap: Map<Symbol | Object, ExecOnceRecord> = new Map();

export async function execOnce(symbolOrObject: Symbol | Object, delay: number, callback: () => Promise<any> | any) {
    if (!execOnceMap.get(symbolOrObject)) {
        let resolve: any;
        const execOnceRecord: ExecOnceRecord = {
            running: true,
            promise: new Promise<void>(p_resolve => {
                resolve = p_resolve;
            }),
        };
        execOnceMap.set(symbolOrObject, execOnceRecord);
        setTimeout(async () => {
            try {
                await callback();
            } catch (e) {
                console.error(`CODE00000193 Unhandled error inside execOnce`, e);
            }
            execOnceMap.delete(symbolOrObject);
            execOnceRecord.running = false;
            resolve(undefined);
        }, delay);
    }
}
