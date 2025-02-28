import * as Cesium from 'cesium';
import { ESJNativeNumber16, ESSceneObject, PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from '../../../../ESCesiumViewer';
import { CzmModelAnimationJsonType, CzmModelAnimationType, CzmModelNodeTransformations, CzmModelPrimitiveCustomShaderClassType, CzmModelPrimitiveCustomShaderInstanceClassType, CzmPassType } from '../../../../ESJTypesCzm';
import { defaultGetLocalFilePath, Destroyable, Event, extendClassProps, Listener, react, reactArray, reactArrayWithUndefined, reactDeepArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactJson, reactJsonWithUndefined, track } from 'xbsj-base';
import { CzmViewDistanceRangeControl, flyTo, getSceneScaleForScreenPixelSize, SmoothMoving } from '../../../../utils';
import { NativePrimitiveResetting } from './NativePrimitiveResetting';
const defaultCzmModelNodeTransformation = {
    translationX: 0,
    translationY: 0,
    translationZ: 0,
    rotationHeading: 0,
    rotationPitch: 0,
    rotationRoll: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
}
export class CzmModelPrimitive extends Destroyable {
    static defaultUrl = '${earthsdk3-assets-script-dir}/assets/glb/building.glb';
    static defaultSpecularEnvironmentMaps = '${earthsdk3-assets-script-dir}/assets/EnvironmentMap/kiara_6_afternoon_2k_ibl.ktx2';
    private _readyEvent = this.disposeVar(new Event<[Cesium.Model]>());
    get readyEvent() { return this._readyEvent; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _customShaderInstanceClass = this.disposeVar(react<CzmModelPrimitiveCustomShaderInstanceClassType | undefined>(undefined));
    get customShaderInstanceClass() { return this._customShaderInstanceClass.value; }
    set customShaderInstanceClass(value: CzmModelPrimitiveCustomShaderInstanceClassType | undefined) { this._customShaderInstanceClass.value = value; }
    get customShaderInstanceClassChanged() { return this._customShaderInstanceClass.changed; }

    private _updateCustomShaderEvent = this.disposeVar(new Event<[(customShaderInstance: CzmModelPrimitiveCustomShaderClassType, sceneObject: CzmModelPrimitive, viewer: ESCesiumViewer) => void]>());
    get updateCustomShaderEvent() { return this._updateCustomShaderEvent; }
    updateCustomShader(func: (customShaderInstance: CzmModelPrimitiveCustomShaderClassType) => void) {
        this._updateCustomShaderEvent.emit(func);
    }

    private _activeAnimations = this.disposeVar(reactDeepArrayWithUndefined<CzmModelAnimationType>(undefined, (a, b) => {
        return a.animationTime === b.animationTime &&
            a.delay === b.delay &&
            a.index === b.index &&
            a.loop === b.loop &&
            a.multiplier === b.multiplier &&
            a.name === b.name &&
            a.removeOnStop === b.removeOnStop &&
            a.reverse === b.reverse &&
            Cesium.JulianDate.equals(a.startTime, b.startTime) &&
            Cesium.JulianDate.equals(a.stopTime, b.stopTime) &&
            true;
    }, s => ({ ...s })));
    get activeAnimations() { return this._activeAnimations.value; }
    get activeAnimationsChanged() { return this._activeAnimations.changed; }
    set activeAnimations(value: CzmModelAnimationType[] | undefined) { this._activeAnimations.value = value; }

    static defaults = {
        activeAnimationsAnimateWhilePaused: false,
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
    };

    // private _sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'positionEditing'], this.components));
    // get sPositionEditing() { return this._sPositionEditing; }

    // private _sRotationEditing = this.disposeVar(new RotationEditing([this, 'position'], [this, 'rotation'], [this, 'rotationEditing'], this.components, {
    //     showHelper: false,
    // }));
    // get sRotationEditing() { return this._sRotationEditing; }

    // private _sPrsEditing = this.disposeVar(new PrsEditing([this, 'position'], [this, 'rotation'], [this, 'editing'], this, { rotation: { showHelper: false, } }));
    // get sPrsEditing() { return this._sPrsEditing; }

    private _primitive?: Cesium.Model;
    setPrimitive(value: Cesium.Model | undefined) { this._primitive = value; }
    get primitive() { return this._primitive; }
    private _customShaderInstance?: CzmModelPrimitiveCustomShaderClassType;

    private _gltf = this.disposeVar(react<any>(undefined));
    get gltf() { return this._gltf.value; }
    set gltf(value: any) { this._gltf.value = value; }
    get gltfChanged() { return this._gltf.changed; }

    private _czmViewVisibleDistanceRangeControl;
    get czmViewerVisibleDistanceRangeControl() { return this._czmViewVisibleDistanceRangeControl; }
    get visibleAlpha() { return this._czmViewVisibleDistanceRangeControl.visibleAlpha; }
    get visibleAlphaChanged() { return this._czmViewVisibleDistanceRangeControl.visibleAlphaChanged; }
    // private _viewDistanceDebugBinding = (this.dispose(track([this._czmViewVisibleDistanceRangeControl, 'debug'], [this, 'viewDistanceDebug'])), 0);

    private _sceneScaleFromPixelSize = this.disposeVar(react<number | undefined>(undefined));
    get sceneScaleFromPixelSize() { return this._sceneScaleFromPixelSize; }

    private _finalShowReact = this.disposeVar(react<boolean>(true));
    get finalShow() { return this._finalShowReact.value; }

    private _finalModelUriReact;
    get finalModelUriReact() { return this._finalModelUriReact; }

    private _finalSpecularEnvironmentMapsReact = this.disposeVar(ESSceneObject.context.createEnvStrReact([this, 'specularEnvironmentMaps']));
    get finalSpecularEnvironmentMapsReact() { return this._finalSpecularEnvironmentMapsReact; }
    get czmViewer() { return this._czmViewer; }

    private _id = this.disposeVar(react<string | undefined>(undefined));
    get id() { return this._id.value; }
    set id(value: string | undefined) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    constructor(private _czmViewer: ESCesiumViewer, id?: string) {
        super();
        if (id) this.id = id;
        this._czmViewVisibleDistanceRangeControl = this.disposeVar(new CzmViewDistanceRangeControl(
            this.czmViewer,
            [this, 'viewDistanceRange'],
            [this, 'position'],
            // [this.sceneObject, 'radius'],
        ));
        this.dispose(track([this._czmViewVisibleDistanceRangeControl, 'debug'], [this, 'viewDistanceDebug']))
        this._finalModelUriReact = this.disposeVar(ESSceneObject.context.createEnvStrReact([this, 'url'], CzmModelPrimitive.defaultUrl));
        this.disposeVar(new NativePrimitiveResetting(this));
        const viewer = _czmViewer.viewer;
        if (!viewer) return;
        const updateInstanceClassStr = () => {
            try {
                this.customShaderInstanceClass = this.customShaderInstanceClassStr && Function(`"use strict";return (${this.customShaderInstanceClassStr})`)();
            } catch (error) {
                this.customShaderInstanceClass = undefined;
            }
        };
        updateInstanceClassStr();
        this.dispose(this.customShaderInstanceClassStrChanged.disposableOn(updateInstanceClassStr));

        {
            const update = () => {
                if (!this.activeAnimationsJson) {
                    this.activeAnimations = undefined;
                    return;
                }

                this.activeAnimations = this.activeAnimationsJson.map(e => {
                    let animationTime = undefined;
                    try {
                        animationTime = e.animationTime && Function(`"use strict";return (${e.animationTime})`)();
                    } catch (error) {
                        console.error(`animationTimeStr eval error: ${error}`, error);
                        animationTime = undefined;
                    }
                    return {
                        name: e.name,
                        index: e.index,
                        startTime: (e.startTime !== undefined) && Cesium.JulianDate.fromDate(new Date(e.startTime)) || undefined,
                        delay: e.delay,
                        stopTime: (e.stopTime !== undefined) && Cesium.JulianDate.fromDate(new Date(e.stopTime)) || undefined,
                        removeOnStop: e.removeOnStop,
                        multiplier: e.multiplier,
                        reverse: e.reverse,
                        loop: e.loop && Cesium.ModelAnimationLoop[e.loop],
                        animationTime,
                    };
                });
            };
            update();
            this.activeAnimationsJsonChanged.disposableOn(update);
        }
        {
            const update = () => this._finalShowReact.value = (this.show ?? true) && (this.visibleAlpha > 0);
            update();
            this.dispose(this.showChanged.disposableOn(update));
            this.dispose(this.visibleAlphaChanged.disposableOn(update));
        }

        // sceneScaleFromPixelSize
        const { sceneScaleFromPixelSize } = this;
        {
            const update = () => {
                let sceneScale: number | undefined;
                do {
                    if (!this.position || !this.pixelSize) {
                        break;
                    }

                    const cartesian = Cesium.Cartesian3.fromDegrees(...this.position);
                    if (!cartesian) {
                        break;
                    }

                    sceneScale = getSceneScaleForScreenPixelSize(viewer.scene, cartesian, this.pixelSize);
                    if (sceneScale === undefined) {
                        break;
                    }

                    if (this.maximumScale !== undefined && sceneScale > this.maximumScale) {
                        sceneScale = this.maximumScale;
                    }

                    if (this.minimumScale !== undefined && sceneScale < this.minimumScale) {
                        sceneScale = this.minimumScale;
                    }
                } while (false);
                sceneScaleFromPixelSize.value = sceneScale;
            };
            update();

            // 相机的修改必须在preUpdate之前就要定下来，这样preUpdate中的模型位置调整才合适
            // const event = this.disposeVar(createNextMicroTaskEvent(cameraChanged, sceneObject.positionChanged, sceneObject.maximumScaleChanged, sceneObject.minimumScaleChanged, sceneObject.pixelSizeChanged));
            // this.dispose(event.disposableOn(update));
            this.dispose(viewer.scene.preUpdate.addEventListener(update));
        }

        // TODO:用来在视口中显示当前自动计算的缩放值！
        // this.disposeVar(new CurrentSceneScalePoi(this.czmViewer, [this, 'showSceneScale'], [this, 'position'], sceneScaleFromPixelSize));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!this.position) {
                console.warn(`当前没有位置信息，无法飞入！`);
                return;
            }

            if (this._primitive && this._primitive.ready && this._primitive.boundingSphere) {
                // @ts-ignore
                const { center, radius } = this._primitive._boundingSphere as Cesium.BoundingSphere;
                const cartesian = Cesium.Matrix4.multiplyByPoint(this._primitive.modelMatrix, center, new Cesium.Cartesian3());
                // const position = positionFromCartesian(cartesian);
                const viewDistance = radius * 3;
                flyTo(viewer, this.position, viewDistance, undefined, duration);
            } else {
                const viewDistance = viewer.scene.camera.positionCartographic.height;
                flyTo(viewer, this.position, viewDistance, undefined, duration);
            }
        }));

        this.dispose(this.updateCustomShaderEvent.disposableOn(func => {
            this._customShaderInstance && func(this._customShaderInstance, this, this.czmViewer);
        }));
    }
    get ready() {
        return !!this._primitive && this._primitive.ready;
    }

    /**
     * 打开本地目录，加载本地gltf数据，注意只能打开gltf文件所在目录
    */
    async openLocalDir() {
        const url = await defaultGetLocalFilePath(['gltf', 'glb'], 'gltf')
        this.url = url;
    }

    /**
     * 删除某个node节点的transformation配置
     * @param nodeName 
     * @returns 
     */
    deleteNodeTransformation(nodeName: string) {
        if (!this.nodeTransformations) return;
        if (!this.nodeTransformations[nodeName]) return;
        const nodeTransformations = { ...this.nodeTransformations };
        delete nodeTransformations[nodeName];
        this.nodeTransformations = nodeTransformations;
    }

    setNodeTranslation(nodeName: string, translation: [number, number, number]) {
        if (!this.nodeTransformations) {
            this.nodeTransformations = {};
        }

        const transformation = this.nodeTransformations[nodeName] ?? { ...defaultCzmModelNodeTransformation };

        if (translation.length !== 3 || translation.some(e => !Number.isFinite(e))) {
            console.error(`setNodeTranslation error: translation.length !== 3 || translation.some(e => !Number.isFinite(e)): ${nodeName} ${translation}`);
            return;
        }

        this.nodeTransformations = {
            ...this.nodeTransformations,
            [nodeName]: {
                ...transformation,
                translationX: translation[0],
                translationY: translation[1],
                translationZ: translation[2],
            },
        };
    }

    getNodeTranslation(nodeName: string) {
        if (!this.nodeTransformations) return undefined;
        const nodeTransform = this.nodeTransformations[nodeName];
        if (!nodeTransform) return undefined;
        return [nodeTransform.translationX, nodeTransform.translationY, nodeTransform.translationZ] as [number, number, number];
    }

    setNodeRotation(nodeName: string, rotation: [number, number, number]) {
        if (!this.nodeTransformations) {
            this.nodeTransformations = {};
        }

        const transformation = this.nodeTransformations[nodeName] ?? { ...defaultCzmModelNodeTransformation };

        if (rotation.length !== 3 || rotation.some(e => !Number.isFinite(e))) {
            console.error(`setNodeTranslation error: rotation.length !== 3 || rotation.some(e => !Number.isFinite(e)) ${nodeName} ${rotation}`);
            return;
        }

        this.nodeTransformations = {
            ...this.nodeTransformations,
            [nodeName]: {
                ...transformation,
                rotationHeading: rotation[0],
                rotationPitch: rotation[1],
                rotationRoll: rotation[2],
            },
        };
    }

    getNodeRotation(nodeName: string) {
        if (!this.nodeTransformations) return undefined;
        const nodeTransform = this.nodeTransformations[nodeName];
        if (!nodeTransform) return undefined;
        return [nodeTransform.rotationHeading, nodeTransform.rotationPitch, nodeTransform.rotationRoll] as [number, number, number];
    }

    setNodeScale(nodeName: string, scale: [number, number, number]) {
        if (!this.nodeTransformations) {
            this.nodeTransformations = {};
        }
        const transformation = this.nodeTransformations[nodeName] ?? { ...defaultCzmModelNodeTransformation };

        if (scale.length !== 3 || scale.some(e => !Number.isFinite(e) || e < 0)) {
            console.error(`setNodeTranslation error: scale.length !== 3 || scale.some(e => !Number.isFinite(e) || e < 0) ${nodeName} ${scale}`);
            return;
        }

        this.nodeTransformations = {
            ...this.nodeTransformations,
            [nodeName]: {
                ...transformation,
                scaleX: scale[0],
                scaleY: scale[1],
                scaleZ: scale[2],
            },
        };
    }

    getNodeScale(nodeName: string) {
        if (!this.nodeTransformations) return undefined;
        const nodeTransform = this.nodeTransformations[nodeName];
        if (!nodeTransform) return undefined;
        return [nodeTransform.scaleX, nodeTransform.scaleY, nodeTransform.scaleZ] as [number, number, number];
    }

    private _printDebugInfoEvent = this.disposeVar(new Event());
    get printDebugInfoEvent() { return this._printDebugInfoEvent; }
    printDebugInfo() { this._printDebugInfoEvent.emit(); }

    private _smoothMoving = this.disposeVar(new SmoothMoving());
    private _smoothMovingBinding = this.dispose(this._smoothMoving.currentPositionChanged.disposableOn(() => this.position = this._smoothMoving.currentPosition));
    private _smoothMovingBinding2 = this.dispose(this._smoothMoving.currentPositionChanged.disposableOn(() => this.rotation = [this._smoothMoving.currentHeading ?? 0, this.rotation && this.rotation[1] || 0, this.rotation && this.rotation[2] || 0]));
    smoothMove(destination: [number, number, number], duration: number) {
        if (!this.position) {
            this.position = destination;
        }
        this._smoothMoving.restart(this.position, 0);
        this._smoothMoving.restart(destination, duration);

    }
}
export namespace CzmModelPrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        url: undefined as string | undefined,
        editing: false,
        positionEditing: false,
        rotationEditing: false,
        allowPicking: undefined as boolean | undefined,
        allowPickingDepth: true,
        maximumScale: undefined as number | undefined,
        minimumScale: undefined as number | undefined,
        pixelSize: undefined as number | undefined,
        showSceneScale: undefined as boolean | undefined, // 显示每个窗口中的模型缩放值
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单
        rotation: reactArray<[number, number, number]>([0, 0, 0]), // 偏航俯仰翻转，度为单位
        scale: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 缩放
        localPosition: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 本地单位，不是经纬度！
        localRotation: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 本地旋转
        localScale: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 本地缩放
        localModelMatrix: reactArrayWithUndefined<ESJNativeNumber16 | undefined>(undefined), // 本地矩阵，一旦启用，localPosition、localRotation、localScale将不起作用！
        modelMatrix: reactArrayWithUndefined<ESJNativeNumber16 | undefined>(undefined),
        forwardAxis: undefined as 0 | 1 | 2 | undefined,
        upAxis: undefined as 0 | 1 | 2 | undefined,
        color: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        silhouetteColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        shadows: undefined as 'DISABLED' | 'ENABLED' | 'CAST_ONLY' | 'RECEIVE_ONLY' | undefined,
        credit: undefined as string | undefined,
        basePath: undefined as string | undefined,
        gltfJson: reactJson(undefined),
        heightReference: undefined as 'NONE' | 'CLAMP_TO_GROUND' | 'RELATIVE_TO_GROUND' | undefined, // as HeightReferenceType, // HeightReference} [heightReference=HeightReference.NONE] A Property specifying what the height from the entity position is relative to.
        distanceDisplayCondition: undefined as [number, number] | undefined, // DistanceDisplayCondition} [distanceDisplayCondition] A Property specifying at what distance from the camera that this box will be displayed.
        colorBlendMode: undefined as "HIGHLIGHT" | "REPLACE" | "MIX" | undefined,	//ColorBlendMode	ColorBlendMode.HIGHLIGHT	optionalDefines how the color blends with the model.
        // clippingPlanes	ClippingPlaneCollection		optionalThe ClippingPlaneCollection used to selectively disable rendering the model.
        incrementallyLoadTextures: undefined as boolean | undefined,
        asynchronous: undefined as boolean | undefined,
        clampAnimations: undefined as boolean | undefined,
        debugShowBoundingVolume: undefined as boolean | undefined,
        debugWireframe: undefined as boolean | undefined,
        backFaceCulling: undefined as boolean | undefined,
        showOutline: undefined as boolean | undefined,
        colorBlendAmount: undefined as number | undefined,
        silhouetteSize: undefined as number | undefined,
        imageBasedLightingFactor: undefined as [number, number] | undefined,
        lightColor: undefined as [number, number, number] | undefined,
        luminanceAtZenith: undefined as number | undefined,
        atmosphereScatteringIntensity: undefined as number | undefined,
        sphericalHarmonicCoefficients: undefined as [number, number, number][] | undefined, // 9个Cartesian3
        specularEnvironmentMaps: undefined as string | undefined,
        customShaderInstanceClassStr: undefined as string | undefined,
        activeAnimationsJson: reactJsonWithUndefined<CzmModelAnimationJsonType[]>(undefined),
        activeAnimationsAnimateWhilePaused: undefined as boolean | undefined,
        nodeTransformations: reactJsonWithUndefined<CzmModelNodeTransformations>(undefined),
        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,
        nativeMinimumPixelSize: 0,
        nativeMaximumScale: undefined as number | undefined,
        nativeScale: 1,
        opaquePass: 'OPAQUE' as CzmPassType,
    });
}
extendClassProps(CzmModelPrimitive.prototype, CzmModelPrimitive.createDefaultProps);
export interface CzmModelPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmModelPrimitive.createDefaultProps>> { }
