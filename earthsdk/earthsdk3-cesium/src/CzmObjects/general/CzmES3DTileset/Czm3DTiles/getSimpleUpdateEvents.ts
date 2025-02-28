import { Czm3DTiles } from ".";

export function getSimpleUpdateEvents(sceneObject: Czm3DTiles) {
    return [
        // url不能更新，只能重建
        sceneObject.showChanged,
        sceneObject.colorBlendModeChanged,
        // modelMatrix 单独处理
        // modelUpAxis 只能重建
        // modelForwardAxis 只能重建
        sceneObject.shadowsChanged,

        sceneObject.maximumScreenSpaceErrorChanged,
        sceneObject.maximumMemoryUsageChanged,
        sceneObject.cacheBytesChanged,
        sceneObject.maximumCacheOverflowBytesChanged,

        // cullWithChildrenBounds 只能重建
        sceneObject.cullRequestsWhileMovingChanged,
        sceneObject.cullRequestsWhileMovingMultiplierChanged,

        sceneObject.preloadWhenHiddenChanged,
        sceneObject.preloadFlightDestinationsChanged,
        sceneObject.preferLeavesChanged,

        sceneObject.dynamicScreenSpaceErrorChanged,
        sceneObject.dynamicScreenSpaceErrorDensityChanged,
        sceneObject.dynamicScreenSpaceErrorFactorChanged,
        sceneObject.dynamicScreenSpaceErrorHeightFalloffChanged,

        sceneObject.progressiveResolutionHeightFractionChanged,

        sceneObject.foveatedScreenSpaceErrorChanged,
        sceneObject.foveatedConeSizeChanged,
        sceneObject.foveatedMinimumScreenSpaceErrorRelaxationChanged,
        // foveatedInterpolationCallback 单独处理
        sceneObject.foveatedTimeDelayChanged,

        sceneObject.skipLevelOfDetailChanged,

        sceneObject.baseScreenSpaceErrorChanged,
        sceneObject.skipScreenSpaceErrorFactorChanged,
        sceneObject.skipLevelsChanged,

        sceneObject.immediatelyLoadDesiredLevelOfDetailChanged,
        sceneObject.loadSiblingsChanged,

        // clippingPlanes 单独处理
        // classificationType 只能重建
        // ellipsoid 只能重建
        // pointCloudShading 单独处理
        sceneObject.lightColorChanged,
        // imageBasedLighting 单独处理
        sceneObject.backFaceCullingChanged,
        // enableShowOutline 只能重建
        sceneObject.showOutlineChanged,
        sceneObject.outlineColorChanged,

        // sceneObject.vectorClassificationOnlyChanged, // 只能重建
        // sceneObject.vectorKeepDecodedPositionsChanged, // 只能重建

        sceneObject.featureIdLabelChanged,
        sceneObject.instanceFeatureIdLabelChanged,
        sceneObject.showCreditsOnScreenChanged,

        sceneObject.splitDirectionChanged,
        // projectTo2D 只能重建

        // debugHeatmapTilePropertyName 只能重建
        sceneObject.debugFreezeFrameChanged,
        sceneObject.debugColorizeTilesChanged,
        sceneObject.debugWireframeChanged,
        sceneObject.debugShowBoundingVolumeChanged,
        sceneObject.debugShowContentBoundingVolumeChanged,
        sceneObject.debugShowViewerRequestVolumeChanged,
        sceneObject.debugShowGeometricErrorChanged,
        sceneObject.debugShowRenderingStatisticsChanged,
        sceneObject.debugShowMemoryUsageChanged,
        sceneObject.debugShowUrlChanged,
        sceneObject.enableShowOutlineChanged,

        // style 单独处理
        // customShader 单独处理
    ];
}
