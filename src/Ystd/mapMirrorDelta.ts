// Как использовать:
// m: Map<..., ...>         // - где-то существует
// const {deleted,mapSet} = mapMirrorDelta(m);
// onFileRead(()=> {
//      // Как-то обработать изменения
//      mapSet(k,v);
// });
//
// for(let [k,v] of deleted) {
//      // Как-то обработать удаления
// }
//

export const mapMirrorDelta = <K, V>(m: Map<K, V>) => {
    const deleted = new Map<K, V>();
    for (let [k, v] of m) deleted.set(k, v);

    return {
        deleted,
        mapSet: (k: K, v: V) => {
            m.set(k, v);
            deleted.delete(k);
        },
    };
};
