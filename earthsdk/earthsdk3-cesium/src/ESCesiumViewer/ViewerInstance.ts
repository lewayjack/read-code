import { clamp, createNextAnimateFrameEvent, Destroyable, Listener, ObjResettingWithEvent } from "xbsj-base";
import { ESCesiumViewer } from ".";
import * as Cesium from 'cesium';
import { createClippingPlaneCollection, createClippingPolygonCollection, CzmCameraChanged, czmSubscribeAndEvaluate, setClippingPlaneCollection, toColor, toNearFarScalar, toRectangle } from "../utils";
import { ESSceneObject, registerEventUpdate } from "earthsdk3";
import { NavigationManager } from "./NavigationManager";
import { EnvManager } from "./EnvManager";
import { BackGroundImage } from "./BackGroundImage";
import { getCzmSceneSkyBoxSources, SceneSkyBoxSourcesType } from "./getCzmSceneSkyBoxSources";
import { SkyAtmosphere } from "./LocalSkyBox";
export class ViewerInstance extends Destroyable {
    get czmViewer() { return this._czmViewer; }
    get viewer() { return this._viewer; }

    //漫游
    private _navigationManager: NavigationManager;
    get navigationManager() { return this._navigationManager; }
    //环境
    private _envManager: EnvManager;
    get envManager() { return this._envManager; }

    //@ts-ignore
    static BackGroundResetting: BackGroundResetting = class BackGroundResetting extends Destroyable {
        constructor(private _czmViewer: ESCesiumViewer, private _viewer: Cesium.Viewer) {
            super();
            const backgroundImage = new BackGroundImage();
            backgroundImage.material = Cesium.Material.fromType('Image')
            const viewer = this._viewer;

            // @ts-ignore
            viewer.scene.skyBox = backgroundImage;
            // @ts-ignore
            this.dispose(() => viewer.scene.skyBox = viewer.scene._xbsjOriginSkyBox);

            {
                const update = () => {
                    backgroundImage.show = this._czmViewer.sceneSkyBoxShow;
                };
                update();
                this.dispose(this._czmViewer.sceneSkyBoxShowChanged.disposableOn(update));
            }

            {
                const update = () => {
                    // @ts-ignore
                    backgroundImage.material.uniforms.color = toColor(this._czmViewer.xbsjBackgroundColor);
                };
                update();
                this.dispose(this._czmViewer.xbsjBackgroundColorChanged.disposableOn(update));
            }

            {
                const update = () => {
                    // @ts-ignore
                    backgroundImage.material.uniforms.image = SceneObject.context.getStrFromEnv(this._czmViewer.xbsjBackgroundImageUri);
                };
                update();
                this.dispose(this._czmViewer.xbsjBackgroundImageUriChanged.disposableOn(update));
            }
        }
    }
    //@ts-ignore
    static LocalSkyBoxResetting: LocalSkyBoxResetting = class LocalSkyBoxResetting extends Destroyable {
        private _skyAtmosphere;
        get skyAtmosphere() { return this._skyAtmosphere; }

        constructor(private _czmViewer: ESCesiumViewer, private _viewer: Cesium.Viewer, private _sources: SceneSkyBoxSourcesType) {
            super();
            this._skyAtmosphere = new SkyAtmosphere(undefined, this._sources);
            const viewer = this._viewer;
            // @ts-ignore
            viewer.scene.skyAtmosphere = this._skyAtmosphere;
            // @ts-ignore
            this.dispose(() => viewer.scene.skyAtmosphere = viewer.scene._xbsjOriginSkyAtmosphere);

            {
                const update = () => {
                    // @ts-ignore
                    this._skyAtmosphere.show = this._czmViewer.atmosphere;
                };
                update();
                this.dispose(this._czmViewer.atmosphereChanged.disposableOn(update));
            }
        }
    }

    constructor(private _czmViewer: ESCesiumViewer, private _viewer: Cesium.Viewer) {
        super();
        const viewer = this.viewer;
        const czmViewer = this.czmViewer;
        const sscc = viewer.scene.screenSpaceCameraController;

        this._navigationManager = this.dv(new NavigationManager(czmViewer));
        this._envManager = this.dv(new EnvManager(czmViewer));
        this.disposeVar(new ObjResettingWithEvent(this._czmViewer.xbsjUseBackgroundChanged, () => {
            if (!this._czmViewer.xbsjUseBackground) return undefined;
            return new ViewerInstance.BackGroundResetting(this._czmViewer, this._viewer);
        }))
        this.disposeVar(new ObjResettingWithEvent(this._czmViewer.xbsjLocalBoxSourcesChanged, () => {
            if (!this._czmViewer.xbsjLocalBoxSources) return undefined;
            const xbsjLocalBoxSources = getCzmSceneSkyBoxSources(this._czmViewer.xbsjLocalBoxSources);
            if (!xbsjLocalBoxSources) return undefined;
            return new ViewerInstance.LocalSkyBoxResetting(this._czmViewer, this._viewer, xbsjLocalBoxSources);
        }));
        // 屏幕鼠标变化
        {
            this._reu(czmViewer.disabledInputStackChanged, () => {
                const enabledInput = (czmViewer.disabledInputStack === 0);
                // enableInputs这个属性在cesium的flyTo调用以后会被自动解开，特别坑！
                // 所以干脆把所有操作全部禁止掉！
                sscc.enableInputs = enabledInput;
                sscc.enableTranslate = enabledInput;
                sscc.enableZoom = enabledInput;
                sscc.enableRotate = enabledInput;
                sscc.enableTilt = enabledInput;
                sscc.enableLook = enabledInput;
            });
            class Control extends Destroyable {
                constructor() {
                    super();
                    czmViewer.incrementDisabledInputStack();
                    this.dispose(() => czmViewer.decrementDisabledInputStack());
                }
            }
            this.disposeVar(new ObjResettingWithEvent(czmViewer.sceneSsccEnableInputsChanged,
                () => !(czmViewer.sceneSsccEnableInputs ?? true) ? new Control() : undefined));
        }
        // 监听相机变化
        {
            const cameraChanged = this.dv(new CzmCameraChanged(viewer.scene));
            this.d(cameraChanged.changed.don(() => czmViewer.cameraChanged.emit()))
        }

        //ionAccessToken,globeShow,fov
        {
            const update = () => {
                const defaultAccessToken = ESCesiumViewer.latestDefaultAccessToken ?? ESCesiumViewer.currentDefaultAccessToken;
                Cesium.Ion.defaultAccessToken = czmViewer.ionAccessToken === '' ? defaultAccessToken : czmViewer.ionAccessToken;
            };
            update();
            this.dispose(czmViewer.ionAccessTokenChanged.disposableOn(update));
        }
        {
            const { scene } = viewer;
            const update = () => {
                scene.globe.show = czmViewer.globeShow ?? true;
                if ('fov' in scene.camera.frustum) {
                    const aspectRatio = scene.camera.frustum.aspectRatio;
                    if (!aspectRatio) {
                        console.error('aspectRatio is undefined,请检查Cesium的scene.camera.frustum');
                        return;
                    }
                    scene.camera.frustum.fov = Cesium.Math.toRadians(aspectRatio >= 1 ? czmViewer.fov : czmViewer.fov / aspectRatio);
                }
            };
            update();
            const event = this.dv(createNextAnimateFrameEvent(
                czmViewer.globeShowChanged,
                czmViewer.fovChanged,
            ));
            this.d(event.don(update));
        }

        // 同步时间currentTime
        {
            viewer.clockViewModel.currentTime = Cesium.JulianDate.fromDate(new Date(czmViewer.currentTime));

            this.dispose(czmViewer.currentTimeChanged.disposableOn(() => {
                if (czmViewer.currentTime === undefined) return;
                const c = Cesium.JulianDate.fromDate(new Date(czmViewer.currentTime));
                if (Cesium.JulianDate.equals(c, viewer.clockViewModel.currentTime)) return;
                viewer.clockViewModel.currentTime = c;
            }));

            this.dispose(czmSubscribeAndEvaluate(viewer.clockViewModel, 'currentTime', (currentTime) => {
                const t = Cesium.JulianDate.toDate(viewer.clockViewModel.currentTime).getTime();
                if (t === czmViewer.currentTime) return;
                czmViewer.currentTime = t;
            }));
        }

        //获取实时fps
        {
            let lastFpsSampleTime = Cesium.getTimestamp();
            let fpsFrameCount = 0;
            this.d(viewer.scene.preUpdate.addEventListener(() => {
                var time = Cesium.getTimestamp();
                fpsFrameCount++;
                var fpsElapsedTime = time - lastFpsSampleTime;
                if (fpsElapsedTime > 1000) {
                    //@ts-ignore
                    czmViewer._fps.value = fpsFrameCount * 1000 / fpsElapsedTime | 0;
                    lastFpsSampleTime = time;
                    fpsFrameCount = 0;
                }
            }));
        }
        {
            // flashLighting
            const sunLight = new Cesium.SunLight();
            const flashlight = new Cesium.DirectionalLight({
                direction: viewer.scene.camera.directionWC, // Updated every frame
            });

            class Lighting extends Destroyable {
                constructor() {
                    super();
                    const flashLighting = czmViewer.flashLighting ?? false;
                    viewer.scene.light = flashLighting ? flashlight : sunLight;
                    if (flashLighting) {
                        this.dispose(viewer.scene.preRender.addEventListener(function (scene, time) {
                            flashlight.direction = Cesium.Cartesian3.clone(
                                scene.camera.directionWC,
                                scene.light.direction
                            );
                        }));
                    }
                }
            }
            this.disposeVar(new ObjResettingWithEvent(czmViewer.flashLightingChanged, () => new Lighting()));
        }
        {
            const { scene } = viewer;
            const { screenSpaceCameraController: sscc, globe } = scene;
            const reu = (event: Listener<any[]>, update: () => void) => registerEventUpdate(this, event, update);
            const d = ESCesiumViewer.defaults;
            // @ts-ignore
            const reuw = (prop: string, setValue: (v: any) => void) => reu(czmViewer[prop + 'Changed'], () => {
                if (!Reflect.has(czmViewer, prop)) {
                    throw new Error(`!Reflect.has(czmViewer, ${prop})`);
                }
                if (!Reflect.has(d, prop)) {
                    throw new Error(`!Reflect.has(CzmViewer.defaults, ${prop})`);
                }
                // @ts-ignore
                setValue(czmViewer[prop] ?? d[prop]);
            });
            // @ts-ignore
            const reuw2 = (prop: string, setValue: (v: any) => void) => reu(czmViewer[prop + 'Changed'], () => {
                if (!Reflect.has(czmViewer, prop)) {
                    throw new Error(`!Reflect.has(czmViewer, ${prop})`);
                }
                // @ts-ignore
                setValue(czmViewer[prop]);
            });

            reuw('resolutionScale', v => viewer.resolutionScale = v);
            reuw2('shadows', v => viewer.shadows = v);

            reuw('scenePpsfxaaEnabled', v => scene.postProcessStages.fxaa.enabled = v);

            reuw2('scenePpsAmbientOcclusionEnabled', v => scene.postProcessStages.ambientOcclusion.enabled = v);
            reuw2('scenePpsAmbientOcclusionAmbientOcclusionOnly', v => scene.postProcessStages.ambientOcclusion.uniforms.ambientOcclusionOnly = v);
            reuw2('scenePpsAmbientOcclusionIntensity', v => scene.postProcessStages.ambientOcclusion.uniforms.intensity = v);
            reuw2('scenePpsAmbientOcclusionBias', v => scene.postProcessStages.ambientOcclusion.uniforms.bias = v);
            reuw2('scenePpsAmbientOcclusionLengthCap', v => scene.postProcessStages.ambientOcclusion.uniforms.lengthCap = v);
            reuw2('scenePpsAmbientOcclusionStepSize', v => scene.postProcessStages.ambientOcclusion.uniforms.stepSize = v);
            reuw2('scenePpsAmbientOcclusionBlurStepSize', v => scene.postProcessStages.ambientOcclusion.uniforms.blurStepSize = v);

            reuw2('scenePpsBloomEnabled', v => scene.postProcessStages.bloom.enabled = v);
            reuw2('scenePpsBloomGlowOnly', v => scene.postProcessStages.bloom.uniforms.glowOnly = v);
            reuw2('scenePpsBloomContrast', v => scene.postProcessStages.bloom.uniforms.contrast = v);
            reuw2('scenePpsBloomBrightness', v => scene.postProcessStages.bloom.uniforms.brightness = v);
            reuw2('scenePpsBloomDelta', v => scene.postProcessStages.bloom.uniforms.delta = v);
            reuw2('scenePpsBloomSigma', v => scene.postProcessStages.bloom.uniforms.sigma = v);
            reuw2('scenePpsBloomStepSize', v => scene.postProcessStages.bloom.uniforms.stepSize = v);

            // globe
            reuw('globeShow', v => scene.globe.show = v);
            reuw('depthTestAgainstTerrain', v => scene.globe.depthTestAgainstTerrain = v ?? ESCesiumViewer.defaults.depthTestAgainstTerrain);
            reuw('sceneGlobeShadows', v => scene.globe.shadows = v);

            // 这两个是以后1.116版会被删掉的属性
            // @ts-ignore
            reuw2('sceneGlobeTerrainExaggeration', v => scene.globe.terrainExaggeration = v);
            // @ts-ignore
            reuw2('sceneGlobeTerrainExaggerationRelativeHeight', v => scene.globe.terrainExaggerationRelativeHeight = v);
            // 这两个是以后1.116版会新增的属性，用来替代terrainExaggeration和terrainExaggerationRelativeHeight
            // @ts-ignore
            reuw2('sceneGlobeVerticalExaggeration', v => scene.globe.verticalExaggeration = v);
            // @ts-ignore
            reuw2('sceneGlobeVerticalExaggerationRelativeHeight', v => scene.globe.verticalExaggerationRelativeHeight = v);

            reuw2('sceneGlobeBackFaceCulling', v => scene.globe.backFaceCulling = v);
            reuw2('sceneGlobeShowSkirts', v => scene.globe.showSkirts = v);
            reuw2('sceneGlobeShowWaterEffect', v => scene.globe.showWaterEffect = v);
            reuw2('sceneGlobeBaseColor', v => scene.globe.baseColor = toColor(v));
            reuw2('sceneGlobeCartographicLimitRectangle', v => scene.globe.cartographicLimitRectangle = toRectangle(v));
            reuw2('sceneGlobeClippingPlanes', v => {
                // Cesium有一个特别恶习的bug，就是clippingPlanes如果已经有了，再设置就有可能崩溃！所以这里要处理以下，一旦有了，那么就只能更新，不能销毁重建！
                if (!scene.globe.clippingPlanes) {
                    // @ts-ignore
                    scene.globe.clippingPlanes = createClippingPlaneCollection(v ?? { enabled: false });
                    return;
                }
                setClippingPlaneCollection(scene.globe.clippingPlanes, v);
            });
            reuw2('sceneGlobeClippingPolygons', v => {
                // 设置面裁剪，参考sceneGlobeClippingPlanes实现
                // @ts-ignore
                scene.globe.clippingPolygons = v ? createClippingPolygonCollection(v) : undefined;
            })

            reuw('sceneSunGlowFactor', v => scene.sun.glowFactor = v);

            // moon
            reuw('moon', v => scene.moon.show = v);
            reuw('sceneMoonOnlySunLighting', v => scene.moon.onlySunLighting = v);
            reuw('sceneMoonTextureUrl', v => scene.moon.textureUrl = ESSceneObject.context.getStrFromEnv(v));

            // skybox
            // @ts-ignore
            reuw2('sceneSkyBoxShow', v => scene._xbsjOriginSkyBox.show = v);
            // @ts-ignore
            reuw('sceneSkyBoxSources', v => scene._xbsjOriginSkyBox.sources = v && getCzmSceneSkyBoxSources(v));

            // skyAtmosphere
            // @ts-ignore
            reuw2('atmosphere', v => viewer.scene._xbsjOriginSkyAtmosphere.show = v);
            reuw2('sceneBackgroundColor', v => viewer.scene.backgroundColor = toColor(v));

            // fox
            reuw('sceneFogEnabled', v => scene.fog.enabled = v);
            reuw('sceneFogDensity', v => scene.fog.density = v);
            reuw('sceneFogScreenSpaceErrorFactor', v => scene.fog.screenSpaceErrorFactor = v);
            reuw('sceneFogMinimumBrightness', v => scene.fog.minimumBrightness = v);

            // debug
            reuw('sceneDebugShowFramesPerSecond', v => scene.debugShowFramesPerSecond = v);
            reuw('sceneDebugShowCommands', v => scene.debugShowCommands = v);
            reuw('sceneDebugShowFrustums', v => scene.debugShowFrustums = v);
            reuw('sceneDebugShowFrustumPlanes', v => scene.debugShowFrustumPlanes = v);
            reuw('sceneDebugShowDepthFrustum', v => scene.debugShowDepthFrustum = v);

            // underground
            reuw('sceneGlobeUndergroundColor', v => globe.undergroundColor = toColor(v));
            reuw('sceneGlobeUndergroundColorAlphaByDistance', v => globe.undergroundColorAlphaByDistance = toNearFarScalar(v));

            // globeTranslucency
            reuw('sceneGlobeTranslucencyEnabled', v => globe.translucency.enabled = v);
            reuw('sceneGlobeTranslucencyBackFaceAlpha', v => globe.translucency.backFaceAlpha = v);
            reuw('sceneGlobeTranslucencyBackFaceAlphaByDistance', v => globe.translucency.backFaceAlphaByDistance = v && toNearFarScalar(v));
            reuw('sceneGlobeTranslucencyFrontFaceAlpha', v => globe.translucency.frontFaceAlpha = v);
            reuw2('sceneGlobeTranslucencyFrontFaceAlphaByDistance', v => globe.translucency.frontFaceAlphaByDistance = v && toNearFarScalar(v));
            reuw('sceneGlobeTranslucencyRectangle', v => globe.translucency.rectangle = toRectangle(v));

            // splitPosition
            reuw('sceneSplitPosition', v => scene.splitPosition = clamp(v, 0, 1));

            reuw('sceneSsccEnableCollisionDetection', v => scene.screenSpaceCameraController.enableCollisionDetection = v);
            // @ts-ignore
            reuw('sceneSsccZoomFactor', v => scene.screenSpaceCameraController._zoomFactor = v);

            //czm 地形 调试面板
            {
                // showCesiumInspector
                const update = () => {
                    // @ts-ignore
                    if (!viewer.cesiumInspector) return;
                    // @ts-ignore
                    viewer.cesiumInspector.container.style.display = (czmViewer.showCesiumInspector ?? false) ? 'block' : 'none';
                };
                update();
                this.d(czmViewer.showCesiumInspectorChanged.don(update));
            }
            reuw('cesiumInspectorWireframe', v => {
                if (!('cesiumInspector' in viewer)) return;
                // @ts-ignore
                viewer.cesiumInspector.viewModel.wireframe = v;
            });

            //czm 3DTileset 调试面板
            {
                // showCesium3DTilesInspector
                const update = () => {
                    // @ts-ignore
                    if (!viewer.cesium3DTilesInspector) return;
                    // @ts-ignore
                    viewer.cesium3DTilesInspector.container.style.display = (czmViewer.showCesium3DTilesInspector ?? false) ? 'block' : 'none';
                };
                update();
                this.dispose(czmViewer.showCesium3DTilesInspectorChanged.disposableOn(update));
            }
        }
    }
    private _reu = (event: Listener<any[]>, update: () => void) => registerEventUpdate(this, event, update);
}
