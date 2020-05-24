
export type Severity = "F" | "E" | "W" | "I" | "D";
export type SeverityLong = "FATAL" | "ERROR" | "WARN " | "INFO " | "DEBUG";


export const severityLongStr = (severity: Severity): SeverityLong => {
    switch (severity) {
        case "D":
            return "DEBUG";
        case "E":
            return "ERROR";
        case "F":
            return "FATAL";
        case "I":
            return "INFO ";
        case "W":
            return "WARN ";
    }
    return "ERROR";
};
