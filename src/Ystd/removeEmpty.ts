export const removeEmpty = (data: any) => {
    for (let k in data) {
        if (data[k] instanceof Object) removeEmpty(data[k]);

        if (data[k] === null || data[k] === undefined || data[k] === "" || (data[k] instanceof Object && Object.keys(data[k]).length === 0))
            delete data[k];
    }
    return data;
};
export let removeUndefined = (obj: { [key: string]: any }) => {
    for (let k in obj) if (obj[k] === undefined) delete obj[k];
};
