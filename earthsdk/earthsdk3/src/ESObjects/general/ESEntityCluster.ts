
import { ESSceneObject, ESVisualObject } from "../base";
import { Event, extendClassProps, react, reactJsonWithUndefined, UniteChanged } from "xbsj-base";
import { isJSONString } from "./ESGeoJson/type";
import { BooleanProperty, EnumProperty, ESJResource, GroupProperty, JsonProperty, NumberProperty } from "../../ESJTypes";
export type WidgetEventInfo = {
    type: "leftClick" | "rightClick" | "mouseEnter" | "mouseLeave" | "childMouseLeave" | "childMouseEnter";
    add?: {
        children?: string[];
        mousePos?: [number, number];
    }
}
export type ESEntityClusterStyle = {
    cluster?: {
        value?: number,
        minValue?: number,
        maxValue?: number,
        mode?: string,
        style?: { [xx: string]: any }
    }[],
    nonCluster?: {
        mode?: string,
        style?: { [xx: string]: any }
    }
}

/**
 * 聚合POI标注
 * ESEntityCluster - https://www.wolai.com/earthsdk/5drKAUgDrTcQq4zGVtbbYj
 */
export class ESEntityCluster extends ESVisualObject {
    static readonly type = this.register('ESEntityCluster', this, { chsName: 'Poi聚合', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: '用于聚合POI标注，提高性能。' });
    get typeName() { return 'ESEntityCluster'; }
    override get defaultProps() { return ESEntityCluster.createDefaultProps(); }

    private _widgetEvent = this.dv(new Event<[WidgetEventInfo]>());
    get widgetEvent() { return this._widgetEvent; }

    private _data = this.dv(react<Object | undefined>(undefined));
    get data() { return this._data.value; }
    set data(value: Object | undefined) { this._data.value = value; }
    get dataChanged() { return this._data.changed; }
    getFeatures() {
        if (this._data) {
            return this._data;
        }
        console.log('数据未加载完成，请稍后重试');
    }

    static override defaults = {
        ...ESVisualObject.defaults,
        url: '',
        pixelRange: 200,
        minimumClusterSize: 2,
        style: {
            "cluster": [
                {
                    "minValue": 2,
                    "mode": "SquareV02",
                    "style": {}
                }
            ],
            "nonCluster": {
                "mode": "SquareV03",
                "style": {}
            }
        } as ESEntityClusterStyle,
        heightReferences: [["None", "None"], ["CLAMP_TO_GROUND", "CLAMP_TO_GROUND"], ["CLAMP_TO_TERRAIN", "CLAMP_TO_TERRAIN"]] as [name: string, value: string][],
        perspective: false,

    }

    constructor(id?: string) {
        super(id);
        {
            // 加载数据
            const update = () => {
                if (!this.url) return;
                do {
                    if (typeof this.url == 'object') {
                        this.data = this.url;
                        break;
                    }
                    if (isJSONString(this.url)) {
                        this.data = JSON.parse(this.url);
                        break;
                    }
                    fetch(ESSceneObject.context.getStrFromEnv(this.url)).then(response => response.json()).then(res => {
                        this.data = res;
                    }).catch(err => {
                        console.warn("ESEntityCluster数据加载失败", err);
                    })
                } while (false);
            }
            update();
            this.d(this.urlChanged.don(update));
        }
    }

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new JsonProperty('地址', '数据Url地址', false, false, [this, 'url'], ESEntityCluster.defaults.url),
                new NumberProperty('集合范围', '用于扩展屏幕空间边界框的像素范围', false, false, [this, 'pixelRange'], ESEntityCluster.defaults.pixelRange),
                new NumberProperty('最小数量', '可以聚合的屏幕空间对象的最小数量', false, false, [this, 'minimumClusterSize'], ESEntityCluster.defaults.minimumClusterSize),
                // new JsonProperty('style', '用于设置聚合和非聚合的显示样式', false, false, [this, 'style'], ESEntityCluster.defaults.style),
                new EnumProperty('高度模式', '高度获取模式', false, false, [this, 'heightReference'], ESEntityCluster.defaults.heightReferences, 'None'),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            // 属性UI配置
            new GroupProperty('通用', '通用', [
                new JsonProperty('url', '数据Url地址', false, false, [this, 'url'], ESEntityCluster.defaults.url),
                new NumberProperty('pixelRange', '用于扩展屏幕空间边界框的像素范围', false, false, [this, 'pixelRange'], ESEntityCluster.defaults.pixelRange),
                new NumberProperty('minimumClusterSize', '可以聚合的屏幕空间对象的最小数量', false, false, [this, 'minimumClusterSize'], ESEntityCluster.defaults.minimumClusterSize),
                new JsonProperty('style', '用于设置聚合和非聚合的显示样式', false, false, [this, 'style'], ESEntityCluster.defaults.style),
                new EnumProperty('heightReference', '高度获取模式', false, false, [this, 'heightReference'], ESEntityCluster.defaults.heightReferences),
            ]),
            new GroupProperty('UE', 'UE', [
                new BooleanProperty('perspective', '是否启用透视效果，自动缩放远处标签', false, false, [this, 'perspective'], ESEntityCluster.defaults.perspective),
            ]),
        ];
    }
}

export namespace ESEntityCluster {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        url: '' as string | ESJResource | { [xx: string]: any },
        pixelRange: 200,
        minimumClusterSize: 2,
        style: reactJsonWithUndefined<ESEntityClusterStyle>(undefined),
        heightReference: "None",
        perspective: false,
    });
}
extendClassProps(ESEntityCluster.prototype, ESEntityCluster.createDefaultProps);
export interface ESEntityCluster extends UniteChanged<ReturnType<typeof ESEntityCluster.createDefaultProps>> { }
