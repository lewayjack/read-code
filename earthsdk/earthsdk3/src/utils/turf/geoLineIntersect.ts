import lineIntersect from '@turf/line-intersect';
import { lineString } from '@turf/helpers';
import { ESJVector3DArray } from '../../ESJTypes';
/**
 * @description  线段相交的点
 * @param l0  线段1
 * @param l1  线段2
 * @returns   线段1和线段2的交点
 */
export function geoLineIntersect(l0: ESJVector3DArray, l1: ESJVector3DArray) {
    const b = lineIntersect(lineString(l0), lineString(l1));
    return b;
}
