import { expect } from "chai";
import { trimAll } from "Ystd";

describe("trimAll", () => {
    it("trimAll", () => {
        expect(trimAll(`123`)).to.equal("123");
        expect(trimAll(`123 abc абв`)).to.equal("123 abc абв");
        expect(trimAll(` 123 abc   абв `)).to.equal("123 abc абв");
        expect(trimAll(`\n123 abc \r\n  абв\t `)).to.equal("123 abc абв");
    });
});
