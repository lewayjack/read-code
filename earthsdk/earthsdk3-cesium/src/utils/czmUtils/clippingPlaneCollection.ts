import * as Cesium from 'cesium';
import { CzmClippingPlaneCollectionJsonType } from '../../ESJTypesCzm';
import { toCartesian3, toColor } from './czmConverts';

export function createClippingPlaneCollection(clippingPlanesJson: CzmClippingPlaneCollectionJsonType, originRootTransformInv?: Cesium.Matrix4) {
    const { planes, enabled, modelMatrix, unionClippingRegions, edgeColor, edgeWidth } = clippingPlanesJson;
    let m = modelMatrix && Cesium.Matrix4.fromArray(modelMatrix);
    if (originRootTransformInv) {
        m = m || Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY, new Cesium.Matrix4());
        Cesium.Matrix4.multiply(originRootTransformInv, m, m);
    }
    return new Cesium.ClippingPlaneCollection({
        planes: planes && planes.map(e => new Cesium.ClippingPlane(toCartesian3(e.normal), e.distance)),
        enabled,
        modelMatrix: m,
        unionClippingRegions,
        edgeColor: edgeColor && toColor(edgeColor),
        edgeWidth,
    });
}

export function setClippingPlaneCollection(clippingPlanes: Cesium.ClippingPlaneCollection, clippingPlanesJson: CzmClippingPlaneCollectionJsonType | undefined, originRootTransformInv?: Cesium.Matrix4) {
    // // @ts-ignore
    // tileset.clippingPlanes = getClippingPlaneCollection(sceneObject.clippingPlanes ?? { enabled: false });
    
    // Cesium有一个特别恶习的bug，就是clippingPlanes如果已经有了，再设置就有可能崩溃！所以这里要处理以下，一旦有了，那么就只能更新，不能销毁重建！
    const cp = clippingPlanesJson;
    if (!cp) {
        clippingPlanes.removeAll();
        clippingPlanes.enabled = false;
        return;
    }

    clippingPlanes.removeAll();
    if (cp.planes) {
        for (let e of cp.planes) {
            clippingPlanes.add(new Cesium.ClippingPlane(toCartesian3(e.normal), e.distance));
        }
    }

    let m = cp.modelMatrix && Cesium.Matrix4.fromArray(cp.modelMatrix) || Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY, new Cesium.Matrix4());
    if (originRootTransformInv) {
        Cesium.Matrix4.multiply(originRootTransformInv, m, m);
    }

    clippingPlanes.enabled = cp.enabled ?? true;
    clippingPlanes.modelMatrix = m,
    clippingPlanes.unionClippingRegions = cp.unionClippingRegions ?? false;
    clippingPlanes.edgeColor = toColor(cp.edgeColor ?? [1, 1, 1, 1]);
    clippingPlanes.edgeWidth = cp.edgeWidth ?? 2;
}