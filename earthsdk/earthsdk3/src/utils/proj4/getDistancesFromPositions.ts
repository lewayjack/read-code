import { ESJArcType } from "@sdkSrc/ESJTypes";
import { geoDistance, geoRhumbDistance } from "../turf";
import { lbhToXyz } from "./lbhToXyz";
import { Vector } from 'xbsj-base';

export function cartesianDistance(left: [number, number, number], right: [number, number, number]) {
    const l = lbhToXyz(left);
    const r = lbhToXyz(right);
    return Vector.distance(l, r);
}

export function getDistancesFromPositions(positions: [number, number, number][], arcType: ESJArcType) {
    const distances: number[] = [];
    do {
        const l = positions.length;
        let accumeD = 0;
        for (let i = 0; i < l - 1; ++i) {
            if (arcType === undefined || arcType === 'GEODESIC') {
                const sd = geoDistance(positions[i], positions[i + 1]);
                const sh = Math.abs(positions[i][2] - positions[i + 1][2]);
                if (sh === 0) {
                    accumeD += sd;
                } else {
                    const d = Math.sqrt(sd * sd + sh * sh);
                    accumeD += d;
                }
            } else if (arcType === 'RHUMB') {
                const sd = geoRhumbDistance(positions[i], positions[i + 1]);
                const sh = Math.abs(positions[i][2] - positions[i + 1][2]);
                if (sh === 0) {
                    accumeD += sd;
                } else {
                    const d = Math.sqrt(sd * sd + sh * sh);
                    accumeD += d;
                }
            } else if (arcType === 'NONE') {
                const d = cartesianDistance(positions[i], positions[i + 1]);
                accumeD += d;
            } else {
                console.warn(`未知的arcType: ${arcType}，导致距离无法计算！`);
            }
            distances.push(accumeD);
        }
    } while (false);
    return distances;
}
