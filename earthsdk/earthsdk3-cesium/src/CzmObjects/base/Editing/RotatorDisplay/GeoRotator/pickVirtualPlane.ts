import * as Cesium from 'cesium';

let scratchRay: Cesium.Ray | undefined;
let scratchPlane: Cesium.Plane | undefined;

export function pickVirtualPlane(scene: Cesium.Scene, planePivot: Cesium.Cartesian3, planeNormal: Cesium.Cartesian3, windowCoordinates: Cesium.Cartesian2, result?: Cesium.Cartesian3) {
    result = result || new Cesium.Cartesian3();

    scratchRay = scratchRay || new Cesium.Ray();
    scratchPlane = scratchPlane || new Cesium.Plane(Cesium.Cartesian3.UNIT_X, 0.0);

    const ray = scene.camera.getPickRay(windowCoordinates, scratchRay) as Cesium.Ray;
    const plane = Cesium.Plane.fromPointNormal(planePivot, planeNormal, scratchPlane);
    result = Cesium.IntersectionTests.rayPlane(ray, plane, result) as Cesium.Cartesian3 | undefined;

    return result;
}
