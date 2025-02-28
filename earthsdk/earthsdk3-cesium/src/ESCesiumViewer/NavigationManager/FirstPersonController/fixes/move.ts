import * as Cesium from 'cesium';

var scratchMoveForward1 = new Cesium.Cartesian3();
var scratchMoveForward2 = new Cesium.Cartesian3();
function move(camera: Cesium.Camera, amount: number, moveRight: boolean) {
    let oldTransform = Cesium.Matrix4.clone(camera.transform);
    camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    var h = camera.positionCartographic.height;

    var pos = camera.positionWC;
    var earthUp = Cesium.Cartesian3.normalize(pos, scratchMoveForward1);

    var dotDU = Cesium.Cartesian3.dot(camera.direction, earthUp);
    if (dotDU > -0.9 && dotDU < 0.9) {
        var earthRight = Cesium.Cartesian3.cross(camera.direction, earthUp, scratchMoveForward2);
    } else {
        var earthRight = Cesium.Cartesian3.cross(camera.up, earthUp, scratchMoveForward2);
    }

    var axis = earthRight;
    if (moveRight) {
        var earthDirection = Cesium.Cartesian3.cross(earthUp, earthRight, scratchMoveForward1);
        axis = earthDirection;
    }

    //camera.move(direction, amount);

    var r = Cesium.Cartesian3.magnitude(pos);
    camera.rotate(axis, amount / r);

    // 确保高度不变！ vtxf 20181026
    var carto = camera.positionCartographic;
    var l = carto.longitude;
    var b = carto.latitude;
    Cesium.Cartesian3.fromRadians(l, b, h, undefined, camera.position);

    camera.lookAtTransform(oldTransform);
}

export function moveForward(camera: Cesium.Camera, amount: number) {
    move(camera, amount, false);
}

export function moveRight(camera: Cesium.Camera, amount: number) {
    move(camera, -amount, true);
}

export function moveUp(camera: Cesium.Camera, amount: number) {
    var pos = camera.positionWC;
    var oldTransform = Cesium.Matrix4.clone(camera.transform);
    camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    var carto = camera.positionCartographic;
    //var earthUp = Cesium.Cartesian3.normalize(pos, scratchMoveForward1);
    //camera.move(earthUp, amount);
    // 确保只有高度变化，经纬度不变 vtxf 20181026
    Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height + amount, undefined, camera.position);
    camera.lookAtTransform(oldTransform);
}
