export type Jsonable = undefined | string | number | boolean | JsonableObject | JsonableArray;

export interface JsonableObject {
    [x: string]: Jsonable;
}

export interface JsonableArray extends Array<Jsonable> {}
