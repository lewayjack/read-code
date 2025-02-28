import rhumbBearing from '@turf/rhumb-bearing';
import { point } from '@turf/helpers';
import { ESJVector3D } from '../../ESJTypes';
/**
 * @description 计算两点之间的方位角 椭球模型
 * @param p0  起点
 * @param p1  终点
 * @returns   方位角
 */
export function geoRhumbHeading(p0: ESJVector3D, p1: ESJVector3D) {
    const b = rhumbBearing(point(p0), point(p1));
    return b;
}
