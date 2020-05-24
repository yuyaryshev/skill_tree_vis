/// *
import { CompilationError } from "./compilationError";

type any_1 = any;

export const tt = {
    none: 0 as 0,
    punctuator: 1 as 1,
    space: 2 as 2,
    identifier: 4 as 4,
    int: 32 as 32,
    float: 64 as 64,
    number: 32 | (64 as 32 | 64),
    squoted: 128 as 128,
    dquoted: 256 as 256,
    tquoted: 512 as 512,
    string: (128 | 256 | 512) as 128 | 256 | 512,
    comment: 1024 as 1024,
    code: 2048 as 2048,
};

const tokenFilterStr = (token_filter: ITokenFilterType): string => {
    if (typeof token_filter === "string") return token_filter;

    if (typeof token_filter === "number") {
        let s = "";
        if (token_filter & tt.punctuator) s += " punctuator";
        if (token_filter & tt.space) s += " space";
        if (token_filter & tt.identifier) s += " identifier";

        if ((token_filter & tt.number) === tt.number) s += " number";
        else {
            if (token_filter & tt.int) s += " int";
            if (token_filter & tt.float) s += " float";
        }

        if ((token_filter & tt.string) === tt.string) s += " string";
        else {
            if (token_filter & tt.squoted) s += " squoted";
            if (token_filter & tt.dquoted) s += " dquoted";
            if (token_filter & tt.tquoted) s += " tquoted";
        }

        return s.trim();
    }

    if (Array.isArray(token_filter)) return token_filter.join(" ");

    throw new LexerError("E", "CODE00000131", undefined as any, `Unknown token_filter type`);
};

const lexer_debug_mode = true;
// */

// TODO TODO_lo_NI нужно прицепиться к нодовскому readFileStream
// TODO TODO_lo_NI нужно понять как работать с потоком
// Основная идея работы с потоком: функция read_next_token(), skip_till и read_fixed должны убеждаться
// что поток или закрыт, или в нем не меньше max_token_length.
// В случае если меньше, то: нужно ждать пока он дочитается
// Потому что потоковое чтение файла, по идее, должно быть async, соответственно чтение его будет await
// await до момента пока вернется block
//
// в случае если парсеру нужен syncRead, тогда если данных не хватает - throw

export type ITokenValueType = string | number | undefined;

export interface ITokenLike<T = ITokenValueType> {
    lexer?: Lexer<unknown>;
    token_type?: number;
    t?: string;
    p?: number;
    line?: number;
    linep?: number;
    len?: number;
    v: T;
}

export interface IToken<T = ITokenValueType> extends ITokenLike<T> {
    lexer: Lexer<unknown>;
    token_type: number;
    t: string;
    p: number;
    line: number;
    linep?: number;
    len: number;
    v: T;
}

export class LexerError<CompilationContextT> extends CompilationError<CompilationContextT> {}

export type ITokenFilterType = string | number | string[];

export interface ReadTillMatched extends IToken<string> {
    matched: true;
    matchedWith: string | RegExp;
    matchedStr: string;
    input: string;
    groups: { [key: string]: string } | undefined;
    values: string[] | undefined;
}

export interface ReadTillResult {
    prefix: IToken<string>;
    matched: ReadTillMatched | undefined;
}

export type SplitCallback = (item: ReadTillMatched | IToken<string>) => boolean | void | undefined;
export type BreakpointCallback = (token: IToken) => void;

export const parseEscapedStringValue = (s: string) => {
    const len = s.length-1;
    let r = "";
    let i = 1;
    while (i < len) {
        const c = s.charAt(i);
        if(c === '\\') {
            const c2 = s.charAt(i+1);
            switch (c2) {
                case "n": r+= "\n"; break;
                case "r": r+= "\r"; break;
                case "t": r+= "\t"; break;
                default: r+= c2; break;
            }
        }
        r += c;
        i++;
    }
    return r;
}

export const parseCODEBlock = (s: string) => {
    return s.substr(5,s.length - 10);
}

export type TokenValueParser<T> = (s:string) => T;

export class Lexer<CompilationContextT = unknown> {
    context: CompilationContextT;
    filePath: string;
    s: string;
    line: number; // line, 1 based index
    linestartp: number; // position in line, 1 based index
    p: number;
    next_tokens: IToken[];
    max_token_length: number;
    skip_spaces: boolean;
    skip_comments: boolean;
    breakpoint?: number | undefined;
    onBreakpoint: BreakpointCallback | undefined;

    constructor(s: string, filePath: string, context: CompilationContextT) {
        // TODO вообще мне лексер нужен расширяемый. Ведь мне трубуется читать различные лексемы, а не только комментарии
        // Логично было бы переделать лексер: сделать его просто набором функций, которому передается структура с полями в текущем Lexer'е
        // Одно из полей должно быть - errorFunс
        // При этом должна сохраниться возможность использовать expect, вероятно он будет работать путем передачи ему функции
        // Важно еще и то, что expect вероятно будет совместим с parser'ом, а не только с lexer'ом

        this.context = context;
        this.filePath = filePath;
        this.s = s;
        this.line = 1;
        this.p = 0;
        this.next_tokens = [];
        this.max_token_length = 16 * 1024 * 1024;
        this.skip_spaces = true;
        this.skip_comments = true;
        this.linestartp = 0;

        this.onBreakpoint = (token: IToken) => {
            console.log(`CODE00000478 Triggered lexer debugger! token = `, token);
            debugger;
            console.log(`CODE00000479 Triggered lexer debugger! token = `, token);
        };
        // HINT
        // Всегда можно ограничить длину, даже для строк. Потому что если строка будет длиннее оперативки,
        // то принимающая сторона никак не сможет ее обработать. Если только принимающая сторона не потоковая.
        // Но я же не буду делать все потоковым - тогда будет слишком сложно разрабатывать и работать будет медленнее.
        //
        // Это сделано для поддержки Stream в будущем, но, поскольку я не разобрался со чтением файла по частям я не доделал это.
    }

    setBreakpoint(position: number | string, breakpointCallback?: BreakpointCallback) {
        if (breakpointCallback !== undefined) this.onBreakpoint = breakpointCallback;

        if (typeof position === "string") {
            const pp = this.s.indexOf(position);
            if (pp >= 0) {
                this.setBreakpoint(pp);
                this.s = this.s.split(position).join("");
            }
        } else {
            this.breakpoint = position;
        }
    }

    readToken<T = string>(len: number, token_type: number = tt.none, parserFunc?: TokenValueParser<T>): IToken<T> {
        const line = this.line;
        const linep = this.p - this.linestartp + 1;
        const p = this.p;
        const t = this.substr_with_adjusted_linenums(len);
        const v = parserFunc? parserFunc(t) : t;
        const token = { lexer: this, token_type, line, linep, p, len, t, v };
        if (this.breakpoint !== undefined && this.p >= this.breakpoint && this.onBreakpoint) this.onBreakpoint(token as IToken<any>);
        return token as IToken<any>;
    }

    emptyToken(): IToken<undefined> {
        return this.readToken<undefined>(0,0, undefined);
    }

    advance() {
        let r = this.next();
        if (r) this.next_tokens.splice(0, 1);
        return r;
    }

    done() {
        return !this.next();
    }

    substr_with_adjusted_linenums(len: number): string {
        const r = this.s.substr(this.p, len);
        const ending_p = this.p + len;
        while (this.p < ending_p) {
            if (this.s[this.p] === "\r") {
                this.p++;
                if (this.s[this.p] === "\n") this.p++;
                this.line++;
                this.linestartp = this.p;
            } else if (this.s[this.p] === "\n") {
                this.p++;
                this.line++;
                this.linestartp = this.p;
            } else this.p++;
        }
        return r;
    }

    read_fixed(len: number): IToken<string>  {
        this.uncache_next_tokens();
        return this.readToken(len);
    }

    read_till(regexp_or_regexps: string | string[] | RegExp | RegExp[]): ReadTillResult {
        this.uncache_next_tokens();
        const input = this.s.substr(this.p);
        const regexps = Array.isArray(regexp_or_regexps) ? regexp_or_regexps : [regexp_or_regexps];
        let minIndex: number = this.s.length + 1;
        let minR: RegExpMatchArray | null | undefined;
        let matchedWith: string | RegExp | undefined;

        for (let regexp of regexps) {
            if (typeof regexp === "string") {
                const index = input.indexOf(regexp);
                if (index < minIndex) {
                    minR = undefined;
                    minIndex = index;
                    matchedWith = regexp;
                }
            } else {
                const r = input.match(regexp);
                if (r && r.index && r.index < minIndex) {
                    minR = r;
                    minIndex = r.index;
                    matchedWith = regexp;
                }
            }
        }

        if (typeof matchedWith === "string") {
            const prefix = this.readToken(minIndex || 0);
            const match = this.readToken(length);
            return {
                prefix,
                matched: Object.assign(match, {
                    matched: true,

                    matchedWith,
                    matchedStr: matchedWith,
                    input,
                    groups: undefined,
                    values: undefined,
                }) as ReadTillMatched,
            };
        } else if (minR) {
            const { index, groups } = minR;
            delete minR.index;
            delete minR.input;
            delete minR.groups;
            const [matchedStr, ...values] = minR;
            const length = matchedStr.length;

            const prefix = this.readToken(index || 0);
            const match = this.readToken(length);
            return {
                prefix,
                matched: Object.assign(match, {
                    matched: true,
                    matchedWith: matchedWith as RegExp,
                    matchedStr: matchedStr,
                    input,
                    groups,
                    values,
                }) as ReadTillMatched,
            };
        }

        const prefix = this.readToken(this.s.length - this.p);
        return {
            prefix,
            matched: undefined,
        };
    }

    split(regexp_or_regexps: RegExp | RegExp[], callback?: SplitCallback) {
        const parts: IToken<string>[] = [];
        while (true) {
            let r = this.read_till(regexp_or_regexps);
            if (callback && callback(r.prefix) === false) return parts;
            parts.push(r.prefix);

            if (r.matched) {
                if (callback && callback(r.matched) === false) return parts;
                parts.push(r.matched);
            } else break;
        }
        return parts;
    }

    next(offset: number = 0): IToken | undefined {
        while (!this.next_tokens.hasOwnProperty(offset)) {
            if (this.p >= this.s.length) {
                return undefined;
            }

            // TODO Тут нужно доделать чтение потоков. Скорее всего при этом все функции станут async
            // В этом месте нужно добавить чтенеи в переменную s до тех пор пока в ней не будет как минимум
            // max_token_size данных или пока не будет достигнут конец потока.

            let next_token = this.read_next_token();
            if (!next_token) return undefined;
            this.next_tokens.push(next_token);
        }
        return this.next_tokens[offset];
    }

    uncache_next_tokens() {
        let next_token;
        while ((next_token = this.next_tokens.pop())) this.p = this.p - next_token.len;
    }

    read(token_filter: 32 | 64 | 96): IToken<number> | undefined;
    read(token_filter: 1 | 2 | 4 | 128 | 256 | 512 | 896 | (128 | 256 | 512)): IToken<string> | undefined;
    read(token_filter: ITokenFilterType): IToken | undefined;

    read(token_filter: ITokenFilterType) {
        let r = this.next();
        if (!r) return undefined;

        if (typeof token_filter === "number") {
            if (!(token_filter & r.token_type)) return undefined;
            this.next_tokens.splice(0, 1);
            return r as IToken;
        }

        if (typeof token_filter === "string") {
            if (token_filter !== r.t) return undefined;
            this.next_tokens.splice(0, 1);
            return r as IToken<string>;
        }

        if (Array.isArray(token_filter)) {
            if (!token_filter.includes(r.t)) return undefined;
            this.next_tokens.splice(0, 1);
            return r as IToken;
        }

        throw new LexerError("E", "CODE00000153", this, `Unknown token filter type`);
    }

    expect(token_filter: 32 | 64, expected_name?: string, cpl?: string): IToken<number>;
    expect(token_filter: 1 | 2 | 4 | 128 | 256 | 512 | 2048, expected_name?: string, cpl?: string): IToken<string>;
    expect(token_filter: ITokenFilterType, expected_name?: string, cpl?: string): IToken;

    expect(token_filter: ITokenFilterType, expected_name?: string, cpl?: string): IToken {
        let r = this.read(token_filter);
        if (!r) throw new LexerError("E", cpl || "CODE00000155", this, `Expected ${expected_name || tokenFilterStr(token_filter)}`);
        return r;
    }

    read_next_token_identifier() {
        let p2 = this.p + 1;
        first_while: while (true)
            switch (this.s.charAt(p2)) {
                case "_":
                case "a":
                case "b":
                case "c":
                case "d":
                case "e":
                case "f":
                case "g":
                case "h":
                case "i":
                case "j":
                case "k":
                case "l":
                case "m":
                case "n":
                case "o":
                case "p":
                case "q":
                case "r":
                case "s":
                case "t":
                case "u":
                case "v":
                case "w":
                case "x":
                case "y":
                case "z":
                case "A":
                case "B":
                case "C":
                case "D":
                case "E":
                case "F":
                case "G":
                case "H":
                case "I":
                case "J":
                case "K":
                case "L":
                case "M":
                case "N":
                case "O":
                case "P":
                case "Q":
                case "R":
                case "S":
                case "T":
                case "U":
                case "V":
                case "W":
                case "X":
                case "Y":
                case "Z":
                case "а":
                case "б":
                case "в":
                case "г":
                case "д":
                case "е":
                case "ж":
                case "з":
                case "и":
                case "й":
                case "к":
                case "л":
                case "м":
                case "н":
                case "о":
                case "п":
                case "р":
                case "с":
                case "т":
                case "у":
                case "ф":
                case "х":
                case "ц":
                case "ч":
                case "ш":
                case "щ":
                case "ъ":
                case "ы":
                case "ь":
                case "э":
                case "ю":
                case "я":
                case "А":
                case "Б":
                case "В":
                case "Г":
                case "Д":
                case "Е":
                case "Ж":
                case "З":
                case "И":
                case "Й":
                case "К":
                case "Л":
                case "М":
                case "Н":
                case "О":
                case "П":
                case "Р":
                case "С":
                case "Т":
                case "У":
                case "Ф":
                case "Х":
                case "Ц":
                case "Ч":
                case "Ш":
                case "Щ":
                case "Ъ":
                case "Ы":
                case "Ь":
                case "Э":
                case "Ю":
                case "Я":
                case "ё":
                case "Ё":
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    p2++;
                    break;
                default:
                    break first_while;
            }
        // noinspection UnreachableCodeJS
        return this.readToken(p2 - this.p, tt.identifier);
    }

    read_next_token_number(): IToken | undefined {
        let p2 = this.p + 1;
        first_while: while (true)
            switch (this.s.charAt(p2)) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    p2++;
                    break;
                default:
                    break first_while;
            }

        // noinspection UnreachableCodeJS
        {
            const len = p2 - this.p;
            if (this.s.charAt(p2) !== ".") return this.readToken(len,tt.int, Number.parseInt);
        }

        second_while: while (true)
            switch (this.s.charAt(p2)) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    p2++;
                    break;
                default:
                    break second_while;
            }

        // noinspection UnreachableCodeJS
        const len = p2 - this.p;
        return this.readToken(len, tt.float, Number.parseFloat);
    }

    read_next_token_space(): IToken | undefined {
        let p2 = this.p + 1;
        while (true)
            switch (this.s.charAt(p2)) {
                case "\r":
                case "\n":
                case " ":
                case "\t":
                    p2++;
                    break;
                default:
                    return this.readToken(p2 - this.p, tt.space);
            }
    }

    read_next_token_singleline_comment(): IToken | undefined {
        if (this.s.substr(this.p, 2) === "//") {
            let p2 = this.p + 2;
            while (true)
                switch (this.s.charAt(p2)) {
                    case "\r":
                    case "\n":
                        p2++;
                        return this.readToken(p2 - this.p, tt.comment);

                    default:
                        p2++;
                        break;
                }

            return this.readToken(p2 - this.p, tt.comment);
        }
        return undefined;
    }

    read_next_token_multiline_comment(): IToken | undefined {
        if (this.s.substr(this.p, 2) === "/*") {
            let p2 = this.p + 2;
            while (true)
                switch (this.s.charAt(p2)) {
                    case "*":
                        if (this.s.charAt(p2 + 1) === "/") {
                            p2 += 2;
                            return this.readToken(p2 - this.p, tt.comment);
                        } else {
                            p2++;
                            break;
                        }

                    case "\r":
                        p2++;
                        break;

                    default:
                        p2++;
                        break;
                }
            throw new LexerError("E", "CODE00000171", this, `Missing closing */`);
        }
        return undefined;
    }

    read_next_token_code(): IToken | undefined {
        if (this.s.substr(this.p, 5) === "CODE{") {
            let p2 = this.p + 2;
            while (true)
                switch (this.s.charAt(p2)) {
                    case "}":
                        if (this.s.substr(p2, 5) === "}CODE") {
                            p2+=5;
                            return this.readToken(p2 - this.p, tt.code, parseCODEBlock);
                        } else {
                            p2++;
                            break;
                        }

                    case "\r":
                        p2++;
                        break;

                    default:
                        p2++;
                        break;
                }
            throw new LexerError("E", "CODE00000172", this, `Missing closing }CODE.`);
        }
        return undefined;
    }

    read_next_token_squoted(): IToken | undefined {
        let p2 = this.p + 1;
        let v = "";
        while (true)
            switch (this.s.charAt(p2)) {
                case "":
                    throw new LexerError("E", "CODE00000173", this, `Missing closing quote ['].`);
                case "\\":
                    p2++;
                    switch (this.s.charAt(p2)) {
                        case "t":
                            v += "\t";
                            break;
                        case "r":
                            v += "\r";
                            break;
                        case "n":
                            v += "\n";
                            break;
                        default:
                            v += this.s.charAt(p2);
                            break;
                    }
                    p2++;
                    break;
                case "'":
                    p2++;
                    return this.readToken(p2 - this.p, tt.squoted, parseEscapedStringValue);
                default:
                    v += this.s.charAt(p2);
                    p2++;
            }
    }

    read_next_token_dquoted(): IToken | undefined {
        let p2 = this.p + 1;
        let v = "";
        while (true)
            switch (this.s.charAt(p2)) {
                case "":
                    throw new LexerError("E", "CODE00000157", this, `Missing closing quote ["].`);
                case "\\":
                    p2++;
                    switch (this.s.charAt(p2)) {
                        case "t":
                            v += "\t";
                            break;
                        case "r":
                            v += "\r";
                            break;
                        case "n":
                            v += "\n";
                            break;
                        default:
                            v += this.s.charAt(p2);
                            break;
                    }
                    p2++;
                    break;
                case '"':
                    p2++;
                    return this.readToken(p2 - this.p, tt.dquoted, parseEscapedStringValue);
                default:
                    v += this.s.charAt(p2);
                    p2++;
            }
    }

    read_next_token_tquoted(): IToken | undefined {
        let p2 = this.p + 1;
        let v = "";
        while (true)
            switch (this.s.charAt(p2)) {
                case "":
                    throw new LexerError("E", "CODE00000158", this, `Missing closing quote [\`].`);
                case "`":
                    p2++;
                    return this.readToken(p2 - this.p, tt.tquoted, parseEscapedStringValue);
                default:
                    v += this.s.charAt(p2);
                    p2++;
            }
    }

    read_all(): IToken[] {
        const r: IToken[] = [];
        while (true) {
            const rr = this.advance();
            if (rr) r.push(rr);
            else break;
        }
        return r;
    }

    read_next_token(): IToken | undefined {
        while (true) {
            switch (this.s.charAt(this.p)) {
                case "":
                    return undefined;

                case "+":
                    if (this.s.charAt(this.p + 1) === "+" || this.s.charAt(this.p + 1) === "=") return this.readToken(2, tt.punctuator);

                    return this.readToken(1, tt.punctuator);

                case "-":
                    if (this.s.charAt(this.p + 1) === "-" || this.s.charAt(this.p + 1) === "=") return this.readToken(2, tt.punctuator);
                    return this.readToken(1, tt.punctuator);

                case "*":
                    if (this.s.charAt(this.p + 1) === "=") return this.readToken(2, tt.punctuator);
                    return this.readToken(1, tt.punctuator);

                case "/":
                    if (this.s.charAt(this.p + 1) === "*") {
                        const r = this.read_next_token_multiline_comment();
                        if (r && this.skip_comments) continue;
                        return r;
                    } else if (this.s.charAt(this.p + 1) === "/") {
                        const r = this.read_next_token_singleline_comment();
                        if (r && this.skip_comments) continue;
                        return r;
                    } else if (this.s.charAt(this.p + 1) === "=") return this.readToken(2, tt.punctuator);
                    return this.readToken(1, tt.punctuator);

                case "&":
                    if (this.s.charAt(this.p + 1) === "&") return this.readToken(2, tt.punctuator);
                    return this.readToken(1, tt.punctuator);

                case "<":
                    if (this.s.charAt(this.p + 1) === "=") return this.readToken(2, tt.punctuator);
                    return this.readToken(1, tt.punctuator);

                case ">":
                    if (this.s.charAt(this.p + 1) === "=") return this.readToken(2, tt.punctuator);
                    return this.readToken(1, tt.punctuator);

                case "=":
                    if (this.s.charAt(this.p + 1) === "=") return this.readToken(2, tt.punctuator);
                    return this.readToken(1, tt.punctuator);

                case "|":
                    if (this.s.charAt(this.p + 1) === "|") return this.readToken(2, tt.punctuator);
                    return this.readToken(1, tt.punctuator);

                case ".":
                case "\\":
                case ":":
                case "%":
                case "!":
                case "?":
                case "#":
                case ";":
                case ",":
                case "(":
                case ")":
                case "{":
                case "}":
                case "[":
                case "]":
                case "$":
                case "@":
                    return this.readToken(1, tt.punctuator);

                case "C":
                    if (this.s.substr(this.p, 5) === "CODE{") return this.read_next_token_code();
                case "_":
                case "a":
                case "b":
                case "c":
                case "d":
                case "e":
                case "f":
                case "g":
                case "h":
                case "i":
                case "j":
                case "k":
                case "l":
                case "m":
                case "n":
                case "o":
                case "p":
                case "q":
                case "r":
                case "s":
                case "t":
                case "u":
                case "v":
                case "w":
                case "x":
                case "y":
                case "z":
                case "A":
                case "B":
                case "D":
                case "E":
                case "F":
                case "G":
                case "H":
                case "I":
                case "J":
                case "K":
                case "L":
                case "M":
                case "N":
                case "O":
                case "P":
                case "Q":
                case "R":
                case "S":
                case "T":
                case "U":
                case "V":
                case "W":
                case "X":
                case "Y":
                case "Z":
                case "а":
                case "б":
                case "в":
                case "г":
                case "д":
                case "е":
                case "ж":
                case "з":
                case "и":
                case "й":
                case "к":
                case "л":
                case "м":
                case "н":
                case "о":
                case "п":
                case "р":
                case "с":
                case "т":
                case "у":
                case "ф":
                case "х":
                case "ц":
                case "ч":
                case "ш":
                case "щ":
                case "ъ":
                case "ы":
                case "ь":
                case "э":
                case "ю":
                case "я":
                case "А":
                case "Б":
                case "В":
                case "Г":
                case "Д":
                case "Е":
                case "Ж":
                case "З":
                case "И":
                case "Й":
                case "К":
                case "Л":
                case "М":
                case "Н":
                case "О":
                case "П":
                case "Р":
                case "С":
                case "Т":
                case "У":
                case "Ф":
                case "Х":
                case "Ц":
                case "Ч":
                case "Ш":
                case "Щ":
                case "Ъ":
                case "Ы":
                case "Ь":
                case "Э":
                case "Ю":
                case "Я":
                case "ё":
                case "Ё":
                    return this.read_next_token_identifier();

                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    return this.read_next_token_number();
                case "'":
                    return this.read_next_token_squoted();
                case '"':
                    return this.read_next_token_dquoted();
                case "`":
                    return this.read_next_token_tquoted();

                case "\r":
                case "\n":
                case " ":
                case "\t":
                    const r = this.read_next_token_space();
                    if(this.skip_spaces)
                        continue;
                    return r;

                default:
                    let s = "Char '" + this.s.charAt(this.p) + "' not in switch";
                    console.log(s);
                    throw new LexerError("E", "CODE00000159", this, s);
            }
        }
    }
}

export function lexAll<CompilationContextT = unknown>(s: string, filePath: string, context: CompilationContextT): IToken[] {
    return new Lexer<CompilationContextT>(s, filePath, context).read_all();
}
