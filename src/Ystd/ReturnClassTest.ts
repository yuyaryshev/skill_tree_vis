export class ProducedClass {
    x: number;
    constructor() {
        this.x = 0;
    }
}

class Test2 {
    y: ProducedClass; // ok
    constructor() {
        this.y = new ProducedClass();
    }
}
