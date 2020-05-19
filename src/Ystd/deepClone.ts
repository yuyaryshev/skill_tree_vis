export const deepClone = require("clone-deep");

export const yyaDeepClone = (aObject: any) => {
    if (!aObject) return aObject;

    let bObject: any = Array.isArray(aObject) ? [] : {};
    for (let k in aObject) {
        let v = aObject[k];
        bObject[k] = typeof v === "object" ? yyaDeepClone(v) : v;
    }
    return bObject;
};
