export const asString = (a: any): string => {
    if (typeof a === "string") return a;
    throw new Error(`'string' expected but got ${typeof a}`);
};
export const asNumber = (a: any): number => {
    if (typeof a === "number") return a;
    throw new Error(`'number' expected but got ${typeof a}`);
};
export const asBoolean = (a: any): boolean => {
    if (typeof a === "boolean") return a;
    throw new Error(`'boolean' expected but got ${typeof a}`);
};
