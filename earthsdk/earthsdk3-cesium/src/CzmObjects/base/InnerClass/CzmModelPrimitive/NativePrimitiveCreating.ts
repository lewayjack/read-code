import * as Cesium from 'cesium';
import { NativePrimitive } from './NativePrimitive';
import { NativePrimitiveResetting } from './NativePrimitiveResetting';
import { createNextAnimateFrameEvent, createProcessingFromAsyncFunc, Destroyable } from 'xbsj-base';
import { toColor, toDistanceDisplayCondition } from '../../../../utils';
import { CzmModelPrimitiveCustomShaderClassType, czmPropMaps } from '../../../../ESJTypesCzm';


export class NativePrimitiveCreating extends Destroyable {
    get owner() { return this._owner; }
    private _nativePrimitive: NativePrimitive | undefined;
    get nativePrimitive() { return this._nativePrimitive; }
    constructor(private _owner: NativePrimitiveResetting) {
        super();
        const sceneObject = this.owner.owner;
        const createPrimitive = async () => {
            const czmModelPrimitive = this.owner.owner;
            const { finalModelUriReact, czmViewer, visibleAlpha, finalShow } = czmModelPrimitive;
            const viewer = czmViewer.viewer as Cesium.Viewer;

            if (!finalModelUriReact.value) {
                return undefined;
            }

            const customShaderInstance = sceneObject.customShaderInstanceClass && new sceneObject.customShaderInstanceClass(sceneObject, czmViewer);

            const c = (sceneObject.color ?? [1, 1, 1, 1]);
            c[3] *= visibleAlpha;
            const color = toColor(c);

            let gltf;
            // const model = Cesium.Model.fromGltf({ // Cesium 1.83
            const model = await Cesium.Model.fromGltfAsync({
                //@ts-ignore
                url: sceneObject.gltfJson ? undefined : finalModelUriReact.value,
                // url: sceneObject.gltfJson ?? finalModelUriReact.value,
                gltf: sceneObject.gltfJson ? JSON.parse(JSON.stringify(sceneObject.gltfJson)) : undefined,
                basePath: sceneObject.basePath,
                // show: sceneObject.show ?? true,
                show: finalShow,
                allowPicking: sceneObject.allowPicking,
                incrementallyLoadTextures: sceneObject.incrementallyLoadTextures,
                asynchronous: sceneObject.asynchronous,
                clampAnimations: sceneObject.clampAnimations,
                shadows: sceneObject.shadows && czmPropMaps.shadowPropsMap[sceneObject.shadows],
                debugShowBoundingVolume: sceneObject.debugShowBoundingVolume,
                debugWireframe: sceneObject.debugWireframe,

                backFaceCulling: sceneObject.backFaceCulling,
                showOutline: sceneObject.showOutline,
                heightReference: sceneObject.heightReference && czmPropMaps.heightReferencePropsMap[sceneObject.heightReference],
                distanceDisplayCondition: sceneObject.distanceDisplayCondition && toDistanceDisplayCondition(sceneObject.distanceDisplayCondition),
                color: color,
                scene: viewer.scene,
                colorBlendMode: sceneObject.colorBlendMode && czmPropMaps.colorBlendModeType[sceneObject.colorBlendMode],
                credit: sceneObject.credit,
                silhouetteColor: sceneObject.silhouetteColor && toColor(sceneObject.silhouetteColor),
                // clippingPlanes: ClippingPlaneCollection,// TODO3
                // dequantizeInShader: model.dequantizeInShader,
                colorBlendAmount: sceneObject.colorBlendAmount,
                silhouetteSize: sceneObject.silhouetteSize,
                // minimumPixelSize: sceneObject.minimumPixelSize
                // @ts-ignore
                // upAxis: Cesium.Axis.Z,
                upAxis: sceneObject.upAxis,
                // @ts-ignore
                // forwardAxis: Cesium.Axis.X,
                forwardAxis: sceneObject.forwardAxis,

                // imageBasedLightingFactor: sceneObject.imageBasedLightingFactor,
                // lightColor: sceneObject.lightColor,
                // luminanceAtZenith: sceneObject.luminanceAtZenith,
                // sphericalHarmonicCoefficients: sceneObject.sphericalHarmonicCoefficients,
                // specularEnvironmentMaps: sceneObject.specularEnvironmentMaps,
                customShader: customShaderInstance && customShaderInstance.customShader,
                // @ts-ignore
                opaquePass: Cesium.Pass[sceneObject.opaquePass],
                gltfCallback: e => { gltf = e; }
            });

            //@ts-ignore
            Cesium.Model.prototype && (model.ESSceneObjectID = sceneObject.id);

            const ready = model.readyEvent.addEventListener((e) => {
                sceneObject.readyEvent.emit(e);
            });
            this.dispose(ready);

            return [model, customShaderInstance, gltf] as [Cesium.Model, CzmModelPrimitiveCustomShaderClassType | undefined, any];
        };

        const recreateModelProcessing = this.disposeVar(createProcessingFromAsyncFunc(async (cancelsManager) => {
            const czmModelPrimitive = this.owner.owner;
            const { finalModelUriReact } = czmModelPrimitive;
            if (!finalModelUriReact.value) {
                return;
            }
            const result = await cancelsManager.promise(createPrimitive());
            if (!result) {
                return;
            }
            const [primitive, customShaderInstance, gltf] = result;
            this._nativePrimitive = this.disposeVar(new NativePrimitive(gltf, primitive, this));

            this._nativePrimitive.update();
            this.owner.owner.gltf = gltf;
        }));

        recreateModelProcessing.start();

        const { visibleAlphaChanged } = this.owner.owner;

        {
            const update = () => {
                this.nativePrimitive && this.nativePrimitive.update();
            };
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                // pickingReact.changed,
                // sceneObject.sPositionEditing.pickingChanged,
                sceneObject.clampAnimationsChanged,
                sceneObject.shadowsChanged,
                sceneObject.debugShowBoundingVolumeChanged,
                sceneObject.debugWireframeChanged,
                sceneObject.backFaceCullingChanged,
                sceneObject.heightReferenceChanged,
                sceneObject.distanceDisplayConditionChanged,
                sceneObject.colorChanged,
                sceneObject.colorBlendModeChanged,
                sceneObject.silhouetteColorChanged,
                sceneObject.colorBlendAmountChanged,
                sceneObject.silhouetteSizeChanged,
                // sceneObject.pixelSizeChanged,
                // sceneObject.maximumScaleChanged,
                // sceneObject.minimumScaleChanged,
                sceneObject.activeAnimationsChanged,
                sceneObject.activeAnimationsAnimateWhilePausedChanged,
                sceneObject.nodeTransformationsChanged,
                sceneObject.nativeMinimumPixelSizeChanged,
                sceneObject.nativeMaximumScaleChanged,
                sceneObject.nativeScaleChanged,
                visibleAlphaChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }
    }
}
