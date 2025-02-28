import * as Cesium from 'cesium';

// 修复Cesium1.83版本中的问题,版本已经更替，代码注释
export function fixForCesium1_83() {
    try {
        // @ts-ignore
        // Cesium.SplitDirection = Cesium.SplitDirection || Cesium?.ImagerySplitDirection;
    } catch (error) {
    }
}
