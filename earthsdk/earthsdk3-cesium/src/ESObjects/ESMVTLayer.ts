import { Event, extendClassProps, reactArrayWithUndefined, reactJson, reactJsonWithUndefined, UniteChanged } from "xbsj-base";
import {
    EnumProperty, ESJVector4D, GroupProperty, JsonProperty,
    Number4Property, NumberProperty, NumberSliderProperty, PickedInfo, StringProperty, ESVisualObject
} from "earthsdk3"


export class ESMVTLayer extends ESVisualObject {
    static readonly type = this.register('ESMVTLayer', this, { chsName: '矢量瓦片图层', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: '用于加载矢量瓦片图层。' });
    get typeName() { return 'ESMVTLayer'; }
    override get defaultProps() { return ESMVTLayer.createDefaultProps(); }

    private _pickFeaturesEvent = this.dv(new Event<[PickedInfo]>());
    get pickFeaturesEvent() { return this._pickFeaturesEvent; }

    static override defaults = {
        ...ESVisualObject.defaults,
        // 属性的类型若存在undefined的情况，这里配置为undefined时应该使用的默认值
        url: "",
        zIndex: 0,
        accessToken: "",
        tileSizes: [["256", 256], ["512", 512], ["1024", 1024]] as [name: string, value: number][],
        tileSize: 256,
        maximumLevel: 18,
        minimumLevel: 0,
        rectangle: [-180.0000000, -90.0000000, 180.0000000, 90.0000000] as [number, number, number, number],
        style: [],
    }

    constructor(id?: string) {
        super(id);
    }

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new StringProperty('令牌', '影像服务访问令牌', false, false, [this, 'accessToken'], ESMVTLayer.defaults.accessToken),
                new Number4Property('矩形范围', '西南东北', true, false, [this, 'rectangle'], ESMVTLayer.defaults.rectangle),
                new JsonProperty('服务地址', 'mapbox样式对象或url资源', false, false, [this, 'url'], ESMVTLayer.defaults.url),
                new JsonProperty('样式配置', '样式配置，用于自定义或替换样式', false, false, [this, 'style'], ESMVTLayer.defaults.style),
                new NumberProperty('层级序号', '层级序号', false, false, [this, 'zIndex'], ESMVTLayer.defaults.zIndex),
                new EnumProperty('瓦片大小', '瓦片大小', false, false, [this, 'tileSize'], ESMVTLayer.defaults.tileSizes),
                new NumberSliderProperty('最大层级', '最大层级', false, false, [this, 'maximumLevel'], 1, [1, 24], ESMVTLayer.defaults.maximumLevel),
                new NumberSliderProperty('最小层级', '最小层级', false, false, [this, 'minimumLevel'], 1, [0, 24], ESMVTLayer.defaults.minimumLevel),
            ]
        }
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            // 属性UI配置
            new GroupProperty('通用', '通用', [
                new Number4Property('矩形范围', '西南东北', true, false, [this, 'rectangle'], ESMVTLayer.defaults.rectangle),
                new JsonProperty('服务地址', 'mapbox样式对象或url资源', false, false, [this, 'url'], ESMVTLayer.defaults.url),
                new JsonProperty('样式配置', '样式配置，用于自定义或替换样式', false, false, [this, 'style'], ESMVTLayer.defaults.style),
                new NumberProperty('层级', '影像显示层级', false, false, [this, 'zIndex'], ESMVTLayer.defaults.zIndex),
                new StringProperty('令牌', '影像服务访问令牌', false, false, [this, 'accessToken'], ESMVTLayer.defaults.accessToken),
                new EnumProperty('瓦片大小', '瓦片大小', false, false, [this, 'tileSize'], ESMVTLayer.defaults.tileSizes),
                new NumberSliderProperty('最大层级', '最大层级', false, false, [this, 'maximumLevel'], 1, [1, 24], ESMVTLayer.defaults.maximumLevel),
                new NumberSliderProperty('最小层级', '最小层级', false, false, [this, 'minimumLevel'], 1, [0, 24], ESMVTLayer.defaults.minimumLevel),
            ]),
        ];
    }
}

export namespace ESMVTLayer {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        // 属性配置
        rectangle: reactJsonWithUndefined<ESJVector4D>(undefined),
        url: reactJson<string | { [xx: string]: any }>(""),
        zIndex: 0,
        accessToken: "",
        tileSize: 256,
        maximumLevel: 18,
        minimumLevel: 0,
        style: reactArrayWithUndefined<{ [xx: string]: any }[]>(undefined)
    });
}
extendClassProps(ESMVTLayer.prototype, ESMVTLayer.createDefaultProps);
export interface ESMVTLayer extends UniteChanged<ReturnType<typeof ESMVTLayer.createDefaultProps>> { }
