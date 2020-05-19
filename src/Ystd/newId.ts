import {v4 as new_uuid} from "uuid";

export const newId = new_uuid;
export const newIdNoSep = () => new_uuid().replace(/[-]/g, "");
