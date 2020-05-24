import { fjmap } from "Ystd";
import { Data } from "./main";

export function render(d: Data): string {
    // const unused1 = `
    //
    // // level nodes
    // ${fjmap(d.levels, "", lv => `    ${lv} ${d.invNode};\n`).trim()}
    //
    // // level links
    // ${fjmap(d.levels, " -> ", lv => lv).trim()} ${d.invLine};
    //     `;

    return `
    digraph tasks {
    size="30,9";
    rankdir="LR";
    node [color=lightgray, style=filled, fontname=Arial, colorscheme=pastel28];

    // prime rels
    ${fjmap(d.rels.filter(rel => rel.prime), "", r => `    ${r.s.id} -> ${r.t.id} [dir=forward ${r.style}];\n`).trim()}

    // non prime rels
    ${fjmap(d.rels.filter(rel => !rel.prime), "", r => `    ${r.s.id} -> ${r.t.id} ${d.invLine};\n`).trim()} 
    
    // tasks
    ${fjmap(
        d.tasks,
        "",
        t => `    ${t.id} [label="${t.name}" ${t.style?.trim()?.length ?  ", " + t.style : ""}];\n`
    ).trim()}

    // task children
    ${fjmap(
        d.tasks,
        "",
        t => t.children.length>1 && `${fjmap(t.children, " -> ", c => c.id)} [dir=none ${t.childRelStyle}];\n`
    ).trim()}

    
    // ranks 
    ${fjmap(
        d.ranked,
        "",
        (items, rank) => `
    {
    rank = same;
    ${fjmap(items,";", item => item.id)};
    rankdir = LR;    
    }    
    `
    ).trim()}
}


    
    `;
}

