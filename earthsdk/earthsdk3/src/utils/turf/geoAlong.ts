import { ESJVector3D, ESJVector3DArray } from '../../ESJTypes';
import along from '@turf/along';
import { lineString } from '@turf/helpers';
/**
 * @description 根据距离获取线段上的点
 * @param positions @type {ESJVector3DArray} 线段坐标数组
 * @param distance  单位为米
 * @returns  [lat,lng,alt]
 */
export function geoAlong(positions: ESJVector3DArray, distance: number) {
    const line = lineString(positions);
    const alongPt = along(line, distance, { units: 'meters' });
    return alongPt.geometry.coordinates as ESJVector3D;
}
