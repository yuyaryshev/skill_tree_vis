export const strReplace = (container: string, needle: string | string[], replacement: string = ""): string => {
    if (Array.isArray(needle)) {
        for (let needle1 of needle) container = strReplace(container, needle1, replacement);
        return container;
    } else {
        return container.split(needle).join(replacement);
    }
};

export const strReplacePrefix = (container: string, prefix: string | string[], replacement: string = ""): string => {
    if (Array.isArray(prefix)) {
        L_outter: while (true) {
            for (let needle1 of prefix) {
                if (container.startsWith(needle1)) {
                    container = container.substr(prefix.length);
                    continue L_outter;
                }
            }
            return container;
        }
    } else {
        if (container.startsWith(prefix)) return container.substr(prefix.length);
        return container;
    }
};

export const strReplaceSuffix = (container: string, suffix: string | string[], replacement: string = ""): string => {
    if (Array.isArray(suffix)) {
        L_outter: while (true) {
            for (let needle1 of suffix) {
                if (container.endsWith(needle1)) {
                    container = container.substr(0, container.length - suffix.length);
                    continue L_outter;
                }
            }
            return container;
        }
    } else {
        if (container.endsWith(suffix)) return container.substr(0, container.length - suffix.length);
        return container;
    }
};
