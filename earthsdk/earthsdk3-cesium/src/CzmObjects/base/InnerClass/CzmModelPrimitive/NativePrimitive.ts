import * as Cesium from 'cesium';
import { ModelMatrixUpdating } from './ModelMatrixUpdating';
import { NativePrimitiveCreating } from './NativePrimitiveCreating';
import { NativePrimitiveReady } from './NativePrimitiveReady';
import { toCoefficients } from './toCoefficients';
import { Destroyable } from 'xbsj-base';
import { czmPropMaps } from '../../../../ESJTypesCzm';
import { toCartesian2, toCartesian3, toColor, toDistanceDisplayCondition } from '../../../../utils';
import { PickingManager } from '../../../../ESCesiumViewer';

export class NativePrimitive extends Destroyable {
    get owner() { return this._owner; }
    get czmCzmModelPrimitive() { return this.owner.owner.owner; }
    get czmViewer() { return this.czmCzmModelPrimitive.czmViewer; }
    get viewer() { return this.czmViewer.viewer as Cesium.Viewer; }
    get scene() { return this.viewer.scene; }
    get primitive() { return this._primitive; }
    get sceneObject() { return this.czmCzmModelPrimitive; }
    get gltf() { return this._gltf; }
    get pickingManager() { return this.czmViewer.extensions?.pickingManager as PickingManager; }

    private _modelMatrixUpdating

    private _nativePrimitiveReady?: NativePrimitiveReady;
    get nativePrimitiveReady() { return this._nativePrimitiveReady; }

    update() {
        const { visibleAlpha, finalShow, finalSpecularEnvironmentMapsReact } = this.owner.owner.owner;
        const sceneObject = this.owner.owner.owner;
        const { primitive } = this;
        // const modelShow = sceneObject.show ?? true;
        const modelShow = finalShow;
        primitive.show = modelShow;
        // primitive.basePath = model.basePath;//只读属性
        // primitive.allowPicking = model.allowPicking;
        // primitive.incrementallyLoadTextures = model.incrementallyLoadTextures;
        // primitive.asynchronous = model.asynchronous;
        // primitive.showOutline = model.showOutline;
        // primitive.credit = model.credit;
        // primitive.dequantizeInShader = model.dequantizeInShader;//属性不存在
        primitive.clampAnimations = sceneObject.clampAnimations ?? true;
        primitive.shadows = czmPropMaps.shadowPropsMap[sceneObject.shadows ?? 'DISABLED'];
        primitive.debugShowBoundingVolume = sceneObject.debugShowBoundingVolume ?? false;
        primitive.debugWireframe = sceneObject.debugWireframe ?? false;
        primitive.backFaceCulling = sceneObject.backFaceCulling ?? true;

        primitive.heightReference = sceneObject.heightReference ? czmPropMaps.heightReferencePropsMap[sceneObject.heightReference] : czmPropMaps.heightReferencePropsMap['NONE'];
        primitive.distanceDisplayCondition = toDistanceDisplayCondition(sceneObject.distanceDisplayCondition ?? [0, Number.MAX_VALUE]);
        // primitive.color = sceneObject.color && toColor(sceneObject.color) || Cesium.Color.WHITE;
        {
            const c = (sceneObject.color ?? [1, 1, 1, 1]);
            c[3] *= visibleAlpha;
            const color = toColor(c);
            primitive.color = color;
        }
        primitive.colorBlendMode = czmPropMaps.colorBlendModeType[sceneObject.colorBlendMode ?? 'HIGHLIGHT'];
        primitive.silhouetteColor = sceneObject.silhouetteColor && toColor(sceneObject.silhouetteColor) || Cesium.Color.RED;
        primitive.silhouetteSize = sceneObject.silhouetteSize ?? 0;
        primitive.colorBlendAmount = sceneObject.colorBlendAmount ?? 0.5;

        primitive.lightColor = toCartesian3(sceneObject.lightColor ?? [1, 1, 1]);

        // Cesium 1.83
        // primitive.imageBasedLightingFactor = toCartesian2(sceneObject.imageBasedLightingFactor ?? [1.0, 1.0]);
        // primitive.luminanceAtZenith = sceneObject.luminanceAtZenith ?? .2;
        // @ts-ignore
        // primitive.sphericalHarmonicCoefficients = sceneObject.sphericalHarmonicCoefficients && sceneObject.sphericalHarmonicCoefficients.map(e => toCartesian3(e));
        // @ts-ignore
        // primitive.specularEnvironmentMaps = sceneObject.specularEnvironmentMaps;
        // Cesium 1.99
        const ibl = primitive.imageBasedLighting;
        {
            primitive.environmentMapManager.saturation = 0.35;
            primitive.environmentMapManager.brightness = 1.4;
            primitive.environmentMapManager.gamma = 0.8;
            primitive.environmentMapManager.groundColor =
                Cesium.Color.fromCssColorString("#001850");
        }
        if (ibl && primitive.environmentMapManager) {
            primitive.environmentMapManager.atmosphereScatteringIntensity = sceneObject.luminanceAtZenith ?? 5;
            primitive.environmentMapManager.atmosphereScatteringIntensity = sceneObject.atmosphereScatteringIntensity ?? 5;
            ibl.imageBasedLightingFactor = toCartesian2(sceneObject.imageBasedLightingFactor ?? [1, 1]);
            // @ts-ignore
            ibl.sphericalHarmonicCoefficients = sceneObject.sphericalHarmonicCoefficients && toCoefficients(sceneObject.sphericalHarmonicCoefficients);
            // @ts-ignore
            ibl.specularEnvironmentMaps = finalSpecularEnvironmentMapsReact.value;
        }

        primitive.minimumPixelSize = sceneObject.nativeMinimumPixelSize;
        // @ts-ignore
        primitive.maximumScale = sceneObject.nativeMaximumScale;
        primitive.scale = sceneObject.nativeScale;

        if (this._nativePrimitiveReady) {
            this._nativePrimitiveReady.update();
        }
    }

    constructor(private _gltf: any, private _primitive: Cesium.Model, private _owner: NativePrimitiveCreating) {
        super();
        this._modelMatrixUpdating = this.disposeVar(new ModelMatrixUpdating(this));
        const { czmViewer, sceneObject, pickingManager } = this;
        const { viewer } = czmViewer;
        if (!viewer) throw new Error(`!viewer`);
        const { scene } = viewer;
        scene.primitives.add(this._primitive);
        this.dispose(() => scene.primitives.remove(this._primitive));

        this.owner.owner.owner.setPrimitive(this._primitive);
        this.dispose(() => this.owner.owner.owner.setPrimitive(undefined));

        this.dispose(sceneObject.printDebugInfoEvent.disposableOn(() => {
            console.log(`---czm-model-primitive-debug-info-viewerid-${czmViewer.id}-begin---`);
            console.log(`CzmCzmModelPrimitive: `, this);
            console.log(`native gltf: `, this.gltf);
            console.log(`native primitive: `, this.primitive);
            console.log(`---czm-model-primitive-debug-info-viewerid-${czmViewer.id}-end---`);
        }));

        // {
        //     const event = this.disposeVar(createNextAnimateFrameEvent(
        //         sceneObject.sPositionEditing.pickingChanged,
        //         sceneObject.sPrsEditing.sPositionEditing.pickingChanged,
        //     ));
        //     this.disposeVar(new ObjResettingWithEvent(event, () => {
        //         if (sceneObject.sPositionEditing.picking || sceneObject.sPrsEditing.sPositionEditing.picking || !sceneObject.allowPickingDepth) {
        //             return new CzmViewer.ObjectsToExcludeWrapper(this.czmViewer, [this._primitive])
        //         }
        //         return undefined;
        //     }));
        // }

        const d = this._primitive.readyEvent.addEventListener(() => {
            d();
            if (!this.primitive.ready) {
                console.error(`!this.primitive.ready`);
                throw new Error(`!this.primitive.ready`);
            }

            if (this._nativePrimitiveReady) {
                console.error(`this._nativePrimitiveReady`);
                throw new Error(`this._nativePrimitiveReady`);
            }
            this._nativePrimitiveReady = this.disposeVar(new NativePrimitiveReady(this));
            this._nativePrimitiveReady.update();
        });
        this.dispose(d);
    }
}
