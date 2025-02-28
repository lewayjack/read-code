import { Czm3DTiles } from ".";

export function getRecreateEvents(sceneObject: Czm3DTiles) {
    return [
        sceneObject.urlChanged,
        sceneObject.classificationTypeChanged,
        sceneObject.ellipsoidChanged,
        sceneObject.modelUpAxisChanged,
        sceneObject.modelForwardAxisChanged,
        sceneObject.cullWithChildrenBoundsChanged,
        sceneObject.enableShowOutlineChanged,
        sceneObject.projectTo2DChanged,
        sceneObject.debugHeatmapTilePropertyNameChanged,
        sceneObject.enableDebugWireframeChanged,
        sceneObject.vectorClassificationOnlyChanged,
        sceneObject.vectorKeepDecodedPositionsChanged,
        //TODO Cesium Bug environmentMapManager无法动态修改，暂时重新创建解决，后期修复
        // sceneObject.luminanceAtZenithChanged,
        // sceneObject.atmosphereScatteringIntensityChanged,
    ];
}
