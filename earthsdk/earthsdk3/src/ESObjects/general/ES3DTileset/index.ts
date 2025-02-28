
import {
    BooleanProperty, ColorProperty, EnumProperty, ESJColor, ESJResource, ESJsonObjectType, ESJVector2D, ESJVector3D, ESJVector4D, FunctionProperty,
    GroupProperty, JsonProperty, Number2Property, Number3Property, NumberProperty,
    NumberSliderProperty, PositionProperty, RotationProperty, StringProperty
} from "@sdkSrc/ESJTypes";
import { ESVisualObject } from "@sdkSrc/ESObjects";
import { Event, extendClassProps, JsonValue, react, reactArray, reactArrayWithUndefined, reactJson, UniteChanged } from "xbsj-base";
import { ESJFeatureStyleType, FeatureColorJsonType, FeatureVisableJsonType } from "./type";
/**
 * https://www.wolai.com/earthsdk/scb9Mm6X1zR4GypJQreRvK
 */
export class ES3DTileset extends ESVisualObject {
    static readonly type = this.register('ES3DTileset', this, { chsName: '3DTileset', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "3DTileset" });
    get typeName() { return 'ES3DTileset'; }
    override get defaultProps() { return ES3DTileset.createDefaultProps(); }

    private _editing = this.dv(react(false));
    get editing() { return this._editing.value; }
    set editing(value: boolean) { this._editing.value = value; }
    get editingChanged() { return this._editing.changed; }

    private _rotationEditing = this.dv(react(false));
    get rotationEditing() { return this._rotationEditing.value; }
    set rotationEditing(value: boolean) { this._rotationEditing.value = value; }
    get rotationEditingChanged() { return this._rotationEditing.changed; }

    private _refreshTilesetEvent = this.dv(new Event());
    get refreshTilesetEvent() { return this._refreshTilesetEvent; }
    refreshTileset() { this._refreshTilesetEvent.emit(); }

    private _tilesetReadyEvent = this.dv(new Event<[tileset: any]>());
    get tilesetReady() { return this._tilesetReadyEvent; }

    private _supportEdit = this.dv(react<boolean>(true));
    get supportEdit() { return this._supportEdit.value; }
    set supportEdit(value: boolean) { this._supportEdit.value = value; }
    get supportEditChanged() { return this._supportEdit.changed; }

    private _highlightFeatureEvent = this.dv(new Event<[id: string | number, color?: string]>());
    get highlightFeatureEvent() { return this._highlightFeatureEvent; }
    highlightFeature(id: string | number, color?: string) { this._highlightFeatureEvent.emit(id, color); }

    private _highlightFeatureAndFlyToEvent = this.dv(new Event<[id: string | number, sphere: ESJVector4D, color?: string, duration?: number]>());
    get highlightFeatureAndFlyToEvent() { return this._highlightFeatureAndFlyToEvent; }
    /**
     * @param id 节点id
     * @param sphere 笛卡尔坐标系[x, y, z, radius]
     * @param color 高亮颜色,不传就是默认颜色不高亮, 参数形式如 `rgba(255,0,0,1)`
     * @param duration 飞行时间，默认1s
     */
    highlightFeatureAndFlyTo(id: string | number, sphere: ESJVector4D, color?: string, duration?: number) { this._highlightFeatureAndFlyToEvent.emit(id, sphere, color, duration); }

    private _getFeatureTableEvent = this.dv(new Event());
    public _featureTableResultEvent = this.dv(new Event<[{ key: string, type: string | number }[] | undefined]>());
    get getFeatureTableEvent() { return this._getFeatureTableEvent; }
    getFeatureTable() {
        return Promise.race([
            new Promise<{ key: string, type: string | number }[] | undefined>(resolve => {
                const cleanup = this.d(this._featureTableResultEvent.donce(resolve));
                this._getFeatureTableEvent.emit();
                setTimeout(() => {
                    cleanup();
                    resolve(undefined);
                }, 2000);
            })
        ]);
    }

    private _setFeatureStyleEvent = this.dv(new Event<[ESJFeatureStyleType]>());
    get setFeatureStyleEvent() { return this._setFeatureStyleEvent; }
    /**
     * 根据条件设置style
     * @param json
     * @description json格式如下：
     * @param op:string类型，操作符(目前字符串属性支持：==  !=  contain empty; 数字属性支持：== != > >= < <=）
     * @example
     * [
         {
           condition:[{
                field:"id",
                op:"!=",
                value:"ss"
            },{
                field:"name",
                op:"contain",
                value:"杨"
            }],
            color:[1,0,0,1],
            show:true
         },
         {
           condition:{
                field:"height",
                op:"==",
                value:20
            },
            color:[1,1,0,1],
            show:false
         }
       ]
     */
    setFeatureStyle(json: ESJFeatureStyleType) { this._setFeatureStyleEvent.emit(json); }
    /**
     * 根据属性设置颜色
     */
    private _setFeatureColorEvent = this.dv(new Event<[string, FeatureColorJsonType[]]>());
    get setFeatureColorEvent() { return this._setFeatureColorEvent; }
    /**
     * 基于提供的条件为特定特征属性设置颜色。
     * @param featureName - 要修改的特征属性的名称。
     * @param json - 要素的条件和颜色。
     * 如果提供的是字符串，它应该是有效的 JSON 字符串。
     * 如果提供的是数组，它应该是 FeatureColorJsonType 对象的数组。
     * @remarks
     * 条件可以基于要素的值、最小值或最大值。
     * 颜色为0~1的映射数组，例如[1,0,0,1] 表示红色。
     * @example
     * ```typescript
     * const featureName = "height";
     * const conditions: FeatureColorJsonType[] = [
     *   { minValue: 100000, color: [1,0,0,1] }, 
     *   { maxValue: 500000, color: [1,1,0,1] }, 
     * ];
     * setFeatureColor(featureName, conditions);
     * ```
     * @throws 如果提供的条件无效，将引发错误。
     */
    setFeatureColor(featureName: string, json: string | FeatureColorJsonType[]) {
        this._setFeatureColorEvent.emit(featureName, (typeof json === 'string') ? JSON.parse(json) : json);
    }

    /**
     * 根据属性控制show
     */
    private _setFeatureVisableEvent = this.dv(new Event<[string, FeatureVisableJsonType[]]>());
    get setFeatureVisableEvent() { return this._setFeatureVisableEvent; }
    /**
     * 根据提供的条件设置要素的可见性。
     *
     * @param featureName - 要修改的属性名称。
     * @param json - 要素的条件和可见性。
     * 如果提供的是字符串，它应该是有效的 JSON 字符串。
     * 如果提供的是数组，它应该是 FeatureVisableJsonType 对象的数组。
     *
     * @remarks
     * 条件可以基于要素的值、最小值或最大值。
     * 可见性可以设置为 true 或 false。
     *
     * @example
     * ```typescript
     * const featureName = "height";
     * const conditions: FeatureVisableJsonType[] = [
     *   { value: 1000000, visable: false },
     *   { minValue: 5000000, visable: true },
     *   { maxValue: 10000000, visable: false },
     * ];
     * setFeatureVisable(featureName, conditions);
     * ```
     * @throws 如果提供的条件无效，将引发错误。
     */
    setFeatureVisable(featureName: string, json: string | FeatureVisableJsonType[]) {
        this._setFeatureVisableEvent.emit(featureName, (typeof json === 'string') ? JSON.parse(json) : json);
    }

    /**
     * 还原样式设置
     */
    private _resetFeatureStyleEvent = this.dv(new Event());
    get resetFeatureStyleEvent() { return this._resetFeatureStyleEvent; }
    resetFeatureStyle() { this._resetFeatureStyleEvent.emit(); }

    private _clippingPlanesId = this.dv(react(""));
    get clippingPlanesId() { return this._clippingPlanesId.value; }
    set clippingPlanesId(value: string) { this._clippingPlanesId.value = value; }
    get clippingPlanesIdChanged() { return this._clippingPlanesId.changed; }

    /**
     * 面裁切 ESClippingPlane
     */
    private _clippingPlaneIds = this.dv(react<string[]>([]));
    get clippingPlaneIds() { return this._clippingPlaneIds.value; }
    set clippingPlaneIds(value: string[]) { this._clippingPlaneIds.value = value; }
    get clippingPlaneIdsChanged() { return this._clippingPlaneIds.changed; }

    private _flattenedPlaneId = this.dv(react(""));
    get flattenedPlaneId() { return this._flattenedPlaneId.value; }
    set flattenedPlaneId(value: string) { this._flattenedPlaneId.value = value; }
    get flattenedPlaneIdChanged() { return this._flattenedPlaneId.changed; }

    private _flattenedPlaneEnabled = this.dv(react(false));
    get flattenedPlaneEnabled() { return this._flattenedPlaneEnabled.value; }
    set flattenedPlaneEnabled(value: boolean) { this._flattenedPlaneEnabled.value = value; }
    get flattenedPlaneEnabledChanged() { return this._flattenedPlaneEnabled.changed; }

    /**
     * 体裁切 ESBoxClippingPlanes + 挖坑
     */
    private _clippingPlaneId = this.dv(react(""));
    get clippingPlaneId() { return this._clippingPlaneId.value; }
    set clippingPlaneId(value: string) { this._clippingPlaneId.value = value; }
    get clippingPlaneIdChanged() { return this._clippingPlaneId.changed; }
    private _excavateId = this.dv(reactArray<string[]>([]));
    get excavateId() { return this._excavateId.value; }
    set excavateId(value: string[]) { this._excavateId.value = value; }
    get excavateIdChanged() { return this._excavateId.changed; }

    static override defaults = {
        ...ESVisualObject.defaults,
        url: "",
        actorTag: "",
        materialMode: "normal",
        materialModes: [["常规", 'normal'], ["科技感", "technology"]] as [string, string][],
        offset: [0, 0, 0],
        materialParams: {
            baseColor: [0, 0.5, 1]
        },
        cacheBytes: 512 * 1024 * 1024,
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'dataSource',
            basic: [
                ...properties.basic,
                new NumberSliderProperty('精度', '精度.', false, false, [this, 'maximumScreenSpaceError'], 1, [0, 256], 16),
                new EnumProperty('材质模式', 'materialMode', true, false, [this, 'materialMode'], ES3DTileset.defaults.materialModes, 'normal'),
                new EnumProperty('颜色模式', '颜色混合模式', false, false, [this, 'colorBlendMode'], [['默认', "HIGHLIGHT"], ['替换', "REPLACE"], ['混合', "MIX"]], 'HIGHLIGHT'),
            ],
            dataSource: [
                ...properties.dataSource,
                new JsonProperty('服务地址', '服务地址', true, false, [this, 'url'], ES3DTileset.defaults.url),
            ],
            coordinate: [
                ...properties.coordinate,
                new BooleanProperty('位置编辑', '位置编辑', true, false, [this, 'editing'], false),
                new BooleanProperty('姿态编辑', '姿态编辑', false, false, [this, 'rotationEditing'], false),
                new Number3Property("偏移", "偏移量", true, false, [this, 'offset'], [0, 0, 0]),
                new RotationProperty("旋转", "旋转", false, false, [this, 'rotation'], [0, 0, 0]),
            ]
        }
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ES3DTileset', 'ES3DTileset', [
                new JsonProperty('服务地址', '服务地址', false, false, [this, 'url'], ES3DTileset.defaults.url),
                new EnumProperty('materialMode', 'materialMode', false, false, [this, 'materialMode'], ES3DTileset.defaults.materialModes),
                new JsonProperty('materialParams', 'materialParams', false, false, [this, 'materialParams'], ES3DTileset.defaults.materialParams),
                new NumberProperty('maximumScreenSpaceError', '显示精度,maximumScreenSpaceError', false, false, [this, 'maximumScreenSpaceError']),
                new BooleanProperty('位置编辑', '位置编辑', false, false, [this, 'editing'], false),
                new BooleanProperty('姿态编辑', '姿态编辑', false, false, [this, 'rotationEditing'], false),
                new PositionProperty("offset", "offset", true, false, [this, 'offset']),
                new PositionProperty("rotation", "rotation", false, false, [this, 'rotation']),
                new NumberSliderProperty('精度', '精度.', false, false, [this, 'maximumScreenSpaceError'], 1, [0, 256], 16),
                new FunctionProperty("highlightFeature", "highlightFeature", ['string', 'string'], (id, color) => this.highlightFeature(id, color), ['', `rgba(255,0,0,1)`]),
                new FunctionProperty("setFeatureColor", "setFeatureColor", ['string', 'string'], (featureName: string, json: string) => this.setFeatureColor(featureName, json), ['', '']),
                new FunctionProperty("setFeatureVisable", "setFeatureVisable", ['string', 'string'], (featureName: string, json: string) => this.setFeatureVisable(featureName, json), ['', '']),
                new FunctionProperty("resetFeatureStyle", "resetFeatureStyle", [], () => this.resetFeatureStyle(), []),

                new GroupProperty('ue', 'ue', [
                    new FunctionProperty("refreshTileset", "refreshTileset", [], () => this.refreshTileset(), []),
                    new StringProperty("actorTag", "actorTag", false, false, [this, 'actorTag']),
                    new BooleanProperty('是否高亮', '是否高亮.', false, false, [this, 'highlight']),
                    new ColorProperty('highlightColor', ' highlightColor.', false, false, [this, 'highlightColor']),
                    new NumberProperty('highlightID', 'highlightID', false, false, [this, 'highlightID']),
                ]),
                new GroupProperty('czm', 'czm', [
                    new GroupProperty('可视化', '可视化', [
                        new Number2Property('czmImageBasedLightingFactor', '散射强度 ,imageBasedLightingFactor', false, false, [this, 'czmImageBasedLightingFactor']),
                        new NumberProperty('czmLuminanceAtZenith', '材质底色 ,luminanceAtZenith', false, false, [this, 'czmLuminanceAtZenith']),
                        new NumberProperty('czmMaximumMemoryUsage', '最大内存,maximumMemoryUsage', false, false, [this, 'czmMaximumMemoryUsage']),
                    ]),
                    new GroupProperty('常用', '常用', [
                        new EnumProperty('czmClassificationType', 'Determines whether terrain, 3D Tiles or both will be classified by this tileset. See Cesium3DTileset#czmClassificationType for details about restrictions and limitations.', true, false, [this, 'czmClassificationType'], [['NONE', 'NONE'], ['TERRAIN', 'TERRAIN'], ['CESIUM_3D_TILE', 'CESIUM_3D_TILE'], ['BOTH', 'BOTH']]),
                        new JsonProperty('czmStyle', 'czmStyle', false, false, [this, 'czmStyleJson']),
                        new BooleanProperty('czmBackFaceCulling', 'czmBackFaceCulling', false, false, [this, 'czmBackFaceCulling']),
                        new BooleanProperty('czmSkipLevelOfDetail', 'czmSkipLevelOfDetail', false, false, [this, 'czmSkipLevelOfDetail']),
                        new EnumProperty('colorBlendMode', '颜色混合模式', false, false, [this, 'colorBlendMode'], [['HIGHLIGHT', "HIGHLIGHT"], ['REPLACE', "REPLACE"], ['MIX', "MIX"]], 'HIGHLIGHT'),
                        new NumberProperty('cacheBytes', '最大缓存占用,超过的会自动卸载,但是视野范围内能看见的保留。单位字节。Cesium1.110(含)以后的版本起作用。', false, false, [this, 'cacheBytes'], 512 * 1024 * 1024),
                    ]),
                    new GroupProperty('调试信息', '调试信息', [
                        new BooleanProperty('czmDebugShowBoundingVolume', 'For debugging only.When true, renders the bounding volume for each tile.', false, false, [this, 'czmDebugShowBoundingVolume']),
                        new BooleanProperty('czmDebugShowContentBoundingVolume', 'czmDebugShowContentBoundingVolume.', false, false, [this, 'czmDebugShowContentBoundingVolume']),
                    ]),
                    new GroupProperty('clippingPlanes', 'clippingPlanes', [
                        new BooleanProperty('clippingPlaneEnabled', 'clippingPlaneEnabled', false, false, [this, 'clippingPlaneEnabled']),
                        new BooleanProperty('unionClippingRegions', 'unionClippingRegions', false, false, [this, 'unionClippingRegions']),
                        new ColorProperty('clippingPlaneEdgeColor', 'clippingPlaneEdgeColor', false, false, [this, 'clippingPlaneEdgeColor']),
                        new NumberProperty('clippingPlaneEdgeWidth', 'clippingPlaneEdgeWidth', false, false, [this, 'clippingPlaneEdgeWidth']),
                    ]),
                ]),
            ]),

        ]
    }
}

export namespace ES3DTileset {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        url: "" as string | ESJResource,
        actorTag: "",
        materialMode: "normal" as 'normal' | 'technology',
        highlight: false,
        maximumScreenSpaceError: 16,
        highlightID: 0,
        highlightColor: reactArray<ESJColor>([1, 0, 0, 1]),

        offset: reactArrayWithUndefined<ESJVector3D>(undefined),
        rotation: reactArray<ESJVector3D>([0, 0, 0]),

        czmImageBasedLightingFactor: reactArray<ESJVector2D>([1, 1]),
        czmLuminanceAtZenith: 5,
        czmMaximumMemoryUsage: 512,
        czmClassificationType: "NONE",
        czmStyleJson: reactJson<JsonValue>({}),
        czmBackFaceCulling: true,
        czmDebugShowBoundingVolume: false,
        czmDebugShowContentBoundingVolume: false,
        czmSkipLevelOfDetail: false,

        // czmColorBlendMode: 'HIGHLIGHT' as 'HIGHLIGHT' | 'REPLACE' | 'MIX',
        // czmCacheBytes: 512 * 1024 * 1024,
        // czmMaximumCacheOverflowBytes: 512 * 1024 * 1024,

        cacheBytes: 512 * 1024 * 1024,
        colorBlendMode: 'HIGHLIGHT' as 'HIGHLIGHT' | 'REPLACE' | 'MIX',

        clippingPlaneEnabled: true,
        unionClippingRegions: true,
        clippingPlaneEdgeColor: reactArray<ESJColor>([1, 1, 1, 1]),
        clippingPlaneEdgeWidth: 2,
        materialParams: { baseColor: [0, 0.5, 1] } as ESJsonObjectType,
        allowPicking: true,
    });
}
extendClassProps(ES3DTileset.prototype, ES3DTileset.createDefaultProps);
export interface ES3DTileset extends UniteChanged<ReturnType<typeof ES3DTileset.createDefaultProps>> { }
