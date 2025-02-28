import { ESJVector2D, ESJVector3D } from '../../ESJTypes';
import { lineString, point } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';

/**
 * @description 获取点在线上最近的点
 * @param l 线 数组
 * @param p 点
 * @returns  
 */
export function geoNearestPointOnLine(l: (ESJVector2D | ESJVector3D)[], p: ESJVector2D | ESJVector3D) {
    const pt = point(p);
    const line = lineString(l);
    const np = nearestPointOnLine(line, pt, { units: 'meters' }) as {
        geometry: { type: 'Point', coordinates: ESJVector3D }
        properties: { dist: number, index: number, location: number }
        type: "Feature"
    };
    return np;
}
