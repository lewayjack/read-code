import { computeCzmModelMatrix } from "../../../../utils";
import { Czm3DTiles } from ".";
import * as Cesium from 'cesium';

export function updateModelMatrix(tileset: Cesium.Cesium3DTileset, czm3DTiles: Czm3DTiles) {
    const sceneObject = czm3DTiles;

    if (sceneObject.modelMatrix) {
        // modelMatrix属性优先级最高
        Cesium.Matrix4.clone(Cesium.Matrix4.fromArray(sceneObject.modelMatrix), tileset.modelMatrix);
        return;
    }

    if (!sceneObject.position) {
        Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY, tileset.modelMatrix);
        return;
    }
    // @ts-ignore
    let originTransform = tileset._root.transform as Cesium.Matrix4;
    // 如果转换矩阵跟计算出来的矩阵不一样，返回
    const originMatrix = computeCzmModelMatrix({
        initialRotation: 'yForwardzUp',
        rotation: [0, 0, 0],
        position: sceneObject.origin,
    });
    if (originMatrix && !originMatrix.equalsEpsilon(originTransform, 0.001) || originTransform.equals(Cesium.Matrix4.IDENTITY)) {
        originMatrix && (originTransform = originMatrix);
    }

    const modelMatrix = computeCzmModelMatrix({
        initialRotation: 'yForwardzUp',
        // reverseInitialRotation: true,
        rotation: sceneObject.rotation,
        position: sceneObject.position,
    });

    if (!modelMatrix) {
        console.warn(`modelMatrix is undefined!`);
        return;
    }
    const originTransformInv = Cesium.Matrix4.inverseTransformation(originTransform, new Cesium.Matrix4())
    Cesium.Matrix4.multiply(modelMatrix, originTransformInv, tileset.modelMatrix);
}
