export type XbsjRoutePath = {
    positions: ([number, number] | [number, number, number])[];
    width: number;
    // color?: [number, number, number, number];
    // /**
    //  * 单位秒？
    //  */
    // startTime?: number;
    // /**
    //  * 单位秒
    //  */
    // duration?: number;
    [k: string]: any;
} | {
    startPos: [number, number, number];
    endPos: [number, number, number];
    heightRatio: number;
    width: number;
    // color: [number, number, number, number];
    // /**
    //  * 单位秒？
    //  */
    // startTime?: number;
    // /**
    //  * 单位秒
    //  */
    // duration?: number;
    [k: string]: any;
}
