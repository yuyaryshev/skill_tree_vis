const replacer = (k: any, v: any) => {
    if (v instanceof Error)
        return {
            message: v.message,
            stack: v.stack,
        };
    return v;
};

export const messageStringify = (value: any) => {
    return JSON.stringify(value, replacer);
};
