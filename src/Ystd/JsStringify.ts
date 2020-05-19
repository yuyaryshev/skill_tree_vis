import {stringify} from "javascript-stringify";

export const JsStringify = (v: any): string => {
    return stringify(v, undefined, "    ") || "";
};
