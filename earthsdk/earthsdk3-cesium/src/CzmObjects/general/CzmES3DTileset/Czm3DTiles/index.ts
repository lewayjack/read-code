import * as Cesium from 'cesium';
import { ES3DTileset, ESBoxClipping, ESJNativeNumber16, ESSceneObject, ESSceneObjectWithId, PickedInfo, registerEventUpdate } from "earthsdk3";
import { ESCesiumViewer } from '../../../../ESCesiumViewer';
import { CzmAxis, CzmClassificationType, CzmClippingPlaneCollectionJsonType, CzmClippingPlanesType, CzmClippingPolygonCollectionJsonType, czmEllipsoidWGS84, CzmImageBasedLightingJsonType, CzmPointCloudShadingJsonType, CzmShadowMode, CzmSplitDirection } from '../../../../ESJTypesCzm';
import { computeCzmModelMatrix, positionFromCartesian } from '../../../../utils';
import { Destroyable, Listener, react, track, Event, reactArrayWithUndefined, reactJsonWithUndefined, reactArray, JsonValue, extendClassProps, ReactivePropsToNativePropsAndChanged, defaultLocalFileServer, ObjResettingWithEvent, createNextAnimateFrameEvent, SceneObjectKey, createGuid } from 'xbsj-base';
import { CzmES3DTileset, CzmESBoxClipping, CzmPolygonClipping, PositionEditing, RotationEditing } from '../../../../CzmObjects';
import { getRecreateEvents } from './getRecreateEvents';
import { NativeTilesetResetting } from './NativeTilesetResetting';
import { getStyleFromJson } from './getStyleFromJson';
import { ClippingPolygonsIdBind } from './ClippingPolygonsIdBind';
export type FoveatedInterpolationCallbackType = (p: number, q: number, time: number) => number;
export type ESJResource = {
    url: string;
    queryParameters?: any;
    templateValues?: any;
    headers?: any;
    proxy?: any;
    retryCallback?: any;
    retryAttempts?: number;
    request?: any;
    parseUrl?: boolean;
};

export function getFoveatedInterpolationCallback(evalStr?: string): FoveatedInterpolationCallbackType {
    let foveatedInterpolationCallback;
    try {
        foveatedInterpolationCallback = evalStr && Function('"use strict";return (' + evalStr + ')')();
    } catch (error) {
        foveatedInterpolationCallback = undefined;
    }

    if (!foveatedInterpolationCallback) {
        return Cesium.Math.lerp;
    }

    return foveatedInterpolationCallback;
}

const defaultCustomShaderInstanceClassStr = `
// shader定义请参见文档：https://github.com/CesiumGS/cesium/tree/main/Documentation/CustomShaderGuide#customshader-documentation
class CityShaderInstance extends xbsj['xr-base-utils'].Destroyable {
    constructor(sceneObject, viewer) {
        super();

        // Use the checkerboard red channel as a mask
        const shader = this.disposeVar(new Cesium.CustomShader({
            lightingModel: Cesium.LightingModel.UNLIT,
            fragmentShaderText: \`
              // Color tiles by distance to the camera
              void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
              {
                  material.diffuse = vec3(0.0, 0.0, 1.0);
                  material.diffuse.g = -fsInput.attributes.positionEC.z / 1.0e4;
              }
              \`,
          }));

        this._customShader = shader;
    }

    update() {
        alert('暂未实现!');
    }

    get customShader() {
        return this._customShader;
    }
}
`;

const customShaderInstanceClassStrMd = `\

## 文档
shader定义请参见文档：https://github.com/CesiumGS/cesium/tree/main/Documentation/CustomShaderGuide#customshader-documentation  

## 示例1 默认纯色示例
\`\`\`
${defaultCustomShaderInstanceClassStr}
\`\`\`

## 示例2 数字城市示例
\`\`\`
class CityShaderInstance extends xbsj['xr-base-utils'].Destroyable {
    constructor(sceneObject, viewer) {
        super();

        // Use the checkerboard red channel as a mask
        const shader = this.disposeVar(new Cesium.CustomShader({
            //lightingModel: Cesium.LightingModel.UNLIT,
            fragmentShaderText: \`
                // Color tiles by distance to the camera
                void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
                {
                    // 可以修改的参数
                    // 注意shader中写浮点数是，一定要带小数点，否则会报错，比如0需要写成0.0，1要写成1.0
                    float _baseHeight = 0.0; // 物体的基础高度，需要修改成一个合适的建筑基础高度
                    float _heightRange = 100.0; // 高亮的范围(_baseHeight ~ _baseHeight + _heightRange) 默认是 0-60米
                    float _glowRange = 300.0; // 光环的移动范围(高度)

                    // 建筑基础色
                    float vtxf_height = fsInput.attributes.positionMC.y - _baseHeight;
                    float vtxf_a11 = fract(czm_frameNumber / 120.0) * 3.14159265 * 2.0;
                    float vtxf_a12 = vtxf_height / _heightRange + sin(vtxf_a11) * 0.1;
                    material.diffuse *= vec3(vtxf_a12, vtxf_a12, vtxf_a12);
                    material.diffuse *= vec3(0, .5, 1.);

                    // 动态光环
                    float vtxf_a13 = fract(czm_frameNumber / 360.0);
                    float vtxf_h = clamp(vtxf_height / _glowRange, 0.0, 1.0);
                    vtxf_a13 = abs(vtxf_a13 - 0.5) * 2.0;
                    float vtxf_diff = step(0.005, abs(vtxf_h - vtxf_a13));
                    material.diffuse += material.diffuse * (1.0 - vtxf_diff);

                  //material.diffuse = vec3(0.0, 0.0, 1.0);
                  //material.diffuse.g = -fsInput.attributes.positionEC.z / 1.0e4;
                }
                \`,
          }));

        this._customShader = shader;
    }

    update() {
        alert('暂未实现!');
    }

    get customShader() {
        return this._customShader;
    }
}
\`\`\`
`;

const styleMd = `
## style示例
\`\`\`
纯色
{
    "color": "vec4(1,0,0,1)"
}

半透明
{
    "color": "vec4(1,1,1,0.5)"
}

建筑高度着色
{
    "color": {
        "conditions": [
            ["\${height} >= 300", "rgba(45, 0, 75, 0.5)"],
            ["\${height} >= 200", "rgb(102, 71, 151)"],
            ["\${height} >= 100", "rgb(170, 162, 204)"],
            ["\${height} >= 50", "rgb(224, 226, 238)"],
            ["\${height} >= 25", "rgb(252, 230, 200)"],
            ["\${height} >= 10", "rgb(248, 176, 87)"],
            ["\${height} >= 5", "rgb(198, 106, 11)"],
            ["true", "rgb(127, 59, 8)"]
        ]
    }
}

点云高度着色
{
    "color": {
        "conditions": [
            ["\${POSITION}.z >= 10", "rgba(255,255, 0, 1)"], 
            ["true", "rgb(255, 0, 0)"]
        ]
    }
}

分类全透
{
    "color": "vec4(0,0,1,0.01)"
}

分类浅色
{
    "color": "vec4(0,0,1,0.1)"
}
\`\`\`
`;

const defaultFoveatedInterpolationCallbackStr = `\
function (p, q, time) {
    return (1.0 - time) * p + time * q;
};`;

const defaultStyleJson = {
    color: "vec4(1,0,0,1)"
};

const defaultClippingPlanes = {
    "planes": [{ normal: [1, 0, 0], distance: 0 }],
    "enabled": true,
    "modelMatrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    "unionClippingRegions": false,
    "edgeColor": [1, 1, 1, 1],
    "edgeWidth": 2
};

const clippingPlanesMd = `
## 类型
\`\`\`
export type CzmClippingPlaneCollectionJsonType = {
    planes?: CzmClippingPlaneJsonType[];
    enabled?: boolean; // true
    modelMatrix?: NativeNumber16Type; // Matrix4.IDENTITY
    unionClippingRegions?: boolean; // false 
    edgeColor?: [number, number, number, number]; // Color.White
    edgeWidth?: number; // 0
};
\`\`\`
## 示例
\`\`\`
${JSON.stringify(defaultClippingPlanes, undefined, '    ')}
\`\`\`
`;

const defaultPointCloudShading = {
    "attenuation": false,
    "geometricErrorScale": 1.0,
    "maximumAttenuation": 16,
    "baseResolution": undefined,
    "eyeDomeLighting": true,
    "eyeDomeLightingStrength": 1.0,
    "eyeDomeLightingRadius": 1.0,
    "backFaceCulling": false,
    "normalShading": true,
}

const pointCloudShadingMd = `
## 类型
\`\`\`
export type CzmPointCloudShadingJsonType = {
    attenuation: boolean; //	false	optionalPerform point attenuation based on geometric error.
    geometricErrorScale: number; //	1.0	optionalScale to be applied to each tile's geometric error.
    maximumAttenuation: number; //		optionalMaximum attenuation in pixels. Defaults to the Cesium3DTileset's maximumScreenSpaceError.
    baseResolution?: number; //		optionalAverage base resolution for the dataset in meters. Substitute for Geometric Error when not available.
    eyeDomeLighting: boolean; //	true	optionalWhen true, use eye dome lighting when drawing with point attenuation.
    eyeDomeLightingStrength: number; //	1.0	optionalIncreasing this value increases contrast on slopes and edges.
    eyeDomeLightingRadius: number; //	1.0	optionalIncrease the thickness of contours from eye dome lighting.
    backFaceCulling: boolean; //	false	optionalDetermines whether back-facing points are hidden. This option works only if data has normals included.
    normalShading: boolean; //	true	optionalDetermines whether a point cloud that contains normals is shaded by the scene's light source.
}
\`\`\`
## 示例
\`\`\`
${JSON.stringify(defaultPointCloudShading, undefined, '    ')}
\`\`\`
`

const defaultImageBasedLighting = {
    imageBasedLightingFactor: [1, 1],
    luminanceAtZenith: 5,
    atmosphereScatteringIntensity: 5,
    sphericalHarmonicCoefficients: [
        [1.234709620475769, 1.221461296081543, 1.273156881332397],
        [1.135921120643616, 1.171217799186707, 1.287644743919373],
        [1.245193719863892, 1.245591878890991, 1.282818794250488],
        [-1.106930732727051, -1.112522482872009, -1.153198838233948],
        [-1.086226940155029, -1.079731941223145, -1.101912498474121],
        [1.189834713935852, 1.185906887054443, 1.214385271072388],
        [0.01778045296669, 0.02013735473156, 0.025313569232821],
        [-1.086826920509338, -1.084611177444458, -1.111204028129578],
        [-0.05241484940052, -0.048303380608559, -0.041960217058659],
    ],
    specularEnvironmentMaps: ''
} as CzmImageBasedLightingJsonType;

const imageBasedLightingMd = `
## 类型
\`\`\`
export type CzmImageBasedLightingJsonType = {
    imageBasedLightingFactor?: [number, number];
    luminanceAtZenith?: number;
    sphericalHarmonicCoefficients?: [number, number, number, number, number, number, number, number, number];
    specularEnvironmentMaps?: string;
}
\`\`\`
## 示例
\`\`\`
${JSON.stringify(defaultImageBasedLighting, undefined, '    ')}
\`\`\`
`

export type Czm3DTilesCustomShaderClassType = { destroy(): undefined; get customShader(): Cesium.CustomShader };
export type Czm3DTilesCustomShaderInstanceClassType = new (sceneObject: Czm3DTiles, viewer: ESCesiumViewer) => Czm3DTilesCustomShaderClassType;
const identityMatrixArray: ESJNativeNumber16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

class ClippingPlanesIdResetting extends Destroyable {
    constructor(private _czm3DTiles: Czm3DTiles, private _czmClippingPlanes: CzmClippingPlanesType) {
        super();
        this.dispose(track([this._czm3DTiles, 'clippingPlanes'], [this._czmClippingPlanes, 'computedClippingPlanes']));
        this.dispose(() => this._czm3DTiles.clippingPlanes = undefined);
    }
}
export function getFinalCzm3DTilesUrlString(czm3DTilesUrl: string | ESJResource) {
    let finalUrl;
    let url = typeof czm3DTilesUrl == 'string' ? czm3DTilesUrl : czm3DTilesUrl.url;
    do {
        if (!url.startsWith('Ion(')) break;

        let rr = /Ion\((\d+)/.exec(url);
        if (!rr) break;

        let assetId = rr[1] && +rr[1];
        try {
            assetId && (finalUrl = `"await Cesium.IonResource.fromAssetId(${assetId}))"`);
        } catch (error) {
            console.error(`Ion资源未能获取到 error: ${error}`, error);
            break;
        }
    } while (false);

    finalUrl = finalUrl || `"${ESSceneObject.context.getStrFromEnv(url)}"`;

    return finalUrl;
}

export function getCzmCodeFromCzm3DTiles(czm3DTiles: Czm3DTiles) {
    if (!czm3DTiles.url) return undefined;
    const finalUrl = getFinalCzm3DTilesUrlString(czm3DTiles.url);

    // scene.primitives.add(tileset);

    return `\
async function createCzm3DTiles() {
    var tileset = await Cesium.Cesium3DTileset.fromUrl(
        ${finalUrl}
    );
    viewer.scene.primitives.add(tileset);
    // viewer.flyTo(tileset);
    return tileset;
}
`;
}

export class Czm3DTiles extends Destroyable {
    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    getCzmCode() { return getCzmCodeFromCzm3DTiles(this); }

    get czmViewer() { return this._czmViewer; }

    private _supportEdit = this.disposeVar(react<boolean>(true));
    get supportEdit() { return this._supportEdit.value; }
    set supportEdit(value: boolean) { this._supportEdit.value = value; }
    /**
    * @deprecated 均支持编辑，该属性后期会删除
    */
    get supportEditChanged() { return this._supportEdit.changed; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) {
        this._flyToEvent.emit(duration);
    }

    private _customShaderInstanceClass = this.disposeVar(react<Czm3DTilesCustomShaderInstanceClassType | undefined>(undefined));
    get customShaderInstanceClass() { return this._customShaderInstanceClass.value; }
    set customShaderInstanceClass(value: Czm3DTilesCustomShaderInstanceClassType | undefined) { this._customShaderInstanceClass.value = value; }
    get customShaderInstanceClassChanged() { return this._customShaderInstanceClass.changed; }

    private _updateCustomShaderEvent = this.disposeVar(new Event<[(customShaderInstance: Czm3DTilesCustomShaderClassType, sceneObject: Czm3DTiles, viewer: ESCesiumViewer) => void]>());
    get updateCustomShaderEvent() { return this._updateCustomShaderEvent; }
    updateCustomShader(func: (customShaderInstance: Czm3DTilesCustomShaderClassType) => void) {
        this._updateCustomShaderEvent.emit(func);
    }

    static defaultCustomShaderInstanceClassStr = defaultCustomShaderInstanceClassStr;
    static customShaderInstanceClassStrMd = customShaderInstanceClassStrMd;

    static styleMd = styleMd;
    static defaultFoveatedInterpolationCallbackStr = defaultFoveatedInterpolationCallbackStr;
    static defaultStyleJson = defaultStyleJson;

    static defaultFoveatedInterpolationCallback = Cesium.Math.lerp;
    private _foveatedInterpolationCallback = this.disposeVar(react<FoveatedInterpolationCallbackType>(Czm3DTiles.defaultFoveatedInterpolationCallback));
    get foveatedInterpolationCallback() { return this._foveatedInterpolationCallback.value; }
    get foveatedInterpolationCallbackChanged() { return this._foveatedInterpolationCallback.changed; }
    set foveatedInterpolationCallback(value: FoveatedInterpolationCallbackType) { this._foveatedInterpolationCallback.value = value; }

    get imageBasedLightingFactor() { return this.imageBasedLighting && this.imageBasedLighting.imageBasedLightingFactor; }
    get imageBasedLightingFactorChanged() { return this.imageBasedLightingChanged; }
    set imageBasedLightingFactor(value: [number, number] | undefined) { this.imageBasedLighting = this.imageBasedLighting && { ...this.imageBasedLighting, imageBasedLightingFactor: value } || { imageBasedLightingFactor: value }; }

    get luminanceAtZenith() { return this.imageBasedLighting && this.imageBasedLighting.luminanceAtZenith; }
    get luminanceAtZenithChanged() { return this.imageBasedLightingChanged; }
    set luminanceAtZenith(value: number | undefined) { this.imageBasedLighting = this.imageBasedLighting && { ...this.imageBasedLighting, luminanceAtZenith: value } || { luminanceAtZenith: value }; }

    get atmosphereScatteringIntensity() { return this.imageBasedLighting && this.imageBasedLighting.atmosphereScatteringIntensity; }
    get atmosphereScatteringIntensityChanged() { return this.imageBasedLightingChanged; }
    set atmosphereScatteringIntensity(value: number | undefined) { this.imageBasedLighting = this.imageBasedLighting && { ...this.imageBasedLighting, atmosphereScatteringIntensity: value, luminanceAtZenith: value } || { atmosphereScatteringIntensity: value, luminanceAtZenith: value }; }

    private _origin = this.disposeVar(react<[number, number, number] | undefined>(undefined));
    get origin() { return this._origin.value; }
    get originChanged() { return this._origin.changed; }
    setPositionAsOrigin() { this.position = this.origin; }

    private _czmTilesetReadyEvent = this.disposeVar(new Event<[tileset: Cesium.Cesium3DTileset, czmObj: Czm3DTiles]>());
    get czmTilesetReadyEvent() { return this._czmTilesetReadyEvent; }
    notifyCzmTilesetReady(tileset: Cesium.Cesium3DTileset, czmObj: Czm3DTiles) {
        this._czmTilesetReadyEvent.emit(tileset, czmObj);
    }

    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    private _czmFlattenedPlaneWithId;
    get czmFlattenedPlaneWithId() { return this._czmFlattenedPlaneWithId; }

    private _clippingPlanesSceneObjectWithId;
    get clippingPlanesSceneObjectWithId() { return this._clippingPlanesSceneObjectWithId; }

    private _sRotationEditing;
    get sRotationEditing() { return this._sRotationEditing; }

    private _customShaderInstance = this.disposeVar(react<Czm3DTilesCustomShaderClassType | undefined>(undefined));
    get customShaderInstance() { return this._customShaderInstance.value; }
    get customShaderInstanceChanged() { return this._customShaderInstance.changed; }
    set customShaderInstance(value: Czm3DTilesCustomShaderClassType | undefined) { this._customShaderInstance.value = value; }

    private _style = this.disposeVar(react<Cesium.Cesium3DTileStyle | undefined>(undefined));
    get style() { return this._style.value; }
    get styleChanged() { return this._style.changed; }
    set style(value: Cesium.Cesium3DTileStyle | undefined) { this._style.value = value; }

    private _originRootTransform = this.disposeVar(react<Cesium.Matrix4 | undefined>(undefined));
    get originRootTransform() { return this._originRootTransform.value; }
    set originRootTransform(value: Cesium.Matrix4 | undefined) { this._originRootTransform.value = value; }
    get originRootTransformChanged() { return this._originRootTransform.changed; }

    private _originRootTransformInv = this.disposeVar(react<Cesium.Matrix4 | undefined>(undefined));
    get originRootTransformInv() { return this._originRootTransformInv.value; }
    set originRootTransformInv(value: Cesium.Matrix4 | undefined) { this._originRootTransformInv.value = value; }
    get originRootTransformInvChanged() { return this._originRootTransformInv.changed; }

    private _recreateEvent = this.disposeVar(createNextAnimateFrameEvent(...getRecreateEvents(this)));

    private _nativeTilesetResetting;
    get nativeTilesetResetting() { return this._nativeTilesetResetting; }

    get tileset() { return this.nativeTilesetResetting.obj?.tileset; }
    get tilesetChanged() { return this.nativeTilesetResetting.objChanged; }

    constructor(private _czmViewer: ESCesiumViewer, czmES3DTileset: CzmES3DTileset, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        this._sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], undefined, _czmViewer));
        this._sRotationEditing = this.disposeVar(new RotationEditing([this, 'position'], [this, 'rotation'], [this, 'rotationEditing'], _czmViewer, {
            showHelper: false,
        }));
        this._nativeTilesetResetting = this.disposeVar(new ObjResettingWithEvent(this._recreateEvent, () => {
            if (typeof this.url == 'string') {
                this.url = ESSceneObject.context.getStrFromEnv(this.url);
            } else if (this.url) {
                this.url.url = ESSceneObject.context.getStrFromEnv(this.url.url);
            }
            const url = this.url;
            if (!url) return undefined;
            return new NativeTilesetResetting(url, this, _czmViewer.viewer as Cesium.Viewer, _czmViewer);
        }));
        this._clippingPlanesSceneObjectWithId = this.disposeVar(new ESSceneObjectWithId());
        this.dispose(track([this._clippingPlanesSceneObjectWithId, 'id'], [this, 'clippingPlanesId']));
        this.ad(new ClippingPolygonsIdBind(this.czmViewer, this));
        this.disposeVar(new ObjResettingWithEvent(this.clippingPlanesSceneObjectWithId.sceneObjectChanged, () => {
            const { sceneObject } = this.clippingPlanesSceneObjectWithId;
            if (!sceneObject) return undefined;
            let czmClippingPlanes: CzmClippingPlanesType | undefined = undefined;
            do {
                const czmSceneObject = _czmViewer.getCzmObject(sceneObject);
                if (sceneObject instanceof ESBoxClipping) {
                    czmClippingPlanes = (czmSceneObject as CzmESBoxClipping).czmBoxClippingPlanes as unknown as CzmClippingPlanesType;
                }
                if (sceneObject instanceof ES3DTileset) {
                    czmClippingPlanes = czmES3DTileset.clippingPlanes as unknown as CzmClippingPlanesType;
                }
            } while (false);
            if (!czmClippingPlanes) return undefined;
            if (!('computedClippingPlanes' in czmClippingPlanes)) return undefined;
            if (!('computedClippingPlanesChanged' in czmClippingPlanes)) return undefined;

            return new ClippingPlanesIdResetting(this, czmClippingPlanes as CzmClippingPlanesType);
        }));
        this._czmFlattenedPlaneWithId = this.disposeVar(new ESSceneObjectWithId());
        this.dispose(track([this._czmFlattenedPlaneWithId, 'id'], [this, 'czmFlattenedPlaneId']));
        {
            // 位置编辑
            const positionEditingRef = this.sPositionEditing.editingRef;
            this.dispose(this.positionEditingChanged.disposableOn((val, oldVal) => {
                if (this.positionEditing) {
                    if (!this.position && !!this.origin) {
                        this.position = this.origin;
                    }
                    if (this.position) {
                        positionEditingRef.value = true;
                    }
                } else {
                    positionEditingRef.value = false;
                }
            }));
            this.dispose(this.positionChanged.disposableOn((val, oldVal) => {
                if (!val) {
                    positionEditingRef.value = false;
                } else {
                    if (oldVal === undefined && (this.positionEditing)) {
                        positionEditingRef.value = true;
                    }
                }
            }));
            this.dispose(positionEditingRef.changed.disposableOn(() => {
                if (!positionEditingRef.value) {
                    this.positionEditing = false;
                }
            }));
            this.dispose(this.originChanged.disposableOn(() => {
                if (!this.origin) return;
                if ((this.positionEditing) && !this.position) {
                    this.position = this.origin;
                }
            }));
        }

        const updateInstanceClassStr = () => {
            try {
                this.customShaderInstanceClass = this.customShaderInstanceClassStr && Function(`"use strict";return (${this.customShaderInstanceClassStr})`)();
            } catch (error) {
                this.customShaderInstanceClass = undefined;
            }
        };
        updateInstanceClassStr();
        this.dispose(this.customShaderInstanceClassStrChanged.disposableOn(updateInstanceClassStr));

        registerEventUpdate(this, this.foveatedInterpolationCallbackStrChanged, () => {
            this.foveatedInterpolationCallback = getFoveatedInterpolationCallback(this.foveatedInterpolationCallbackStr);
        });

        // origin
        {
            this.dispose(this.urlChanged.disposableOn(() => {
                this._origin.value = undefined;
            }));
            this.dispose(this._czmTilesetReadyEvent.disposableOn((tileset, czmObj) => {
                if (!this._origin.value) {
                    let originTransform = tileset.root.transform as Cesium.Matrix4;
                    const originCartesian = Cesium.Matrix4.getTranslation(originTransform, new Cesium.Cartesian3());
                    const origin = positionFromCartesian(originCartesian);
                    // 如果转换矩阵跟计算出来的矩阵不一样，返回
                    const originMatrix = computeCzmModelMatrix({
                        initialRotation: 'yForwardzUp',
                        rotation: [0, 0, 0],
                        position: origin,
                    });
                    if (originMatrix && !originMatrix.equalsEpsilon(originTransform, 0.001) || originTransform.equals(Cesium.Matrix4.IDENTITY)) {
                        // @ts-ignore 如果偏移矩阵是单位矩阵或者计算出的矩阵与原矩阵不一致，说明原始服务无偏移矩阵或者偏移矩阵不标准，通过裁剪矩阵代替原点矩阵
                        originTransform = tileset.clippingPlanesOriginMatrix;
                        this._origin.value = positionFromCartesian(Cesium.Matrix4.getTranslation(originTransform, new Cesium.Cartesian3()));
                    } else {
                        this._origin.value = origin;
                    }
                }
            }));
        }
        // 中间变量处理 url style customShaderInstance
        // const urlReact = this.disposeVar(SceneObject.context.createEvnStrReact([sceneObject, 'url']));
        registerEventUpdate(this, this.styleJsonChanged, () => this.style = getStyleFromJson(this.styleJson));
        registerEventUpdate(this, this.customShaderInstanceClassChanged, () => {
            const c = this.customShaderInstanceClass;
            this.customShaderInstance = c && new c(this, _czmViewer);
        });
        this.dispose(this.updateCustomShaderEvent.disposableOn(func => {
            this.customShaderInstance && func(this.customShaderInstance, this, _czmViewer);
        }));
    }

    static defaults = {
        // 构造函数中使用的参数，和cesium源码中的构造参数顺序保持一致
        url: '',
        show: true,
        colorBlendMode: 'HIGHLIGHT' as 'HIGHLIGHT' | 'REPLACE' | 'MIX',
        modelMatrix: identityMatrixArray,
        modelUpAxis: 'Y' as CzmAxis,
        modelForwardAxis: 'X' as CzmAxis,
        shadows: 'ENABLED' as CzmShadowMode,

        maximumScreenSpaceError: 16,
        maximumMemoryUsage: 512,
        cacheBytes: 512 * 1024 * 1024,
        maximumCacheOverflowBytes: 512 * 1024 * 1024,

        cullWithChildrenBounds: true,
        cullRequestsWhileMoving: true,
        cullRequestsWhileMovingMultiplier: 60.0,

        preloadWhenHidden: false,
        preloadFlightDestinations: true,
        preferLeaves: false,

        dynamicScreenSpaceError: false,
        dynamicScreenSpaceErrorDensity: 0.00278,
        dynamicScreenSpaceErrorFactor: 4.0,
        dynamicScreenSpaceErrorHeightFalloff: 0.25,

        progressiveResolutionHeightFraction: 0.3,

        foveatedScreenSpaceError: true,
        foveatedConeSize: 0.1,
        foveatedMinimumScreenSpaceErrorRelaxation: 0.0,
        // foveatedInterpolationCallback, // 后面有foveatedInterpolationCallbackStr
        foveatedTimeDelay: 0.2,

        skipLevelOfDetail: false,
        baseScreenSpaceError: 1024,
        skipScreenSpaceErrorFactor: 16,
        skipLevels: 1,

        immediatelyLoadDesiredLevelOfDetail: false,
        loadSiblings: false,

        clippingPlanes: defaultClippingPlanes,
        classificationType: "NONE" as CzmClassificationType,
        ellipsoid: czmEllipsoidWGS84,
        pointCloudShading: defaultPointCloudShading,
        lightColor: [1, 1, 1] as [number, number, number],
        imageBasedLighting: defaultImageBasedLighting,
        backFaceCulling: true,
        enableShowOutline: true,
        showOutline: true,
        outlineColor: [1, 1, 1, 1], // TODO

        vectorClassificationOnly: false,
        vectorKeepDecodedPositions: false,

        featureIdLabel: "featureId_0",
        instanceFeatureIdLabel: "instanceFeatureId_0",
        showCreditsOnScreen: false,

        splitDirection: "NONE" as CzmSplitDirection,
        projectTo2D: false,

        debugHeatmapTilePropertyName: '',

        debugFreezeFrame: false,
        debugColorizeTiles: false,
        enableDebugWireframe: false,
        debugWireframe: false,
        debugShowBoundingVolume: false,
        debugShowContentBoundingVolume: false,
        debugShowViewerRequestVolume: false,
        debugShowGeometricError: false,
        debugShowRenderingStatistics: false,
        debugShowMemoryUsage: false,
        debugShowUrl: false,

        // customShader 也是构造参数，但是cesium的声明文件中没有

        // 构造函数参数中没使用的属性
        customShaderInstanceClassStr: Czm3DTiles.defaultCustomShaderInstanceClassStr,
        styleJson: Czm3DTiles.defaultStyleJson as JsonValue,
        foveatedInterpolationCallbackStr: Czm3DTiles.defaultFoveatedInterpolationCallbackStr,
    };

    /**
     * 打开本地目录，加载本地3dtiles数据，注意只能打开tileset.json文件所在目录
     */
    async openLocalDir() {
        const rootDirId = await defaultLocalFileServer.getRootDirId('3dtiles');
        if (rootDirId === undefined) {
            console.warn('openLocalDir failed!');
            return;
        }
        const url = `https://${rootDirId}/tileset.json`;
        this.url = url;
    }
}

export namespace Czm3DTiles {
    export const createDefaultProps = () => ({
        // 定制属性
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        positionEditing: react<boolean>(false),
        rotation: reactArrayWithUndefined<[number, number, number]>([0, 0, 0]),
        rotationEditing: react<boolean>(false),
        allowPicking: false,

        // TODO 未来去掉
        // xbsjFlattened: false,
        // xbsjFlattenedBound: reactArray<[number, number, number, number]>([-100, -100, 100, 100]),
        // xbsjElevationMatrix: reactArray<NativeNumber16Type>([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        // xbsjFlattenedTextureId: '',

        czmFlattenedPlaneId: '',

        // 构造函数中使用的参数，和cesium源码中的构造参数顺序保持一致
        url: undefined as string | undefined | ESJResource,

        show: undefined as boolean | undefined,
        colorBlendMode: undefined as 'HIGHLIGHT' | 'REPLACE' | 'MIX' | undefined,
        modelMatrix: reactArrayWithUndefined<ESJNativeNumber16>(undefined), // modelMatrix设置以后，postion和rotation的设置将不起作用！
        modelUpAxis: undefined as CzmAxis | undefined,	//Axis Axis.Y	optionalWhich axis is considered up when loading models for tile contents.
        modelForwardAxis: undefined as CzmAxis | undefined,	//Axis	Axis.X	optionalWhich axis is considered forward when loading models for tile contents.
        shadows: undefined as CzmShadowMode | undefined,

        maximumScreenSpaceError: undefined as number | undefined,
        maximumMemoryUsage: undefined as number | undefined,
        cacheBytes: undefined as number | undefined,
        maximumCacheOverflowBytes: undefined as number | undefined,

        cullWithChildrenBounds: undefined as boolean | undefined,//	true	optionalOptimization option. Whether to cull tiles using the union of their children bounding volumes.
        cullRequestsWhileMoving: undefined as boolean | undefined,//	true	optionalOptimization option. Don't request tiles that will likely be unused when they come back because of the camera's movement. This optimization only applies to stationary tilesets.
        cullRequestsWhileMovingMultiplier: undefined as number | undefined,//	60.0	Optimization option. Multiplier used in culling requests while moving. Larger is more aggressive culling, smaller less aggressive culling.

        preloadWhenHidden: undefined as boolean | undefined,//	false	optionalPreload tiles when tileset.show is false. Loads tiles as if the tileset is visible but does not render them.
        preloadFlightDestinations: undefined as boolean | undefined,//	true	optionalOptimization option. Preload tiles at the camera's flight destination while the camera is in flight.
        preferLeaves: undefined as boolean | undefined,//	false	optionalOptimization option. Prefer loading of leaves first.

        dynamicScreenSpaceError: undefined as boolean | undefined,//	false	optionalOptimization option. Reduce the screen space error for tiles that are further away from the camera.
        dynamicScreenSpaceErrorDensity: undefined as number | undefined,//	0.00278	Density used to adjust the dynamic screen space error, similar to fog density.
        dynamicScreenSpaceErrorFactor: undefined as number | undefined,//	4.0	A factor used to increase the computed dynamic screen space error.
        dynamicScreenSpaceErrorHeightFalloff: undefined as number | undefined,//	0.25	A ratio of the tileset's height at which the density starts to falloff.

        progressiveResolutionHeightFraction: undefined as number | undefined,//	0.3	Optimization option. If between (0.0, 0.5], tiles at or above the screen space error for the reduced screen resolution of progressiveResolutionHeightFraction*screenHeight will be prioritized first. This can help get a quick layer of tiles down while full resolution tiles continue to load.

        foveatedScreenSpaceError: undefined as boolean | undefined,//	true	optionalOptimization option. Prioritize loading tiles in the center of the screen by temporarily raising the screen space error for tiles around the edge of the screen. Screen space error returns to normal once all the tiles in the center of the screen as determined by the Cesium3DTileset#foveatedConeSize are loaded.
        foveatedConeSize: undefined as number | undefined, // 0.1	Optimization option. Used when Cesium3DTileset#foveatedScreenSpaceError is true to control the cone size that determines which tiles are deferred. Tiles that are inside this cone are loaded immediately. Tiles outside the cone are potentially deferred based on how far outside the cone they are and their screen space error. This is controlled by Cesium3DTileset#foveatedInterpolationCallback and Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation. Setting this to 0.0 means the cone will be the line formed by the camera position and its view direction. Setting this to 1.0 means the cone encompasses the entire field of view of the camera, disabling the effect.
        foveatedMinimumScreenSpaceErrorRelaxation: undefined as number | undefined,//	0.0	Optimization option. Used when Cesium3DTileset#foveatedScreenSpaceError is true to control the starting screen space error relaxation for tiles outside the foveated cone. The screen space error will be raised starting with tileset value up to Cesium3DTileset#maximumScreenSpaceError based on the provided Cesium3DTileset#foveatedInterpolationCallback.
        // foveatedInterpolationCallback 复杂属性，用foveatedInterpolationCallbackStr替代
        foveatedInterpolationCallbackStr: undefined as string | undefined, // -> foveatedInterpolationCallback // 构造后需要立即更新
        foveatedTimeDelay: undefined as number | undefined,//	0.2	Optimization option. Used when Cesium3DTileset#foveatedScreenSpaceError is true to control how long in seconds to wait after the camera stops moving before deferred tiles start loading in. This time delay prevents requesting tiles around the edges of the screen when the camera is moving. Setting this to 0.0 will immediately request all tiles in any given view.

        skipLevelOfDetail: undefined as boolean | undefined,

        baseScreenSpaceError: undefined as number | undefined,//	1024	When skipLevelOfDetail is true, the screen space error that must be reached before skipping levels of detail.
        skipScreenSpaceErrorFactor: undefined as number | undefined,//	16	When skipLevelOfDetail is true, a multiplier defining the minimum screen space error to skip. Used in conjunction with skipLevels to determine which tiles to load.
        skipLevels: undefined as number | undefined,//	1	When skipLevelOfDetail is true, a constant defining the minimum : undefined as number | undefined,// of levels to skip when loading tiles. When it is 0, no levels are skipped. Used in conjunction with skipScreenSpaceErrorFactor to determine which tiles to load.

        immediatelyLoadDesiredLevelOfDetail: undefined as boolean | undefined,//	false	optionalWhen skipLevelOfDetail is true, only tiles that meet the maximum screen space error will ever be downloaded. Skipping factors are ignored and just the desired tiles are loaded.
        loadSiblings: undefined as boolean | undefined,//	false	optionalWhen skipLevelOfDetail is true, determines whether siblings of visible tiles are always downloaded during traversal.

        clippingPlanes: reactJsonWithUndefined<CzmClippingPlaneCollectionJsonType>(undefined),
        clippingPlanesId: '',
        clippingPolygons: reactJsonWithUndefined<CzmClippingPolygonCollectionJsonType>(undefined),
        clippingPolygonsId: reactArray<string[]>([]),
        absoluteClippingPlanes: false, //  clippingPlanes是否使用绝对坐标，默认同Cesium，为false
        classificationType: undefined as CzmClassificationType | undefined,
        ellipsoid: reactArrayWithUndefined<[x: number, y: number, z: number] | undefined>(undefined),
        pointCloudShading: reactJsonWithUndefined<CzmPointCloudShadingJsonType>(undefined),
        lightColor: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        imageBasedLighting: reactJsonWithUndefined<CzmImageBasedLightingJsonType>(undefined),
        backFaceCulling: undefined as boolean | undefined,
        enableShowOutline: undefined as boolean | undefined,
        showOutline: undefined as boolean | undefined,//	true	optionalWhether to display the outline for models using the CESIUM_primitive_outline extension. When true, outlines are displayed. When false, outlines are not displayed.
        outlineColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),

        vectorClassificationOnly: undefined as boolean | undefined,//	false	optionalIndicates that only the tileset's vector tiles should be used for classification.
        vectorKeepDecodedPositions: undefined as boolean | undefined,//	false	optionalWhether vector tiles should keep decoded positions in memory. This is used with Cesium3DTileFeature.getPolylinePositions.

        featureIdLabel: undefined as string | undefined,
        instanceFeatureIdLabel: undefined as string | undefined,
        showCreditsOnScreen: undefined as boolean | undefined,//	false	optionalWhether to display the credits of this tileset on screen.

        splitDirection: undefined as CzmSplitDirection | undefined,
        projectTo2D: undefined as boolean | undefined,//	false	optionalWhether to accurately project the tileset to 2D. If this is true, the tileset will be projected accurately to 2D, but it will use more memory to do so. If this is false, the tileset will use less memory and will still render in 2D / CV mode, but its projected positions may be inaccurate. This cannot be set after the tileset has loaded.

        debugHeatmapTilePropertyName: undefined as string | undefined,

        debugFreezeFrame: undefined as boolean | undefined,//	Boolean	false	optionalFor debugging only.Determines if only the tiles from last frame should be used for rendering.
        debugColorizeTiles: undefined as boolean | undefined,//	Boolean	false	optionalFor debugging only.When true, assigns a random color to each tile.
        enableDebugWireframe: undefined as boolean | undefined,//	Boolean		optionalFor debugging only.This must be true for debugWireframe to work for ModelExperimental in WebGL1.This cannot be set after the tileset has loaded.
        debugWireframe: undefined as boolean | undefined,//Boolean	false	optionalFor debugging only.When true, render's each tile's content as a wireframe.
        debugShowBoundingVolume: undefined as boolean | undefined,//	Boolean	false	optionalFor debugging only.When true, renders the bounding volume for each tile.
        debugShowContentBoundingVolume: undefined as boolean | undefined,//	Boolean	false	optionalFor debugging only.When true, renders the bounding volume for each tile's content.
        debugShowViewerRequestVolume: undefined as boolean | undefined,//	Boolean	false	optionalFor debugging only.When true, renders the viewer request volume for each tile.
        debugShowGeometricError: undefined as boolean | undefined,//Boolean	false	optionalFor debugging only.When true, draws labels to indicate the geometric error of each tile.
        debugShowRenderingStatistics: undefined as boolean | undefined,//	Boolean	false	optionalFor debugging only.When true, draws labels to indicate the number of commands, points, triangles and features for each tile.
        debugShowMemoryUsage: undefined as boolean | undefined,//	Boolean	false	optionalFor debugging only.When true, draws labels to indicate the texture and geometry memory in megabytes used by each tile.
        debugShowUrl: undefined as boolean | undefined,//	Boolean	false	optionalFor debugging only.When true, draws labels to indicate the url of each tile.

        // customShader 也是构造参数，但是cesium的声明文件中没有
        customShaderInstanceClassStr: undefined as string | undefined, // -> customShaderInstance -> customShader // customShader在构造函数中，所以不需要create之后更新

        // 不在构造函数中，但是需要更新的属性
        // style
        styleJson: reactJsonWithUndefined<JsonValue>(undefined), // -> style // 构造后需要立即更新

        autoSetPositionAsOrigin: undefined as boolean | undefined,
    });
}
extendClassProps(Czm3DTiles.prototype, Czm3DTiles.createDefaultProps);
export interface Czm3DTiles extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof Czm3DTiles.createDefaultProps>> { }
