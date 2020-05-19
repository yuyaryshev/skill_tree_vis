export const dateDiff = (a: Date | string, b: Date | string): number => {
    let a2: Date = typeof a === "string" ? new Date(a) : a;
    let b2: Date = typeof b === "string" ? new Date(b) : b;
    return a2.getTime() - b2.getTime();
};
