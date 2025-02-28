import { reactDeepArrayWithUndefined } from "xbsj-base";
export function reactPosition2Ds(defaultValue: [number, number][] | undefined) {
    return reactDeepArrayWithUndefined<[number, number]>(defaultValue, (a, b) => (a[0] === b[0] && a[1] === b[1]), s => [...s]);
}
export function map<T, R>(collection: Iterable<T>, func: (element: T) => R) {
    const a = new Array<R>();
    for (let element of collection) {
        a.push(func(element));
    }
    return a;
}
export function equalsN3(left: [number, number, number] | undefined, right: [number, number, number] | undefined) {
    if (left === undefined && right === undefined) return true;
    if (!left || !right) return false;
    return (left[0] === right[0] && left[1] === right[1] && left[2] === right[2]);
}

