import { dirname } from "path";
import { mkdirSync, readFileSync, writeFileSync } from "fs";

export const writeFileSyncWithMkDir = (fileName: string, content: string) => {
    try {
        if (content === readFileSync(fileName, "utf-8")) return;
    } catch (e) {}

    try {
        writeFileSync(fileName, content, "utf-8");
    } catch (e) {
        const targetDir = dirname(fileName);
        mkdirSync(targetDir, { recursive: true });
        writeFileSync(fileName, content, "utf-8");
    }
};
