export function __STACK__(offset: number = 0): any {
    let orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack) {
        return stack;
    };
    let err = new Error();
    Error.captureStackTrace(err); //, arguments.callee);
    let stack = err.stack;
    Error.prepareStackTrace = orig;
    (stack as any).splice(0, offset + 1);
    return stack;
}

export const __FILENAME__ = (offset: number = 0) => {
    return __STACK__(offset + 1)[0].getFileName();
};

export const __LINE__ = (offset: number = 0) => {
    return __STACK__(offset + 1)[0].getLineNumber();
};

export const __FUNCTIONNAME__ = (offset: number = 0) => {
    return __STACK__(offset + 1)[0].getFunctionName();
};

export interface SMSourceLocation {
    line: number;
    column: number;
    functionName: string;
    fileName: string;
    str: string;
}

export const __FULLSOURCELOCATION__ = (offset: number = 0): SMSourceLocation => {
    let sourceLocation0 = __STACK__(offset + 1)[0];
    let line = sourceLocation0.getLineNumber();
    let column = sourceLocation0.getColumnNumber();
    let typeName = sourceLocation0.getTypeName();
    let methodName = sourceLocation0.getMethodName();
    let evalOrigin = sourceLocation0.getEvalOrigin();
    let functionName = sourceLocation0.getFunctionName() || (typeName ? typeName + "." + methodName : undefined) || evalOrigin;
    let functionName2 = `functon '${functionName}' at `;
    let fileName = sourceLocation0.getFileName();
    let str = `${functionName2}${fileName}:${line}:${column}`;

    return { functionName, fileName, line, column, str };
};

export const __METHODNAME__ = (offset: number = 0) => {
    return __STACK__(offset + 1)[0].getMethodName();
};
