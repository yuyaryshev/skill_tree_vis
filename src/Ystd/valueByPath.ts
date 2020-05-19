import { AnyObject } from "./AnyObject";

export const valueByPath = (v: AnyObject, path: string[]) => {
    for (let part of path) v = v[part];
    return v;
};
