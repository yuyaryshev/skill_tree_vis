import { ITokenLike, Lexer } from "Ystd";

export type CompilationErrorSeverity = "e" | "w" | "i";
export const severityLongStr = (severity: CompilationErrorSeverity) => {
    switch (severity) {
        case "e":
            return "ERROR";
        case "w":
            return "WARN";
        case "i":
            return "INFO";
    }
    return "UNKNOWN";
};

export class CompilationError<CompilationContextT> extends Error {
    compilationContext?: CompilationContextT | undefined;
    lexer?: Lexer<CompilationContextT> | undefined;
    severity: CompilationErrorSeverity;
    cpl: string;
    token?: ITokenLike | undefined;
    shortMessage: string;

    constructor(severity: "e" | "w" | "i", cpl: string, where: Lexer<CompilationContextT> | ITokenLike | undefined, shortMessage: string) {
        let lexer: Lexer<CompilationContextT> | ITokenLike | undefined = (where instanceof Lexer ? where : undefined);
        const token: ITokenLike | undefined = !lexer && where && (where as any).line ? (where as any) : undefined;
        if(token)
            lexer = token.lexer as Lexer<CompilationContextT> | undefined;

        let positionStr: string = "";
        if (token && token.lexer) positionStr = `\n\tat source file (${token.lexer!.filePath}:${token.line}:${token.linep})`;
        else if (lexer && lexer.line) positionStr = `\n\tat source file (${lexer.filePath}:${lexer.line}:${lexer.p - lexer.linestartp})`;

        super(`${severityLongStr(severity)} ${cpl} ${shortMessage}${positionStr}`);
        this.compilationContext = lexer ? lexer.context as CompilationContextT : token && token.lexer ? token.lexer.context as CompilationContextT : undefined;
        this.lexer = lexer;
        this.severity = severity;
        this.cpl = cpl;
        this.token = token;
        this.shortMessage = shortMessage;
    }
}
