// @ts-nocheck
//TODO:未启动TS检查
import { Destroyable, react, Event, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, reactJson, JsonValue, Listener, getMinMaxPosition, createProcessingFromAsyncFunc, sleep, createCancelablePromise, Vector, track, createNextAnimateFrameEvent, ObjResettingWithEvent, SceneObjectWithId, SceneObjectKey, createGuid } from "xbsj-base";
import { defaultAttribute, defaultBoundingVolume, defaultDsAttribute, defaultDsIndexTypedArray, defaultFragmentShaderSource, defaultIndexTypedArray, defaultRenderState, defaultUniformMap, defaultVertexShaderSource } from "./defaults";
import { attributesJsonToAttributes, attributesToAttributesJson, indexJsonToIndex, indexToIndexJson, triangleIndicesToLine } from "./funcs";
import { AttributesJsonType, BoundingVolumeJsonType, CzmCustomPrimitiveUniformMapType, CzmPassType, CzmPrimitiveType, IndexJsonType } from "./types";
import { CzmCustomPrimitiveImpl } from "./CzmCustomPrimitiveImpl";
import { ESJNativeNumber16, PickedInfo } from "earthsdk3";
// import { PositionEditing, PrsEditing, RotationEditing } from "src/CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import * as Cesium from 'cesium';
import { computeCzmModelMatrix, CurrentSceneScalePoi, CzmViewDistanceRangeControl, flyTo, getSceneScaleForScreenPixelSize, positionFromCartesian } from "../../../../utils";
import { CzmTexture } from "../../../../CzmObjects";
import { CzmAttributesType, CzmIndexType } from "../../../../ESJTypesCzm";

function fetchImage(imageUrl: string) {
    // 当前使用的是1.83版Cesium，Promise居然还是when.js!
    const promise = Cesium.Resource.fetchImage({ url: imageUrl });
    if (promise instanceof Promise) {
        return promise as Promise<HTMLImageElement | ImageBitmap>;
    } else if (promise) {
        return new Promise<HTMLImageElement | ImageBitmap>((resolve, reject) => {
            // @ts-ignore
            promise.then(resolve).otherwise(reject);
        });
    } else {
        return Promise.reject(`Cesium.Resource.fetchImage error, 可能是参数有问题！`);
    }
}

function createTexture(context: Cesium.Context, image: ImageBitmap | HTMLImageElement) {
    // @ts-ignore
    if (image.internalFormat !== undefined) {
        return new Cesium.Texture({
            context: context,
            // @ts-ignore
            pixelFormat: image.internalFormat,
            // @ts-ignore
            width: image.naturalWidth,
            // @ts-ignore
            height: image.naturalHeight,
            // @ts-ignore
            source: {
                // @ts-ignore
                arrayBufferView: image.bufferView
            }
        });
    } else {
        return new Cesium.Texture({
            context: context,
            // @ts-ignore
            source: image
        });
    }
}

function createTextureFromImageUriProcessing(context: Cesium.Context, imageUrl: string, setTextureFunc: (texture: Cesium.Texture | undefined) => void) {
    return createProcessingFromAsyncFunc(async cancelsManager => {
        try {
            await cancelsManager.promise(sleep(1000));
            const image = await cancelsManager.promise(createCancelablePromise(fetchImage(imageUrl)));
            const texture = createTexture(context, image);
            setTextureFunc(texture);
        } catch (error) {
            // console.error(error);
            // debugger;
            setTextureFunc(undefined);
            throw error;
        }
    });
}

class TextureResetting extends Destroyable {
    private _processing = this.disposeVar(createTextureFromImageUriProcessing(this._context, this._imageUri, this._setTextureFunc));
    get processing() { return this._processing; }
    constructor(private _context: Cesium.Context, private _imageUri: string, private _setTextureFunc: (texture: Cesium.Texture | undefined) => void) {
        super();
        this._processing.start();
    }
}

function getCenterAndViewDistance(boundingVolume: Cesium.BoundingSphere | Cesium.BoundingRectangle | Cesium.OrientedBoundingBox) {
    let viewDistance: number | undefined;
    let center: [number, number, number] | undefined;
    if (boundingVolume instanceof Cesium.BoundingSphere) {
        center = positionFromCartesian(boundingVolume.center);
        viewDistance = boundingVolume.radius * 5.0;
    } else if (boundingVolume instanceof Cesium.BoundingRectangle) {
        const { x, y, width, height } = boundingVolume;
        const rectangle = Cesium.Rectangle.fromRadians(x, y, x + width, y + height);
        const bs = Cesium.BoundingSphere.fromRectangle2D(rectangle);
        center = positionFromCartesian(bs.center);
        viewDistance = bs.radius * 5.0;
    } else if (boundingVolume instanceof Cesium.OrientedBoundingBox) {
        center = positionFromCartesian(boundingVolume.center);
        const h = boundingVolume.halfAxes;
        const d0 = Vector.magnitude([h[0], h[1], h[2]]);
        const d1 = Vector.magnitude([h[3], h[4], h[5]]);
        const d2 = Vector.magnitude([h[6], h[7], h[8]]);
        viewDistance = Math.max(d0, d1, d2) * 5.0;
    }

    if (!center || viewDistance === undefined) {
        return undefined;
    }

    return [center, viewDistance] as [center: [number, number, number], viewDistance: number];
}

// TODO(vtxf): 以后需要支持双精度顶点计算！
export class CzmCustomPrimitive extends Destroyable {
    static readonly defaultRenderState = defaultRenderState;
    static readonly defaultVertexShaderSource = defaultVertexShaderSource;
    static readonly defaultFragmentShaderSource = defaultFragmentShaderSource;
    static readonly defaultUniformMap = defaultUniformMap;
    static readonly defaultBoundingVolume = defaultBoundingVolume;
    static readonly defaultAttribute = defaultAttribute;
    static readonly defaultIndexTypedArray = defaultIndexTypedArray;
    static readonly defaultDsAttribute = defaultDsAttribute;
    static readonly defaultDsIndexTypedArray = defaultDsIndexTypedArray;

    static triangleIndicesToLine = triangleIndicesToLine;

    get attributesJson() {
        return this.attributes && attributesToAttributesJson(this.attributes);
    }

    set attributesJson(value: AttributesJsonType | undefined) {
        const oldJsonStr = JSON.stringify(this.attributesJson);
        const newJsonStr = JSON.stringify(value);
        if (oldJsonStr !== newJsonStr) {
            this.attributes = value && attributesJsonToAttributes(value);
        }
    }

    get attributesJsonChanged() {
        return this.attributesChanged;
    }

    get indexTypedArrayJson() {
        return this.indexTypedArray && indexToIndexJson(this.indexTypedArray);
    }

    set indexTypedArrayJson(value: IndexJsonType | undefined) {
        const oldJsonStr = JSON.stringify(this.indexTypedArrayJson);
        const newJsonStr = JSON.stringify(value);
        if (oldJsonStr !== newJsonStr) {
            this.indexTypedArray = value && indexJsonToIndex(value);
        }
    }

    get indexTypedArrayJsonChanged() {
        return this.indexTypedArrayChanged;
    }

    private _attributes = this.disposeVar(react<CzmAttributesType | undefined>(undefined));
    get attributes() { return this._attributes.value; }
    set attributes(value: CzmAttributesType | undefined) { this._attributes.value = value; }
    get attributesChanged() { return this._attributes.changed; }

    private _indexTypedArray = this.disposeVar(react<CzmIndexType | undefined>(undefined));
    get indexTypedArray() { return this._indexTypedArray.value; }
    set indexTypedArray(value: CzmIndexType | undefined) { this._indexTypedArray.value = value; }
    get indexTypedArrayChanged() { return this._indexTypedArray.changed; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sceneScaleEvent = this.disposeVar(new Event<[sceneScale: number | undefined, viewer: ESCesiumViewer]>());
    get sceneScaleEvent() { return this._sceneScaleEvent; }

    // private _sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'positionEditing'], this.czmViewer));
    // get sPositionEditing() { return this._sPositionEditing; }

    // private _sRotationEditing = this.disposeVar(new RotationEditing([this, 'position'], [this, 'rotation'], [this, 'rotationEditing'], this.czmViewer, {
    //     showHelper: false,
    // }));
    // get sRotationEditing() { return this._sRotationEditing; }

    // private _sPrsEditing = this.disposeVar(new PrsEditing([this, 'position'], [this, 'rotation'], [this, 'editing'], this, { rotation: { showHelper: false, } }));
    // get sPrsEditing() { return this._sPrsEditing; }

    static defaults = {
        position: [116.39, 39.9, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        modelMatrix: [-0.8957893500750183, -0.4444788412198901, 0, 0, 0.28511078894078473, -0.5746037485691958, 0.7671651518152995, 0, -0.3409886777031455, 0.68721837274483, 0.6414496315691579, 0, -2177873.9967047274, 4389222.053178148, 4069473.6755001387, 1] as ESJNativeNumber16,
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
    };

    get czmViewer() { return this._czmViewer; }

    private _nativePrimitive?: CzmCustomPrimitiveImpl;
    get nativePrimitive() { return this._nativePrimitive; }

    private _lastCzmPickResult: any = undefined;

    private _czmViewVisibleDistanceRangeControl;
    get czmViewerVisibleDistanceRangeControl() { return this._czmViewVisibleDistanceRangeControl; }
    get visibleAlpha() { return this._czmViewVisibleDistanceRangeControl.visibleAlpha; }
    get visibleAlphaChanged() { return this._czmViewVisibleDistanceRangeControl.visibleAlphaChanged; }
    // private _viewDistanceDebugBinding = (this.dispose(track([this._czmViewVisibleDistanceRangeControl, 'debug'], [this, 'viewDistanceDebug'])), 0);
    
    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }
    constructor(private _czmViewer: ESCesiumViewer, id?: string | undefined) {
        super();
        id && (this.id = id);
        this._czmViewVisibleDistanceRangeControl = this.disposeVar(new CzmViewDistanceRangeControl(
            this.czmViewer,
            [this, 'viewDistanceRange'],
            [this, 'position'],
            // [this.sceneObject, 'radius'],
        ));
        const viewer = _czmViewer.viewer;
        if (!viewer) return;
        this.dispose(track([this._czmViewVisibleDistanceRangeControl, 'debug'], [this, 'viewDistanceDebug']))

        const { scene } = viewer;
        const { context } = scene;

        const primitive = viewer.scene.primitives.add(new CzmCustomPrimitiveImpl(viewer.scene, id)) as CzmCustomPrimitiveImpl;
        this._nativePrimitive = primitive;
        this.dispose(() => viewer.scene.primitives.remove(primitive));

        {
            const event = this.disposeVar(createNextAnimateFrameEvent(
                // this.sPositionEditing.pickingChanged,
                this.allowPickingDepthChanged,
            ));
            this.disposeVar(new ObjResettingWithEvent(event, () => {
                if (!this.allowPickingDepth) {
                    // if (!this.allowPickingDepth || this.sPositionEditing.picking) {
                    if (!this.allowPickingDepth) {
                        return new ESCesiumViewer.ObjectsToExcludeWrapper(this.czmViewer, [primitive]);
                    }
                    return undefined;
                }
            }));
        }

        const sceneScaleFromPixelSize = react<number | undefined>(undefined);
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

            // const event = this.disposeVar(createNextMicroTaskEvent(cameraChanged, sceneObject.positionChanged, sceneObject.maximumScaleChanged, sceneObject.minimumScaleChanged, sceneObject.pixelSizeChanged));
            // this.dispose(event.disposableOn(update));
            this.dispose(viewer.scene.preUpdate.addEventListener(update));
        }

        {
            const update = () => {
                this.sceneScaleEvent.emit(sceneScaleFromPixelSize.value, this.czmViewer);
            };
            update();
            this.dispose(sceneScaleFromPixelSize.changed.disposableOn(update));
        }

        // 用来在视口中显示当前自动计算的缩放值！
        this.disposeVar(new CurrentSceneScalePoi(_czmViewer, [this, 'showSceneScale'], [this, 'position'], sceneScaleFromPixelSize));

        // 显隐属性绑定
        {
            const updateShow = () => {
                primitive.show = (this.show ?? true) && (this.visibleAlpha > 0);
            };
            updateShow();
            this.dispose(this.showChanged.disposableOn(updateShow));
            this.dispose(this.visibleAlphaChanged.disposableOn(updateShow));
        }
        // 模型矩阵属性绑定
        const modelMatrixReact = this.disposeVar(react<Cesium.Matrix4 | undefined>(undefined));
        {
            const updateModelMatrix = () => {
                const modelMatrix = computeCzmModelMatrix({
                    localScale: this.localScale,
                    initialRotation: 'yForwardzUp',
                    localRotation: this.localRotation,
                    localPosition: this.localPosition,
                    localModelMatrix: this.localModelMatrix,
                    sceneScaleFromPixelSize: sceneScaleFromPixelSize.value,
                    scale: this.scale,
                    rotation: this.rotation,
                    position: this.position,
                    modelMatrix: this.modelMatrix,
                });

                if (!modelMatrix) {
                    console.warn(`computeCzmModelMatrix error!`);
                    return;
                }

                modelMatrixReact.value = modelMatrix;
                primitive.modelMatrix = modelMatrix;
            };
            updateModelMatrix();
            let modelMatrixDirty = true;
            this.dispose(this.showChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(this.localPositionChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(this.localRotationChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(this.localScaleChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(this.localModelMatrixChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(this.positionChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(this.rotationChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(this.scaleChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(this.modelMatrixChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(sceneScaleFromPixelSize.changed.disposableOn(() => modelMatrixDirty = true));
            this.dispose(viewer.scene.preUpdate.addEventListener(() => {
                if (!modelMatrixDirty) {
                    return;
                }
                if (modelMatrixDirty) {
                    modelMatrixDirty = false;
                }
                updateModelMatrix();
            }));
        }

        // 更新包围球
        {
            const updateBoundingVolumeWithoutModelMatrix = () => {
                const { boundingVolume = CzmCustomPrimitive.defaultBoundingVolume } = this;
                if (!boundingVolume) {
                    primitive.boundingVolume = undefined;
                    return;
                }

                if (boundingVolume.type === 'BoundingRectangle') {
                    primitive.boundingVolume = Cesium.BoundingRectangle.fromRectangle(Cesium.Rectangle.fromDegrees(...boundingVolume.data));
                    return;
                }

                if (boundingVolume.type === 'BoundingSphere') {
                    primitive.boundingVolume = new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(...boundingVolume.data.center), boundingVolume.data.radius);
                    return;
                }
            }

            const updateBoundingVolumeWithModelMatrix = () => {
                const { boundingVolume = CzmCustomPrimitive.defaultBoundingVolume } = this;
                if (!boundingVolume) {
                    primitive.boundingVolume = undefined;
                    return;
                }

                if (boundingVolume.type === 'LocalBoundingSphere') {
                    const modelMatrix = modelMatrixReact.value ?? Cesium.Matrix4.IDENTITY;
                    const center = Cesium.Matrix4.multiplyByPoint(modelMatrix, Cesium.Cartesian3.fromArray(boundingVolume.data.center), new Cesium.Cartesian3());
                    primitive.boundingVolume = new Cesium.BoundingSphere(center, boundingVolume.data.radius);
                    return;
                }

                if (boundingVolume.type === 'LocalAxisedBoundingBox') {
                    const modelMatrix = modelMatrixReact.value ?? Cesium.Matrix4.IDENTITY;
                    const { min, max } = boundingVolume.data;
                    const localCenter = new Cesium.Cartesian3(.5 * (min[0] + max[0]), .5 * (min[1] + max[1]), .5 * (min[2] + max[2]));
                    const center = Cesium.Matrix4.multiplyByPoint(modelMatrix, localCenter, localCenter);
                    const localScale = new Cesium.Cartesian3(.5 * (max[0] - min[0]), .5 * (max[1] - min[1]), .5 * (max[2] - min[2]));
                    localScale.x = localScale.x === 0 ? 1.0 : localScale.x;
                    localScale.y = localScale.y === 0 ? 1.0 : localScale.y;
                    localScale.z = localScale.z === 0 ? 1.0 : localScale.z;
                    const scaleMatrix3 = new Cesium.Matrix3(localScale.x, 0, 0, 0, localScale.y, 0, 0, 0, localScale.z);
                    const matrix3 = Cesium.Matrix4.getMatrix3(modelMatrix, new Cesium.Matrix3());
                    const halfAxis = Cesium.Matrix3.multiply(matrix3, scaleMatrix3, matrix3);
                    primitive.boundingVolume = new Cesium.OrientedBoundingBox(center, halfAxis);
                    return;
                }
            };

            const updateBoundingVolume = () => {
                updateBoundingVolumeWithoutModelMatrix();
                updateBoundingVolumeWithModelMatrix();
            };
            updateBoundingVolume();
            this.dispose(this.boundingVolumeChanged.disposableOn(updateBoundingVolume));
            this.dispose(modelMatrixReact.changed.disposableOn(updateBoundingVolumeWithModelMatrix));
        }

        // {
        //     const pickObject = {
        //         primitive,
        //     };
        //     // @ts-ignore
        //     const pickId = context.createPickId(pickObject) as { color: Cesium.Color; };
        //     const { red, green, blue, alpha } = pickId.color;
        //     const pickIdColor = `vec4(${red.toFixed(6)}, ${green.toFixed(6)}, ${blue.toFixed(6)}, ${alpha.toFixed(6)})`;

        //     const updatePicking = () => {
        //         primitive.pickId = sceneObject.allowPicking ? pickIdColor : undefined;
        //     };
        //     updatePicking();
        //     this.dispose(sceneObject.allowPickingChanged.disposableOn(updatePicking));
        // }


        this.dispose(track([primitive, 'allowPicking'], [this, 'allowPicking']));
        // this.dispose(track([primitive, 'attributes'], [this, 'attributes']));
        // this.dispose(track([primitive, 'indexTypedArray'], [this, 'indexTypedArray']));
        {
            const updateAttributes = () => {
                primitive.indexTypedArray = this.indexTypedArray ?? CzmCustomPrimitive.defaultIndexTypedArray;
                // primitive.indexTypedArray = this.indexTypedArray ? indexJsonToIndex(this.indexTypedArray) : CzmCustomPrimitive.defaultIndexTypedArray;
            };
            updateAttributes();
            this.dispose(this.indexTypedArrayChanged.disposableOn(updateAttributes));
        }
        {
            const updateAttributes = () => {
                primitive.attributes = this.attributes ?? CzmCustomPrimitive.defaultAttribute;
                // primitive.attributes = this.attributes ? attributesJsonToAttributes(this.attributes) : CzmCustomPrimitive.defaultAttribute;
            };
            updateAttributes();
            this.dispose(this.attributesChanged.disposableOn(updateAttributes));
        }
        {
            const updateRenderState = () => {
                // @ts-ignore
                primitive.renderState = this.renderState ?? CzmCustomPrimitive.defaultRenderState;
            };
            updateRenderState();
            this.dispose(this.renderStateChanged.disposableOn(updateRenderState));
        }
        {
            const updateVertexShaderSource = () => {
                primitive.vertexShaderSource = this.vertexShaderSource ?? CzmCustomPrimitive.defaultVertexShaderSource;
            };
            updateVertexShaderSource();
            this.dispose(this.vertexShaderSourceChanged.disposableOn(updateVertexShaderSource));
        }
        {
            const updateFragmentShaderSource = () => {
                primitive.fragmentShaderSource = this.fragmentShaderSource ?? CzmCustomPrimitive.defaultFragmentShaderSource;
            };
            updateFragmentShaderSource();
            this.dispose(this.fragmentShaderSourceChanged.disposableOn(updateFragmentShaderSource));
        }
        {
            const updateCull = () => primitive.cull = this.cull ?? true;
            updateCull();
            this.dispose(this.cullChanged.disposableOn(updateCull));
        }
        {
            // @ts-ignore
            const updatePass = () => primitive.pass = Cesium.Pass[this.pass ?? 'TRANSLUCENT'];
            updatePass();
            this.dispose(this.passChanged.disposableOn(updatePass));
        }
        {
            const updatePrimitiveType = () => primitive.primitiveType = Cesium.PrimitiveType[this.primitiveType ?? 'TRIANGLES'];
            updatePrimitiveType();
            this.dispose(this.primitiveTypeChanged.disposableOn(updatePrimitiveType));
        }
        {
            // count
            const updateOcclude = () => primitive.occlude = this.occlude ?? true;
            const updateCount = () => primitive.count = this.count;
            const updateOffset = () => primitive.offset = this.offset ?? 0;
            const updateInstanceCount = () => primitive.instanceCount = this.instanceCount ?? 0;
            const updateCastShadows = () => primitive.castShadows = this.castShadows ?? false;
            const updateReceiveShadows = () => primitive.receiveShadows = this.receiveShadows ?? false;

            updateOcclude();
            updateCount();
            updateOffset();
            updateInstanceCount();
            updateCastShadows();
            updateReceiveShadows();

            this.dispose(this.occludeChanged.disposableOn(updateOcclude));
            this.dispose(this.countChanged.disposableOn(updateCount));
            this.dispose(this.offsetChanged.disposableOn(updateOffset));
            this.dispose(this.instanceCountChanged.disposableOn(updateInstanceCount));
            this.dispose(this.castShadowsChanged.disposableOn(updateCastShadows));
            this.dispose(this.receiveShadowsChanged.disposableOn(updateReceiveShadows));
        }

        {
            // 若干个不常用的属性跟踪
            const updateExecuteInClosestFrustum = () => primitive.executeInClosestFrustum = this.executeInClosestFrustum ?? false;
            const updateDebugShowBoundingVolume = () => primitive.debugShowBoundingVolume = this.debugShowBoundingVolume ?? false;
            const updateDebugOverlappingFrustums = () => primitive.debugOverlappingFrustums = this.debugOverlappingFrustums ?? 0;
            const updatePickOnly = () => primitive.pickOnly = this.pickOnly ?? false;
            const updateDepthForTranslucentClassification = () => primitive.depthForTranslucentClassification = this.depthForTranslucentClassification ?? false;

            updateExecuteInClosestFrustum();
            updateDebugShowBoundingVolume();
            updateDebugOverlappingFrustums();
            updatePickOnly();
            updateDepthForTranslucentClassification();

            this.dispose(this.executeInClosestFrustumChanged.disposableOn(updateExecuteInClosestFrustum));
            this.dispose(this.debugShowBoundingVolumeChanged.disposableOn(updateDebugShowBoundingVolume));
            this.dispose(this.debugOverlappingFrustumsChanged.disposableOn(updateDebugOverlappingFrustums));
            this.dispose(this.pickOnlyChanged.disposableOn(updatePickOnly));
            this.dispose(this.depthForTranslucentClassificationChanged.disposableOn(updateDepthForTranslucentClassification));
        }

        {
            // TODO uniformMap中的纹理的业务逻辑有点儿复杂，以后拆分出去
            // 如果为texture为undefiend，表示曾经尝试获取，但是失败了！
            const textureMap = new Map<string, Cesium.Texture | undefined>();
            this.dispose(() => {
                for (let texture of textureMap.values()) {
                    texture && texture.destroy();
                }
                textureMap.clear();
            });

            const textureResettingMap = new Map<string, TextureResetting>();
            this.dispose(() => {
                for (let textureResetting of textureResettingMap.values()) {
                    textureResetting.destroy();
                }
                textureResettingMap.clear();
            });

            // let sharedCzmTextureWithIds: { [uniformKey: string]: SceneObjectWithId<CzmTexture> } | undefined;
            // const resetSharedCzmTextureWithIds = () => {
            //     if (!sharedCzmTextureWithIds) return;
            //     for (let e of Object.values(sharedCzmTextureWithIds)) {
            //         e.destroy();
            //     }
            //     sharedCzmTextureWithIds = undefined;
            // };
            // this.dispose(resetSharedCzmTextureWithIds);

            let selfCzmTextureWithIds: { [uniformKey: string]: CzmTexture } | undefined;
            const resetSelfCzmTextureWithIds = () => {
                if (!selfCzmTextureWithIds) return;
                for (let e of Object.values(selfCzmTextureWithIds)) {
                    // czmViewer.delete(e);
                    e.destroy();
                }
                selfCzmTextureWithIds = undefined;
            };
            this.dispose(resetSelfCzmTextureWithIds);

            const updateUniformMap = () => {
                const uniformMap: Cesium.UniformMap = {};
                // if (!sceneObject.uniformMap) {
                //     primitive.uniformMap = uniformMap;
                //     return;
                // }

                // const uniformMap: Cesium.UniformMap = sceneObject.uniformMap ?? CzmCustomPrimitive.defaultUniformMap;

                const sceneObjectUniformMap = this.uniformMap ?? CzmCustomPrimitive.defaultUniformMap;

                // resetSharedCzmTextureWithIds();
                // sharedCzmTextureWithIds = {};

                resetSelfCzmTextureWithIds();
                selfCzmTextureWithIds = {};

                let currentUsingImageUris: string[] = [];
                for (let uniformKey of Object.keys(sceneObjectUniformMap)) {
                    const uniformValue = sceneObjectUniformMap[uniformKey];
                    if (uniformValue === undefined || uniformValue === null) {
                        console.error(`updateUniformMap [${uniformKey}] error: !uniformValue`);
                        continue;
                    }

                    if (Array.isArray(uniformValue)) {
                        const l = uniformValue.length;
                        const cartesianConstructor = l === 2 ? Cesium.Cartesian2 : l === 3 ? Cesium.Cartesian3 : Cesium.Cartesian4;
                        const cartesian = cartesianConstructor.fromArray(uniformValue);
                        uniformMap[uniformKey] = () => cartesian;
                    } else if (typeof uniformValue === 'number') {
                        uniformMap[uniformKey] = () => uniformValue;
                    } else if (('type' in uniformValue) && uniformValue.type === 'image') {
                        // const imageUri = uniformValue.uri;
                        // currentUsingImageUris.push(imageUri);
                        // if (!textureMap.get(imageUri)) {
                        //     if (!textureResettingMap.get(imageUri)) {
                        //         const textureResetting = new TextureResetting(context, SceneObject.context.getStrFromEnv(imageUri), texture => {
                        //             if (textureMap.has(imageUri)) {
                        //                 console.error(`逻辑错误：textureMap.has(imageUri) imageUri: ${imageUri}`);
                        //             }
                        //             if (!textureResettingMap.has(imageUri)) {
                        //                 console.error(`逻辑错误：!textureResettingMap.has(imageUri) imageUri: ${imageUri}`);
                        //             }

                        //             textureMap.set(imageUri, texture);
                        //             textureResettingMap.delete(imageUri);
                        //         });
                        //         textureResettingMap.set(imageUri, textureResetting);
                        //     }
                        // }
                        // uniformMap[uniformKey] = () => textureMap.get(uniformValue.uri) || context.defaultTexture;


                        const czmTexture = new CzmTexture(_czmViewer);
                        czmTexture.enabled = true;
                        czmTexture.uri = uniformValue.uri;
                        czmTexture.uriType = 'img';
                        // czmViewer.add(czmTexture);
                        selfCzmTextureWithIds[uniformKey] = czmTexture;
                        uniformMap[uniformKey] = () => {
                            do {
                                // const czmCzmTexture = _czmViewer.getCzmObject(czmTexture);
                                // if (!czmCzmTexture) break;
                                // if (!(czmCzmTexture instanceof CzmCzmTexture)) break;
                                if (!czmTexture.texture) break;
                                return czmTexture.texture;
                            } while (false);
                            return context.defaultTexture;
                        }
                    } else if (('type' in uniformValue) && uniformValue.type === 'texture') {
                        // const sowi = new SceneObjectWithId<CzmTexture>();
                        if (!uniformValue.id) {
                            console.warn(`uniform变量设置错误：${uniformKey} 的配置中id未设置或者无效！id为${uniformValue.id}`);
                        }
                        // sowi.id = uniformValue.id;
                        uniformMap[uniformKey] = () => {
                            do {
                                // const czmTexture = sowi.sceneObject;
                                // if (!czmTexture) break;
                                // if (!(czmTexture instanceof CzmTexture)) break;
                                // const czmCzmTexture = czmViewer.getCzmObject(czmTexture);
                                // if (!czmCzmTexture) break;
                                // if (!(czmCzmTexture instanceof CzmCzmTexture)) break;
                                // if (!czmCzmTexture.texture) break;
                                //@ts-ignore
                                const czmTexture = window.czmTexture[uniformValue.id];
                                if (!czmTexture) break;
                                return czmTexture.texture;
                            } while (false);
                            return context.defaultTexture;
                        }
                        // sharedCzmTextureWithIds[uniformKey] = sowi;
                    }
                }

                uniformMap['u_xe2VisibleAlpha'] = () => {
                    return this.visibleAlpha;
                }

                primitive.uniformMap = uniformMap;

                for (let imageUri of textureMap.keys()) {
                    if (!currentUsingImageUris.includes(imageUri)) {
                        const texture = textureMap.get(imageUri);
                        texture?.destroy();
                        textureMap.delete(imageUri);
                    }
                }

                for (let imageUri of textureResettingMap.keys()) {
                    if (!currentUsingImageUris.includes(imageUri)) {
                        const texture = textureResettingMap.get(imageUri);
                        texture?.destroy();
                        textureResettingMap.delete(imageUri);
                    }
                }
            };
            updateUniformMap();
            this.dispose(this.uniformMapChanged.disposableOn(updateUniformMap));
        }

        this.dispose(this.flyToEvent.disposableOn(duration => {
            // if (!sceneObject.position) {
            //     console.warn(`CzmCzmCustomPrimitive当前没有位置信息，无法飞入！`);
            //     return;
            // }

            if (!primitive.boundingVolume) {
                console.warn(`CzmCustomPrimitive没有设置boundingVolume属性，无法飞入(flyTo)！`);
                return;
            }

            const cav = getCenterAndViewDistance(primitive.boundingVolume)
            if (!cav) {
                console.warn(`无法计算viewDistance！`);
                return;
            }
            const [center, viewDistance] = cav;

            flyTo(viewer, center, viewDistance, undefined, duration);
        }));
    }

    setUniformMap(value: CzmCustomPrimitiveUniformMapType) {
        if (Object.entries(value).some(([k, v]) => {
            console.warn(`setUniformMap error: key: ${k} value: ${v}`);
            return (v === null)
        })) {
            return;
        }

        const finalUniformMap = { ...(this.uniformMap ?? {}), ...value };
        this.uniformMap = finalUniformMap;
    }

    setLocalBoundingSphere(radius: number, center: [number, number, number] = [0, 0, 0]) {
        if (!Number.isFinite(radius) || radius <= 0) {
            console.warn(`!Number.isFinite(radius) || radius <= 0 radius: ${radius}`);
            return;
        }
        this.boundingVolume = {
            type: 'LocalBoundingSphere', // BoundingSphere表示世界坐标系下的包围球, center为[经度, 纬度, 高度], radius单位为米
            data: { center, radius }
        };
    }

    setLocalAxisedBoundingBox(min: [number, number, number], max: [number, number, number]) {
        if (min.some(e => !Number.isFinite(e)) || max.some(e => !Number.isFinite(e))) {
            console.warn(`setLocalAxisedBoundingBox error, min: ${min.toString()}, max: ${max.toString()}`);
            return;
        }

        this.boundingVolume = {
            type: 'LocalAxisedBoundingBox',
            data: {
                min,
                max,
            }
        };
    }

    static getMinMaxPosition = getMinMaxPosition;

    computeLocalAxisedBoundingBoxFromAttribute(attributeName: string = 'a_position') {
        if (!this.attributes || !this.attributes[attributeName]) {
            console.warn(`attributes[${attributeName}]不存在！无法获取！`);
            return undefined;
        }
        const posAttribute = this.attributes[attributeName];
        if (!('typedArray' in posAttribute) || !(posAttribute.typedArray instanceof Float32Array)) {
            console.warn(`!('typedArray' in posAttribute) || !(posAttribute.typedArray instanceof Float32Array) attributeName: ${attributeName}`);
            return undefined;
        }

        if (!('componentsPerAttribute' in posAttribute) || posAttribute.componentsPerAttribute !== 3) {
            console.warn(`!('componentsPerAttribute' in posAttribute) || posAttribute.componentsPerAttribute !== 3 attributeName: ${attributeName}`);
            return undefined;
        }

        const { min, max } = CzmCustomPrimitive.getMinMaxPosition(posAttribute.typedArray as unknown as number[]);
        if (min.some(e => !Number.isFinite(e) || max.some(e => !Number.isFinite(e)))) {
            return undefined;
        }

        return { min, max };
    }
}

export namespace CzmCustomPrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined, // boolean} [show=true] A boolean Property specifying the visibility of the box.
        allowPicking: false,
        allowPickingDepth: true, // 能否拾取深度
        positionEditing: false,
        rotationEditing: false,
        editing: false,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单位
        rotation: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 偏航俯仰翻转，度为单位
        scale: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 缩放
        maximumScale: undefined as number | undefined,
        minimumScale: undefined as number | undefined,
        pixelSize: undefined as number | undefined,
        showSceneScale: undefined as boolean | undefined, // 显示每个窗口中的模型缩放值
        modelMatrix: reactArrayWithUndefined<ESJNativeNumber16 | undefined>(undefined),
        cull: react<boolean | undefined>(undefined),
        boundingVolume: reactJson<BoundingVolumeJsonType | undefined>(undefined),
        // TODO JSONValue => RenderStateOptions
        renderState: reactJson<JsonValue | undefined>(undefined),
        primitiveType: undefined as CzmPrimitiveType | undefined,
        pass: undefined as CzmPassType | undefined,
        vertexShaderSource: undefined as string | undefined,
        fragmentShaderSource: undefined as string | undefined,
        uniformMap: reactJson<CzmCustomPrimitiveUniformMapType | undefined>(undefined),
        localPosition: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 本地单位，不是经纬度！
        localRotation: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 本地旋转
        localScale: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 本地缩放
        localModelMatrix: reactArrayWithUndefined<ESJNativeNumber16 | undefined>(undefined), // 本地矩阵
        occlude: undefined as boolean | undefined, // true
        count: undefined as number | undefined,
        offset: undefined as number | undefined, // 0
        instanceCount: undefined as number | undefined, // 0
        castShadows: undefined as boolean | undefined, // false, 
        receiveShadows: undefined as boolean | undefined, // false,
        executeInClosestFrustum: undefined as boolean | undefined,
        debugShowBoundingVolume: undefined as boolean | undefined,
        debugOverlappingFrustums: undefined as number | undefined,
        pickOnly: undefined as boolean | undefined,
        depthForTranslucentClassification: undefined as boolean | undefined,
        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,
    });
}
extendClassProps(CzmCustomPrimitive.prototype, CzmCustomPrimitive.createDefaultProps);
export interface CzmCustomPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmCustomPrimitive.createDefaultProps>> { }
