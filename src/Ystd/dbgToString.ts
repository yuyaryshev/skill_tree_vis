import { getClassName } from "./getClassName";

export const dbgToString = (v: any): string => {
    if (v === undefined) return "undefined";
    else if (v === null) return "null";
    else if (v instanceof Error) return `Error(${v.message})`;
    else if (v instanceof Promise) return "Promise";
    else if (typeof v === "object") {
        let r = JSON.stringify(v);
        if (r.length > 50) r = r.substr(0, 45) + " ...}";
        return (getClassName(v) || "?object?") + ":" + r;
    }
    return v + "";
};
