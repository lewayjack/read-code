import { extendClassProps, ReactivePropsToNativePropsAndChanged, UniteChanged } from "xbsj-base";
import { BooleanProperty, ColorProperty, EnumProperty, GroupProperty, NumberProperty, StringProperty } from "../../ESJTypes";
import { ESGeoPolygon } from "./ESGeoPolygon";

/**
 * https://www.wolai.com/earthsdk/ejBicXu8Jxr2EGJDcxYvkV
 * 
 */
export class ESExcavate extends ESGeoPolygon {
    static override readonly type = this.register('ESExcavate', this, { chsName: '挖坑', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: '挖坑' });
    override get typeName() { return 'ESExcavate'; }
    override get defaultProps() { return ESExcavate.createDefaultProps(); }

    static override defaults = {
        ...ESGeoPolygon.defaults,
        stroked: false,
        ground: true,
        modes: [["向内", "in"], ["向外", "out"]] as [name: string, value: string][],
        targetID: "",
        filled: false,
    }
    constructor(id?: string) {
        super(id);
        this.filled = false;
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new EnumProperty('模式', 'mode', false, false, [this, 'mode'], ESExcavate.defaults.modes, 'in'),
                new StringProperty('瓦片图层', 'targetID', false, false, [this, 'targetID'], '')
            ],
            style: [
                new GroupProperty('点样式', '点样式集合', []),
                new BooleanProperty('开启', '开启点样式', false, false, [this, 'pointed'], false),
                new NumberProperty('点大小', '点大小(pointSize)', false, false, [this, 'pointSize'], 1),
                new EnumProperty('点类型', '点类型(pointSizeType)', false, false, [this, 'pointSizeType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('点颜色', '点颜色(pointColor)', false, false, [this, 'pointColor'], [1, 1, 1, 1]),
                new GroupProperty('线样式', '线样式集合', []),
                new BooleanProperty('开启', '开启线样式', false, false, [this, 'stroked'], true),
                new NumberProperty('线宽', '线宽(strokeWidth)', false, false, [this, 'strokeWidth'], 1),
                new EnumProperty('线类型', '线类型(strokeWidthType)', false, false, [this, 'strokeWidthType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('线颜色', '线颜色(strokeColor)', false, false, [this, 'strokeColor'], [1, 1, 1, 1]),
                new BooleanProperty('是否贴地', '是否贴地(线)', false, false, [this, 'strokeGround'], false),
                new GroupProperty('面样式', '面样式集合', []),
                new BooleanProperty('开启', '开启填充样式', false, false, [this, 'filled'], true),
                new ColorProperty('填充颜色', '填充颜色(fillColor)', false, false, [this, 'fillColor'], [1, 1, 1, 1]),
                new BooleanProperty('是否贴地', '是否贴地', false, false, [this, 'fillGround'], false),
            ],

        }
    }
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new EnumProperty('模式', 'mode', false, false, [this, 'mode'], ESExcavate.defaults.modes),
                new StringProperty('目标ID', 'targetID', false, false, [this, 'targetID'])
            ])
        ];
    }
}

export namespace ESExcavate {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        mode: "in",
        targetID: "",
        filled: false,
    })
}
extendClassProps(ESExcavate.prototype, ESExcavate.createDefaultProps);
export interface ESExcavate extends UniteChanged<ReturnType<typeof ESExcavate.createDefaultProps>> { }
