import { ESJVector3D } from '../../ESJTypes';
import bearing from '@turf/bearing';
import { point } from '@turf/helpers';
/**
 * @description 计算两个点之间的方位角 球模型
 * @param p0  起点
 * @param p1  终点
 * @returns   0-360度 
 */
export function geoHeading(p0: ESJVector3D, p1: ESJVector3D) {
    const b = bearing(point(p0), point(p1));
    return b;
}
