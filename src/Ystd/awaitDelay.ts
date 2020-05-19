export const awaitDelay = (delay_ms: number) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, delay_ms);
    });
};
