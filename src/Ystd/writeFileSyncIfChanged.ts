import {readFileSync, writeFileSync} from "fs";

export const writeFileSyncIfChanged = (filePath: string, content: string, encoding: string = "utf-8") => {
    let oldContent;
    try {
        readFileSync(filePath, "utf-8");
    } catch (e) {
        if (e.code !== "ENOENT") throw e;
    }
    if (!oldContent || oldContent !== content) writeFileSync(filePath, content, "utf-8");
};