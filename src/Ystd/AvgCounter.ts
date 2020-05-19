// Usage:
//  import { AvgCounter } from 'AvgCounter';
//  let my_avg_counter = new AvgCounter(60, 5*1000);
//  my_avg_counter.inc(some_key);
//  let stats = my_avg_counter.stats();
//  // stats.keys - averange number of keys for last 5 minutes
//  // stats.values - averange number of keys for last 5 minutes

export interface IPart {
    m: Map<any, any>;
    keys: number;
    values: number;
}

// Счетчик усредненных по времени значений
export class AvgCounter {
    part?: IPart;
    parts: IPart[];
    maxParts: number;
    closed: boolean;

    constructor(maxParts: number, interval: number) {
        this.parts = [];
        this.maxParts = maxParts;
        if (!this.maxParts || this.maxParts < 2) this.maxParts = 2;
        this.next_part();
        this.closed = false;

        let worker = () => {
            this.next_part();
            if (!this.closed) setTimeout(worker, interval);
        };
        worker();
    }

    next_part(): IPart {
        this.part = { m: new Map(), keys: 0, values: 0 };
        this.parts.push(this.part);
        while (this.parts.length > this.maxParts) this.parts.splice(0, 1);
        return this.part;
    }

    inc(key: string | number = "") {
        let v: number;
        if (!this.part) this.part = this.next_part();

        this.part.m.set(key, (v = (this.part.m.get(key) || 0) + 1));
        this.part.values++;
        if (v <= 1) this.part.keys++;
    }

    stats(n: number = 0) {
        let r = { keys: 0, values: 0 };
        for (let i = this.parts.length; i >= n; i--) {
            r.keys += this.parts[i].keys;
            r.values += this.parts[i].values;
        }
        return r;
    }

    full(n: number = 0) {
        let m = new Map();
        for (let i = this.parts.length; i >= n; i--) {
            for (let p of this.parts[i].m) m.set(p[0], (m.get(p[1]) || 0) + (p[1] || 0));
        }
        return Object.assign(this.stats(), { m });
    }

    close() {
        this.closed = true;
    }
}
