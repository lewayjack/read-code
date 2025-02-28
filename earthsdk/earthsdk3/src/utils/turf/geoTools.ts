import intersect from '@turf/intersect';
import union from '@turf/union';
import buffer from '@turf/buffer';
import difference from '@turf/difference';
import circle from '@turf/circle';
import booleanContains from '@turf/boolean-contains';
import booleanWithin from '@turf/boolean-within';
import { Units, lineString, polygon } from '@turf/helpers';
import { ESJVector2DArray, ESJVector3D, ESJVector3DArray } from '../../ESJTypes';

/**
 * @description 两个多边形交集计算
 * @param polygon1 多边形1
 * @param polygon2 多边形2
 * @returns  两个多边形交集多边形
 */
function geoIntersect(polygon1: ESJVector3DArray, polygon2: ESJVector3DArray) {
    //判断首尾是否一致
    if (polygon1[0][0] !== polygon1[polygon1.length - 1][0] || polygon1[0][1] !== polygon1[polygon1.length - 1][1] || polygon1[0][2] !== polygon1[polygon1.length - 1][2]) {
        polygon1.push(polygon1[0]);
    }
    if (polygon2[0][0] !== polygon2[polygon2.length - 1][0] || polygon2[0][1] !== polygon2[polygon2.length - 1][1] || polygon2[0][2] !== polygon2[polygon2.length - 1][2]) {
        polygon2.push(polygon2[0]);
    }

    const p = intersect(polygon([polygon1]), polygon([polygon2]));
    if (p) {
        return p.geometry.coordinates as ESJVector2DArray[] | ESJVector2DArray[][];
    } else {
        return undefined
    }
}
/**
 * @description 两个多边形并集计算
 * @param polygon1 多边形1
 * @param polygon2 多边形2
 * @returns  两个多边形并集多边形，一个或者多个多边形
 */
function geoUnion(polygon1: ESJVector3DArray, polygon2: ESJVector3DArray) {
    //判断首尾是否一致
    if (polygon1[0][0] !== polygon1[polygon1.length - 1][0] || polygon1[0][1] !== polygon1[polygon1.length - 1][1] || polygon1[0][2] !== polygon1[polygon1.length - 1][2]) {
        polygon1.push(polygon1[0]);
    }
    if (polygon2[0][0] !== polygon2[polygon2.length - 1][0] || polygon2[0][1] !== polygon2[polygon2.length - 1][1] || polygon2[0][2] !== polygon2[polygon2.length - 1][2]) {
        polygon2.push(polygon2[0]);
    }
    const p = union(polygon([polygon1]), polygon([polygon2]));
    if (p) {
        return p.geometry.coordinates as ESJVector2DArray[] | ESJVector2DArray[][];
    } else {
        return undefined
    }
}

/**
 * @description 线条缓冲区
 * @param line 线
 * @param radius  半径
 * @param units   单位默认m
 * @returns   线条缓冲区多边形
 */
function geoBuffer(line: ESJVector3DArray, radius: number = 500, units: string = 'meters') {
    const p = buffer(lineString(line), radius, { units } as { units: Units });
    if (p) {
        return p.geometry.coordinates as ESJVector2DArray[];
    } else {
        return undefined
    }
}
//计算差异
/**
 * @description 两个多边形差异计算
 * @param polygon1 多边形1
 * @param polygon2  多边形2
 * @returns   两个多边形差异多边形，一个或者多个多边形
 */
function geoDifference(polygon1: ESJVector3DArray, polygon2: ESJVector3DArray) {
    //判断首尾是否一致
    if (polygon1[0][0] !== polygon1[polygon1.length - 1][0] || polygon1[0][1] !== polygon1[polygon1.length - 1][1] || polygon1[0][2] !== polygon1[polygon1.length - 1][2]) {
        polygon1.push(polygon1[0]);
    }
    if (polygon2[0][0] !== polygon2[polygon2.length - 1][0] || polygon2[0][1] !== polygon2[polygon2.length - 1][1] || polygon2[0][2] !== polygon2[polygon2.length - 1][2]) {
        polygon2.push(polygon2[0]);
    }
    const p = difference(polygon([polygon1]), polygon([polygon2]));
    if (p) {
        return p.geometry.coordinates as ESJVector2DArray[] | ESJVector2DArray[][];
    } else {
        return undefined
    }
}

/**
 * @description 圆形转变多边形
 * @param center   圆心
 * @param radius  半径
 * @param steps   圆周点数
 * @param units   单位默认m
 * @returns   多边形
 */
function geoPolygonFromCircle(center: ESJVector3D, radius: number, steps: number = 10, units: string = 'meters') {
    const options = { steps, units: units as Units };
    const polygon = circle(center, radius, options);
    return polygon.geometry.coordinates as ESJVector2DArray[];
}

//计算多边形是否在另一个多边形内
/**
 * @description 多边形是否在另一个多边形内
 * @param polygon1 多边形1
 * @param polygon2  多边形2
 * @returns  false | "oneBig" | "twoBig"
 */
function geoPolygonOverlap(polygon1: ESJVector3DArray, polygon2: ESJVector3DArray) {
    //判断首尾是否一致
    if (polygon1[0][0] !== polygon1[polygon1.length - 1][0] || polygon1[0][1] !== polygon1[polygon1.length - 1][1] || polygon1[0][2] !== polygon1[polygon1.length - 1][2]) {
        polygon1.push(polygon1[0]);
    }
    if (polygon2[0][0] !== polygon2[polygon2.length - 1][0] || polygon2[0][1] !== polygon2[polygon2.length - 1][1] || polygon2[0][2] !== polygon2[polygon2.length - 1][2]) {
        polygon2.push(polygon2[0]);
    }
    const poly1 = polygon([polygon1]);
    const poly2 = polygon([polygon2]);
    if (booleanContains(poly1, poly2)) {//第二个完全在第一个中
        return 'oneBig'

    } else if (booleanWithin(poly1, poly2)) {//第一个完全在第二个中
        return 'twoBig'
    } else return false
}

export { geoIntersect, geoUnion, geoBuffer, geoDifference, geoPolygonFromCircle, geoPolygonOverlap }
