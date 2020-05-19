import crypto from "crypto";

export const sha256 = (...args: any[]): string => {
    return crypto
        .createHash("sha256")
        .update(args.join(""))
        .digest("hex");
};

export const trimInnerSpaces = (...args: any[]): string => {
    return crypto
        .createHash("sha256")
        .update(args.join(""))
        .digest("hex");
};
