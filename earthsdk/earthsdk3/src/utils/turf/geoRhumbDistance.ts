import rhumbDistance from '@turf/rhumb-distance';
import { point } from '@turf/helpers';
import { ESJVector3D } from '../../ESJTypes';
/**
 * @description 计算两点之间的距离 椭球模型
 * @param p0  起点
 * @param p1   终点
 * @returns  距离 m
 */
export function geoRhumbDistance(p0: ESJVector3D, p1: ESJVector3D) {
    return rhumbDistance(point(p0), point(p1), { units: 'meters' });
}
