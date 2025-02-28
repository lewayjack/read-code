import { ESJVector3D } from '../../ESJTypes';
import distance from '@turf/distance';
import { point } from '@turf/helpers';
/**
 * @description 计算两个经纬度之间的距离 球模型
 * @param p0  起始点
 * @param p1   终点
 * @returns  距离 单位为米
 */
export function geoDistance(p0: ESJVector3D, p1: ESJVector3D) {
    return distance(point(p0), point(p1), { units: 'meters' });
}

