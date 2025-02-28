import { GroupProperty, JsonProperty } from "../../../ESJTypes";
import { bind, Event, extendClassProps, react, reactJsonWithUndefined, track, UniteChanged } from "xbsj-base";
import { ES3DTileset } from "../ES3DTileset";
import { ESDSFeature } from "./ESDSFeature";
import { _commitEditings, _getFeatureProperty, _getLayerConfig, _getport, _saveLayerConfig, CommitItemType, FeatureItem, LayerType } from "./types";
export class ESRtsTileset extends ES3DTileset {
    static override readonly type = this.register('ESRtsTileset', this, { chsName: '实时3DTileset图层', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "实时3DTileset图层" });
    override get typeName() { return 'ESRtsTileset'; }
    override get defaultProps() { return ESRtsTileset.createDefaultProps(); }

    private _es3DTileset = this.dv(new ES3DTileset());
    get es3DTileset() { return this._es3DTileset; }

    private _featureMap = new Map<string, FeatureItem>();
    get featureMap() { return this._featureMap };
    getEditing() { return [...this.featureMap.values()] };

    getFeatureItem(id: string) { return this._featureMap.get(id) };

    /**
     * 获取已创建的或者创建一个返回
     * @param featureId 要素id
     * @returns FeatureItem
     */
    async _getCurrentFeatureItem(featureId: string) {
        let featureItem = this.getFeatureItem(featureId);
        if (!featureItem) {
            featureItem = await this._createESDSFeatureItem(featureId);
        }
        this.currentESDSFeature = featureItem.dsFeature;
        return featureItem;
    }

    // 设置当前选中的要素
    private _currentESDSFeature = this.dv(react<ESDSFeature | undefined>(undefined));
    get currentESDSFeature() { return this._currentESDSFeature.value; }
    get currentESDSFeatureChanged() { return this._currentESDSFeature.changed; }
    set currentESDSFeature(value: ESDSFeature | undefined) { this._currentESDSFeature.value = value; }
    setCurrentESDSFeature(value: ESDSFeature) {
        if (this._currentESDSFeature.value === value) return;
        this._currentESDSFeature.value = value;
    }

    //获取图层配置
    async getLayerConfig() {
        const layerConfig = await _getLayerConfig(this.baseUrl, this.tileServiceName);
        this.layerConfig = layerConfig;
        return layerConfig;
    }
    //保存图层配置
    async saveLayerConfig() {
        const res = await _saveLayerConfig(this.baseUrl, this.tileServiceName, this.layerConfig);
        return res;
    }

    // 创建ESDSFeature对象
    async _createESDSFeatureItem(id: string) {
        if (!this.url || typeof this.url !== 'string') {
            throw new Error('_createESDSFeatureItem: url is not defined or not a string');
        }
        //创建要素
        const dsFeature = new ESDSFeature(this, id);
        //设置为当前选中的要素
        this.setCurrentESDSFeature(dsFeature);
        const properties = await _getFeatureProperty(this.baseUrl, this.tileServiceName, id);
        //存到featureMap
        const featureItem = { id, removed: false, dsFeature, datasetName: properties?.datasetName, properties } as FeatureItem;
        this._featureMap.set(id, featureItem);
        return featureItem;
    }

    // 只显示当前Feature,show属性和这个函数会互相影响
    async showOnlyFeature(id: string) {
        const featureItem = await this._getCurrentFeatureItem(id);
        this.es3DTileset.show = false;
        this.getEditing().forEach(e => {
            if (e.id === featureItem.id) {
                e.dsFeature.inner3DTileset.show = true;
            } else {
                e.dsFeature.inner3DTileset.show = false
            }
        });
    }

    // 查找要素ID所在的数据集
    async findDatasetById(featureId: string) {
        const featureItem = await this._getCurrentFeatureItem(featureId);
        const { datasetName } = featureItem;
        return datasetName;
    }

    // 获取要素属性
    async getFeatureProperty(featureId: string) {
        const featureItem = await this._getCurrentFeatureItem(featureId);
        const { properties } = featureItem;
        return properties;
    }

    // 飞行定位
    async flyToFeature(id: string) {
        const featureItem = await this._getCurrentFeatureItem(id);
        featureItem.dsFeature.inner3DTileset.flyTo();
    }

    // 实现类内实现高亮和移除高亮 czm和ue高亮逻辑不一样，需要单独实现
    private _highlightInner3DtilesetEvent = this.dv(new Event<[sceneObject: ES3DTileset]>());
    get highlightInner3DtilesetEvent() { return this._highlightInner3DtilesetEvent; }
    _highlightInner3Dtileset(sceneObject: ES3DTileset) { this._highlightInner3DtilesetEvent.emit(sceneObject); }
    async highlightDSFeature(id: string) {
        const featureItem = await this._getCurrentFeatureItem(id);
        const sceneObject = featureItem.dsFeature.inner3DTileset;
        this._highlightInner3Dtileset(sceneObject);
    };


    private _removeHighlightInner3DtilesetEvent = this.dv(new Event<[sceneObject: ES3DTileset]>());
    get removeHighlightInner3DtilesetEvent() { return this._removeHighlightInner3DtilesetEvent; }
    _removeHighlightInner3Dtileset(sceneObject: ES3DTileset) { this._removeHighlightInner3DtilesetEvent.emit(sceneObject); }
    async reamoveHighlightDSFeature(id: string) {
        const featureItem = await this._getCurrentFeatureItem(id);
        const sceneObject = featureItem.dsFeature.inner3DTileset;
        this._removeHighlightInner3Dtileset(sceneObject);
    };


    async pickFeature(viewer: any, screenPosition: [number, number]) {
        const result = await viewer.pick(screenPosition);
        const sceneObject = result.sceneObject;
        if (!sceneObject) return;
        if (sceneObject.id !== this.id) return;
        // 全局ESDSTileset对象要素ID
        let id = result?.childPickedInfo?.tilesetPickInfo?.id;
        // 第一次点击
        if (id) {
            return {
                featureId: result?.childPickedInfo?.tilesetPickInfo?.id,
                pickInnerFields: result?.childPickedInfo?.tilesetPickInfo
            }
        }
        // 第二次拾取 
        else {
            return {
                featureId: result?.childPickedInfo?.sceneObject?.id,
                pickInnerFields: result?.childPickedInfo?.childPickedInfo?.tilesetPickInfo
            }
        }
    };

    // 平移编辑
    async moveFeature(id: string) {
        this.getEditing().forEach(e => {
            e.dsFeature.inner3DTileset.editing = false;
            e.dsFeature.inner3DTileset.rotationEditing = false;
        })
        const featureItem = await this._getCurrentFeatureItem(id);
        const sceneObject = featureItem.dsFeature.inner3DTileset;
        sceneObject.editing = true;
    };
    // 旋转编辑
    async rotateFeature(id: string) {
        this.getEditing().forEach(e => {
            e.dsFeature.inner3DTileset.editing = false;
            e.dsFeature.inner3DTileset.rotationEditing = false;
        });

        const featureItem = await this._getCurrentFeatureItem(id);
        const sceneObject = featureItem.dsFeature.inner3DTileset;
        sceneObject.rotationEditing = true;
    };
    // 设置offset 
    async setFeatureOffset(id: string, offset: [number, number, number]) {
        const featureItem = await this._getCurrentFeatureItem(id);
        const sceneObject = featureItem.dsFeature.inner3DTileset;
        sceneObject.offset = offset;
    };
    // 设置hpr 
    async setFeatureHpr(id: string, hpr: [number, number, number]) {
        const featureItem = await this._getCurrentFeatureItem(id);
        const sceneObject = featureItem.dsFeature.inner3DTileset;
        sceneObject.rotation = hpr;
    };
    // 设置scale
    async setFeatureScale(id: string, scale: number) {
        const featureItem = await this._getCurrentFeatureItem(id);
        const sceneObject = featureItem.dsFeature.inner3DTileset;
        console.log('setFeatureScale 暂未实现');
        // sceneObject.scale = scale;
    };

    /**
    * 重置单个编辑操作，不移除Map中的FeatureItem,只恢复dsFeature到初始位置;
    */
    undoEditing(id: string) {
        const dsFeature = this.getFeatureItem(id)?.dsFeature;
        if (!dsFeature) return;
        const sceneObject = dsFeature.inner3DTileset;
        sceneObject.offset = [0, 0, 0];
        sceneObject.rotation = [0, 0, 0];
        sceneObject.show = true;
    }
    /**
     * 模拟移除feature show = false
     */
    async removeFeature(id: string) {
        const featureItem = await this._getCurrentFeatureItem(id);
        const sceneObject = featureItem.dsFeature.inner3DTileset;
        sceneObject.show = false;//模拟移除
        sceneObject.editing = false;
        sceneObject.rotationEditing = false;
        featureItem.removed = true;//标记移除
        this.currentESDSFeature = undefined;
    };
    /**
     * 模拟恢复feature show=true
     */
    async resetFeature(id: string) {
        const featureItem = this.getFeatureItem(id);
        if (!featureItem) return;
        const sceneObject = featureItem.dsFeature.inner3DTileset;
        sceneObject.show = true;
        featureItem.removed = false;
    };

    /**
     * 撤销单个编辑操作,移除Map中的FeatureItem,恢复原始tileset中的tile块;
     */
    cancelFeature(id: string) {
        if (this._featureMap.has(id)) {
            this.reamoveHighlightDSFeature(id);
            const sceneObject = this.getFeatureItem(id)?.dsFeature as ESDSFeature;
            if (!sceneObject) {
                throw new Error('ESDSFeature is null');
            }
            sceneObject.destroy();
            this._featureMap.delete(id);
            if (this.currentESDSFeature === sceneObject) {
                this.currentESDSFeature = undefined;
            }
        }
    };

    /**
     * 撤销所有编辑操作,移除Map中的所有FeatureItem
     */
    clearEditing() {
        for (let [_, item] of this.featureMap) {
            this.cancelFeature(item.id);
        }
        this.featureMap.clear()
        this.currentESDSFeature = undefined
    };

    //提交所有编辑，清空本地所有编辑记录，刷新tileset
    async commitEditings() {
        const features: CommitItemType[] = this.getEditing().map((item) => {
            const inner3DTileset = item.dsFeature.inner3DTileset;
            const { rotation, offset = [0, 0, 0] } = inner3DTileset;
            return {
                datasetName: item.datasetName,
                featureId: item.id,
                removed: item.removed,
                x: offset[0],
                y: offset[1],
                z: offset[2],
                h: rotation[0],
                p: rotation[1],
                r: rotation[2],
                s: 1,//TODO: 缩放
            };
        });
        const res = await _commitEditings(this.baseUrl, { features });
        if (res) {
            this.clearEditing();
            await this.refresh();
        }
        return res;
    }


    // 设置当前选中的要素
    private _tilesetServePort = this.dv(react<string>(""));
    get tilesetServePort() { return this._tilesetServePort.value; }
    get tilesetServePortChanged() { return this._tilesetServePort.changed; }
    set tilesetServePort(value: string) { this._tilesetServePort.value = value; }
    async getport() {
        const port = await _getport(this.url as string);
        if (port) {
            this.tilesetServePort = port;
            return port;
        } else {
            throw new Error('服务地址port获取失败!');
        }
    }

    async refresh() {
        const ip = this.tileServiceIp;//http://localhost
        const port = await this.getport();//9014
        await this.getLayerConfig();
        const time = +new Date();
        this._es3DTileset.url = `${ip}:${port}/tiles/tileset.json` + `?t=${time}`;
        console.log('3dtileset url:', this._es3DTileset.url);
    }

    /**
     * 获取当前服务的ip和port http://localhost:9009/ts/info/ts01
     * 从this.url中获取http://localhost:9009 ,作为请求地址
     */
    get baseUrl() {
        if (this.url && typeof this.url === 'string') {
            const uri = this.url.match(/^(https?:\/\/[^\/]+)/)?.[1];
            if (!uri) {
                throw new Error('服务地址不合法,baseUrl is not found! 示例: http://localhost:9009/ts/info/ts01');
            }
            return uri;
        } else {
            throw new Error('服务地址不合法,baseUrl is not found! 示例: http://localhost:9009/ts/info/ts01');
        }
    }
    /**
     * 图层服务名称 http://localhost:9009/ts/info/ts01
     * 从this.url中获取sv1
     */
    get tileServiceName() {
        if (this.url && typeof this.url === 'string') {
            // const tileServiceName = this.url.match(/\/tileservice\/service\/info\/(.*)/)?.[1];
            const tileServiceName = this.url.match(/\/ts\/info\/(.*)/)?.[1];
            if (!tileServiceName) {
                throw new Error('服务地址不合法,tileServiceName is not found! 示例: http://localhost:9009/ts/info/ts01');
            }
            return tileServiceName
        } else {
            throw new Error('服务地址不合法,tileServiceName is not found! 示例: http://localhost:9009/ts/info/ts01');
        }
    }
    /**
   * 获取当前服务的ip http://localhost:9009/ts/info/ts01
   * 从this.url中获取http://localhost
   */
    get tileServiceIp() {
        if (this.url && typeof this.url === 'string') {
            const ip = this.url.match(/^(https?:\/\/[^:]+)/)?.[1];
            if (!ip) {
                throw new Error('服务地址不合法,ip is not found! 示例: http://localhost:9009/ts/info/ts01');
            }
            return ip
        } else {
            throw new Error('服务地址不合法,ip is not found! 示例: http://localhost:9009/ts/info/ts01');
        }
    }

    constructor(id?: string) {
        super(id);

        {
            const loadTileset = async () => {
                if (typeof this.url !== 'string') {
                    console.error('服务地址不合法, Init Error! 示例: http://localhost:9009/ts/info/ts01');
                    return;
                }
                if (!this.url) {
                    this.clearEditing()
                    this._es3DTileset.url = ""
                } else {
                    this.refresh();
                }
            }
            // loadTileset();
            this.d(this.urlChanged.don(() => { loadTileset() }));
        }

        //属性同步
        {
            this.d(this.components.disposableAdd(this._es3DTileset));
            const tileset = this._es3DTileset;
            this.d(track([tileset, 'allowPicking'], [this, 'allowPicking']));
            this.d(track([tileset, 'collision'], [this, 'collision']));
            this.d(bind([tileset, 'flyToParam'], [this, 'flyToParam']));
            this.d(bind([tileset, 'flyToParam'], [this, 'flyToParam']));
            this.d(bind([tileset, 'editing'], [this, 'editing']));
            this.d(bind([tileset, 'rotationEditing'], [this, 'rotationEditing']));

            //此处url为服务地址，由服务端返回
            // this.d(track([tileset, 'url'], [this, 'url']));
            this.d(track([tileset, 'actorTag'], [this, 'actorTag']));
            this.d(track([tileset, 'materialMode'], [this, 'materialMode']));
            this.d(track([tileset, 'highlight'], [this, 'highlight']));
            this.d(track([tileset, 'maximumScreenSpaceError'], [this, 'maximumScreenSpaceError']));
            this.d(track([tileset, 'highlightID'], [this, 'highlightID']));
            this.d(track([tileset, 'highlightColor'], [this, 'highlightColor']));

            this.d(bind([tileset, 'offset'], [this, 'offset']));
            this.d(bind([tileset, 'rotation'], [this, 'rotation']));

            this.d(track([tileset, 'czmImageBasedLightingFactor'], [this, 'czmImageBasedLightingFactor']));
            this.d(track([tileset, 'czmLuminanceAtZenith'], [this, 'czmLuminanceAtZenith']));
            this.d(track([tileset, 'czmMaximumMemoryUsage'], [this, 'czmMaximumMemoryUsage']));
            this.d(track([tileset, 'czmClassificationType'], [this, 'czmClassificationType']));
            this.d(track([tileset, 'czmStyleJson'], [this, 'czmStyleJson']));
            this.d(track([tileset, 'czmBackFaceCulling'], [this, 'czmBackFaceCulling']));
            this.d(track([tileset, 'czmDebugShowBoundingVolume'], [this, 'czmDebugShowBoundingVolume']));
            this.d(track([tileset, 'czmDebugShowContentBoundingVolume'], [this, 'czmDebugShowContentBoundingVolume']));
            this.d(track([tileset, 'czmSkipLevelOfDetail'], [this, 'czmSkipLevelOfDetail']));

            // this.d(track([tileset, 'czmColorBlendMode'], [this, 'czmColorBlendMode']));
            // this.d(track([tileset, 'czmCacheBytes'], [this, 'czmCacheBytes']));
            // this.d(track([tileset, 'czmMaximumCacheOverflowBytes'], [this, 'czmMaximumCacheOverflowBytes']));

            this.d(track([tileset, 'colorBlendMode'], [this, 'colorBlendMode']));
            this.d(track([tileset, 'cacheBytes'], [this, 'cacheBytes']));

            this.d(track([tileset, 'clippingPlaneEnabled'], [this, 'clippingPlaneEnabled']));
            this.d(track([tileset, 'unionClippingRegions'], [this, 'unionClippingRegions']));
            this.d(track([tileset, 'clippingPlaneEdgeColor'], [this, 'clippingPlaneEdgeColor']));
            this.d(track([tileset, 'clippingPlaneEdgeWidth'], [this, 'clippingPlaneEdgeWidth']));
            this.d(track([tileset, 'materialParams'], [this, 'materialParams']));

            this.d(bind([tileset, 'supportEdit'], [this, 'supportEdit']));
            this.d(bind([tileset, 'clippingPlanesId'], [this, 'clippingPlanesId']));
            this.d(bind([tileset, 'clippingPlaneIds'], [this, 'clippingPlaneIds']));
            this.d(bind([tileset, 'flattenedPlaneId'], [this, 'flattenedPlaneId']));
            this.d(bind([tileset, 'flattenedPlaneEnabled'], [this, 'flattenedPlaneEnabled']));
            this.d(bind([tileset, 'clippingPlaneId'], [this, 'clippingPlaneId']));
            this.d(bind([tileset, 'excavateId'], [this, 'excavateId']));
        }
        //函数同步
        {
            const es3DTileset = this._es3DTileset;
            this.d(this.refreshTilesetEvent.don(() => { es3DTileset.refreshTileset(); }));
            this.d(this.highlightFeatureEvent.don((...arg) => { es3DTileset.highlightFeature(...arg); }));
            this.d(this.highlightFeatureAndFlyToEvent.don((...arg) => { es3DTileset.highlightFeatureAndFlyTo(...arg); }));
            this.d(this.setFeatureColorEvent.don((...arg) => { es3DTileset.setFeatureColor(...arg); }));
            this.d(this.setFeatureVisableEvent.don((...arg) => { es3DTileset.setFeatureVisable(...arg); }));
            this.d(this.resetFeatureStyleEvent.don((...arg) => { es3DTileset.resetFeatureStyle(...arg); }));
            this.d(this.flyInEvent.don((...arg) => { es3DTileset.flyIn(arg[0]); }));
            this.d(this.flyToEvent.don((...arg) => { es3DTileset.flyTo(arg[0]); }));
            this.d(this.calcFlyToParamEvent.don((...arg) => { es3DTileset.calcFlyToParam(...arg); }));
            this.d(this.calcFlyInParamEvent.don((...arg) => { es3DTileset.calcFlyInParam(...arg); }));
        }
        //事件同步
        {
            const es3DTileset = this._es3DTileset;
            this.d(es3DTileset.tilesetReady.don((tileset) => { this.tilesetReady.emit(tileset); }));

            this.d(es3DTileset.pickedEvent.don((pickedInfo) => {
                this.pickedEvent.emit(pickedInfo);
            }));
        }
        //显隐控制
        {
            const updateShow = () => {
                this.es3DTileset.show = this.show;
                this.getEditing().forEach(e => { e.dsFeature.inner3DTileset.show = this.show; });
            }
            updateShow();
            this.d(this.showChanged.don(() => { updateShow() }));
        }

    }

    static override defaults = {
        ...ES3DTileset.defaults,
        layerConfig: {} as LayerType
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESRtsTileset', 'ESRtsTileset', [
                new JsonProperty('图层配置', '图层配置(layerConfig)', true, false, [this, 'layerConfig'], {}),
            ]),
        ]
    }
}

export namespace ESRtsTileset {
    export const createDefaultProps = () => ({
        layerConfig: reactJsonWithUndefined<LayerType>(undefined),
        ...ES3DTileset.createDefaultProps(),
    });
}
extendClassProps(ESRtsTileset.prototype, ESRtsTileset.createDefaultProps);
export interface ESRtsTileset extends UniteChanged<ReturnType<typeof ESRtsTileset.createDefaultProps>> { }





