import { czmPropMaps } from "../../../../ESJTypesCzm";
import { Czm3DTiles, ESJResource } from ".";
import * as Cesium from "cesium";
import { createClippingPlaneCollection, createClippingPolygonCollection, toCartesian3, toColor, toEllipsoid } from "../../../../utils";
import { getImageBasedLighting } from "./getImageBasedLighting";

export async function createCzm3DTiles(sceneObject: Czm3DTiles, url: string | ESJResource, customShader?: Cesium.CustomShader) {
    let urlOrResource: string | Cesium.IonResource | Cesium.Resource = ""
    if (typeof url != 'string') {
        if (typeof url == 'object' && url.url) {
            urlOrResource = new Cesium.Resource({
                url: url.url,
                headers: url.headers,
                queryParameters: url.queryParameters,
                templateValues: url.templateValues,
                proxy: url.proxy,
                retryCallback: url.retryCallback,
                retryAttempts: url.retryAttempts,
                request: url.request,
                parseUrl: url.parseUrl,
            });
        }
    } else {
        urlOrResource = url;
    }

    //url.startsWith('Ion(') 改为 url.startsWith('ion://')
    if (typeof url == 'string' && url.startsWith('ion://')) {
        const idStr = url.substring('ion://'.length);
        const id = +idStr;
        try {
            urlOrResource = await Cesium.IonResource.fromAssetId(id);
        } catch (error) {
            console.error(`Ion资源未能获取到 error: ${error}`, error);
            return;
        }

        // let rr = /Ion\((\d+)/.exec(url);
        // if (rr) {
        //     let assetId = rr[1] && +rr[1];
        //     try {
        //         assetId && (urlOrResource = await Cesium.IonResource.fromAssetId(assetId));
        //     } catch (error) {
        //         console.error(`Ion资源未能获取到 error: ${error}`, error);
        //         return;
        //     }
        // }
    }
    const czm3DTiles = await Cesium.Cesium3DTileset.fromUrl(
        urlOrResource,
        {
            show: sceneObject.show,
            shadows: sceneObject.shadows && czmPropMaps.shadowPropsMap[sceneObject.shadows],
            maximumScreenSpaceError: sceneObject.maximumScreenSpaceError,
            // Cesium 1.110以下版本仍然可以通过这个属性来控制
            // @ts-ignore 
            maximumMemoryUsage: sceneObject.maximumMemoryUsage,
            cacheBytes: sceneObject.cacheBytes,
            maximumCacheOverflowBytes: sceneObject.maximumCacheOverflowBytes,
            cullWithChildrenBounds: sceneObject.cullWithChildrenBounds,
            cullRequestsWhileMoving: sceneObject.cullRequestsWhileMoving,
            cullRequestsWhileMovingMultiplier: sceneObject.cullRequestsWhileMovingMultiplier,
            preloadWhenHidden: sceneObject.preloadWhenHidden,
            preloadFlightDestinations: sceneObject.preloadFlightDestinations,
            preferLeaves: sceneObject.preferLeaves,
            dynamicScreenSpaceError: sceneObject.dynamicScreenSpaceError,
            dynamicScreenSpaceErrorDensity: sceneObject.dynamicScreenSpaceErrorDensity,
            dynamicScreenSpaceErrorFactor: sceneObject.dynamicScreenSpaceErrorFactor,
            dynamicScreenSpaceErrorHeightFalloff: sceneObject.dynamicScreenSpaceErrorHeightFalloff,
            progressiveResolutionHeightFraction: sceneObject.progressiveResolutionHeightFraction,
            foveatedScreenSpaceError: sceneObject.foveatedScreenSpaceError,
            foveatedConeSize: sceneObject.foveatedConeSize,
            foveatedMinimumScreenSpaceErrorRelaxation: sceneObject.foveatedMinimumScreenSpaceErrorRelaxation,
            foveatedInterpolationCallback: sceneObject.foveatedInterpolationCallbackStr && Function('"use strict";return (' + sceneObject.foveatedInterpolationCallbackStr + ')')(),
            foveatedTimeDelay: sceneObject.foveatedTimeDelay,
            skipLevelOfDetail: sceneObject.skipLevelOfDetail,
            baseScreenSpaceError: sceneObject.baseScreenSpaceError,
            skipScreenSpaceErrorFactor: sceneObject.skipScreenSpaceErrorFactor,
            skipLevels: sceneObject.skipLevels,
            immediatelyLoadDesiredLevelOfDetail: sceneObject.immediatelyLoadDesiredLevelOfDetail,
            loadSiblings: sceneObject.loadSiblings,
            classificationType: czmPropMaps.classificationTypeMap[sceneObject.classificationType ?? Czm3DTiles.defaults.classificationType],
            lightColor: sceneObject.lightColor && toCartesian3(sceneObject.lightColor),
            backFaceCulling: sceneObject.backFaceCulling ?? Czm3DTiles.defaults.backFaceCulling,
            showOutline: sceneObject.showOutline ?? Czm3DTiles.defaults.showOutline,

            debugHeatmapTilePropertyName: sceneObject.debugHeatmapTilePropertyName,
            debugFreezeFrame: sceneObject.debugFreezeFrame,
            debugColorizeTiles: sceneObject.debugColorizeTiles,
            debugWireframe: sceneObject.debugWireframe,
            debugShowBoundingVolume: sceneObject.debugShowBoundingVolume,
            debugShowContentBoundingVolume: sceneObject.debugShowContentBoundingVolume,
            debugShowViewerRequestVolume: sceneObject.debugShowViewerRequestVolume,
            debugShowGeometricError: sceneObject.debugShowGeometricError,
            debugShowRenderingStatistics: sceneObject.debugShowRenderingStatistics,
            debugShowMemoryUsage: sceneObject.debugShowMemoryUsage,
            debugShowUrl: sceneObject.debugShowUrl,
            // @ts-ignore
            customShader: customShader,

            ellipsoid: toEllipsoid(sceneObject.ellipsoid ?? Czm3DTiles.defaults.ellipsoid),
            modelMatrix: sceneObject.modelMatrix && Cesium.Matrix4.fromArray(sceneObject.modelMatrix),
            clippingPlanes: sceneObject.clippingPlanes && createClippingPlaneCollection(sceneObject.clippingPlanes),
            clippingPolygons: sceneObject.clippingPolygons && createClippingPolygonCollection(sceneObject.clippingPolygons),
            imageBasedLighting: sceneObject.imageBasedLighting && getImageBasedLighting(sceneObject.imageBasedLighting),
            splitDirection: Cesium.SplitDirection[sceneObject.splitDirection ?? Czm3DTiles.defaults.splitDirection],
            modelUpAxis: sceneObject.modelUpAxis && Cesium.Axis[sceneObject.modelUpAxis],
            modelForwardAxis: sceneObject.modelForwardAxis && Cesium.Axis[sceneObject.modelForwardAxis],
            featureIdLabel: sceneObject.featureIdLabel ?? Czm3DTiles.defaults.featureIdLabel,
            instanceFeatureIdLabel: sceneObject.instanceFeatureIdLabel ?? Czm3DTiles.defaults.instanceFeatureIdLabel,

            outlineColor: sceneObject.outlineColor && toColor(sceneObject.outlineColor),
            pointCloudShading: sceneObject.pointCloudShading,
            enableShowOutline: sceneObject.enableShowOutline,
            vectorClassificationOnly: sceneObject.vectorClassificationOnly,
            vectorKeepDecodedPositions: sceneObject.vectorKeepDecodedPositions,
            showCreditsOnScreen: sceneObject.showCreditsOnScreen,
            projectTo2D: sceneObject.projectTo2D,
            enableDebugWireframe: sceneObject.enableDebugWireframe,
        }
    );
    //@ts-ignore
    Cesium.Cesium3DTileset.prototype && (czm3DTiles.ESSceneObjectID = sceneObject.id);
    return czm3DTiles;
}