import { IToken, Lexer } from "./lexer";
// @ts-ignore
//import SourceMapIndexGenerator from "source-map-index-generator"

export interface WriterPart {
    s: IToken<string>;
    r: string;
}

export function makeTokenWriter(lexer: Lexer) {
    const r = {
        lexer,
        parts: [] as WriterPart[],
        replace: (token: IToken<string>, replacement: string) => {
            r.parts.push({
                s: token,
                r: replacement,
            });
        },
        keep(token: IToken<string>) {
            r.parts.push({
                s: token,
                r: token.v,
            });
        },
        generateWithOutSourcemap() {
            return r.parts.map(p=>p.r ).join("");
        },
        // Нельзя в Ystd
        //  потому что import SourceMapIndexGenerator from "source-map-index-generator"
        //  кривой - в Webpack не пролазит. В итоге React не собирается и не стартует.
        //
        // generateWithSourcemap(sourceFilePath:string) {
        //
        //         // https://github.com/twolfson/source-map-index-generator
        //         // SourceMapIndexGenerator
        //
        //         // // Load in SourceMapIndexGenerator
        //         //     var SourceMapIndexGenerator = require('source-map-index-generator');
        //         //
        //         // // Data output by node-jsmin2
        //         //     var input = [
        //         //             '// First line comment',
        //         //             'var test = {',
        //         //             '  a: "b"',
        //         //             '};'
        //         //         ].join('\n'),
        //         //         output = 'var test={a:"b"};',
        //         //         srcFile = 'input.js',
        //         //         coordmap = {"22":0,"23":1,"24":2,"25":3,"26":4,"27":5,"28":6,"29":7,"31":8,"33":9,"37":10,"38":11,"40":12,"41":13,"42":14,"44":15,"45":16};
        //         //
        //         // // Generate source map via SourceMapIndexGenerator
        //         //     var generator = new SourceMapIndexGenerator(generatorProps);
        //         //
        //         // // Add the index coordinate mapping
        //         //     generator.addIndexMapping({
        //         //         src: srcFile,
        //         //         input: input,
        //         //         output: output,
        //         //         map: coordmap
        //         //     });
        //         //
        //         // // Collect our source-map
        //         //     generator.toString(); // {"version":3,"file":"min.js","sources":["input.js"],"names":[],"mappings":"AACA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAE,CAAE,CACT,CAAC,CAAE,CAAC,CAAC,CACP,CAAC"}
        //
        //         // TODO make coordmap like below
        //         // YYA coordmap ЭТО
        //         // ДЛЯ КАЖДОГО СИМВОЛА индекс исходного символа -> индекс результирующего символа
        //         const coordmap = {"22":0,"23":1,"24":2,"25":3,"26":4,"27":5,"28":6,"29":7,"31":8,"33":9,"37":10,"38":11,"40":12,"41":13,"42":14,"44":15,"45":16};
        //
        //         throw new Error(`CODE00000472 generate withSourceMap=true - not implemented. Find npm sourcemap  library and add it herer`)
        //
        //         // TODO унести инициализацию отсюда. SourceMapIndexGenerator будет общий для нескольких файлов!
        //         const GenProps = {
        //             file: "GENERATED_FILE_NAME",
        //             sourceRoot: "ROOT_OF_SOURCE_FILES",
        //         }
        //
        //         const sourceMapIndexGenerator = new SourceMapIndexGenerator(GenProps);
        //         sourceMapIndexGenerator.addIndexMapping({
        //                     src: sourceFilePath,
        //                     input: r.parts.map(p=>p.s.v).join(""),
        //                     output: r.parts.map(p=>p.r).join(""),
        //                     map: coordmap
        //                 });
        //
        //         // TODO Collect our source-map
        //         //     generator.toString(); // {"version":3,"file":"min.js","sources":["input.js"],"names":[],"mappings":"AACA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAE,CAAE,CACT,CAAC,CAAE,CAAC,CAAC,CACP,CAAC"}
        //
        //         // TODO проверить source map тут
        //         // http://sokra.github.io/source-map-visualization/
        //     }
    };
    return r;
}
