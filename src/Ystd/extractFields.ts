import { AnyObject } from "./AnyObject";

export const extractFields = (v: AnyObject, fields: string[]) => {
    let r = {} as any;
    for (let field of fields) {
        let path = field.split(".");
        let v2 = v;
        for (let part of path) if (v2) v2 = v2[part];
        r[path[0]] = v2;
    }
    return r;
};
