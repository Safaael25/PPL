import { Result, makeFailure, makeOk, bind, either } from "../lib/result";

/* Library code */
const findOrThrow = <T>(pred: (x: T) => boolean, a: T[]): T => {
    for (let i = 0; i < a.length; i++) {
        if (pred(a[i])) return a[i];
    }
    throw "No element found.";
}

export const findResult = <T>(pred: (x: T) => boolean, a: T[]): Result<T> => 
    a.filter(pred).length > 0 ? makeOk(a.filter(pred)[0]):makeFailure('No element found');
  

/* Client code */
const returnSquaredIfFoundEven_v1 = (a: number[]): number => {
    try {
        const x = findOrThrow(x => x % 2 === 0, a);
        return x * x;

    } 
    catch (e) {
        return -1;
    }
}
// console.log(returnSquaredIfFoundEven_v1([1, 2, 3, 4, 5])); // 4
export const returnSquaredIfFoundEven_v2 : (a: number[]) => Result<number> =
    (a : number[]) => bind(
        findResult(x => x % 2 === 0, a),
        (x: number) => makeOk(x * x)
    );


export const returnSquaredIfFoundEven_v3: (a: number[]) => number = 
    (a: number[]) => either(findResult(x => x % 2 === 0, a),(x: number) => x * x,() => -1);

