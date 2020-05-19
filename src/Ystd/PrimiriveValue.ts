import { anyJson, array, Decoder } from "@mojotech/json-type-validation";

export type PrimitiveValue = undefined | null | boolean | number | string | Date;
export type PrimitiveArray = PrimitiveValue[];
export const isPrimitiveArray = (v: any): v is PrimitiveArray => {
    return Array.isArray(v);
};
export const decoderPrimitiveArray: Decoder<PrimitiveArray> = array(anyJson());

export interface PrimitiveObject {
    [key: string]: PrimitiveValueOrArray;
}

export type PrimitiveValueOrArray = PrimitiveValue | PrimitiveValue[];
