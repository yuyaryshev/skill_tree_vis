export const equal = (a: any, b: any): boolean => {
    return (
        a === b ||
        (typeof a === "number" && typeof b === "number" && isNaN(a) && isNaN(b)) ||
        (a instanceof Date && b instanceof Date && a.getTime() === b.getTime())
    );
};
