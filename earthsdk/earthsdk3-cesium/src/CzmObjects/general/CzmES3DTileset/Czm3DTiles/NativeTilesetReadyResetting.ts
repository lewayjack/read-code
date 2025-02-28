// create属性，只能在create时设置的属性
import * as Cesium from 'cesium';
import { createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, react } from "xbsj-base";
import { Czm3DTiles, Czm3DTilesCustomShaderClassType } from ".";
import { updateModelMatrix } from "./updateModelMatrix";
import { AbsoluteClippingPlaneCollectionUpdating } from "./AbsoluteClippingPlaneCollectionUpdating";
import { RelativeClippingPlaneCollectionUpdating } from "./RelativeClippingPlaneCollectionUpdating";
import { ClippingPolygonCollectionUpdating } from "./ClippingPolygonCollectionUpdating";
import { Czm3DTilesFlattenedPlaneResetting } from "./Czm3DTilesFlattenedPlaneResetting";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { ES3DTileset, registerEventUpdate } from "earthsdk3";
import { updateSimpleProps } from "./updateSimpleProps";
import { getSimpleUpdateEvents } from "./getSimpleUpdateEvents";
import { toCartesian2 } from '../../../../utils';
import { CzmFlattenedPlane } from '../../CzmESPolygonFlattenedPlane';
import { CzmES3DTileset } from '..';

// url classificationType ellipsoid modelUpAxis modelForwardAxis cullWithChildrenBounds enableShowOutline projectTo2D debugHeatmapTilePropertyName enableDebugWireframe
function updatePointCloudShading(tileset: Cesium.Cesium3DTileset, sceneObject: Czm3DTiles) {
    console.warn(`Czm3DTiles暂不支持pointCloudShading属性`);
    // TODO 这种写法不对，
    // @ts-ignore
    tileset.pointCloudShading = new Cesium.PointCloudShading(sceneObject.pointCloudShading);
}
function updateImageBasedLighting(tileset: Cesium.Cesium3DTileset, sceneObject: Czm3DTiles) {
    // console.warn(`Czm3DTiles暂不支持imageBasedLighting属性`);
    // TODO 这种写法不对，会导致cesium加载不了3dtiles数据
    // tileset.imageBasedLighting = sceneObject.imageBasedLighting && new Cesium.ImageBasedLighting(sceneObject.imageBasedLighting)
    tileset.imageBasedLighting.imageBasedLightingFactor = toCartesian2(sceneObject.imageBasedLighting?.imageBasedLightingFactor ?? [1, 1]);
    tileset.environmentMapManager.atmosphereScatteringIntensity = sceneObject.imageBasedLighting?.luminanceAtZenith ?? 5;
    tileset.environmentMapManager.atmosphereScatteringIntensity = sceneObject.imageBasedLighting?.atmosphereScatteringIntensity ?? 5;
    {
        tileset.environmentMapManager.saturation = 0.35;
        tileset.environmentMapManager.brightness = sceneObject.imageBasedLighting?.luminanceAtZenith ?? 1.4;
        tileset.environmentMapManager.gamma = 0.8;
        tileset.environmentMapManager.groundColor =
            Cesium.Color.fromCssColorString("#001850");
    }    // @ts-ignore
    tileset.imageBasedLighting.specularEnvironmentMaps = sceneObject.imageBasedLighting?.specularEnvironmentMaps;

    const shc = sceneObject.imageBasedLighting?.sphericalHarmonicCoefficients;
    // @ts-ignore
    tileset.imageBasedLighting.sphericalHarmonicCoefficients = shc && toCoefficients(shc);
}

export class NativeTilesetReadyResetting extends Destroyable {
    get tileset() { return this._tileset; }
    get czm3DTiles() { return this._czm3DTiles; }

    private _clippingPlanesCollectionResetting;
    get clippingPlanesCollectionResetting() { return this._clippingPlanesCollectionResetting; }
    private _clippingPolygonCollectionResetting;
    get clippingPolygonCollectionResetting() { return this._clippingPolygonCollectionResetting; }

    private _flattenedCustomShader = this.disposeVar(react<Czm3DTilesCustomShaderClassType | undefined>(undefined));
    get flattenedCustomShader() { return this._flattenedCustomShader.value; }
    set flattenedCustomShader(value: Czm3DTilesCustomShaderClassType | undefined) { this._flattenedCustomShader.value = value; }
    get flattenedCustomShaderChanged() { return this._flattenedCustomShader.changed; }

    constructor(
        private _tileset: Cesium.Cesium3DTileset,
        private _czm3DTiles: Czm3DTiles,
        private _czmNativeViewer: Cesium.Viewer,
        private _czmViewer: ESCesiumViewer) {
        super();

        this._clippingPolygonCollectionResetting = new ClippingPolygonCollectionUpdating(this.tileset, this.czm3DTiles);
        const { tileset, czm3DTiles } = this;

        {
            const updateMatrixEvent = this.disposeVar(createNextAnimateFrameEvent(
                this.czm3DTiles.positionChanged,
                this.czm3DTiles.rotationChanged,
                this.czm3DTiles.modelMatrixChanged,
                this.czm3DTiles.originChanged
            ));
            updateModelMatrix(this.tileset, this.czm3DTiles);
            this.dispose(updateMatrixEvent.disposableOn(() => updateModelMatrix(this.tileset, this.czm3DTiles)));

            this._clippingPlanesCollectionResetting = this.disposeVar(new ObjResettingWithEvent(this.czm3DTiles.absoluteClippingPlanesChanged, () => {
                if (this.czm3DTiles.absoluteClippingPlanes) {
                    return new AbsoluteClippingPlaneCollectionUpdating(this.tileset, this.czm3DTiles, updateMatrixEvent);
                } else {
                    return new RelativeClippingPlaneCollectionUpdating(this.tileset, this.czm3DTiles);
                }
            }));
        }
        this.disposeVar(new ObjResettingWithEvent(this.czm3DTiles.czmFlattenedPlaneWithId.sceneObjectChanged, () => {
            const { sceneObject } = this.czm3DTiles.czmFlattenedPlaneWithId;
            if (!sceneObject) return undefined;
            let czmFlattenedPlane: CzmFlattenedPlane | undefined = undefined;
            do {
                const czmSceneObject = _czmViewer.getCzmObject(sceneObject);
                if (sceneObject instanceof ES3DTileset) {
                    czmFlattenedPlane = (czmSceneObject as CzmES3DTileset).flattenedPlane;
                }
            } while (false);
            if (!czmFlattenedPlane) return undefined;
            return new Czm3DTilesFlattenedPlaneResetting(this, czmFlattenedPlane);
        }));
        // if (!this._tileset.ready) {
        //     throw new Error(`!this._tileset.ready`);
        // }        

        const simpleUpdateEvent = this.disposeVar(createNextAnimateFrameEvent(...getSimpleUpdateEvents(czm3DTiles)));
        registerEventUpdate(this, simpleUpdateEvent, () => {
            updateSimpleProps(tileset, czm3DTiles);
        });

        // foveatedInterpolationCallback 单独处理
        registerEventUpdate(this, czm3DTiles.foveatedInterpolationCallbackChanged, () => {
            tileset.foveatedInterpolationCallback = czm3DTiles.foveatedInterpolationCallback;
        });

        // style 单独处理
        registerEventUpdate(this, czm3DTiles.styleChanged, () => {
            tileset.style = czm3DTiles.style;
        });

        // pointCloudShading 单独处理
        registerEventUpdate(this, czm3DTiles.pointCloudShadingChanged, () => {
            updatePointCloudShading(tileset, czm3DTiles);
        });

        // imageBasedLighting 单独处理
        registerEventUpdate(this, czm3DTiles.imageBasedLightingChanged, () => {
            updateImageBasedLighting(tileset, czm3DTiles);
        });

        // // customShader 单独处理
        // registerEventUpdate(this, czmCzm3DTiles.customShaderInstanceChanged, () => {
        //     tileset.customShader = czmCzm3DTiles.customShaderInstance?.customShader;
        // });
        {
            const update = () => {
                // 有压平shader，就直接用压平shader了
                if (this.flattenedCustomShader) {
                    tileset.customShader = this.flattenedCustomShader?.customShader;
                    if (czm3DTiles.customShaderInstance) {
                        console.warn(`压平shader和Czm3DTiles的customShader冲突，优先使用压平shader！`);
                    }
                    return;
                }
                tileset.customShader = czm3DTiles.customShaderInstance?.customShader;
            };
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                czm3DTiles.customShaderInstanceChanged,
                this.flattenedCustomShaderChanged,
            ));
            this.dispose(event.disposableOn(update));
        }

        this.dispose(czm3DTiles.flyToEvent.disposableOn(duration => {
            if (!czm3DTiles.czmViewer.actived) return;
            if (!this.tileset) return;
            // this._tilesetRef.value && viewer.flyTo(this._tilesetRef.value, { duration: (duration ?? 1000) / 1000 });
            this._czmNativeViewer.camera.flyToBoundingSphere(this.tileset.boundingSphere, { duration: (duration ?? 1000) / 1000 });
        }));
    }
}
