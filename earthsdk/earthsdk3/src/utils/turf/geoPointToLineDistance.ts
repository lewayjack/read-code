import { ESJVector2D, ESJVector3D } from '../../ESJTypes';
import { lineString, point } from '@turf/helpers';
import pointToLineDistance from '@turf/point-to-line-distance';

/**
 * @description 计算点到线的距离
 * @param p 点
 * @param l 线
 * @returns 距离单位米
 */
export function geoPointToLineDistance(p: ESJVector2D | ESJVector3D, l: (ESJVector2D | ESJVector3D)[]) {
    const pt = point(p);
    const line = lineString(l);
    const distance = pointToLineDistance(pt, line, { units: 'meters' });
    return distance;
}

