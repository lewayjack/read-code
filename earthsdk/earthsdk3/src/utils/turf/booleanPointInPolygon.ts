import { ESJVector2D, ESJVector2DArray } from '../../ESJTypes';
import * as turf from '@turf/turf'
/**
 * @description 判断点是否在多边形内
 * @param positions @type { ESJVector2DArray } 多边形坐标
 * @param point @type { ESJVector2D } 点坐标
 * @returns  true/false
 */
export function booleanPointInPolygon(positions: ESJVector2DArray, point: ESJVector2D) {
    //判断首尾是否一致
    if (positions[0][0] !== positions[positions.length - 1][0] || positions[0][1] !== positions[positions.length - 1][1]) {
        positions.push(positions[0]);
    }
    const pt = turf.point(point);
    const poly = turf.polygon([positions]);
    const flag = turf.booleanPointInPolygon(pt, poly);
    return flag;
}

