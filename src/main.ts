import moment from "moment";
import { readFileSync, writeFileSync } from "fs";
import { spawnSync } from "child_process";

export interface Task {
    line: number;
    parent: Task | undefined;
    id: string;
    name: string;
    reqIds: string[];
    req: Task[];
    lv: number;

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

export interface Rel {
    s: Task;
    t: Task;
}

// https://www.graphviz.org/doc/info/colors.html
// pastel28
export function taskColor(t: Task): string {
    if (t.escalated) return `#FFFFAA`;
    if (t.done) return `#AAFFAA`;
    if (t.cancelled) return `#FFAAAA`;
    if (t.inWork) return `#AAFFFF`;
    return `#DDDDDD`;
}

export function processTasksFile(sourcePath: string, targetPath: string, diagName: string) {
    const taskFileContent = readFileSync(sourcePath, "utf-8");
    const taskMaps: Map<string, Task> = new Map();
    const parentStack: Task[] = [];

    console.log(moment().format(), "\n");

    let line = 0;
    for (let taskLine0 of taskFileContent.split("\n")) {
        // =============== Парсинг строк ======================
        let done: boolean = false;
        let inWork: boolean = false;
        let escalated: boolean = false;
        let changed: boolean = false;
        let cancelled: boolean = false;

        line++;
        let taskLine = taskLine0.trimEnd();
        if (!taskLine.length) continue;

        const lv = Math.round((taskLine.length - taskLine.trimLeft().length) / 4);
        taskLine = taskLine.trim();

        while (true) {
            if (taskLine.startsWith("+")) {
                done = true;
                taskLine = taskLine.substr(1).trim()
                continue;
            }

            if (taskLine.startsWith("-")) {
                done = false;
                taskLine = taskLine.substr(1).trim()
                continue;
            }
            
            if (taskLine.startsWith("!")) {
                escalated = true;
                taskLine = taskLine.substr(1).trim()
                continue;
            }
            
            if (taskLine.startsWith(">")) {
                inWork = true;
                taskLine = taskLine.substr(1).trim()
                continue;
            }
            break;
        }

        let [name, modifiersStr] = taskLine.split(/[\/\|\\]/);
        name = (name || "").trim();
        modifiersStr = (modifiersStr || "").trim();

        let id = "noname" + (taskMaps.size + 1);
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

            if (id.trim() === "0007") debugger;

            switch (mName) {
                case "id":
                    id = mValues[0].trim();
                    if (!id) throw new Error(`Incorrect id in line ${line}`);
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

        const parent = (lv - 1 >= 0 ? parentStack[lv - 1] : undefined);
        const task: Task = {
            line,
            id,
            name,
            reqIds,
            lv,
            parent,
            req: [],

            done,
            inWork,
            escalated,
            changed,
            cancelled
        };

        parentStack[lv] = task;
        if (taskMaps.has(id)) throw new Error(`Dublicate 'id' in line ${line}`);
        taskMaps.set(task.id, task);
        // =============== Парсинг строк END ======================
    }

    // Связывание req по ссылкам
    for (let [, task] of taskMaps)
        for (let reqId of task.reqIds) {
            const rq = taskMaps.get(reqId);
            if (rq) task.req.push(rq);
            else console.error(`Task have invalid req ${task.id} ${task.name} ${task.line}, invalid req id = '${rq}'`);
        }

    const rels: Rel[] = [];

    // Формирование данных для диаграммы
    const tasks: Task[] = [];
    for (let [, task] of taskMaps) {
        // task.name = taskStr(task);
        tasks.push(task);
        if (task.parent) rels.push({ s: task, t: task.parent });
        for (let rq of task.req) rels.push({ s: rq, t: task });
    }

    tasks.sort((a: Task, b: Task) => {
        let r = a.lv - b.lv;
        if (r) return r;
        if (a.name === b.name) return 0;
        return a.name < b.name ? 1 : -1;
    });

    const graph_viz_str = `
digraph ${diagName} {
    size="30,9";
    node [color=lightgray, style=filled, fontname=Arial, colorscheme=pastel28];
${rels.map(r => `    n${r.s.id} -> n${r.t.id};`).join("\n")}
${tasks
    .map(t => `    n${t.id} [label="${t.name}", ${t.changed ? "" : `shape="box"`} color="${taskColor(t)}"];`)
    .join("\n")}
}
`;
    writeFileSync(targetPath, graph_viz_str, "utf-8");
}

processTasksFile("tasks.txt", "tasks.dot", "tasks");
// spawnSync("cmd", ["/c", "graph_viz.bat"]);
console.log("FINISHED!");
