export const assertDbg = (x: boolean, message?: string): void => {
    if (!x) throw new Error(`Assert failed! ${message} - debug mode`);
};

export const assertRel = (x: boolean, message?: string): void => {
    if (!x) throw new Error(`Assert failed! ${message} - release mode`);
};
