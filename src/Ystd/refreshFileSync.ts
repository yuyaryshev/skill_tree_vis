import fs from "fs";

export const refreshFileSync = (filepath: string, data: string) => {
    let old_data: string = "";
    try {
        old_data = fs.readFileSync(filepath, "utf8");
    } catch (e) {}

    if (old_data !== data) fs.writeFileSync(filepath, data);
};
