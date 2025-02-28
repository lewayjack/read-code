import * as Cesium from 'cesium';
/**
 * 旋转角转方向向量
 * @param rotation [heading, pitch, roll]
 * @returns 
 */
export function getDirectionVectorFromRotation(rotation: [number, number, number]) {
    const heading = Cesium.Math.toRadians(rotation[0]);
    const pitch = Cesium.Math.toRadians(rotation[1]); // 将角度转换为弧度
    const roll = Cesium.Math.toRadians(rotation[2]);
    // 创建一个Matrix3来表示俯仰、偏航和滚转角
    const rotationMat3 = Cesium.Matrix3.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(heading, pitch, roll));
    // 获取方向向量
    const direction = new Cesium.Cartesian3();
    Cesium.Matrix3.multiplyByVector(rotationMat3, Cesium.Cartesian3.UNIT_X, direction);
    return [direction.x, direction.y, direction.z] as [number, number, number];
}