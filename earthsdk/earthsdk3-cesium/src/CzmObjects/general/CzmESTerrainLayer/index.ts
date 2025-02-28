import { ESSceneObject, ESTerrainLayer } from "earthsdk3";
import { CzmESVisualObject } from "../../base";
import { ESCesiumViewer, getViewerExtensions } from "../../../ESCesiumViewer";
import * as Cesium from 'cesium'
import { createProcessingFromAsyncFunc, react, Event } from "xbsj-base";
import { createTerrainProviderFromJson } from "./terrainProviderUtils";
import { rectangleIsGlobal, toRectangle } from "../../../utils";
import { CzmTerrainProviderJsonType } from "../../../ESJTypesCzm/czmObject/CzmTerrainProviderJsonType";
export class CzmESTerrainLayer extends CzmESVisualObject<ESTerrainLayer> {
    static readonly type = this.register('ESCesiumViewer', ESTerrainLayer.type, this);

    private _provider = this.disposeVar(react<Cesium.TerrainProvider | undefined>(undefined));
    get provider() { return this._provider.value; }
    set provider(value: Cesium.TerrainProvider | undefined) { this._provider.value = value; }
    get providerChanged() { return this._provider.changed; }

    private _czmProvider = this.dv(react<CzmTerrainProviderJsonType | undefined>(undefined));
    get czmProvider() { return this._czmProvider.value; }
    get czmProviderChanged() { return this._czmProvider.changed; }

    constructor(sceneObject: ESTerrainLayer, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) return;

        const viewerExtensions = getViewerExtensions(viewer);
        if (!viewerExtensions) return;
        const { terrainManager } = viewerExtensions;
        const resetTerrainProvider = () => {
            if (this.provider) {
                terrainManager.delete(this);
                this.provider = undefined;
            }
        };
        this.dispose(resetTerrainProvider);

        let recreating = false; // 是否正在创建
        const recreateAndUpdateTerrainProviderProcessing = this.disposeVar(createProcessingFromAsyncFunc<void, [recreated: boolean]>(async (cancelsManager, recreated) => {
            if (recreated) {
                recreating = true;
                resetTerrainProvider();
                if (!this.czmProvider) return;
                this.provider = await cancelsManager.promise(createTerrainProviderFromJson(this.czmProvider, czmViewer));
                //@ts-ignore
                this.provider.ESSceneObjectID = sceneObject.id
                terrainManager.add(this);
                recreating = false;
            }
        }));
        recreateAndUpdateTerrainProviderProcessing.restart(undefined, true);

        const createProviderEvent = this.disposeVar(new Event());

        this.dispose(this.czmProviderChanged.disposableOn(() => {
            createProviderEvent.emit();
        }));

        this.dispose(ESSceneObject.context.environmentVariablesChanged.disposableOn(() => {
            createProviderEvent.emit();
        }));

        this.dispose(createProviderEvent.disposableOn(() => {
            recreateAndUpdateTerrainProviderProcessing.restart(undefined, true);
        }));
        this.dispose(sceneObject.showChanged.disposableOn(() => {
            // 如果正在创建，就不要更新，否则创建过程取消了，地形都创建不出来！
            if (recreating) return;
            recreateAndUpdateTerrainProviderProcessing.restart(undefined, false);
        }));
        this.dispose(sceneObject.flyToEvent.disposableOn((duration, id) => this.flyTo(duration, id)));

        {
            // url解析
            const urlReact = this.dv(ESSceneObject.context.createEnvStrReact([sceneObject, 'url'], ESTerrainLayer.defaults.url));
            const update = () => {
                if (!urlReact.value) return;
                let url = urlReact.value;
                if (url.includes(ESTerrainLayer.defaults.url)) {
                    const params = getParamsFromUrl(url);
                    //判断是否是平球地形
                    if (params && params.h) {
                        const h = Number(params.h);
                        const defaultEllipsoid = {
                            x: 6378137,
                            y: 6378137,
                            z: 6356752.314245179
                        }
                        this._czmProvider.value = {
                            type: "EllipsoidTerrainProvider",
                            ellipsoid: [defaultEllipsoid.x + h, defaultEllipsoid.y + h, defaultEllipsoid.z + h]
                        } as CzmTerrainProviderJsonType
                    } else {
                        this._czmProvider.value = {
                            type: "CesiumTerrainProvider",
                            url: '',
                            requestMetadata: true,
                            requestWaterMask: true,
                            requestVertexNormals: true
                        } as CzmTerrainProviderJsonType
                    }
                } else {
                    if (url.includes('/layer.json')) {
                        url = url.split('/layer.json').join("");
                    }
                    this._czmProvider.value = {
                        type: 'CesiumTerrainProvider',
                        url,
                        requestMetadata: true,
                        requestWaterMask: true,
                        requestVertexNormals: true
                    } as CzmTerrainProviderJsonType
                }
            }
            update();
            this.dispose(urlReact.changed.disposableOn(update));
        }
    }
    override flyTo(duration: number | undefined, id: number) {
        const { czmViewer, sceneObject } = this;
        if (!czmViewer.actived) return false;
        const { viewer } = czmViewer;
        if (!viewer) return false;
        viewer.camera.flyTo({
            destination: sceneObject.rectangle && !rectangleIsGlobal(sceneObject.rectangle) ? toRectangle(sceneObject.rectangle) : Cesium.Camera.DEFAULT_VIEW_RECTANGLE,
            duration,//单位是秒
        });
        return true;
    }
    override flyIn(duration: number | undefined, id: number) {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            return this.flyTo(duration, id);
        }
    }
}
// 获取平球地形高度
function getParamsFromUrl(url: string) {
    const index = url.indexOf("?");
    const b = url.slice(index + 1);
    const c = b.split("&");
    const data: { [k: string]: any } = {};
    for (var i = 0; i < c.length; i++) {
        var d = c[i].split("=");
        data[d[0]] = d[1];
    }
    return data;
}
