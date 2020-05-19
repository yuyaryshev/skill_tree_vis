const stringBuilderHandler = {
    get: (target: any, prop: string) => {
        switch (prop) {
            case "i":
            case "indent":
                return target.indent;
            case "indent_str":
                return target.indent_str;
        }
        return target.s;
    },
    set: (target: any, prop: string, value: any) => {
        if (value === undefined || value === null) {
            throw new Error("ERROR: string_builder 'value' is undefined or null!");
        }
        switch (prop) {
            case "i":
            case "indent":
                target.indent = value;
                target.indent_str = "\n                                                                                                                                                                          ".substr(
                    0,
                    1 + target.indent * 4,
                );
                return true;
        }
        target.s += target.indent_str + value;
        return true;
    },
    apply: (target: any, indent_diff: any) => {
        target.indent += indent_diff;
        target.indent_str = "\n                                                                                                                                                                          ".substr(
            0,
            1 + target.indent * 4,
        );
    },
};

interface IStringBuilder {
    s: string;
    i: number;
}

// let new_string_builder =
export const newStringBuilder = (): any => {
    return new Proxy({ s: "", indent: 0, indent_str: "\n" }, stringBuilderHandler);
};

/*
let ss = new_string_builder();
ss.s = 'a';
ss.s = 'bbbb';
ss.i++;
ss.s = 'ccc';
ss.i--;
ss.s = 'ddd';

console.log(ss.s);
*/
