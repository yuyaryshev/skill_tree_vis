export const recursiveDeleteKey = (v: any, ...keys: string[]) => {
    if (!(v instanceof Object)) return;

    if (Array.isArray(v)) for (let i = v.length - 1; i >= 0; i--) recursiveDeleteKey(v[i], ...keys);
    else
        for (let i in v)
            if (keys.includes(i)) delete v[i];
            else recursiveDeleteKey(v[i], ...keys);
};
