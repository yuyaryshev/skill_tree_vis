export const getClassName = (v: any): string | undefined => {
    if (typeof v === "object") Object.getPrototypeOf(v).constructor.name;
    return undefined;
};
