let formatjs: any = undefined;

// @ts-ignore
try {
    formatjs = require("sql-prettier");
} catch (e) {}

let format = formatjs ? formatjs.format : undefined;

export const formatSql = (sqlSourceCode: string): string => {
    if (!format) return sqlSourceCode;
    try {
        return format(sqlSourceCode);
    } catch (e) {
        return sqlSourceCode;
    }
};
