export abstract class YDictGeneric<K, V> {
    m: Map<K, V>;
    abstract getKey(v: V): K;

    constructor() {
        this.m = new Map();
    }

    construct(k: K): V {
        let r = ({} as any) as V;
        if ((this as any).setKey) (this as any).setKey(r, k);
        return r;
    }

    has(k: K) {
        return this.m.has(k);
    }

    get(k: K) {
        return this.m.get(k);
    }

    delete(k: K) {
        return this.m.delete(k);
    }

    add(v: V) {
        return this.m.set(this.getKey(v), v);
    }

    getOrCreate(k: K): V {
        let r = this.get(k);
        if (r === undefined) {
            r = this.construct(k);
            this.add(r);
        }
        return r;
    }

    expect(k: K): V {
        let r = this.get(k);
        if (r === undefined) throw new Error(`YDict.expect '${k}' does not exist`);
        return r;
    }

    createOrThrow(k: K) {
        if (this.has(k)) throw new Error(`YDict.createOrThrow '${k}' already exists`);
        let r = this.construct(k);
        this.add(r);
        return r;
    }

    setEmptyOrThrow(k: K, v: V): void {
        if (this.has(k)) throw new Error(`YDict.setFree '${k}' already exists`);
        this.add(v);
    }

    deleteOrThrow(k: K) {
        if (!this.delete(k)) throw new Error(`YDict.deleteOrThrow '${k}' does not exist`);
    }

    rekeyOrThrow(oldKey: K, newKey: K) {
        let v = this.get(oldKey);
        if (v === undefined) throw new Error(`YDict.rekey '${oldKey}' does not exist`);

        if (this.has(newKey)) throw new Error(`YDict.rekey '${newKey}' already exists`);

        this.m.set(newKey, v);
        this.m.delete(oldKey);
    }

    addOrThrow(v: V) {
        let k = this.getKey(v);
        if (this.has(k)) throw new Error(`YDict.addOrThrow key '${k}' already exists`);
        this.add(v);
    }

    *[Symbol.iterator]() {
        for (let pv of this.m) yield pv[1];
    }
}

export const makeYDictGenericClass = <K, CV extends { new (...args: any): any }>(elemClass: CV, prop: string) => {
    type V = InstanceType<typeof elemClass>;
    return class LambdaYDict extends YDictGeneric<K, V> {
        getKey(v: V): K {
            return ((v as any)[prop] as any) as K;
        }

        setKey(v: V, k: K): void {
            (v as any)[prop] = k;
        }

        construct(k: K): V {
            let v = new elemClass(k) as any;
            (v as any)[prop] = k;
            return v;
        }
    };
};

export interface WithIdAndName<IDT> {
    id: IDT;
    name: string;
}

export class YDictIdNameSequential<IDT, V extends WithIdAndName<IDT>> {
    itemClass: any;
    sequence: V[];
    byIdMap: Map<IDT, V>;
    byNameMap: Map<string, V>;

    constructor(itemClass: any) {
        this.itemClass = itemClass;
        this.sequence = [];
        this.byIdMap = new Map();
        this.byNameMap = new Map();
    }

    create(...args: any[]): V {
        let r = new this.itemClass(...args);
        this.add(r);
        return r;
    }

    hasId(k: IDT) {
        return this.byIdMap.has(k);
    }

    hasName(k: string) {
        return this.byNameMap.has(k);
    }

    getById(k: IDT) {
        return this.byIdMap.get(k);
    }

    getByName(k: string) {
        return this.byNameMap.get(k);
    }

    add(v: V) {
        let id = v.id;
        if (id !== undefined) {
            if (this.byIdMap.has(id)) throw new Error(`YDictIdNameSequential.add id='${id}' already exist`);
            this.byIdMap.set(v.id, v);
        }

        let name = v.name;
        if (name) {
            if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.add name='${name}' already exist`);
            this.byNameMap.set(name, v);
        }

        this.sequence.push(v);
        return v;
    }

    getOrCreateById(id: IDT, ...createArgs: any[]): V {
        let r = this.byIdMap.get(id);
        if (r === undefined) {
            r = this.create(...createArgs);
            this.add(r);
        }
        return r;
    }

    getOrCreateByName(name: string, ...createArgs: any[]): V {
        let r = this.byNameMap.get(name);
        if (r === undefined) {
            r = this.create(...createArgs);
            this.add(r);
        }
        return r;
    }

    expectById(id: IDT): V {
        let r = this.byIdMap.get(id);
        if (r === undefined) throw new Error(`YDictIdNameSequential.expectById '${id}' does not exist`);
        return r;
    }

    expectByName(name: string): V {
        let r = this.byNameMap.get(name);
        if (r === undefined) throw new Error(`YDictIdNameSequential.expectByName '${name}' does not exist`);
        return r;
    }

    createByNameOrThrow(name: string, ...createArgs: any[]) {
        if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.createByNameOrThrow '${name}' already exists`);
        this.create(...createArgs);
    }

    deleteByV(v: V) {
        this.byIdMap.delete(v.id);
        this.byNameMap.delete(v.name);
        let index = this.sequence.indexOf(v);
        if (index >= 0) this.sequence.splice(index, 1);
    }

    deleteById(id: IDT) {
        let v = this.byIdMap.get(id);
        if (v) this.deleteByV(v);
    }

    deleteByName(name: string) {
        let v = this.byNameMap.get(name);
        if (v) this.deleteByV(v);
    }

    deleteByIdOrThrow(id: IDT) {
        let v = this.byIdMap.get(id);
        if (!v) throw new Error(`YDictIdNameSequential.deleteByIdOrThrow id='${id}' doesn't exist`);
        this.deleteByV(v);
    }

    deleteByNameOrThrow(name: string) {
        let v = this.byNameMap.get(name);
        if (!v) throw new Error(`YDictIdNameSequential.deleteByIdOrThrow name='${name}' doesn't exist`);
        this.deleteByV(v);
    }

    renameOrThrow(oldName: string, newName: string) {
        let v = this.byNameMap.get(oldName);
        if (v === undefined) throw new Error(`YDictIdNameSequential.renameOrThrow '${oldName}' does not exist`);

        if (oldName !== newName) {
            if (this.byNameMap.has(newName)) throw new Error(`YDictIdNameSequential.renameOrThrow '${newName}' already exists`);

            this.byNameMap.set(newName, v);
            v.name = newName;
            this.byNameMap.delete(oldName);
        }
    }

    changeIdOrThrow(oldId: IDT, newId: IDT) {
        let v = this.byIdMap.get(oldId);
        if (v === undefined) throw new Error(`YDictIdNameSequential.changeIdOrThrow '${oldId}' does not exist`);

        if (oldId !== newId) {
            if (this.byIdMap.has(newId)) throw new Error(`YDictIdNameSequential.changeIdOrThrow '${newId}' already exists`);

            this.byIdMap.set(newId, v);
            v.id = newId;
            this.byIdMap.delete(oldId);
        }
    }

    *[Symbol.iterator]() {
        for (let pv of this.sequence) yield pv;
    }

    map(cb: (v: V, index: number) => any) {
        let r: any[] = [];
        let index = 0;
        for (let pv of this.sequence) {
            let ri = cb(pv, index++);
            if (ri !== undefined) r.push(ri);
        }
        return r;
    }

    rebuildIndexes() {
        this.byIdMap = new Map();
        this.byNameMap = new Map();
        for (let v of this.sequence) {
            let id = v.id;
            let name = v.name;
            if (id) {
                if (this.byIdMap.has(id)) throw new Error(`YDictIdNameSequential.add id='${id}' already exist`);
                this.byIdMap.set(id, v);
            }

            if (name) {
                if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.add name='${name}' already exist`);
                this.byNameMap.set(name, v);
            }
        }
    }

    get array(): V[] {
        return this.sequence;
    }

    get empty() {
        return !this.sequence.length;
    }
}

export class YDictIdNameUnordered<IDT, V extends WithIdAndName<IDT>> {
    itemClass: any;
    byIdMap: Map<IDT, V>;
    byNameMap: Map<string, V>;

    constructor(itemClass: any) {
        this.itemClass = itemClass;
        this.byIdMap = new Map();
        this.byNameMap = new Map();
    }

    create(...args: any[]): V {
        let r = new this.itemClass(...args);
        this.add(r);
        return r;
    }

    hasId(k: IDT) {
        return this.byIdMap.has(k);
    }

    hasName(k: string) {
        return this.byNameMap.has(k);
    }

    getById(k: IDT) {
        return this.byIdMap.get(k);
    }

    getByName(k: string) {
        return this.byNameMap.get(k);
    }

    add(v: V) {
        let id = v.id;
        if (id !== undefined) {
            if (this.byIdMap.has(id)) throw new Error(`YDictIdNameSequential.add id='${id}' already exist`);
            this.byIdMap.set(v.id, v);
        }

        let name = v.name;
        if (name) {
            if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.add name='${name}' already exist`);
            this.byNameMap.set(name, v);
        }
    }

    getOrCreateById(id: IDT, ...createArgs: any[]): V {
        let r = this.byIdMap.get(id);
        if (r === undefined) {
            r = this.create(...createArgs);
            this.add(r);
        }
        return r;
    }

    getOrCreateByName(name: string, ...createArgs: any[]): V {
        let r = this.byNameMap.get(name);
        if (r === undefined) {
            r = this.create(...createArgs);
            this.add(r);
        }
        return r;
    }

    expectById(id: IDT): V {
        let r = this.byIdMap.get(id);
        if (r === undefined) throw new Error(`YDictIdNameSequential.expectById '${id}' does not exist`);
        return r;
    }

    expectByName(name: string): V {
        let r = this.byNameMap.get(name);
        if (r === undefined) throw new Error(`YDictIdNameSequential.expectByName '${name}' does not exist`);
        return r;
    }

    createByNameOrThrow(name: string, ...createArgs: any[]) {
        if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.createByNameOrThrow '${name}' already exists`);
        this.create(...createArgs);
    }

    deleteByV(v: V) {
        this.byIdMap.delete(v.id);
        this.byNameMap.delete(v.name);
    }

    deleteById(id: IDT) {
        let v = this.byIdMap.get(id);
        if (v) this.deleteByV(v);
    }

    deleteByName(name: string) {
        let v = this.byNameMap.get(name);
        if (v) this.deleteByV(v);
    }

    deleteByIdOrThrow(id: IDT) {
        let v = this.byIdMap.get(id);
        if (!v) throw new Error(`YDictIdNameSequential.deleteByIdOrThrow id='${id}' doesn't exist`);
        this.deleteByV(v);
    }

    deleteByNameOrThrow(name: string) {
        let v = this.byNameMap.get(name);
        if (!v) throw new Error(`YDictIdNameSequential.deleteByIdOrThrow name='${name}' doesn't exist`);
        this.deleteByV(v);
    }

    renameOrThrow(oldName: string, newName: string) {
        let v = this.byNameMap.get(oldName);
        if (v === undefined) throw new Error(`YDictIdNameSequential.renameOrThrow '${oldName}' does not exist`);

        if (oldName !== newName) {
            if (this.byNameMap.has(newName)) throw new Error(`YDictIdNameSequential.renameOrThrow '${newName}' already exists`);

            this.byNameMap.set(newName, v);
            v.name = newName;
            this.byNameMap.delete(oldName);
        }
    }

    changeIdOrThrow(oldId: IDT, newId: IDT) {
        let v = this.byIdMap.get(oldId);
        if (v === undefined) throw new Error(`YDictIdNameSequential.changeIdOrThrow '${oldId}' does not exist`);

        if (oldId !== newId) {
            if (this.byIdMap.has(newId)) throw new Error(`YDictIdNameSequential.changeIdOrThrow '${newId}' already exists`);

            this.byIdMap.set(newId, v);
            v.id = newId;
            this.byIdMap.delete(oldId);
        }
    }

    *[Symbol.iterator]() {
        for (let pv of this.byIdMap) yield pv[1];
    }

    get array(): V[] {
        let s = new Set<V>();
        for (let p of this.byIdMap) s.add(p[1]);
        for (let p of this.byNameMap) s.add(p[1]);

        return [...s.values()];
    }

    get arrayFromIdMap(): V[] {
        return [...this.byIdMap.values()];
    }

    get arrayFromNameMap(): V[] {
        return [...this.byNameMap.values()];
    }

    map(cb: (v: V, index: number) => any) {
        let r: any[] = [];
        let index = 0;
        for (let pv of this.byIdMap) {
            let ri = cb(pv[1], index++);
            if (ri !== undefined) r.push(ri);
        }
        return r;
    }

    rebuildIndexesFromNameIndex() {
        this.byIdMap = new Map();
        for (let p of this.byNameMap) {
            let v = p[1];
            let id = v.id;
            if (id) {
                if (this.byIdMap.has(id)) throw new Error(`YDictIdNameSequential.add id='${id}' already exist`);
                this.byIdMap.set(id, v);
            }
        }
    }

    rebuildIndexesFromIdIndex() {
        this.byNameMap = new Map();
        for (let p of this.byIdMap) {
            let v = p[1];
            let name = v.name;
            if (name) {
                if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.add name='${name}' already exist`);
                this.byNameMap.set(name, v);
            }
        }
    }

    get empty() {
        return !this.byIdMap.size;
    }
}

export interface WithName {
    name: string;
}

export class YDictNameSequential<V extends WithName> {
    itemClass: any;
    sequence: V[];
    byNameMap: Map<string, V>;

    constructor(itemClass: any) {
        this.itemClass = itemClass;
        this.sequence = [];
        this.byNameMap = new Map();
    }

    create(...args: any[]): V {
        let r = new this.itemClass(...args);
        this.add(r);
        return r;
    }

    hasName(k: string) {
        return this.byNameMap.has(k);
    }

    getByName(k: string) {
        return this.byNameMap.get(k);
    }

    add(v: V) {
        let name = v.name;
        if (name) {
            if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.add name='${name}' already exist`);
            this.byNameMap.set(name, v);
        }

        this.sequence.push(v);
    }

    getOrCreateByName(name: string, ...createArgs: any[]): V {
        let r = this.byNameMap.get(name);
        if (r === undefined) {
            r = this.create(...createArgs);
            this.add(r);
        }
        return r;
    }

    expectByName(name: string): V {
        let r = this.byNameMap.get(name);
        if (r === undefined) throw new Error(`YDictIdNameSequential.expectByName '${name}' does not exist`);
        return r;
    }

    createByNameOrThrow(name: string, ...createArgs: any[]) {
        if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.createByNameOrThrow '${name}' already exists`);
        this.create(...createArgs);
    }

    deleteByV(v: V) {
        this.byNameMap.delete(v.name);
        let index = this.sequence.indexOf(v);
        if (index >= 0) this.sequence.splice(index, 1);
    }

    deleteByName(name: string) {
        let v = this.byNameMap.get(name);
        if (v) this.deleteByV(v);
    }

    deleteByNameOrThrow(name: string) {
        let v = this.byNameMap.get(name);
        if (!v) throw new Error(`YDictIdNameSequential.deleteByIdOrThrow name='${name}' doesn't exist`);
        this.deleteByV(v);
    }

    renameOrThrow(oldName: string, newName: string) {
        let v = this.byNameMap.get(oldName);
        if (v === undefined) throw new Error(`YDictIdNameSequential.renameOrThrow '${oldName}' does not exist`);

        if (oldName !== newName) {
            if (this.byNameMap.has(newName)) throw new Error(`YDictIdNameSequential.renameOrThrow '${newName}' already exists`);

            this.byNameMap.set(newName, v);
            v.name = newName;
            this.byNameMap.delete(oldName);
        }
    }

    *[Symbol.iterator]() {
        for (let pv of this.sequence) yield pv;
    }

    map(cb: (v: V, index: number) => any) {
        let r: any[] = [];
        let index = 0;
        for (let pv of this.sequence) {
            let ri = cb(pv, index++);
            if (ri !== undefined) r.push(ri);
        }
        return r;
    }

    rebuildIndexes() {
        this.byNameMap = new Map();
        for (let v of this.sequence) {
            let name = v.name;
            if (name) {
                if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.add name='${name}' already exist`);
                this.byNameMap.set(name, v);
            }
        }
    }

    get array(): V[] {
        return this.sequence;
    }

    get empty() {
        return !this.sequence.length;
    }
}

export class YDictNameUnordered<V extends WithName> {
    itemClass: any;
    byNameMap: Map<string, V>;

    constructor(itemClass: any) {
        this.itemClass = itemClass;
        this.byNameMap = new Map();
    }

    create(...args: any[]): V {
        let r = new this.itemClass(...args);
        this.add(r);
        return r;
    }

    hasName(k: string) {
        return this.byNameMap.has(k);
    }

    getByName(k: string) {
        return this.byNameMap.get(k);
    }

    add(v: V) {
        let name = v.name;
        if (name) {
            if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.add name='${name}' already exist`);
            this.byNameMap.set(name, v);
        }
    }

    getOrCreateByName(name: string, ...createArgs: any[]): V {
        let r = this.byNameMap.get(name);
        if (r === undefined) {
            r = this.create(...createArgs);
            this.add(r);
        }
        return r;
    }

    expectByName(name: string): V {
        let r = this.byNameMap.get(name);
        if (r === undefined) throw new Error(`YDictIdNameSequential.expectByName '${name}' does not exist`);
        return r;
    }

    createByNameOrThrow(name: string, ...createArgs: any[]) {
        if (this.byNameMap.has(name)) throw new Error(`YDictIdNameSequential.createByNameOrThrow '${name}' already exists`);
        this.create(...createArgs);
    }

    deleteByV(v: V) {
        this.byNameMap.delete(v.name);
    }

    deleteByName(name: string) {
        let v = this.byNameMap.get(name);
        if (v) this.deleteByV(v);
    }

    deleteByNameOrThrow(name: string) {
        let v = this.byNameMap.get(name);
        if (!v) throw new Error(`YDictIdNameSequential.deleteByIdOrThrow name='${name}' doesn't exist`);
        this.deleteByV(v);
    }

    renameOrThrow(oldName: string, newName: string) {
        let v = this.byNameMap.get(oldName);
        if (v === undefined) throw new Error(`YDictIdNameSequential.renameOrThrow '${oldName}' does not exist`);

        if (oldName !== newName) {
            if (this.byNameMap.has(newName)) throw new Error(`YDictIdNameSequential.renameOrThrow '${newName}' already exists`);

            this.byNameMap.set(newName, v);
            v.name = newName;
            this.byNameMap.delete(oldName);
        }
    }

    *[Symbol.iterator]() {
        for (let pv of this.byNameMap) yield pv[1];
    }

    map(cb: (v: V, index: number) => any) {
        let r: any[] = [];
        let index = 0;
        for (let pv of this.byNameMap) {
            let ri = cb(pv[1], index++);
            if (ri !== undefined) r.push(ri);
        }
        return r;
    }

    get array(): V[] {
        return [...this.byNameMap.values()];
    }

    get empty() {
        return !this.byNameMap.size;
    }
}
