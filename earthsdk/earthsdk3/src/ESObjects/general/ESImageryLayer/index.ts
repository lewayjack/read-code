import {
    EnumProperty, ESJResource, ESJVector4D, GroupProperty, JsonProperty,
    Number4Property, NumberProperty, NumberSliderProperty,
    StringProperty
} from "../../../ESJTypes";
import { ESVisualObject } from "../../../ESObjects";
import { extendClassProps, reactJsonWithUndefined, UniteChanged } from "xbsj-base";
import { CzmSplitDirectionType, ESImageryLayerOptionsType, optionsStr } from "./types";

/**
 * https://www.wolai.com/earthsdk/sTpXjiETeVPfEwGfqDqUUw
 */
export class ESImageryLayer extends ESVisualObject {
    static readonly type = this.register('ESImageryLayer', this, { chsName: '影像图层', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "影像图层" });
    get typeName() { return 'ESImageryLayer'; }
    override get defaultProps() { return ESImageryLayer.createDefaultProps(); }

    static override defaults = {
        ...ESVisualObject.defaults,
        url: "",
        rectangle: [-180, -90, 180, 90] as ESJVector4D,
        options: {},
        zIndex: 0,
        actorTag: "",
        componentTag: "",
        minimumLevel: 0,
        maximumLevel: 22,

        czmSplitDirection: 'NONE' as CzmSplitDirectionType,
        czmSplitDirectionEnum: [['LEFT', 'LEFT'], ['NONE', 'NONE'], ['RIGHT', 'RIGHT']] as [name: string, value: string][],
        czmAlpha: 1.0,
        czmBrightness: 1.0,
        czmContrast: 1.0,
        czmHue: 0.0,
        czmSaturation: 1.0,
        czmGamma: 1.0,
        czmSubdomains: []
    }

    constructor(id?: string) { super(id); }

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'dataSource',
            basic: [
                ...properties.basic,
                new NumberProperty('层级序号', '层级序号', false, false, [this, 'zIndex'], ESImageryLayer.defaults.zIndex),
            ],
            dataSource: [
                ...properties.dataSource,
                new JsonProperty('影像服务地址', '影像服务地址', false, false, [this, 'url']),
                new Number4Property('矩形范围', '西南东北', true, false, [this, 'rectangle'], ESImageryLayer.defaults.rectangle),
                new NumberSliderProperty('最大级别', '最大级别.', true, false, [this, 'maximumLevel'], 1, [1, 24], ESImageryLayer.defaults.maximumLevel),
                new JsonProperty('options', 'options', true, false, [this, 'options'], ESImageryLayer.defaults.options),
                new StringProperty('targetID', 'targetID', false, false, [this, 'targetID']),
            ],
        }
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESImageryLayer', 'ESImageryLayer', [
                new JsonProperty('影像服务地址', '影像服务地址', false, false, [this, 'url']),
                new GroupProperty('通用', '通用', [
                    new Number4Property('矩形范围', '西南东北', true, false, [this, 'rectangle'], ESImageryLayer.defaults.rectangle),
                    new NumberProperty('高度', 'A numeric Property specifying the height.', false, false, [this, 'height']),
                    new NumberProperty('zIndex', '层级', false, false, [this, 'zIndex']),
                    new StringProperty('actorTag', 'actorTag', false, false, [this, 'actorTag']),
                    new StringProperty('componentTag', 'componentTag', false, false, [this, 'componentTag']),
                    new NumberProperty('minimumLevel', 'minimumLevel', false, false, [this, 'minimumLevel']),
                    new NumberProperty('maximumLevel', 'maximumLevel', false, false, [this, 'maximumLevel']),
                    new JsonProperty('options', 'options', true, false, [this, 'options'], {}, optionsStr),
                    new StringProperty('targetID', 'targetID', false, false, [this, 'targetID']),
                ]),
                new GroupProperty('czm', 'czm', [
                    new EnumProperty('czmSplitDirection', 'The ImagerySplitDirection split to apply to this layer.', false, false, [this, 'czmSplitDirection'], ESImageryLayer.defaults.czmSplitDirectionEnum),
                    new NumberProperty('透明度', '透明度,The alpha blending value of this layer, from 0.0 to 1.0.', false, false, [this, 'czmAlpha']),
                    new NumberProperty('亮度', '亮度,The brightness of this layer. 1.0 uses the unmodified imagery color.', false, false, [this, 'czmBrightness']),
                    new NumberProperty('对比度', '对比度,The contrast of this layer. 1.0 uses the unmodified imagery color.', false, false, [this, 'czmContrast']),
                    new NumberProperty('色相', '色相,The hue of this layer. 0.0 uses the unmodified imagery color. ', false, false, [this, 'czmHue']),
                    new NumberProperty('饱和度', '饱和度,The saturation of this layer. 1.0 uses the unmodified imagery color. ', false, false, [this, 'czmSaturation']),
                    new NumberProperty('伽马值', '伽马,The gamma correction to apply to this layer. 1.0 uses the unmodified imagery color.', false, false, [this, 'czmGamma']),
                ])
            ]),
        ]
    }
}

export namespace ESImageryLayer {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        url: "" as string | ESJResource,
        rectangle: reactJsonWithUndefined<ESJVector4D>(undefined),
        options: reactJsonWithUndefined<ESImageryLayerOptionsType>(undefined),
        zIndex: 0,
        actorTag: "",
        componentTag: "",
        maximumLevel: 22,
        minimumLevel: 0,
        targetID: "" as string | undefined,

        czmSplitDirection: 'NONE' as CzmSplitDirectionType,
        czmAlpha: 1.0,
        czmBrightness: 1.0,
        czmContrast: 1.0,
        czmHue: 0.0,
        czmSaturation: 1.0,
        czmGamma: 1.0,
    });
}
extendClassProps(ESImageryLayer.prototype, ESImageryLayer.createDefaultProps);
export interface ESImageryLayer extends UniteChanged<ReturnType<typeof ESImageryLayer.createDefaultProps>> { }
