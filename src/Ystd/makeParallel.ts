export const makeParallel = () => {
    const errors: Error[] = [];
    const promises: Promise<any>[] = [];
    const add = (promise_or_promises: Promise<any> | Promise<any>[]) => {
        if (Array.isArray(promise_or_promises)) for (let p of promise_or_promises) add(p);
        else
            promises.push(
                (async () => {
                    try {
                        await promise_or_promises;
                    } catch (e) {
                        errors.push(e);
                    }
                })(),
            );
    };
    const wait = async () => {
        await Promise.all(promises);
        if (errors.length) throw errors[0];
    };
    return { add, wait };
};
