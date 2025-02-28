import rhumbDestination from '@turf/rhumb-destination';
import { point } from '@turf/helpers';
import { ESJVector3D } from '../../ESJTypes';

/**
 * @description 根据给定的位置、距离和方向计算新的位置 椭球模型
 * @param position  [经度,纬度,高度]
 * @param distance  距离 m
 * @param heading   方向
 * @param result    [经度,纬度,高度]
 * @returns 
 */
export function geoRhumbDestination(position: ESJVector3D, distance: number, heading: number, result?: ESJVector3D) {
    const [l, b, h] = position;
    const r = rhumbDestination(point([l, b]), distance, heading, { units: 'meters' });
    if (!r || !r.geometry || !r.geometry.coordinates) {
        return undefined;
    }

    result = result || [0, 0, 0];
    result[0] = r.geometry.coordinates[0];
    result[1] = r.geometry.coordinates[1];
    result[2] = h;

    return result;
}
