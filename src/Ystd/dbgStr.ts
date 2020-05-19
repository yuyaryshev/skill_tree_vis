export const dbgStr = (v: any, depth: number = 5, indent: string = "\n", set?: any): string => {
    if (!set) set = new Set();
    if (set.has(v)) return "[>>> CIRCULAR REF <<<]";
    set.add(v);

    if (typeof v === "object" || typeof v === "function") {
        let s = "";
        let f = true;
        if (depth <= 0) return "[>>> DEPTH REACHED <<<]";

        if (Array.isArray(v)) {
            let indent2 = indent + "    ";
            s += `${indent}[`;
            for (let item of v) {
                if (f) {
                    f = false;
                    s += `${indent2}`;
                } else s += `,${indent2}`;
                s += dbgStr(item, depth - 1, indent + "    ", set);
            }
            s += `${indent}]`;
            return s;
        }

        if (typeof v === "function" || typeof v === "object") {
            let indent2 = indent + "    ";
            s += `${indent}{`;
            if (typeof v === "function") {
                s += `${indent2}"__type": "${typeof v}"`;
                f = false;
            }

            for (let k in v) {
                if (f) {
                    f = false;
                    s += `${indent2}`;
                } else s += `,${indent2}`;
                s += JSON.stringify(k) + ": " + dbgStr(v[k], depth - 1, indent + "    ", set);
            }
            s += `${indent}}`;
            return s;
        }
    }
    return JSON.stringify(v);
};

export const dbgStrOld = (v: any): string => {
    let s = new Set();
    return JSON.stringify(
        v,
        (k: any, v: any) => {
            if (s.has(v)) return [">>> CIRCULAR REF <<<"];
            s.add(v);
            return v;
        },
        4,
    );
};
