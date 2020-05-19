export const removeSuffix = (s: string, suffix: string): string => {
    if (s.endsWith(suffix)) return s.substr(0, s.length - suffix.length);
    return s;
};
