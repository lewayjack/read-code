import { extendClassProps, ReactivePropsToNativePropsAndChanged, reactJson, SceneObjectKey } from "xbsj-base";
import { ESLabel } from "../base";
import { BooleanProperty, EnumProperty, GroupProperty, JsonProperty } from "../../ESJTypes";

export class ESPoi2D extends ESLabel {
    static readonly type = this.register("ESPoi2D", this, { chsName: "ESPoi2D", tags: ["ESObjects", "_ES_Impl_Cesium", "_ES_Impl_UE"], description: "三角形，菱形" });
    get typeName() { return 'ESPoi2D'; }
    override get defaultProps() { return ESPoi2D.createDefaultProps(); }

    static override defaults = {
        ...ESLabel.defaults,
        modes: [
            ['SquareH01', 'SquareH01'],
            ['SquareH02', 'SquareH02'],
            ['SquareV01', 'SquareV01'],
            ['SquareV02', 'SquareV02'],
            ['SquareV03', 'SquareV03'],
            ['SquareV04', 'SquareV04'],
            ['Flag01', 'Flag01'],
            ['Flag02', 'Flag02'],
            ['Linear01', 'Linear01'],
            ['Linear02', 'Linear02'],
            ['Linear03', 'Linear03'],
            ['CircularH01', 'CircularH01'],
            ['CircularH02', 'CircularH02'],
            ['CircularV01', 'CircularV01'],
            ['CircularV02', 'CircularV02'],
            ['CircularV03', 'CircularV03'],
            ['CircularV04', 'CircularV04'],
            ['CircularV05', 'CircularV05'],
            ['P3D01', 'P3D01'],
            ['P3D02', 'P3D02'],
            ['P3D03', 'P3D03'],
            ['P3D04', 'P3D04'],
            ['P3D05', 'P3D05'],
            ['P3D06', 'P3D06'],
            ['P3D07', 'P3D07'],
            ['Diamond01', 'Diamond01'],
            ['Diamond02', 'Diamond02'],
            ['Stranger', 'Stranger'],
            ['ManNormal', 'ManNormal'],
            ['ManAbnormal', 'ManAbnormal'],
            ['WomanNormal', 'WomanNormal'],
            ['WomanAbnormal', 'WomanAbnormal'],
        ] as [name: string, value: string][],
        mode: 'SquareH01' as
            "SquareH01" | "SquareH02"
            | "SquareV01" | "SquareV02" | "SquareV03" | "SquareV04"
            | "Flag01" | "Flag02"
            | "Linear01" | "Linear02" | "Linear03"
            | "CircularH01" | "CircularH02"
            | "CircularV01" | "CircularV02" | "CircularV03" | "CircularV04" | "CircularV05"
            | "P3D01" | "P3D02" | "P3D03" | "P3D04" | "P3D05" | "P3D06" | "P3D07"
            | "Diamond01" | "Diamond02" | "Stranger" | "ManNormal" | "ManAbnormal" | "WomanNormal" | "WomanAbnormal",
        style: {} as { [xx: string]: any },
        autoAnchor: true,
    }

    constructor(id?: SceneObjectKey) {
        super(id)
    }


    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new EnumProperty('模式', 'mode', false, false, [this, 'mode'], ESPoi2D.defaults.modes, ESPoi2D.defaults.mode),
                new JsonProperty('样式', 'style', false, false, [this, 'style'], ESPoi2D.defaults.style),
                new BooleanProperty('自动锚点对齐', 'autoAnchor', false, false, [this, 'autoAnchor'], ESPoi2D.defaults.autoAnchor),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new EnumProperty('模式', 'mode', false, false, [this, 'mode'], ESPoi2D.defaults.modes),
                new JsonProperty('样式', 'style', false, false, [this, 'style'], ESPoi2D.defaults.style),
                new BooleanProperty('自动锚点对齐', 'autoAnchor', false, false, [this, 'autoAnchor'], ESPoi2D.defaults.autoAnchor),
            ])
        ]
    }
}

export namespace ESPoi2D {
    export const createDefaultProps = () => ({
        ...ESLabel.createDefaultProps(),
        mode: 'SquareH01',
        style: reactJson<{ [xx: string]: any }>({}),
        autoAnchor: true,
    })
}

extendClassProps(ESPoi2D.prototype, ESPoi2D.createDefaultProps);
export interface ESPoi2D extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESPoi2D.createDefaultProps>> { }