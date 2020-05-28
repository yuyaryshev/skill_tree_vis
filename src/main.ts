import moment from "moment";
import { readFileSync, writeFileSync } from "fs";
import { spawnSync } from "child_process";
import { strReplace, removeUndefined, fjmap } from "Ystd";
import commander from "commander";
import { render } from "./template";

export interface Task {
    children: Task[];
    line: number;
    parent: Task | undefined;
    id: string;
    name: string;
    reqIds: string[];
    req: Task[];
    lv: number;
    style: string;
    childRelStyle:string;

    changed: boolean;
    inWork: boolean;
    escalated: boolean;
    done: boolean;
    cancelled: boolean;
}

export function taskStr(t: Task) {
    let r = "";
    r += " " + t.id;
    r += " " + t.name;
    if (t.changed) r += ", changed";
    if (t.inWork) r += ", todo";
    if (t.done) r += ", done";
    if (t.cancelled) r += ", cancelled";
    if (t.escalated) r += ", escalated";
    return r.trim();
}

export type RelType = "child" | "req";
export interface Rel {
    rt: RelType;
    s: Task;
    t: Task;
    prime?: boolean;
    style?: string;
}

// https://www.graphviz.org/doc/info/colors.html
// pastel28
export function taskStyle(opts:ProcessTasksFileOpts, t: Task): string {
    const shape = t.changed ? "" : `shape="box", `;
    if (t.escalated) return `${shape} color="${"#FFFFAA"}}`;
    if (t.done) return `${shape} color="${"#AAFFAA"}"`;
    if (t.cancelled) return `${shape} color="${"#FFAAAA"}"`;
    if (t.inWork) return `${shape} color="${"#AAFFFF"}"`;
    if (!opts.grayInactive || t.parent?.inWork) return `${shape} color="${"#DDDDDD"}"`;
    return `${shape} color="${"#EEEEEE"}" fontcolor="${"#CCCCCC"}"`;
}

// https://www.graphviz.org/doc/info/colors.html
// pastel28
export function relStyle(opts:ProcessTasksFileOpts, r: Rel): string {
    if (!opts.grayInactive || r.s.parent?.inWork) return `color="${"#000000"}"`;
    return `color="${"#DDDDDD"}"`;
}

// https://www.graphviz.org/doc/info/colors.html
// pastel28
export function childRelStyle(opts:ProcessTasksFileOpts, r: Task): string {
    if (!opts.grayInactive || r.inWork) return `color="${"#000000"}"`;
    return `color="${"#DDDDDD"}"`;
}

export const defaultProcessTasksFileOpts = {
    sourcePath: "tasks.txt",
    targetPath: "tasks.dot"
};

export interface ProcessTasksFileOpts {
    sourcePath: string;
    templatePath?: string;
    targetPath: string;
    showInvisible?: boolean;
    grayInactive?: boolean;
    bulkFrontArrow?: boolean;
}

export function fixTaskName(name: string): string {
    return strReplace(name, '"', "'");
}

export function parseTasksFile(opts0: Partial<ProcessTasksFileOpts>) {
    const opts = { ...defaultProcessTasksFileOpts, ...opts0 };
    const { sourcePath, targetPath, showInvisible, bulkFrontArrow } = opts;
    let taskFileContent = readFileSync(sourcePath, "utf-8");

    taskFileContent = taskFileContent.split("\t").join("    ");
    const taskMaps: Map<string, Task> = new Map();
    const parentStack: Task[] = [];

    console.log(moment().format(), "\n");

    let line = 0;
    let ranked: Task[][] = [];

    for (let taskLine0 of taskFileContent.split("\n")) {
        // =============== Парсинг строк ======================
        let done: boolean = false;
        let inWork: boolean = false;
        let escalated: boolean = false;
        let changed: boolean = false;
        let cancelled: boolean = false;

        line++;
        let taskLine = taskLine0.trimEnd();

        const lv = Math.round((taskLine.length - taskLine.trimLeft().length) / 4);
        taskLine = taskLine.trim();
        if (!taskLine.length) continue;

        while (true) {
            if (taskLine.startsWith("+")) {
                done = true;
                taskLine = taskLine.substr(1).trim();
                continue;
            }

            if (taskLine.startsWith("-")) {
                done = false;
                taskLine = taskLine.substr(1).trim();
                continue;
            }

            if (taskLine.startsWith("!")) {
                escalated = true;
                taskLine = taskLine.substr(1).trim();
                continue;
            }

            if (taskLine.startsWith(">")) {
                inWork = true;
                taskLine = taskLine.substr(1).trim();
                continue;
            }
            break;
        }

        let [name, modifiersStr] = taskLine.split(/[\/\|\\]/);
        name = (name || "").trim();
        modifiersStr = (modifiersStr || "").trim();

        let id = "n" + (taskMaps.size + 1);
        if (!name.length) throw new Error(`Incorrect 'name' in line ${line}`);

        let reqIds: string[] = [];

        for (let modifierStr of (modifiersStr || "").split(" ")) {
            if (!modifierStr.trim().length) continue;

            const [mName, mValueStr] = modifierStr
                .split("=")
                .map(s => s.trim())
                .filter(s => s.length);

            const mValues = (mValueStr || "")
                .split(",")
                .map(s => s.trim())
                .filter(s => s.length);

            switch (mName) {
                case "id":
                    id = mValues[0].trim();
                    if (!id) throw new Error(`Incorrect id '${id}' in line ${line}`);
                    if (!id.match(/[_a-zA-Zа-яА-Я][_a-zA-Zа-яА-Я0-9]+/g)) throw new Error(`Incorrect id '${id}' in line ${line}`);
                    break;

                case "r":
                case "req":
                    reqIds = mValues;
                    break;

                case "ok":
                case "done":
                    done = true;
                    break;

                case "tbd":
                case "todo":
                    inWork = true;
                    break;

                case "!":
                case "e":
                case "escalate":
                case "escalated":
                    escalated = true;
                    break;

                case "c":
                case "change":
                case "changed":
                    changed = true;
                    break;

                case "cancelled":
                case "cancel":
                    cancelled = true;
                    break;
            }
        }

        const parent = lv - 1 >= 0 ? parentStack[lv - 1] : undefined;
        const task: Task = {
            children: [],
            line,
            id,
            name: fixTaskName(name),
            reqIds,
            lv,
            parent,
            req: [],

            done,
            inWork,
            escalated,
            changed,
            cancelled,
            style:"",
            childRelStyle:"",
        };

        task.style = taskStyle(opts, task);
        task.childRelStyle = childRelStyle(opts, task);
        if (parent) parent.children.push(task);
        ranked[lv] = ranked[lv] || [];
        ranked[lv].push(task);

        parentStack[lv] = task;
        if (taskMaps.has(id)) throw new Error(`Dublicate 'id' in line ${line}`);
        taskMaps.set(task.id, task);
        // =============== Парсинг строк END ======================
    }

    const childrenRanks: string[] = [];
    for (let [, task] of taskMaps)
        if (task.children.length)
            childrenRanks.push(`lv${task.lv + 1} -> ${fjmap(task.children, " -> ", child => child.id)}`);

    // Связывание req по ссылкам
    for (let [, task] of taskMaps)
        for (let reqId of task.reqIds) {
            const rq = taskMaps.get(reqId);
            if (rq) task.req.push(rq);
            else console.error(`Task have invalid req ${task.id} ${task.name} ${task.line}, invalid req id = '${rq}'`);
        }

    const rels: Rel[] = [];
    const tasks: Task[] = [];
    for (let [, task] of taskMaps) {
        // task.name = taskStr(task);
        tasks.push(task);
        if (task.parent) rels.push({ s: task, t: task.parent, rt:"child", prime: bulkFrontArrow && task.parent.children[0] === task || task.parent.children[task.parent.children.length-1] === task});
        for (let rq of task.req) rels.push({ s: rq, t: task, rt:"req", prime: true });
    }

    for(let rel of rels)
        rel.style = relStyle(opts, rel);

    tasks.sort((a: Task, b: Task) => {
        let r = a.lv - b.lv;
        if (r) return r;
        if (a.name === b.name) return 0;
        return a.name < b.name ? 1 : -1;
    });

    return {
        rels,
        tasks,
        childrenRanks,
        ranked,
        invNode: showInvisible ? " " : " [style=invisible]",
        invLine: showInvisible ? " [color=red]" : " [color=invis]"
    };
}

export function processTasksFile(opts: Partial<ProcessTasksFileOpts>) {
    const { sourcePath, templatePath, targetPath, showInvisible } = { ...defaultProcessTasksFileOpts, ...opts };
    const data = parseTasksFile(opts);
    const graph_viz_str = (templatePath ? require(templatePath).render : render)(data);
    writeFileSync(targetPath, graph_viz_str, "utf-8");
}


export type Data = ReturnType<typeof parseTasksFile>;

const program = new commander.Command();
program.version("0.0.1").description("skill_tree_vis converts simple text plans into visual graph trees");
const parsed = program
    .arguments("<source>")
    .option("-o, --output <string>", "Name of output file")
    .option("-t, --template <string>", "Name of template file")
    .option("--showInvisible", "Shows invisible links")
    .option("--grayInactive", "Grays out inactive branches")
    .option("--bulkFrontArrow", "Also draw the first arrow of tasks bulks, not only the last one")
    .parse(process.argv);

const o = program.opts();
const targetPath = program.args[0];

const opts: Partial<ProcessTasksFileOpts> = {};

opts.sourcePath = program.args[0];
opts.targetPath = o.output;
opts.templatePath = o.template;
opts.showInvisible = o.showInvisible;
opts.grayInactive = o.grayInactive;
opts.bulkFrontArrow = o.bulkFrontArrow;
removeUndefined(opts);

//opts.showInvisible = true;
processTasksFile(opts);
console.log("FINISHED!");
