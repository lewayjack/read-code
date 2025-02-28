import { getExtProp, setExtProp, Vector } from "xbsj-base";
import { lbhToXyz } from "./lbhToXyz";

export function getXyzFromPostion(position: [number, number, number]) {
    const propName = '__getXyzFromPostion';
    let originAndXyz = getExtProp<undefined | [origin: [number, number, number], xyz: [number, number, number]]>(position, propName);
    if (!originAndXyz || !Vector.equals(originAndXyz[0], position)) {
        originAndXyz = [[...position], lbhToXyz(position)] as [origin: [number, number, number], xyz: [number, number, number]];
        setExtProp(position, propName, originAndXyz);
    }
    return originAndXyz[1];
}
