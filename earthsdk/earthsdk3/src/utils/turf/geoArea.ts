import { ESJVector3DArray } from "../../ESJTypes";
import area from "@turf/area";
import { polygon } from "@turf/helpers";
/**
 * @description 计算多边形面积
 * @param positions  @type {ESJVector3DArray}  多边形顶点
 * @returns  面积 单位平方米
 */
export function geoArea(positions: ESJVector3DArray) {
    //判断首尾是否一致
    if (positions[0][0] !== positions[positions.length - 1][0] || positions[0][1] !== positions[positions.length - 1][1] || positions[0][2] !== positions[positions.length - 1][2]) {
        positions.push(positions[0]);
    }
    const p = polygon([positions]);
    const a = area(p);
    return a;
}
