import { join } from "path";
import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from "fs";

export const deleteFile = unlinkSync;
export const deleteFolderRecursive = function(path: string) {
    if (existsSync(path)) {
        for (const file of readdirSync(path)) {
            const curPath = join(path, file);
            if (lstatSync(curPath).isDirectory()) deleteFolderRecursive(curPath);
            else unlinkSync(curPath);
        }
        rmdirSync(path);
    }
};
