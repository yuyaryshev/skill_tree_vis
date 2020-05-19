const fsjs = require("fs");
const readFileSync = fsjs.readFileSync;
const pathjs = require("path");
const join = pathjs.join;

const getMissingPackages = (target, source) => {
    if (!target.endsWith(".json")) target = join(target, "/package.json");
    if (!source.endsWith(".json")) source = join(source, "/package.json");

    let targetj = JSON.parse(readFileSync(target, "utf-8"));
    let sourcej = JSON.parse(readFileSync(source, "utf-8"));

    let missingDependencies = [];
    for (let k in sourcej.dependencies) if (!targetj.dependencies[k] && !targetj.devDependencies[k]) missingDependencies.push(k);

    console.log("missingDependencies");
    console.log(missingDependencies.join(" "));

    let missingDevDependencies = [];
    for (let k in sourcej.devDependencies) if (!targetj.dependencies[k] && !targetj.devDependencies[k]) missingDevDependencies.push(k);

    console.log("missingDevDependencies");
    console.log(missingDevDependencies.join(" "));
    return { missingDependencies, missingDevDependencies };
};
module.exports.getMissingPackages = getMissingPackages;

// getMissingPackages('D:\\b\\Mine\\GIT_Work\\server_store', 'D:\\b\\Mine\\GIT_Work\\mentality');
