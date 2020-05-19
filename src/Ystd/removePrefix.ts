export const removePrefix = (s: string, prefix: string): string => {
    if (s.startsWith(prefix)) return s.substr(prefix.length);
    return s;
};
