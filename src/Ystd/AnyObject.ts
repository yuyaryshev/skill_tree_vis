export interface AnyObject {
    [key: string]: any;
}

export const isAnyObject = (v: any): v is AnyObject => v && typeof v === "object" && v.constructor === Object;
