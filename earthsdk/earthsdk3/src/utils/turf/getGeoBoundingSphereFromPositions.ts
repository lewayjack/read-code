import { getMinMaxCorner } from "./getMinMaxCorner";
import { geoDistance } from "./geoDistance";

export type GeoBoundingSphereType = {
    center: [number, number, number],
    radius: number;
}

export function getGeoBoundingSphereFromPositions(positions: [number, number, number][]): GeoBoundingSphereType | undefined {
    // geoCenterOfMass(positions);
    const { minPos, maxPos, center } = getMinMaxCorner(positions);
    if (minPos.some(e => !Number.isFinite(e) || maxPos.some(e => !Number.isFinite(e)) || center.some(e => !Number.isFinite(e)))) {
        console.warn(`geoCenterAndRadiusFromPositions error: minPos.some(e => !Number.isFinite(e) || maxPos.some(e => !Number.isFinite(e)) || center.some(e => !Number.isFinite(e))`);
        return undefined;
    }

    const length = geoDistance(minPos, maxPos);
    let radius = length * .5;
    const sh = Math.abs(minPos[2] - maxPos[2]);
    if (sh != 0) {
        const tempRadius = Math.sqrt(length * length + sh * sh);
        radius = tempRadius * .5;
    }
    return { center, radius };
}
