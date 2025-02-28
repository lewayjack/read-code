import * as Cesium from 'cesium';
import { positionFromCartesian } from './czmConverts';
export function getPolygonPointsFromHierarchy(hierarchy: Cesium.PolygonHierarchy, points?: [number, number, number][][]) {
    let pointsArr: [number, number, number][][] = points || [];
    if (hierarchy.positions) {
        pointsArr[pointsArr.length] ?? (pointsArr[pointsArr.length] = [])
        //@ts-ignore
        pointsArr[pointsArr.length - 1].push(...hierarchy.positions.map((e: Cesium.Cartesian3) => positionFromCartesian(e)));
    }
    if (hierarchy.holes) {
        hierarchy.holes.forEach((e: Cesium.PolygonHierarchy) => {
            pointsArr = getPolygonPointsFromHierarchy(e, pointsArr)
        })
    }
    return pointsArr;
}