import { extendClassProps, reactArray, UniteChanged } from "xbsj-base";
import { BooleanProperty, ColorProperty, ESJColor, ESJVector3D, GroupProperty, Number3Property, NumberProperty, StringProperty } from "../../ESJTypes";
import { ESObjectWithLocation } from "../base";
/**
 * https://www.wolai.com/earthsdk/hPLjF6oi2a2mxDuRdqbPUS
 */
export class ESBoxClipping extends ESObjectWithLocation {
    static readonly type = this.register('ESBoxClipping', this, { chsName: '体剖切', tags: ['ESObjects', '_ES_Impl_Cesium'], description: "体剖切，体裁剪，体裁切，盒裁切" });
    get typeName() { return 'ESBoxClipping'; }
    override get defaultProps() { return { ...ESBoxClipping.createDefaultProps() }; }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        reverse: false,
        edgeColor: [1, 1, 1, 1] as ESJColor,
        edgeWidth: 1,
        size: [10, 10, 10] as ESJVector3D,
        targetID: ""
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
                new BooleanProperty('反转', 'reverse', false, false, [this, 'reverse'], ESBoxClipping.defaults.reverse),
                new Number3Property('尺寸', '长宽高', false, false, [this, 'size'], ESBoxClipping.defaults.size),
                new ColorProperty('边框颜色', 'edgeColor', false, false, [this, 'edgeColor'], ESBoxClipping.defaults.edgeColor),
                new NumberProperty('边框宽度', 'edgeWidth', false, false, [this, 'edgeWidth'], ESBoxClipping.defaults.edgeWidth),
                new StringProperty('瓦片图层', 'targetID', false, false, [this, 'targetID'], ESBoxClipping.defaults.targetID),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new BooleanProperty('reverse', 'reverse', false, false, [this, 'reverse'], ESBoxClipping.defaults.reverse),
                new ColorProperty('edgeColor', 'edgeColor', false, false, [this, 'edgeColor'], ESBoxClipping.defaults.edgeColor),
                new NumberProperty('edgeWidth', 'edgeWidth', false, false, [this, 'edgeWidth'], ESBoxClipping.defaults.edgeWidth),
                new Number3Property('尺寸', '长宽高', false, false, [this, 'size'], ESBoxClipping.defaults.size),
                new StringProperty('targetID', 'targetID', false, false, [this, 'targetID'], ESBoxClipping.defaults.targetID),
            ]),
        ];
    }
}

export namespace ESBoxClipping {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        reverse: false,
        edgeColor: reactArray<ESJColor>([1, 1, 1, 1]),
        edgeWidth: 2,
        size: reactArray<ESJVector3D>([10, 10, 10]),
        /**
         * 目标  ES3DTileset ID ,为空时代表裁切地形
         */
        targetID: ""
    });
}
extendClassProps(ESBoxClipping.prototype, ESBoxClipping.createDefaultProps);
export interface ESBoxClipping extends UniteChanged<ReturnType<typeof ESBoxClipping.createDefaultProps>> { }
