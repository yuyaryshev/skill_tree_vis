import { expect } from "chai";

// // @ts-ignore-start
// describe(`elvis operator ?. test`, () => {
//     it('success', () => {
//         let x = {a:{b:{c:4}}};
//
//         let y = x ?. a ?. b ?. c;
//
//         expect(y).equal(4);
//     });
//
//     it('fail', () => {
//         let x = {a:{b:{c:4}}};
//
//         let y = x ?. a ?. b2 ?. c;
//
//         expect(y).equal(undefined);
//     });
//
//     it('success - func', () => {
//         let x = {a:{b:{c:() => 4}}};
//
//         let y = x ?. a ?. b ?. c();
//
//         expect(y).equal(4);
//     });
//
//     it('fail - func', () => {
//         let x = {a:{b:{c:4}}};
//
//         let y = x ?. a ?. b2 ?. c();
//
//         expect(y).equal(undefined);
//     });
// });
