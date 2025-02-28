import * as Cesium from 'cesium';
const flyToScratchCartesian = new Cesium.Cartesian3();
const flyToHPR = new Cesium.HeadingPitchRoll();
const flyToMatrix4 = new Cesium.Matrix4();
const flyToCartesian3 = new Cesium.Cartesian3();
const scratchCarto = new Cesium.Cartographic();
/**
 * 根据位置和旋转获取偏移位置
 * @param position 
 * @param rotation 
 * @param viewDistance 
 * @param result 
 * @returns 
 */
export function getPositionOffset(
    position: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0],
    viewDistance: number = 0,
    result?: [number, number, number],
) {
    const [l, b, h] = position;
    const cartesian = Cesium.Cartesian3.fromDegrees(l, b, h, undefined, flyToScratchCartesian)

    const hpr = [...rotation];
    for (let i = 0; i < 3; ++i) {
        hpr[i] = Cesium.Math.RADIANS_PER_DEGREE * hpr[i];
    }

    if (viewDistance !== 0) {
        flyToHPR.heading = hpr[0];
        flyToHPR.pitch = hpr[1];
        flyToHPR.roll = hpr[2];

        flyToHPR.heading -= Cesium.Math.PI_OVER_TWO;

        const mat4 = Cesium.Transforms.headingPitchRollToFixedFrame(cartesian, flyToHPR, undefined, undefined, flyToMatrix4);
        const dir = Cesium.Matrix4.multiplyByPointAsVector(mat4, Cesium.Cartesian3.UNIT_X, flyToCartesian3);

        Cesium.Cartesian3.multiplyByScalar(dir, viewDistance, dir);
        Cesium.Cartesian3.subtract(cartesian, dir, cartesian);
    }

    const carto = Cesium.Cartographic.fromCartesian(cartesian, undefined, scratchCarto);
    if (!carto) {
        return undefined;
    } else {
        result = result || [0, 0, 0];
        result[0] = carto.longitude * 180 / Math.PI;
        result[1] = carto.latitude * 180 / Math.PI;
        result[2] = carto.height;
        return result;
    }
}