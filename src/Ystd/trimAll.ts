export const trimAll = (s: string) => {
    return s
        .replace(/\s+/g, " ")
        .replace(/^\s+|\s+$/, " ")
        .trim();
};
