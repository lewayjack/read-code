import * as Cesium from 'cesium';

// const xAxis = new Cesium.Cartesian3(1, 0, 0);
// const yAxis = new Cesium.Cartesian3(0, 1, 0);
// const zAxis = new Cesium.Cartesian3(0, 0, 1);

// /**
//  * 假设本地模型+z为正向，+y为向上轴
//  * @param rotation
//  * @param result
//  * @returns
//  */
// export function getLocalQuaternion(rotation: [number, number, number], result?: Cesium.Quaternion) {
//     const [heading, pitch, roll] = rotation;
//     // 这个算法有问题
//     // return Cesium.Quaternion.fromHeadingPitchRoll(Cesium.HeadingPitchRoll.fromDegrees(heading - 90, pitch, roll), result);
//     const headingQuat = Cesium.Quaternion.fromAxisAngle(zAxis, Cesium.Math.toRadians(-heading));
//     const pitchQuat = Cesium.Quaternion.fromAxisAngle(xAxis, Cesium.Math.toRadians(pitch));
//     const rollQuat = Cesium.Quaternion.fromAxisAngle(yAxis, Cesium.Math.toRadians(roll));
//     const finalQuat = Cesium.Quaternion.clone(Cesium.Quaternion.IDENTITY, result);
//     Cesium.Quaternion.multiply(rollQuat, finalQuat, finalQuat);
//     Cesium.Quaternion.multiply(pitchQuat, finalQuat, finalQuat);
//     Cesium.Quaternion.multiply(headingQuat, finalQuat, finalQuat);
//     return finalQuat;
// }

export function getQuaternionWithYForwardZUp(rotation: [number, number, number], result?: Cesium.Quaternion) {
    return getQuaternion(rotation, Cesium.Cartesian3.UNIT_Y, Cesium.Cartesian3.UNIT_Z, Cesium.Cartesian3.UNIT_X, result);
}
export function getQuaternionWithXForwardZUp(rotation: [number, number, number], result?: Cesium.Quaternion) {
    return getQuaternion(rotation, Cesium.Cartesian3.UNIT_X, Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3(0, -1, 0), result);
}


export function getQuaternion(rotation: [number, number, number], forwardAxis: Cesium.Cartesian3, upAxis: Cesium.Cartesian3, rightAxis: Cesium.Cartesian3, result?: Cesium.Quaternion) {
    const [heading, pitch, roll] = rotation;
    // 这个算法有问题
    // return Cesium.Quaternion.fromHeadingPitchRoll(Cesium.HeadingPitchRoll.fromDegrees(heading - 90, pitch, roll), result);
    const headingQuat = Cesium.Quaternion.fromAxisAngle(upAxis, Cesium.Math.toRadians(-heading));
    const pitchQuat = Cesium.Quaternion.fromAxisAngle(rightAxis, Cesium.Math.toRadians(pitch));
    const rollQuat = Cesium.Quaternion.fromAxisAngle(forwardAxis, Cesium.Math.toRadians(roll));
    const finalQuat = Cesium.Quaternion.clone(Cesium.Quaternion.IDENTITY, result);
    Cesium.Quaternion.multiply(rollQuat, finalQuat, finalQuat);
    Cesium.Quaternion.multiply(pitchQuat, finalQuat, finalQuat);
    Cesium.Quaternion.multiply(headingQuat, finalQuat, finalQuat);
    return finalQuat;
}
