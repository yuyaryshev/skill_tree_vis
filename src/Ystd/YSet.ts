export class YSet<T> extends Set<T> {
    addOrThrow(v: T) {
        if (this.has(v)) throw new Error(`YMap.addOrThrow '${v}' already exists`);
        this.add(v);
    }

    deleteOrThrow(v: T) {
        if (!this.delete(v)) throw new Error(`YSet.deleteOrThrow '${v}' does not exist`);
    }

    rekeyOrThrow(oldKey: T, newKey: T) {
        if (!this.has(oldKey)) throw new Error(`YDict.rekey '${oldKey}' does not exist`);

        if (this.has(newKey)) throw new Error(`YDict.rekey '${newKey}' already exists`);

        this.add(newKey);
        this.delete(oldKey);
    }
}
