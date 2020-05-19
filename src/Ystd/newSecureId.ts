import { randomBytes } from "crypto";

export function newSecureId(length: number = 16): Promise<string> {
    return new Promise(resolve => {
        randomBytes(length, (err, buffer) => {
            resolve(
                buffer
                    .toString("base64")
                    .replace(/\//g, "_")
                    .replace(/\+/g, "-"),
            );
        });
    });
}
