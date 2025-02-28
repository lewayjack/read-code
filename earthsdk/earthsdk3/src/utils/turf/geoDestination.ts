import { ESJVector3D } from '../../ESJTypes';
import destination from '@turf/destination';
import { point } from '@turf/helpers';

/**
 * @description 根据点位、距离、方向计算目标点位 球模型
 * @param position @type {ESJVector3D} 点位
 * @param distance  距离
 * @param heading  方向
 * @param result  返回值
 * @returns  @type {ESJVector3D} 
 */
export function geoDestination(position: ESJVector3D, distance: number, heading: number, result?: ESJVector3D) {
    const [l, b, h] = position;
    const r = destination(point([l, b]), distance, heading, { units: 'meters' });
    if (!r || !r.geometry || !r.geometry.coordinates) {
        return undefined;
    }

    result = result || [0, 0, 0];
    result[0] = r.geometry.coordinates[0];
    result[1] = r.geometry.coordinates[1];
    result[2] = h;

    return result;
}
