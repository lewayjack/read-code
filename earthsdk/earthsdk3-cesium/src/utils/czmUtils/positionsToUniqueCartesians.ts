import * as Cesium from 'cesium';

/**
 * 把positions批量转化成cartesians，并且进行去重处理，所以返回的结果的数量可能会有所减少。
 * 另外一点是只是进行相邻控制点去重，不是任意去重！
 * @param positions 
 * @returns 
 */
export function positionsToUniqueCartesians(positions: [number, number, number][]) {
    const l = positions.length;
    let lastCartesian: undefined | Cesium.Cartesian3;
    const cartesians: Cesium.Cartesian3[] = [];
    for (let i = 0; i < l; ++i) {
        const [l, b, h] = positions[i];
        const cartesian = Cesium.Cartesian3.fromDegrees(l, b, h);
        if (!cartesian) {
            continue;
        }
        const { x, y, z } = cartesian;
        if (![x, y, z].every(Number.isFinite)) {
            continue;
        }
        if (!lastCartesian || !Cesium.Cartesian3.equals(lastCartesian, cartesian)) {
            lastCartesian = cartesian;
            cartesians.push(lastCartesian);
        }
    }

    return cartesians;
}