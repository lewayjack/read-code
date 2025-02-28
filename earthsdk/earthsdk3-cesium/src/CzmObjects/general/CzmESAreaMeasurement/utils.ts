import { geoArea, geoCenterOfMass, geoDistance } from "earthsdk3";
export const areaToHumanStr = (d: number) => {
    if (Math.abs(d) < 1000000) {
        return `${d.toFixed(2)} m²`;
    } else {
        return `${(d / 1000000).toFixed(2)} km²`;
    }
}
export const distanceToHumanStr = (d: number) => {
    if (Math.abs(d) < 1000) {
        return `${d.toFixed(2)} m`;
    } else {
        return `${(d / 1000).toFixed(2)} km`;
    }
}
export const updateDistances = (positions: [number, number, number][] | undefined) => {
    const distances: number[] = [];
    do {
        if (!positions) {
            break;
        }
        const l = positions.length;
        let accumeD = 0;
        for (let i = 0; i < l; ++i) {
            const ni = (i + 1) % l;
            const sd = geoDistance(positions[i], positions[ni]);
            const sh = Math.abs(positions[i][2] - positions[ni][2]);
            const d = Math.sqrt(sd * sd + sh * sh);
            accumeD += d;
            distances.push(accumeD);
        }
    } while (false);
    return distances;
}


export const updateArea = (positions: [number, number, number][] | undefined) => {
    let area: number;
    if (!positions) {
        return 0;
    }
    const l = positions.length;
    if (l < 3) {
        area = 0;
    } else {
        area = geoArea(positions);
    }
    return area
}
export const updateCenterOfMass = (positions: [number, number, number][] | undefined) => {
    let centerOfMass: [number, number, number] | undefined;
    if (!positions) {
        return;
    }
    const l = positions.length;
    if (l < 3) {
        centerOfMass = undefined;

    } else {
        centerOfMass = geoCenterOfMass(positions);
    }
    return centerOfMass
}
