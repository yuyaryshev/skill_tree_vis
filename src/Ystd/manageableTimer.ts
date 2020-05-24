export interface EnvWithTimers {
    timers: Set<ManageableTimer>;
}

export interface ManageableTimer<Env extends EnvWithTimers = EnvWithTimers> {
    env: Env;
    cpl: string;
    name: string;
    timeout: number;
    disabled?: boolean;
    timeoutHandle?: any;

    stop: () => void;
    cancel: () => void;
    setTimeout: () => void;
    setInterval: () => void;
    disable: () => void;
    enable: () => void;
    executeNow: () => Promise<void>;
}

export function manageableTimer<Env extends EnvWithTimers = EnvWithTimers>(
    env: Env,
    timeout: number,
    cpl: string,
    name: string,
    callback: () => void | Promise<void>
) {
    function stop() {
        if (pthis.timeoutHandle) {
            clearTimeout(pthis.timeoutHandle);
            delete pthis.timeoutHandle;
            env?.timers.delete(pthis);
        }
    }

    function mSetTimeout() {
        if (!env) throw new Error(`${cpl} ERROR Can't start timer because 'env' is empty!`);
        stop();
        if (pthis.disabled) return;
        env.timers.add(pthis);
        pthis.timeoutHandle = setTimeout(async () => {
            stop();
            await callback();
        }, timeout);
    }

    function mSetInterval() {
        if (!env) throw new Error(`${cpl} ERROR Can't start timer because 'env' is empty!`);
        stop();
        if (pthis.disabled) return;
        env.timers.add(pthis);
        pthis.timeoutHandle = setInterval(async () => {
            await callback();
        }, timeout);
    }

    async function executeNow() {
        stop();
        await callback();
    }

    function disable() {
        pthis.disabled = true;
        stop();
    }

    function enable() {
        delete pthis.disabled;
    }

    const pthis: ManageableTimer<Env> = {
        env,
        cpl,
        name,
        timeout,
        stop,
        cancel: stop,
        setTimeout: mSetTimeout,
        setInterval: mSetInterval,
        disable,
        enable,
        executeNow,
    };

    return pthis;
}

// Синоним. Но список параметров совместим со стандартным setTimeout
export function manageableSetTimeout<Env extends EnvWithTimers = EnvWithTimers>(
    callback: () => void | Promise<void>,
    timeout: number,
    env: Env,
    cpl: string,
    name: string
) {
    return manageableTimer(env, timeout, cpl, name, callback).setTimeout();
}

// Синоним. Но список параметров совместим со стандартным setTimeout
export function manageableSetInterval<Env extends EnvWithTimers = EnvWithTimers>(
    callback: () => void | Promise<void>,
    timeout: number,
    env: Env,
    cpl: string,
    name: string
) {
    return manageableTimer(env, timeout, cpl, name, callback).setInterval();
}
