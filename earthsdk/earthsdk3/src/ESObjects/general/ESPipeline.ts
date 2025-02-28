import { BooleanProperty, ColorProperty, EnumProperty, ESJResource, GroupProperty, JsonProperty, NumberProperty } from "../../ESJTypes";
import { extendClassProps, reactJson, UniteChanged } from "xbsj-base";
import { ESGeoLineString } from "./ESGeoLineString";

/**
 * 管线
 * https://www.wolai.com/earthsdk/2X9zwccAfriMJiogcgNwep
 */
export class ESPipeline extends ESGeoLineString {
    static override readonly type = this.register('ESPipeline', this, { chsName: '管线', tags: ['ESObjects', '_ES_Impl_Cesium'], description: 'ESPipeline' });
    override get typeName() { return 'ESPipeline'; }
    override get defaultProps() { return ESPipeline.createDefaultProps(); }

    static override defaults = {
        ...ESGeoLineString.defaults,
        // 属性的类型若存在undefined的情况，这里配置为undefined时应该使用的默认值
        radius: 10,
        sides: 10,
        materialImage: { url: "" as string | ESJResource, uDis: 50, vDis: 10 },
        speed: 1,
        materialModes: [["单箭头", 'singleArrow'], ["多箭头", "multipleArrows"]] as [name: string, value: string][],
    }
    override  _deprecated = [
        {
            "materialMode": {
                "blue": "multipleArrows",
                "purple": "singleArrow",
            }
        },
        "show"
    ];
    private _deprecatedWarningFunc = (() => { this._deprecatedWarning(); })();
    constructor(id?: string) {
        super(id);
        this.filled = true;
        this.stroked = false;
        this.fillColor = [1, 0, 0.73, 1]
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'basic',
            basic: [
                ...properties.basic,
                new NumberProperty('半径', 'radius(米)', false, false, [this, 'radius'], ESPipeline.defaults.radius),
                new NumberProperty('圆边数', 'sides(圆细分边)', false, false, [this, 'sides'], ESPipeline.defaults.sides),
                new NumberProperty('材质速度', 'speed', false, false, [this, 'speed'], ESPipeline.defaults.speed),
                new EnumProperty('材质模式', 'materialMode', false, false, [this, 'materialMode'], ESPipeline.defaults.materialModes),
                new JsonProperty('材质图片和重复度', 'materialImage', false, false, [this, 'materialImage'], ESPipeline.defaults.materialImage),
            ],
            style: [
                new GroupProperty('点样式', '点样式集合', []),
                new BooleanProperty('开启', '开启点样式', false, false, [this, 'pointed'], false),
                new NumberProperty('点大小', '点大小(pointSize)', false, false, [this, 'pointSize'], 1),
                new EnumProperty('点类型', '点类型(pointSizeType)', false, false, [this, 'pointSizeType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('点颜色', '点颜色(pointColor)', false, false, [this, 'pointColor'], [1, 1, 1, 1]),
                new GroupProperty('线样式', '线样式集合', []),
                new BooleanProperty('开启线样式', '开启线样式', false, false, [this, 'stroked'], true),
                new NumberProperty('线宽', '线宽(strokeWidth)', false, false, [this, 'strokeWidth'], 1),
                new EnumProperty('线类型', '线类型(strokeWidthType)', false, false, [this, 'strokeWidthType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('线颜色', '线颜色(strokeColor)', false, false, [this, 'strokeColor'], [1, 1, 1, 1]),
                new BooleanProperty('是否贴地', '是否贴地(线)', false, false, [this, 'strokeGround'], false),
                new GroupProperty('面样式', '面样式集合', []),
                new BooleanProperty('开启', '开启填充样式', false, false, [this, 'filled'], false),
                new ColorProperty('填充颜色', '填充颜色(fillColor)', false, false, [this, 'fillColor'], [1, 1, 1, 1]),
                new BooleanProperty('是否贴地', '是否贴地', false, false, [this, 'fillGround'], false),
            ],
        };
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            // 属性UI配置
            new GroupProperty('通用', '通用', [
                new NumberProperty('半径', 'radius(米)', false, false, [this, 'radius'], ESPipeline.defaults.radius),
                new NumberProperty('圆边数', 'sides(圆细分边)', false, false, [this, 'sides'], ESPipeline.defaults.sides),
                new JsonProperty('材质图片和重复度', 'materialImage', false, false, [this, 'materialImage'], ESPipeline.defaults.materialImage),
                new NumberProperty('材质速度', 'speed', false, false, [this, 'speed'], ESPipeline.defaults.speed),
                new EnumProperty('材质模式', 'materialMode', false, false, [this, 'materialMode'], ESPipeline.defaults.materialModes),
            ]),
        ];
    }
}

export namespace ESPipeline {
    export const createDefaultProps = () => ({
        ...ESGeoLineString.createDefaultProps(),
        // 属性配置
        radius: 10,
        sides: 10,
        materialMode: 'singleArrow',
        materialImage: reactJson(ESPipeline.defaults.materialImage),
        speed: 1,
    });
}
extendClassProps(ESPipeline.prototype, ESPipeline.createDefaultProps);
export interface ESPipeline extends UniteChanged<ReturnType<typeof ESPipeline.createDefaultProps>> { }
