import * as Cesium from 'cesium';

const scratchCartesian2 = new Cesium.Cartesian3();
const scratchRay = new Cesium.Ray();
const scratchPlane = new Cesium.Plane(Cesium.Cartesian3.UNIT_X, 0.0);

// 求取绕向上轴构成的某个平面与鼠标相交，
// 目前这个平面假定为向上轴和相机right轴构成
// export function pickHeightPosition(scene: Cesium.Scene, position: Cesium.Cartographic, windowCoordinates: Cesium.Cartesian2, result?: Cesium.Cartographic) {
export function pickHeightPosition(scene: Cesium.Scene, pivot: Cesium.Cartesian3, windowCoordinates: Cesium.Cartesian2, result?: Cesium.Cartesian3) {
    // console.log(`pivot: ${pivot.toString()} windowCoordinates: ${windowCoordinates.toString()}`);
    // 模型高度方向和相机right方向建立plane
    // const pivot = Cesium.Cartesian3.fromRadians(position.longitude, position.latitude, position.height, undefined, scratchCartesian); 
    const pivotNormal = Cesium.Cartesian3.normalize(pivot, scratchCartesian2);
    
    const planeNormal = Cesium.Cartesian3.cross(scene.camera.right, pivotNormal, scratchCartesian2);

    // 计算过北极的面片，方便以后做平面平移
    // const scratchCC = new Cesium.Cartesian3(0, 0, 6378137);
    // const pivotToNorth = Cesium.Cartesian3.subtract(scratchCC, pivot, scratchCC);
    // const pivotEast = Cesium.Cartesian3.cross(pivotToNorth, pivotNormal, new Cesium.Cartesian3());
    // const planeNormal = pivotEast;

    Cesium.Cartesian3.normalize(planeNormal, planeNormal);
    const plane = Cesium.Plane.fromPointNormal(pivot, planeNormal, scratchPlane);

    // 相机拾取射线求交这个plane
    const ray = scene.camera.getPickRay(windowCoordinates, scratchRay);
    if (!ray) {
        return undefined;
    }

    return Cesium.IntersectionTests.rayPlane(ray, plane, result);
}
