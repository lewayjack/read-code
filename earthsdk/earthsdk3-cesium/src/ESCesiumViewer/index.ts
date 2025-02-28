import * as Cesium from 'cesium';
import { BooleanProperty, ColorProperty, EnumProperty, ESJFlyToParam, ESJLonLatFormatType, ESJVector2D, ESJVector2DArray, ESJVector3D, ESJVector3DArray, ESJVector4D, ESSceneObject, ESViewer, ESVOption, ESVOptionCzm, EvalStringProperty, FunctionProperty, getGeoBoundingSphereFromPositions, GroupProperty, JsonProperty, Number3Property, Number4Property, NumberProperty, StringProperty, StringsProperty } from "earthsdk3";
import { createNextAnimateFrameEvent, Event, extendClassProps, ObjResettingWithEvent, react, reactArray, reactArrayWithUndefined, reactJson, reactJsonWithUndefined, UniteChanged } from 'xbsj-base';
import { CzmClippingPlaneCollectionJsonType, CzmClippingPolygonCollectionJsonType, CzmSceneGlobeShadowsType, CzmSceneSkyBoxSourcesType } from '../ESJTypesCzm';
import { capture, czmFlyTo, CzmFlyToOptions, getCameraPosition, getCameraRotation, toCartesian3, toColor } from '../utils';
import { ClippingPlanesIdBind } from './Clipping';
import { ClippingPolygonsIdBind } from './Clipping/ClippingPolygonsIdResetting';
import { ObjectsToExcludeWrapper } from './ObjectsToExcludeWrapper';
import { ViewerCreating } from './ViewerCreating';
import { getViewerExtensions } from './ViewerExtensions';
import { ViewerInstance } from './ViewerInstance';
import { ViewerLegend } from './ViewerLegend';
import { TerrainShader } from './TerrainShader';
import { getCesiumIonToken } from './getCesiumIonToken';
import { defaultCreateCesiumViewerFuncStr } from './defaultCreateCesiumViewerFuncStr';
import { createCesiumViewerFuncSample } from './createCesiumViewerFuncSample';
export * from './Flattern';
export * from './ViewerExtensions';
export class ESCesiumViewer extends ESViewer {
    static readonly type = this.register('ESCesiumViewer', this);

    static getCesiumIonToken = getCesiumIonToken;
    static currentDefaultAccessToken = Cesium.Ion.defaultAccessToken;
    static latestDefaultAccessToken = undefined as string | undefined;

    static ObjectsToExcludeWrapper = ObjectsToExcludeWrapper

    /**
     * _disabledInputStack记录外部disable的数量，当为0时才可能正常使用！
     */
    private _disabledInputStack = this.disposeVar(react(0));
    get disabledInputStack() { return this._disabledInputStack.value; }
    get disabledInputStackChanged() { return this._disabledInputStack.changed; }
    incrementDisabledInputStack() { ++this._disabledInputStack.value; }
    decrementDisabledInputStack() { --this._disabledInputStack.value; }

    private _viewer = this.dv(react<Cesium.Viewer | undefined>(undefined));
    get viewer() { return this._viewer.value; }

    get extensions() { return this.viewer && getViewerExtensions(this.viewer); }

    private _viewerInstance;
    get viewerInstance() { return this._viewerInstance; }

    private _cameraChanged = this.dv(new Event());
    get cameraChanged() { return this._cameraChanged; }

    private _viewerLegend: ViewerLegend;
    get viewerLegend() { return this._viewerLegend; }

    public pickCustomAttachedInfo: any;

    private _fps = this.dv(react<number>(0));

    static override defaults = {
        ...ESViewer.defaults,
        flashLighting: false,
        resolutionScale: 1,
        msaaSamples: 1,

        sceneSplitPosition: 0,

        depthTestAgainstTerrain: false,
        sceneGlobeShadows: 'RECEIVE_ONLY' as CzmSceneGlobeShadowsType,

        sceneGlobeUndergroundColor: [0, 0, 0, 1] as [number, number, number, number],
        sceneGlobeUndergroundColorAlphaByDistance: [6378.137, 0, 1275627.4, 1] as [number, number, number, number],

        sceneGlobeTranslucencyEnabled: false,
        sceneGlobeTranslucencyBackFaceAlpha: 1,
        sceneGlobeTranslucencyBackFaceAlphaByDistance: [6378.137, 0, 1275627.4, 1] as [number, number, number, number],
        sceneGlobeTranslucencyFrontFaceAlpha: 1,
        sceneGlobeTranslucencyFrontFaceAlphaByDistance: [6378.137, 0, 1275627.4, 1] as [number, number, number, number],
        sceneGlobeTranslucencyRectangle: [-3.141592653589793, -1.5707963267948966, 3.141592653589793, 1.5707963267948966].map(e => 180 * e / Math.PI) as [number, number, number, number],

        sun: true,
        sceneSunGlowFactor: 1,

        moon: true,
        sceneMoonTextureUrl: "${earthsdk3-assets-script-dir}/assets/img/moonSmall.jpg",
        sceneMoonOnlySunLighting: true,

        sceneSkyBoxSources: {
            positiveX: '${earthsdk3-assets-script-dir}/assets/img/sceneSkyBoxSources/tycho2t3_80_px.jpg',
            negativeX: '${earthsdk3-assets-script-dir}/assets/img/sceneSkyBoxSources/tycho2t3_80_mx.jpg',
            positiveY: '${earthsdk3-assets-script-dir}/assets/img/sceneSkyBoxSources/tycho2t3_80_py.jpg',
            negativeY: '${earthsdk3-assets-script-dir}/assets/img/sceneSkyBoxSources/tycho2t3_80_my.jpg',
            positiveZ: '${earthsdk3-assets-script-dir}/assets/img/sceneSkyBoxSources/tycho2t3_80_pz.jpg',
            negativeZ: '${earthsdk3-assets-script-dir}/assets/img/sceneSkyBoxSources/tycho2t3_80_mz.jpg',
        } as CzmSceneSkyBoxSourcesType,

        xbsjLocalBoxSources: {
            positiveX: '${earthsdk3-assets-script-dir}/assets/img/skybox/east.jpg',
            negativeX: '${earthsdk3-assets-script-dir}/assets/img/skybox/west.jpg',
            positiveY: '${earthsdk3-assets-script-dir}/assets/img/skybox/bottom.jpg',
            negativeY: '${earthsdk3-assets-script-dir}/assets/img/skybox/top.jpg',
            positiveZ: '${earthsdk3-assets-script-dir}/assets/img/skybox/north.jpg',
            negativeZ: '${earthsdk3-assets-script-dir}/assets/img/skybox/south.jpg',
        } as CzmSceneSkyBoxSourcesType,

        sceneFogEnabled: true,
        sceneFogDensity: 2.0e-4,
        sceneFogScreenSpaceErrorFactor: 2,
        sceneFogMinimumBrightness: 0.03,

        sceneSsccEnableInputs: true,
        sceneSsccEnableCollisionDetection: true,
        sceneSsccZoomFactor: 5,

        scenePpsfxaaEnabled: true, // 和cesium不一致

        sceneDebugShowFramesPerSecond: false,
        sceneDebugShowCommands: false,
        sceneDebugShowFrustums: false,
        sceneDebugShowFrustumPlanes: false,
        sceneDebugShowDepthFrustum: 1,

        showCesiumInspector: false,
        cesiumInspectorWireframe: false,
        showCesium3DTilesInspector: false,
    }

    constructor(option: ESVOption) {
        super(option);
        // 绑定裁剪
        this.ad(new ClippingPlanesIdBind(this));
        this.ad(new ClippingPolygonsIdBind(this));
        this.dv(new ObjResettingWithEvent(this.viewerChanged, () => {
            if (!this.viewer) return undefined;
            return new TerrainShader(this);
        }))
        //比例尺
        this._viewerLegend = this.dv(new ViewerLegend(this));
        // 实例化ViewerInstance
        {
            this._viewerInstance = this.dv(new ObjResettingWithEvent(this.viewerChanged, () => {
                if (!this.viewer) return undefined;
                return new ViewerInstance(this, this.viewer);
            }))
            // this._viewerInstance?.obj.
        }
        this.d(this.viewerChanged.don((v) => {
            this.viewer && (this.viewer.scene.globe.baseColor = toColor([1, 1, 1, 1]));
        }))
        if (option.type !== 'ESCesiumViewer') throw new Error('option.type must be ESCesiumViewer');
        const opt = option as ESVOptionCzm;
        this.d(this._viewer.changed.don(() => {
            this.actived = true;
            this.viewerChanged.emit(this.viewer);
        }));
        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.subContainerChanged,
            this.msaaSamplesChanged, // msaa修改，只能重构
        ));
        this.dv(new ObjResettingWithEvent(recreateEvent, () => {
            this.setStatus('Raw');
            this.setStatusLog('');
            if (!this.subContainer) return undefined;
            return new ViewerCreating(this.subContainer, this, (viewer) => (this._viewer.value = viewer), opt.options);
        }));
    }

    async pick(screenPosition: ESJVector2D, attachedInfo?: any, parentInfo?: boolean) {
        if (!this.extensions) return undefined;
        const { pickingManager } = this.extensions;
        return await pickingManager.pick(screenPosition, undefined, attachedInfo);
    }
    async pickPosition(screenPosition: ESJVector2D) {
        if (!this.extensions) return undefined;
        const { pickingManager } = this.extensions;
        return await pickingManager.pickPosition(screenPosition);
    }
    async quickPickPosition(screenPosition: ESJVector2D) {
        if (!this.extensions) return undefined;
        const { pickingManager } = this.extensions;
        return await pickingManager.quickPickPosition(screenPosition);
    }
    static getHeightsScartchCarto = new Cesium.Cartographic();
    /**
     * 获取某个经纬度上的地形高度，注意有可能获取不到，需要考虑undefined的情况！
     * @param positions 
     * @returns 注意高度有可能是undefined!
     */
    getTerrainHeight(position: [number, number] | [number, number, number]) {
        const { viewer } = this;
        if (!viewer) return undefined;

        const carto = Cesium.Cartographic.fromDegrees(position[0], position[1], position[2], ESCesiumViewer.getHeightsScartchCarto);
        const height = viewer.scene.globe.getHeight(carto);
        return height;
    }
    getCameraInfo() {
        if (!this.viewer) {
            return undefined;
        }
        const { camera } = this.viewer;
        return {
            position: getCameraPosition(camera),
            rotation: getCameraRotation(camera),
        };
    }
    calcFlyToParam(targetPosition: [number, number, number]) {
        const cameraInfo = this.getCameraInfo();
        if (!cameraInfo) return undefined;

        if (!this.viewer) {
            return undefined;
        }
        // 本地坐标转世界坐标
        const { camera } = this.viewer;
        let worldPoint = camera.positionWC

        const targetPointCar3 = Cesium.Cartesian3.fromDegrees(...targetPosition);
        const distance = Cesium.Cartesian3.distance(camera.positionWC, targetPointCar3);
        //向量
        const normal = Cesium.Cartesian3.subtract(
            targetPointCar3,
            worldPoint,
            new Cesium.Cartesian3()
        );
        //归一化
        Cesium.Cartesian3.normalize(normal, normal);
        //旋转矩阵 rotationMatrixFromPositionVelocity源码中有，并未出现在cesiumAPI中
        const rotationMatrix3 = Cesium.Transforms.rotationMatrixFromPositionVelocity(
            worldPoint,
            normal,
            Cesium.Ellipsoid.WGS84
        );
        const modelMatrix4 = Cesium.Matrix4.fromRotationTranslation(
            rotationMatrix3,
            worldPoint
        );
        var m1 = Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Matrix4.getTranslation(modelMatrix4, new Cesium.Cartesian3()),
            Cesium.Ellipsoid.WGS84,
            new Cesium.Matrix4()
        );
        // 矩阵相除
        var m3 = Cesium.Matrix4.multiply(
            Cesium.Matrix4.inverse(m1, new Cesium.Matrix4()),
            modelMatrix4,
            new Cesium.Matrix4()
        );
        // 得到旋转矩阵
        var mat3 = Cesium.Matrix4.getMatrix3(m3, new Cesium.Matrix3());
        // 计算四元数
        var q = Cesium.Quaternion.fromRotationMatrix(mat3);
        // 计算旋转角(弧度)
        var hpr = Cesium.HeadingPitchRoll.fromQuaternion(q);
        const rotation = getCameraRotation(camera);
        return {
            distance,
            heading: Cesium.Math.toDegrees(hpr.heading) + 90,
            pitch: Cesium.Math.toDegrees(hpr.pitch),
            flyDuration: 1,
            hDelta: -(rotation[0] - (Cesium.Math.toDegrees(hpr.heading) + 90)),
            pDelta: rotation[1] - Cesium.Math.toDegrees(hpr.pitch),
        } as ESJFlyToParam;
    }

    flyIn(position: ESJVector3D, rotation?: ESJVector3D, _duration?: number) {
        const opt = { position, rotation, duration: (_duration ?? 1) * 1000 } as CzmFlyToOptions;
        const camera = this.viewer?.camera;
        return camera && czmFlyTo(camera, opt);
    }
    flyTo(flyToParam: ESJFlyToParam, position: ESJVector3D) {
        const { distance, heading, pitch, flyDuration, hDelta, pDelta } = flyToParam;
        const opt = {
            position, viewDistance: distance, rotation: [heading, pitch, 0],
            duration: flyDuration * 1000, hdelta: hDelta, pdelta: pDelta
        } as CzmFlyToOptions
        const camera = this.viewer?.camera;
        return camera && czmFlyTo(camera, opt);
    }
    flyToBoundingSphere(rectangle: ESJVector4D, distance?: number, duration: number = 1) {
        const positions: ESJVector3DArray = [
            [rectangle[0], rectangle[1], 0],
            [rectangle[0], rectangle[3], 0],
            [rectangle[2], rectangle[3], 0],
            [rectangle[2], rectangle[1], 0]
        ]
        const options = getGeoBoundingSphereFromPositions(positions)
        if (!options) return;
        const { center, radius } = options
        const opt = {
            position: center, viewDistance: distance ?? radius, rotation: [0, -90, 0],
            duration: duration * 1000
        } as CzmFlyToOptions
        const camera = this.viewer?.camera;
        return camera && czmFlyTo(camera, opt);
    }
    getCurrentCameraInfo() {
        if (!this.viewer) return undefined;
        const { camera } = this.viewer;
        return {
            position: getCameraPosition(camera),
            rotation: getCameraRotation(camera),
        };
    }
    getLengthInPixel() {
        return this._viewerLegend.length;
    }

    changeToWalk(position: ESJVector3D) {
        this._viewerInstance?.obj?.navigationManager.changeToWalk(position);
        this._navigationMode.value = 'Walk';
    }
    changeToMap() {
        this._viewerInstance?.obj?.navigationManager.changeToMap();
        this._navigationMode.value = 'Map';
    }
    changeToRotateGlobe(latitude?: number, height?: number, cycleTime?: number) {
        this._viewerInstance?.obj?.navigationManager.changeToRotateGlobe(latitude, height, cycleTime);
        this._navigationMode.value = 'RotateGlobe';
    }
    changeToLine(geoLineStringId: string, speed?: number, heightOffset?: number, loop?: boolean, turnRateDPS?: number, lineMode?: "auto" | "manual") {
        this._viewerInstance?.obj?.navigationManager.changeToLine(geoLineStringId, speed, heightOffset, loop, turnRateDPS, lineMode);
        this._navigationMode.value = 'Line';
    }
    changeToUserDefined(userDefinedPawn: string) {
        this.changeToMap();
        console.warn('Cesium引擎暂不支持自定义漫游,已切换为Map模式', userDefinedPawn);
    };
    changeToRotatePoint(position: ESJVector3D, distance?: number, orbitPeriod?: number, heading?: number, pitch?: number) {
        this._viewerInstance?.obj?.navigationManager.changeToRotatePoint(position, distance, orbitPeriod, heading, pitch);
        this._navigationMode.value = 'RotatePoint';
    }
    changeToFollow(objectId: string, distance?: number, heading?: number, pitch?: number, changeToFollow?: boolean) {
        this._viewerInstance?.obj?.navigationManager.changeToFollow(objectId, distance, heading, pitch, changeToFollow);
        this._navigationMode.value = 'Follow';
    }
    getFPS() {
        return this._fps.value
    }
    override async getVersion() {
        //@ts-ignore
        const copyright = window.g_XE3CopyRights ?? {};
        return copyright;
    }
    async getHeightByLonLat(lon: number, lat: number, channel?: string) {
        if (!this.viewer) return null;
        const carto = Cesium.Cartographic.fromDegrees(lon, lat, undefined, ESCesiumViewer.getHeightsScartchCarto);
        const height = this.viewer.scene.sampleHeight(carto);
        return height
    }
    async getHeightsByLonLats(lonLats: ESJVector2DArray, channel?: string) {
        const heights = lonLats.map(lonLat => this.getHeightByLonLat(...lonLat))
        const resPromise = await Promise.all(heights)
        return resPromise;
    }
    async capture(resx?: number, resy?: number) {
        if (!this.viewer) return undefined;
        return await capture(this.viewer.scene, resx, resy);
    }
    async lonLatAltToScreenPosition(position: ESJVector3D) {
        if (!this.viewer) return undefined;
        const res = this.viewer.scene.cartesianToCanvasCoordinates(toCartesian3(position))
        return res && [res.x, res.y] as ESJVector2D;
    }

    getCzmObject(sceneObject: ESSceneObject) { return this.sceneObjectsMap.get(sceneObject); }

    setCurrentDefaultAccessToken() {
        this.ionAccessToken = ESCesiumViewer.currentDefaultAccessToken;
    }

    setLatestDefaultAccessToken() {
        if (!ESCesiumViewer.latestDefaultAccessToken) {
            alert('Cesium最新的iontoken无法获取！');
            console.error('Cesium最新的iontoken无法获取！');
            return;
        }
        this.ionAccessToken = ESCesiumViewer.latestDefaultAccessToken;
    }

    override getProperties() {
        const d = ESCesiumViewer.defaults;
        return [
            ...super.getProperties(),
            new GroupProperty('通用', '通用', [
                new EvalStringProperty('CesiumViewer创建函数', 'CesiumViewer创建函数', true, false, [this, 'createCesiumViewerFuncStr'], defaultCreateCesiumViewerFuncStr, createCesiumViewerFuncSample),
                new FunctionProperty('获取官方token', '获取官方token', [], () => ESCesiumViewer.getCesiumIonToken(), []),
                new FunctionProperty('当前token', '重置为当前使用的Cesium版本的token', [], () => this.setCurrentDefaultAccessToken(), []),
                new FunctionProperty('最新token', '充值为当前Cesium官方的最新token', [], () => this.setLatestDefaultAccessToken(), []),
                new BooleanProperty('头顶灯', '设置为头顶灯，false时为太阳光', true, false, [this, 'flashLighting']),
            ]),
            new GroupProperty('Viewer', 'Viewer', [
                new NumberProperty('分辨率比率', '分辨率比率', true, false, [this, 'resolutionScale'], d.resolutionScale),
                new NumberProperty('msaaSamples', 'msaaSamples', true, false, [this, 'msaaSamples'], d.msaaSamples),
                new BooleanProperty('shadows', 'shadows', false, false, [this, 'shadows']),
                new GroupProperty('比例尺', '比例尺(Legend)', [
                    new NumberProperty('resolution', 'resolution', true, true, [this.viewerLegend, 'resolution']),
                    new NumberProperty('zoom', 'zoom', true, true, [this.viewerLegend, 'zoom']),
                    new Number3Property('center', 'center', true, true, [this.viewerLegend, 'center']),
                    new NumberProperty('lengthInPixels', 'lengthInPixels', true, false, [this.viewerLegend.legend, 'lengthInPixels']),
                    new NumberProperty('computedLengthInPixels', 'computedLengthInPixels', true, true, [this.viewerLegend.legend, 'computedLengthInPixels']),
                    new NumberProperty('computedLengthInMeters', 'computedLengthInMeters', true, true, [this.viewerLegend.legend, 'computedLengthInMeters']),
                    new StringProperty('computedLengthInStr', 'computedLengthInStr', true, true, [this.viewerLegend.legend, 'computedLengthInStr']),
                ]),
                new GroupProperty('场景', '场景(Scene)', [
                    new NumberProperty('内部视口分割比例', '内部视口分割比例', true, false, [this, 'sceneSplitPosition'], d.sceneSplitPosition),
                    new GroupProperty('Globe', 'Globe', [
                        new BooleanProperty('depthTestAgainstTerrain', 'depthTestAgainstTerrain', true, false, [this, 'depthTestAgainstTerrain'], d.depthTestAgainstTerrain),
                        new EnumProperty('sceneGlobeShadows', 'sceneGlobeShadows', true, false, [this, 'sceneGlobeShadows'], [['禁用', 'DISABLED'], ['启用', 'ENABLED'], ['仅投射', 'CAST_ONLY'], ['仅接收', 'RECEIVE_ONLY']], d.sceneGlobeShadows),
                        new NumberProperty('sceneGlobeTerrainExaggeration', 'sceneGlobeTerrainExaggeration，Cesium1.116废弃', false, false, [this, 'sceneGlobeTerrainExaggeration']),
                        new NumberProperty('sceneGlobeTerrainExaggerationRelativeHeight', 'sceneGlobeTerrainExaggerationRelativeHeight，Cesium1.116废弃', false, false, [this, 'sceneGlobeTerrainExaggerationRelativeHeight']),
                        new NumberProperty('sceneGlobeVerticalExaggeration', 'sceneGlobeVerticalExaggeration', false, false, [this, 'sceneGlobeVerticalExaggeration']),
                        new NumberProperty('sceneGlobeVerticalExaggerationRelativeHeight', 'sceneGlobeVerticalExaggerationRelativeHeight', false, false, [this, 'sceneGlobeVerticalExaggerationRelativeHeight']),
                        new BooleanProperty('sceneGlobeBackFaceCulling', 'sceneGlobeBackFaceCulling', false, false, [this, 'sceneGlobeBackFaceCulling']),
                        new BooleanProperty('sceneGlobeShowSkirts', 'sceneGlobeShowSkirts', false, false, [this, 'sceneGlobeShowSkirts']),
                        new BooleanProperty('sceneGlobeShowWaterEffect', 'sceneGlobeShowWaterEffect', false, false, [this, 'sceneGlobeShowWaterEffect']),
                        new ColorProperty('sceneGlobeBaseColor', 'sceneGlobeBaseColor', false, false, [this, 'sceneGlobeBaseColor']),
                        new Number4Property('sceneGlobeCartographicLimitRectangle', 'sceneGlobeCartographicLimitRectangle', false, false, [this, 'sceneGlobeCartographicLimitRectangle']),
                        new JsonProperty('sceneGlobeClippingPlanes', 'sceneGlobeClippingPlanes', false, false, [this, 'sceneGlobeClippingPlanes']),
                        new StringProperty('sceneGlobeClippingPlanesId', 'sceneGlobeClippingPlanesId', false, false, [this, 'sceneGlobeClippingPlanesId']),
                        new JsonProperty('sceneGlobeClippingPolygons', 'sceneGlobeClippingPolygons', false, false, [this, 'sceneGlobeClippingPolygons']),
                        new StringsProperty('sceneGlobeClippingPolygonsId', 'sceneGlobeClippingPolygonsId', false, false, [this, 'sceneGlobeClippingPolygonsId']),

                        new GroupProperty('Underground', 'Underground', [
                            new ColorProperty('sceneGlobeUndergroundColor', 'sceneGlobeUndergroundColor', true, false, [this, 'sceneGlobeUndergroundColor'], d.sceneGlobeUndergroundColor),
                            new Number4Property('sceneGlobeUndergroundColorAlphaByDistance', 'sceneGlobeUndergroundColorAlphaByDistance', true, false, [this, 'sceneGlobeUndergroundColorAlphaByDistance'], d.sceneGlobeUndergroundColorAlphaByDistance),
                        ]),
                        new GroupProperty('Translucency', 'Translucency', [
                            new BooleanProperty('启用', '启用', true, false, [this, 'sceneGlobeTranslucencyEnabled'], d.sceneGlobeTranslucencyEnabled),
                            new NumberProperty('背面透明度', '背面透明度', true, false, [this, 'sceneGlobeTranslucencyBackFaceAlpha'], d.sceneGlobeTranslucencyBackFaceAlpha),
                            new Number4Property('背面渐变透明度', '背面渐变透明度', true, false, [this, 'sceneGlobeTranslucencyBackFaceAlphaByDistance'], d.sceneGlobeTranslucencyBackFaceAlphaByDistance),
                            new NumberProperty('正面透明度', '正面透明度', true, false, [this, 'sceneGlobeTranslucencyFrontFaceAlpha'], d.sceneGlobeTranslucencyFrontFaceAlpha),
                            new Number4Property('正面渐变透明度', '正面渐变透明度', true, false, [this, 'sceneGlobeTranslucencyFrontFaceAlphaByDistance'], d.sceneGlobeTranslucencyFrontFaceAlphaByDistance),
                            new Number4Property('矩形范围', '矩形范围', true, false, [this, 'sceneGlobeTranslucencyRectangle'], d.sceneGlobeTranslucencyRectangle),
                        ]),
                    ]),
                    new GroupProperty('Sun', 'Sun', [
                        new BooleanProperty('sun', 'sun', true, false, [this, 'sun'], d.sun),
                        new NumberProperty('sceneSunGlowFactor', 'sceneSunGlowFactor', true, false, [this, 'sceneSunGlowFactor'], d.sceneSunGlowFactor),
                    ]),
                    new GroupProperty('Moon', 'Moon', [
                        new BooleanProperty('moon', 'moon', true, false, [this, 'moon'], d.moon),
                        new StringProperty('sceneMoonTextureUrl', 'sceneMoonTextureUrl', true, false, [this, 'sceneMoonTextureUrl'], d.sceneMoonTextureUrl),
                        new BooleanProperty('sceneMoonOnlySunLighting', 'sceneMoonOnlySunLighting', true, false, [this, 'sceneMoonOnlySunLighting'], d.sceneMoonOnlySunLighting),
                    ]),
                    new GroupProperty('SkyBox', 'SkyBox', [
                        new BooleanProperty('sceneSkyBoxShow', 'sceneSkyBoxShow', false, false, [this, 'sceneSkyBoxShow']),
                        new JsonProperty('sceneSkyBoxSources', 'sceneSkyBoxSources', true, false, [this, 'sceneSkyBoxSources']),
                        new GroupProperty('Background', 'Background', [
                            new BooleanProperty('xbsjUseBackground', 'xbsjUseBackground', false, false, [this, 'xbsjUseBackground']),
                            new StringProperty('xbsjBackgroundImageUri', 'xbsjBackgroundImageUri', false, false, [this, 'xbsjBackgroundImageUri']),
                            new ColorProperty('xbsjBackgroundColor', 'xbsjBackgroundColor', false, false, [this, 'xbsjBackgroundColor']),
                        ]),
                    ]),
                    new GroupProperty('SkyAtmosphere', 'SkyAtmosphere', [
                        new JsonProperty('xbsjLocalBoxSources', 'xbsjLocalBoxSources', true, false, [this, 'xbsjLocalBoxSources'], d.xbsjLocalBoxSources),
                    ]),
                    new ColorProperty('sceneBackgroundColor', 'sceneBackgroundColor', false, false, [this, 'sceneBackgroundColor']),
                    new GroupProperty('Fog', 'Fog', [
                        new BooleanProperty('sceneFogEnabled', 'sceneFogEnabled', true, false, [this, 'sceneFogEnabled'], d.sceneFogEnabled),
                        // new BooleanProperty('fogRenderable', 'fogRenderable', false, false, [this, 'fogRenderable'], true),
                        new NumberProperty('sceneFogDensity', 'sceneFogDensity', true, false, [this, 'sceneFogDensity'], d.sceneFogDensity),
                        new NumberProperty('sceneFogScreenSpaceErrorFactor', 'sceneFogScreenSpaceErrorFactor', true, false, [this, 'sceneFogScreenSpaceErrorFactor'], d.sceneFogScreenSpaceErrorFactor),
                        new NumberProperty('sceneFogMinimumBrightness', 'sceneFogMinimumBrightness', true, false, [this, 'sceneFogMinimumBrightness'], d.sceneFogMinimumBrightness),
                    ]),
                    new GroupProperty('Sscc', 'Sscc', [
                        new BooleanProperty('sceneSsccEnableInputs', 'sceneSsccEnableInputs', true, false, [this, 'sceneSsccEnableInputs'], d.sceneSsccEnableInputs),
                        new BooleanProperty('sceneSsccEnableCollisionDetection', 'sceneSsccEnableCollisionDetection', true, false, [this, 'sceneSsccEnableCollisionDetection'], d.sceneSsccEnableCollisionDetection),
                        new NumberProperty('sceneSsccZoomFactor', 'sceneSsccZoomFactor', true, false, [this, 'sceneSsccZoomFactor'], d.sceneSsccZoomFactor),
                    ]),
                    new NumberProperty('相机广角', '相机广角(sceneCameraFrustumFov)', false, false, [this, 'sceneCameraFrustumFov']),
                    new GroupProperty('后处理', '后处理', [
                        new BooleanProperty('开启FXAA', '开启FXAA', true, false, [this, 'scenePpsfxaaEnabled'], d.scenePpsfxaaEnabled),
                        new GroupProperty('环境遮蔽', '环境遮蔽', [
                            new BooleanProperty('Enabled', 'Enabled', false, false, [this, 'scenePpsAmbientOcclusionEnabled']),
                            new BooleanProperty('AmbientOcclusionOnly', 'AmbientOcclusionOnly', false, false, [this, 'scenePpsAmbientOcclusionAmbientOcclusionOnly']),
                            new NumberProperty('Intensity', 'Intensity', false, false, [this, 'scenePpsAmbientOcclusionIntensity']),
                            new NumberProperty('Bias', 'Bias', false, false, [this, 'scenePpsAmbientOcclusionBias']),
                            new NumberProperty('LengthCap', 'LengthCap', false, false, [this, 'scenePpsAmbientOcclusionLengthCap']),
                            new NumberProperty('StepSize', 'StepSize', false, false, [this, 'scenePpsAmbientOcclusionStepSize']),
                            new NumberProperty('BlurStepSize', 'BlurStepSize', false, false, [this, 'scenePpsAmbientOcclusionBlurStepSize']),
                        ]),
                        new GroupProperty('Bloom', 'Bloom', [
                            new BooleanProperty('Enabled', 'Enabled', false, false, [this, 'scenePpsBloomEnabled']),
                            new BooleanProperty('GlowOnly', 'GlowOnly', false, false, [this, 'scenePpsBloomGlowOnly']),
                            new NumberProperty('Contrast', 'Contrast', false, false, [this, 'scenePpsBloomContrast']),
                            new NumberProperty('Brightness', 'Brightness', false, false, [this, 'scenePpsBloomBrightness']),
                            new NumberProperty('Delta', 'Delta', false, false, [this, 'scenePpsBloomDelta']),
                            new NumberProperty('Sigma', 'Sigma', false, false, [this, 'scenePpsBloomSigma']),
                            new NumberProperty('StepSize', 'StepSize', false, false, [this, 'scenePpsBloomStepSize']),
                        ]),
                    ]),
                    new GroupProperty('调试', '调试', [
                        new BooleanProperty('sceneDebugShowFramesPerSecond', 'sceneDebugShowFramesPerSecond', true, false, [this, 'sceneDebugShowFramesPerSecond'], d.sceneDebugShowFramesPerSecond),
                        new BooleanProperty('sceneDebugShowCommands', 'sceneDebugShowCommands', true, false, [this, 'sceneDebugShowCommands'], d.sceneDebugShowCommands),
                        new BooleanProperty('sceneDebugShowFrustums', 'sceneDebugShowFrustums', true, false, [this, 'sceneDebugShowFrustums'], d.sceneDebugShowFrustums),
                        new BooleanProperty('sceneDebugShowFrustumPlanes', 'sceneDebugShowFrustumPlanes', true, false, [this, 'sceneDebugShowFrustumPlanes'], d.sceneDebugShowFrustumPlanes),
                        new NumberProperty('sceneDebugShowDepthFrustum', 'sceneDebugShowDepthFrustum', true, false, [this, 'sceneDebugShowDepthFrustum'], d.sceneDebugShowDepthFrustum),
                    ]),
                ]),
                new GroupProperty('第一人称漫游', '第一人称漫游', [
                    // new BooleanProperty('firstPersonKeyboardEnabled', 'firstPersonKeyboardEnabled', false, false, [this, 'firstPersonKeyboardEnabled']),
                    // new BooleanProperty('firstPersonMouseEnabled', 'firstPersonMouseEnabled', false, false, [this, 'firstPersonMouseEnabled']),
                    // new NumberProperty('firstPersonWalkingSpeed', '运动速度，m/ms 米/毫秒', false, false, [this, 'firstPersonWalkingSpeed']),
                    // new NumberProperty('firstPersonRotatingSpeed', '旋转速度，°/ms 度/毫秒', false, false, [this, 'firstPersonRotatingSpeed']),
                    // new BooleanProperty('firstPersonAlwaysWithCamera', 'firstPersonAlwaysWithCamera', false, false, [this, 'firstPersonAlwaysWithCamera']),
                    // new JsonProperty('firstPersonKeyStatusMap', 'firstPersonKeyStatusMap', false, false, [this, 'firstPersonKeyStatusMap'], undefined, d.firstPersonKeyStatusMapReadMe),
                ]),
                new GroupProperty('Inspector', 'Inspector', [
                    new BooleanProperty('showCesiumInspector', 'showCesiumInspector', true, false, [this, 'showCesiumInspector'], d.showCesiumInspector),
                    new BooleanProperty('cesiumInspectorWireframe', 'cesiumInspectorWireframe', true, false, [this, 'cesiumInspectorWireframe'], d.cesiumInspectorWireframe),
                    new BooleanProperty('showCesium3DTilesInspector', 'showCesium3DTilesInspector', true, false, [this, 'showCesium3DTilesInspector'], d.showCesium3DTilesInspector),
                ])
            ]),
        ];
    }
}
export namespace ESCesiumViewer {
    export const createDefaultProps = () => ({
        ...ESViewer.createDefaultProps(),
        // 通用
        createCesiumViewerFuncStr: undefined as string | undefined,
        flashLighting: undefined as boolean | undefined, // 头顶光
        // Viewer
        resolutionScale: undefined as number | undefined,
        msaaSamples: undefined as number | undefined,
        shadows: false,
        // Viewer Scene
        // 位置分割
        sceneSplitPosition: undefined as number | undefined,
        // Viewer Scene Globe
        depthTestAgainstTerrain: undefined as boolean | undefined,
        sceneGlobeShadows: undefined as CzmSceneGlobeShadowsType | undefined,

        sceneGlobeTerrainExaggeration: 1,
        sceneGlobeTerrainExaggerationRelativeHeight: 0,
        sceneGlobeVerticalExaggeration: 1,
        sceneGlobeVerticalExaggerationRelativeHeight: 0,

        sceneGlobeBackFaceCulling: true,
        sceneGlobeShowSkirts: true,
        sceneGlobeShowWaterEffect: true,
        sceneGlobeBaseColor: reactArray<[number, number, number, number]>([0, 0, 1, 0]),
        sceneGlobeCartographicLimitRectangle: reactArray<[number, number, number, number]>([-180, -90, 180, 90]),
        sceneGlobeClippingPlanes: reactJson<CzmClippingPlaneCollectionJsonType | undefined>(undefined),
        sceneGlobeClippingPlanesId: '',
        sceneGlobeClippingPolygons: reactJsonWithUndefined<CzmClippingPolygonCollectionJsonType>(undefined),
        sceneGlobeClippingPolygonsId: reactArray<string[]>([]),

        // Viewer Scene Globe UnderGround
        sceneGlobeUndergroundColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        sceneGlobeUndergroundColorAlphaByDistance: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        // Viewer Scene Globe Translucency
        sceneGlobeTranslucencyEnabled: undefined as boolean | undefined,
        sceneGlobeTranslucencyBackFaceAlpha: undefined as number | undefined,
        sceneGlobeTranslucencyBackFaceAlphaByDistance: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        sceneGlobeTranslucencyFrontFaceAlpha: undefined as number | undefined,
        sceneGlobeTranslucencyFrontFaceAlphaByDistance: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        sceneGlobeTranslucencyRectangle: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        // Viewer Scene Sun
        sun: undefined as boolean | undefined,//太阳//TODO:ue无
        sceneSunGlowFactor: undefined as number | undefined,
        // Viewer Scene Moon
        moon: undefined as boolean | undefined,//TODO:ue无
        sceneMoonTextureUrl: undefined as string | undefined,
        sceneMoonOnlySunLighting: undefined as boolean | undefined,
        // moonEllipsoid: undefined as [x: number, y: number, z: number] | undefined,//属性为只读属性，无法分配 //TODO
        // Viewer Scene SkyBox
        sceneSkyBoxShow: true,
        sceneSkyBoxSources: reactJson<CzmSceneSkyBoxSourcesType>(ESCesiumViewer.defaults.sceneSkyBoxSources),
        xbsjUseBackground: false,
        xbsjBackgroundImageUri: '',
        xbsjBackgroundColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        xbsjLocalBoxSources: reactJsonWithUndefined<CzmSceneSkyBoxSourcesType>(undefined),
        sceneBackgroundColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]),
        // Viewer Scene Fog
        sceneFogEnabled: undefined as boolean | undefined,
        sceneFogDensity: undefined as number | undefined,
        sceneFogScreenSpaceErrorFactor: undefined as number | undefined,
        sceneFogMinimumBrightness: undefined as number | undefined,
        // fogRenderable: true as boolean,//fog上不存在该属性 //todo
        // Viewer Scene Sscc
        sceneSsccEnableInputs: undefined as boolean | undefined,
        sceneSsccEnableCollisionDetection: undefined as boolean | undefined,
        sceneSsccZoomFactor: undefined as number | undefined, // g_app.czmViewer.viewer.scene.screenSpaceCameraController._zoomFactor = 2
        // Viewer Scene Camera
        // sceneCameraFrustumFov: 90,// TODO:上层已有属性fov
        // Viewer Scene Pps
        scenePpsfxaaEnabled: undefined as boolean | undefined,
        // scenePpsAmbientOcclusion
        scenePpsAmbientOcclusionEnabled: false,
        scenePpsAmbientOcclusionAmbientOcclusionOnly: false,
        scenePpsAmbientOcclusionIntensity: 3.0,
        scenePpsAmbientOcclusionBias: 0.1,
        scenePpsAmbientOcclusionLengthCap: 0.03,
        scenePpsAmbientOcclusionStepSize: 1.0,
        scenePpsAmbientOcclusionBlurStepSize: 0.86,
        // scenePpsBloom
        scenePpsBloomEnabled: false,
        scenePpsBloomGlowOnly: false,
        scenePpsBloomContrast: 128,
        scenePpsBloomBrightness: -0.3,
        scenePpsBloomDelta: 1.0,
        scenePpsBloomSigma: 3.78,
        scenePpsBloomStepSize: 5.0,
        // Viewer Scene Debug
        // debugCommandFilter
        sceneDebugShowFramesPerSecond: undefined as boolean | undefined,
        sceneDebugShowCommands: undefined as boolean | undefined,
        sceneDebugShowFrustums: undefined as boolean | undefined,
        sceneDebugShowFrustumPlanes: undefined as boolean | undefined,
        sceneDebugShowDepthFrustum: undefined as number | undefined,
        // Viewer Inspector
        showCesiumInspector: undefined as boolean | undefined,
        cesiumInspectorWireframe: undefined as boolean | undefined,
        showCesium3DTilesInspector: undefined as boolean | undefined,

        // firstPersonKeyboardEnabled: false,
        // firstPersonMouseEnabled: false,
        // firstPersonWalkingSpeed: 1,
        // firstPersonRotatingSpeed: 0.01,
        // firstPersonAlwaysWithCamera: false,
        // firstPersonKeyStatusMap: reactJson<{ [k: string]: CzmCameraActionType }>(KeyboardCameraController.defaultKeyStatusMap),
    });
}
extendClassProps(ESCesiumViewer.prototype, ESCesiumViewer.createDefaultProps);
export interface ESCesiumViewer extends UniteChanged<ReturnType<typeof ESCesiumViewer.createDefaultProps>> { }

