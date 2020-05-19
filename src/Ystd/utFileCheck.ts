import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { expect } from "chai";
import { sha256 } from "Ystd";

let allowedNameRegex = /[a-zA-Z0-9()\[\]{}\-\_\@\!\.]+$/;

export const utFileCheck = (name: string, v: string, expectedSha256: string) => {
    if (!name.match(allowedNameRegex)) throw new Error(`utFileCheck: Error name '${name}' contains illegal chars!`);

    let packagejson = JSON.parse(readFileSync("package.json", "utf-8"));
    let utFileCheckDir = packagejson.utFileCheckDir || "./utFileCheck/";
    let filepath = join(utFileCheckDir, name);
    let original = "";
    try {
        original = readFileSync(filepath, "utf-8");
    } catch (e) {
        if (e.code !== "ENOENT") throw e;
    }

    if (original !== v) {
        let currentSha256 = sha256(v);
        if (currentSha256 === expectedSha256) {
            writeFileSync(filepath, v, "utf-8");
        } else {
            console.log(`utFileCheck for '${name}', new value sha256:`);
            console.log(currentSha256);
            expect(v).equal(original);
        }
    }
};
