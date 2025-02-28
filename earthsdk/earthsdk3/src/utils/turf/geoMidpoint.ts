import { ESJVector3D } from '@sdkSrc/ESJTypes';
import midpoint from '@turf/midpoint';
import { point } from '@turf/helpers';

export function getMidpoint(p1: ESJVector3D, p2: ESJVector3D) {
    const point1 = point(p1);
    const point2 = point(p2);
    const p3 = midpoint(point1, point2);
    const height = (p1[2] + p2[2]) / 2;
    return [...p3.geometry.coordinates, height] as ESJVector3D;
}
