import { exec, execSync } from "child_process";

export const yexecSync = (command: string) => {
    return execSync(command, { encoding: "utf-8" });
};

export const yexec = (command: string) => {
    return exec(command, { encoding: "utf-8" });
};

export const childJsSync = (jsFile: string) => {
    return execSync("node " + jsFile, { encoding: "utf-8" });
};

export const childJs = (jsFile: string) => {
    return exec("node " + jsFile, { encoding: "utf-8" });
};
