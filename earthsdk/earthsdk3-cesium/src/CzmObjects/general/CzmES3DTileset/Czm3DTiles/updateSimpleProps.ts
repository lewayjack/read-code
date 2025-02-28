import { czmPropMaps } from "../../../../ESJTypesCzm";
import { Czm3DTiles } from ".";
import * as Cesium from 'cesium';
import { toCartesian, toColor } from "../../../../utils";

export function updateSimpleProps(tileset: Cesium.Cesium3DTileset, sceneObject: Czm3DTiles) {
    // url不能更新，只能重建
    tileset.show = sceneObject.show ?? true;
    tileset.colorBlendMode = Cesium.Cesium3DTileColorBlendMode[sceneObject.colorBlendMode ?? 'HIGHLIGHT'];
    // modelMatrix 单独处理
    // modelUpAxis 只能重建
    // modelForwardAxis 只能重建
    tileset.shadows = (sceneObject.shadows && czmPropMaps.shadowPropsMap[sceneObject.shadows]) ?? czmPropMaps.shadowPropsMap['ENABLED'];

    tileset.maximumScreenSpaceError = sceneObject.maximumScreenSpaceError ?? 16;
    // vtxf maximumMemoryUsage不删，这样Cesium1.110以前的版本也可以控制
    // @ts-ignore
    tileset.maximumMemoryUsage = sceneObject.maximumMemoryUsage ?? Czm3DTiles.defaults.maximumMemoryUsage;
    tileset.cacheBytes = sceneObject.cacheBytes ?? Czm3DTiles.defaults.cacheBytes;
    tileset.maximumCacheOverflowBytes = sceneObject.maximumCacheOverflowBytes ?? Czm3DTiles.defaults.maximumCacheOverflowBytes;

    // cullWithChildrenBounds 只能重建
    tileset.cullRequestsWhileMoving = sceneObject.cullRequestsWhileMoving ?? true;
    tileset.cullRequestsWhileMovingMultiplier = sceneObject.cullRequestsWhileMovingMultiplier ?? 60;

    tileset.preloadWhenHidden = sceneObject.preloadWhenHidden ?? false;
    tileset.preloadFlightDestinations = sceneObject.preloadFlightDestinations ?? true;
    tileset.preferLeaves = sceneObject.preferLeaves ?? false;

    tileset.dynamicScreenSpaceError = sceneObject.dynamicScreenSpaceError ?? false;
    tileset.dynamicScreenSpaceErrorDensity = sceneObject.dynamicScreenSpaceErrorDensity ?? 0.00278;
    tileset.dynamicScreenSpaceErrorFactor = sceneObject.dynamicScreenSpaceErrorFactor ?? 4;
    tileset.dynamicScreenSpaceErrorHeightFalloff = sceneObject.dynamicScreenSpaceErrorHeightFalloff ?? 0.25;

    tileset.progressiveResolutionHeightFraction = sceneObject.progressiveResolutionHeightFraction ?? 0.3;

    tileset.foveatedScreenSpaceError = sceneObject.foveatedScreenSpaceError ?? true;
    tileset.foveatedConeSize = sceneObject.foveatedConeSize ?? 0.1;
    tileset.foveatedMinimumScreenSpaceErrorRelaxation = sceneObject.foveatedMinimumScreenSpaceErrorRelaxation ?? 0;
    // foveatedInterpolationCallback 单独处理
    tileset.foveatedTimeDelay = sceneObject.foveatedTimeDelay ?? 0.2;

    tileset.skipLevelOfDetail = sceneObject.skipLevelOfDetail ?? false;

    tileset.baseScreenSpaceError = sceneObject.baseScreenSpaceError ?? 1024;
    tileset.skipScreenSpaceErrorFactor = sceneObject.skipScreenSpaceErrorFactor ?? 16;
    tileset.skipLevels = sceneObject.skipLevels ?? 1;

    tileset.immediatelyLoadDesiredLevelOfDetail = sceneObject.immediatelyLoadDesiredLevelOfDetail ?? false;
    tileset.loadSiblings = sceneObject.loadSiblings ?? false;

    // clippingPlanes 单独处理
    // classificationType 只能重建
    // ellipsoid 只能重建
    // pointCloudShading 单独处理
    tileset.lightColor = (sceneObject.lightColor && toCartesian(sceneObject.lightColor)) ?? toCartesian([1, 1, 1]);
    // imageBasedLighting 单独处理
    tileset.backFaceCulling = sceneObject.backFaceCulling ?? true;
    // enableShowOutline 只能重建
    tileset.showOutline = sceneObject.showOutline ?? true;
    tileset.outlineColor = toColor(sceneObject.outlineColor ?? [1, 1, 1, 1]);

    // tileset.vectorClassificationOnly = sceneObject.vectorClassificationOnly ?? false; // 只能重建
    // tileset.vectorKeepDecodedPositions = sceneObject.vectorKeepDecodedPositions ?? false; // 只能重建

    tileset.featureIdLabel = sceneObject.featureIdLabel ?? Czm3DTiles.defaults.featureIdLabel;
    tileset.instanceFeatureIdLabel = sceneObject.instanceFeatureIdLabel ?? Czm3DTiles.defaults.instanceFeatureIdLabel;
    tileset.showCreditsOnScreen = sceneObject.showCreditsOnScreen ?? false;

    tileset.splitDirection = Cesium.SplitDirection[sceneObject.splitDirection ?? Czm3DTiles.defaults.splitDirection];
    // projectTo2D 只能重建

    // debugHeatmapTilePropertyName 只能重建
    tileset.debugFreezeFrame = sceneObject.debugFreezeFrame ?? false;
    tileset.debugColorizeTiles = sceneObject.debugColorizeTiles ?? false;
    tileset.debugWireframe = sceneObject.debugWireframe ?? false;
    tileset.debugShowBoundingVolume = sceneObject.debugShowBoundingVolume ?? false;
    tileset.debugShowContentBoundingVolume = sceneObject.debugShowContentBoundingVolume ?? false;
    tileset.debugShowViewerRequestVolume = sceneObject.debugShowViewerRequestVolume ?? false;
    tileset.debugShowGeometricError = sceneObject.debugShowGeometricError ?? false;
    tileset.debugShowRenderingStatistics = sceneObject.debugShowRenderingStatistics ?? false;
    tileset.debugShowMemoryUsage = sceneObject.debugShowMemoryUsage ?? false;
    tileset.debugShowUrl = sceneObject.debugShowUrl ?? false;

    // style 单独处理
    // customShader 单独处理
}