import * as Cesium from 'cesium';

const scratchCartesian = new Cesium.Cartesian3();
const scratchRay = new Cesium.Ray();
const scratchCarto = new Cesium.Cartographic();
const scratchEllipsoid = new Cesium.Ellipsoid();

// 模拟鼠标和指定半径的球体相交，用于求取某高度上的虚拟交点
export function pickVirtualEarth(scene: Cesium.Scene, windowCoordinates: Cesium.Cartesian2, height: number, result?: Cesium.Cartographic) {
    const ray = scene.camera.getPickRay(windowCoordinates, scratchRay);
    if (!ray) {
        return undefined;
    }

    const heightCartesian = Cesium.Cartesian3.fromElements(height, height, height, scratchCartesian);
    const ellipsoidCartesian = Cesium.Cartesian3.add(heightCartesian, Cesium.Ellipsoid.WGS84.radii, scratchCartesian);
    const ellipsoid = Cesium.Ellipsoid.fromCartesian3(ellipsoidCartesian, scratchEllipsoid);

    const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);

    if (intersection) {
        const dis = intersection.start > 0 ? intersection.start : intersection.stop;
        if (dis) { // dis仍然有可能为undefined，所以此处加一个判断
            const cartesian = Cesium.Ray.getPoint(ray, dis, scratchCartesian);
            const carto = Cesium.Cartographic.fromCartesian(cartesian, undefined, scratchCarto);
            result = result || new Cesium.Cartographic();
            result.longitude = carto.longitude;
            result.latitude = carto.latitude;
            result.height = height;
            return result;
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
}
