import {stringify} from "javascript-stringify";

export function dbgStringify(v: any) {
    return stringify(v, undefined, "    ");
}