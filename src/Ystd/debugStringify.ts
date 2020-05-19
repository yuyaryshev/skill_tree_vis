const makeDebugReplacer = () => {
    let context = {
        recurringValues: new Set<any>(),
    };
    return (k: any, v: any) => {
        if (typeof v === "number") {
            if (!isFinite(v))
                if (v < 0) return "-Infinity";
                else return "+Infinity";
            return v;
        }

        if (!v || typeof v === "undefined" || typeof v === "string") return v;

        if (context.recurringValues.has(v)) return "[>>> recursive <<<]";
        context.recurringValues.add(v);

        if (v instanceof Error)
            return {
                message: v.message,
                stack: v.stack,
            };
        return v;
    };
};

export const debugStringify = (value: any) => {
    // Нельзя использовать make_plain_ex, потому что это нарушает последовательность включения модулей!
    return JSON.stringify(value, makeDebugReplacer());
    // return JSON.stringify(make_plain_ex(value), makeDebugReplacer());
};
