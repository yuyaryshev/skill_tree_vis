export const encodeURIParams = (data: { [key: string]: string | number | boolean }): string => {
    let ret = [];
    for (let d in data) ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d].toString()));
    return ret.join("&");
};
