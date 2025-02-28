import { extendClassProps, UniteChanged } from "xbsj-base";
import { EnumProperty, ESJFillStyle, ESJStrokeStyle, GroupProperty, NumberProperty } from "../../ESJTypes";
import { ESGeoVector } from "../base";
/**
 * https://www.wolai.com/earthsdk/KumomxD1tKHbq242aFVwz
 */
export class ESPipeFence extends ESGeoVector {
    static readonly type = this.register('ESPipeFence', this, { chsName: '管道电子围栏', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "管道电子围栏" });
    get typeName() { return 'ESPipeFence'; }
    override get defaultProps() { return ESPipeFence.createDefaultProps(); }

    static override defaults = {
        ...ESGeoVector.defaults,
        strokeStyle: {
            width: 1,
            widthType: 'screen',
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {}
        } as ESJStrokeStyle,
        fillStyle: {
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {}
        } as ESJFillStyle,
        filled: true,
        stroked: true,
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
        this.fillColor = [1, 0, 0.73, 1]
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'basic',
            basic: [
                ...properties.basic,
                new NumberProperty('高度', 'height', false, false, [this, 'height'], 10),
                new NumberProperty('宽度', 'width', false, false, [this, 'width'], 10),
                new EnumProperty('模式', 'materialMode', false, false, [this, 'materialMode'], ESPipeFence.defaults.materialModes, 'purple'),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESPipeFence', 'ESPipeFence', [
                new NumberProperty('高度', 'height', false, false, [this, 'height']),
                new NumberProperty('宽度', 'width', false, false, [this, 'width']),
                new EnumProperty('materialMode', 'materialMode', false, false, [this, 'materialMode'], ESPipeFence.defaults.materialModes),

            ]),
        ]
    }
}

export namespace ESPipeFence {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
        height: 10,
        width: 10,
        materialMode: 'singleArrow',
        filled: true,
    });
}
extendClassProps(ESPipeFence.prototype, ESPipeFence.createDefaultProps);
export interface ESPipeFence extends UniteChanged<ReturnType<typeof ESPipeFence.createDefaultProps>> { }
