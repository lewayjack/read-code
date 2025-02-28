import { ESJVector3D, ESJVector3DArray } from '../../ESJTypes';
import centerOfMass from '@turf/center-of-mass';
import { polygon } from "@turf/helpers";
/**
 * @description 获取中心点
 * @param positions @type { ESJVector3DArray } 点位数组
 * @returns  @type { ESJVector3D } 中心点
 */
export function geoCenterOfMass(positions: ESJVector3DArray) {
    //判断首尾是否一致
    if (positions[0][0] !== positions[positions.length - 1][0] || positions[0][1] !== positions[positions.length - 1][1] || positions[0][2] !== positions[positions.length - 1][2]) {
        positions.push(positions[0]);
    }
    const p = polygon([positions]);
    const fp = centerOfMass(p);
    const fpp = fp.geometry.coordinates;
    return [fpp[0], fpp[1], fpp[2] ?? positions[0][2] ?? 0] as ESJVector3D;
}
