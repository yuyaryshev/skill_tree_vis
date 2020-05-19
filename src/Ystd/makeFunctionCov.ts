// USAGE:
//     1. Make a file for coverage data and functions
//         import {makeCoverageWithJournal} from 'Ystd';
//         export let {
//             functionCoverageData,
//             functionJournalData,
//             startJournal,
//             stopJournal,
//             functionCoverage,
//             getFileCoverage,
//             getUnusedFiles,
//         } = makeCoverageWithJournal(true, __dirname, [
//     'index.js',
//     'funcCov.js',
// ]);
//     2. Add functionCoverage(); to each function you want to track.
//     3. Use startJournal/stopJournal to start journaling in UT
//     4. Obtain journal and coverage data from 'functionCoverageData' and 'functionJournalData'
//     5. Use deepEqual for journal in UT
//     6. Call console.log(getUnusedFiles()); to see uncovered files

import { sep } from "path";
import { __FULLSOURCELOCATION__ } from "./sourceMacrosAndStack";
import { readDirRecursive } from "./readDirRecursive";

export interface FCSourceLocation {
    line: number;
    column: number;
    str: string;
    functionName: string;
    fileName: string;
}

export interface FCItem {
    c: number;
    loc: FCSourceLocation;
}

export type FCData = Map<string, FCItem>;
export type FCJournal = FCSourceLocation[];

export const makeFunctionCoverage = (): {
    functionCoverageData: FCData;
    functionCoverage: (offset?: number) => void;
} => {
    let functionCoverageData = new Map();
    return {
        functionCoverageData,
        functionCoverage: (offset: number = 0) => {
            let loc = __FULLSOURCELOCATION__(offset + 1);
            let v = functionCoverageData.get(loc.str);
            if (!v) {
                v = { c: 0, loc };
                functionCoverageData.set(loc.str, v);
            }

            v.c++;
        },
    };
};

export const makeFunctionJournal = (): {
    functionJournalData: FCJournal;
    functionJournal: (offset?: number) => void;
} => {
    let functionJournalData: FCSourceLocation[] = [];
    return {
        functionJournalData,
        functionJournal: (offset: number = 0) => {
            functionJournalData.push(__FULLSOURCELOCATION__(offset + 1));
        },
    };
};

export const mergeFunctionCoverage = (target: FCData, source: FCData) => {
    for (let [_, sourceItem] of source) {
        let v = target.get(sourceItem.loc.str);
        if (!v)
            target.set(sourceItem.loc.str, {
                c: sourceItem.c,
                loc: sourceItem.loc,
            });
        else v.c += sourceItem.c;
    }
};

export interface FunctionCoverageWithJournal {
    useJournal: boolean;
    startJournal: () => void;
    stopJournal: () => void;
    functionCoverage: (offset?: number) => void;
    functionCoverageData: FCData;
    functionJournalData: FCJournal;
    getFileCoverageEx: () => any[];
    getFileCoverage: () => string[];
    getUnusedFiles: () => string;
}

export const makeCoverageWithJournal = (enabled: boolean = true, basePath0?: string, additionalFiles?: string[]) => {
    if (!enabled)
        return {
            useJournal: false,
            functionCoverageData: new Map<any, any>(),
            functionJournalData: [],
            startJournal: () => {},
            stopJournal: () => {},
            functionCoverage: (offset: number = 0) => {},
            getFileCoverageEx: () => {},
            getFileCoverage: () => {
                return [];
            },
            getUnusedFiles: () => {
                return [];
            },
        };

    let basePath = basePath0;
    if (basePath && !basePath.endsWith(sep)) basePath += sep;
    let { functionCoverageData, functionCoverage } = makeFunctionCoverage();
    let { functionJournalData, functionJournal } = makeFunctionJournal();

    let r: FunctionCoverageWithJournal = {
        useJournal: false,
        functionCoverageData,
        functionJournalData,
        startJournal: () => {
            r.useJournal = true;
            functionJournalData.length = 0;
        },
        stopJournal: () => {
            r.useJournal = false;
            return functionJournalData.map(item => item.str).join("\n");
        },

        functionCoverage: (offset: number = 0) => {
            functionCoverage(offset + 1);
            if (r.useJournal) functionJournal(offset + 1);
        },
        getFileCoverageEx: () => {
            let rr: any = {};
            for (let [_, fcItem] of r.functionCoverageData) rr[fcItem.loc.fileName] = (rr[fcItem.loc.fileName] || 0) + fcItem.c;
            return rr;
        },
        getFileCoverage: () => {
            let r3: string[] = Object.keys(r.getFileCoverageEx()).map(a => {
                if (basePath && a.startsWith(basePath)) return a.substr(basePath.length);
                return a;
            });
            if (additionalFiles) for (let additionalFile of additionalFiles) r3.push(additionalFile);
            r3.sort();
            return r3;
        },
        getUnusedFiles: () => {
            if (!basePath0) throw new Error(`To use this function pass in a valid basePath0 parameter to makeCoverageWithJournal`);
            let usedFiles = r.getFileCoverage();
            let unusedFiles: string[] = [];
            readDirRecursive(basePath0, (path: string, filename0: any) => {
                let filename1 = path + sep + filename0.name;
                let filename = filename1.substr(basePath!.length);
                if (!usedFiles.includes(filename)) unusedFiles.push(filename);
                return undefined;
            });
            unusedFiles.sort();
            return unusedFiles.join("\n");
        },
    };

    return r;
};

// USAGE:
//     1. Make a file for coverage data and functions
//         import {makeCoverageWithJournal} from 'Ystd';
//         export let {
//             functionCoverageData,
//             functionJournalData,
//             startJournal,
//             stopJournal,
//             functionCoverage,
//             getFileCoverage,
//             getUnusedFiles,
//         } = makeCoverageWithJournal(true, __dirname, [
//     'index.js',
//     'funcCov.js',
// ]);
//     2. Add functionCoverage(); to each function you want to track.
//     3. Use startJournal/stopJournal to start journaling in UT
//     4. Obtain journal and coverage data from 'functionCoverageData' and 'functionJournalData'
//     5. Use deepEqual for journal in UT
//     6. Call console.log(getUnusedFiles()); to see uncovered files
