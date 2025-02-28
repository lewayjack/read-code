import { ESJResource, ESJVector2D, GroupProperty, JsonProperty, NumberProperty, StringProperty } from "../../ESJTypes";
import { ESVisualObject } from "../base";
import { extendClassProps, reactJsonWithUndefined, UniteChanged } from "xbsj-base";

export type ESTreeType = { name: string, mesh: string, cullingDistance: number, scale: number }
export type ESXiaoBanWidget = { class: string, pivot: ESJVector2D, space: number }

export class ESForestTileset extends ESVisualObject {
    static readonly type = this.register('ESForestTileset', this, { chsName: '森林切片图层', tags: ['ESObjects', '_ES_Impl_UE'], description: "ESForestTileset" });
    get typeName() { return 'ESForestTileset'; }
    override get defaultProps() { return ESForestTileset.createDefaultProps(); }

    static override defaults = {
        ...ESVisualObject.defaults,
        url: "",
        treeTypes: [] as ESTreeType[],

        xiaoBanWidgetDefault: {
            class: `WidgetBlueprint'/ESFoliage/ESDefaultXiaoBan.ESDefaultXiaoBan`, pivot: [0.5, 1], space: 1
        },
        youShiSZ: "StringTable'/ESFoliage/You_Shi_SZ.You_Shi_SZ'",
        diLei: "StringTable'/ESFoliage/Di_Lei.Di_Lei'",
        senLinLB: "StringTable'/ESFoliage/Sen_Lin_LB.Sen_Lin_LB'",
        labelMaterial: "Material'/ESFoliage/ES3DWidgetMaterial.ES3DWidgetMaterial'",
        heightOffset: 40,
        XiaoBanWidgetSampleValue: `
        ## 参数类型为 ESTreeType
        ${'```'}js

        type ESJVector2D = [number, number]

        type ESTreeType = { 
            class: string, 
            pivot: ESJVector2D, 
            space: number
        }

        ${'```'}
        `,
        TreeTypeSampleValue: `
        ## 参数类型为 ESTreeType[]
        ${'```'}js

        type ESTreeType = {
            name: string, 
            mesh: string,
            cullingDistance: number, 
            scale: number 
        }

        ${'```'}
        `

    }

    constructor(id?: string) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty("路径", "路径", true, false, [this, 'url']),
                new JsonProperty('treeTypes', '类型为 { name: string, mesh: string, cullingDistance: number, scale: number }[]', true, false, [this, 'treeTypes'], []),
                new JsonProperty('xiaoBanWidget', '类型为 { class: string, pivot: [number,number], space: number }', true, false, [this, 'xiaoBanWidget'], ESForestTileset.defaults.xiaoBanWidgetDefault, ESForestTileset.defaults.XiaoBanWidgetSampleValue),
                new StringProperty("youShiSZ", "youShiSZ", false, false, [this, 'youShiSZ']),
                new StringProperty("diLei", "diLei", false, false, [this, 'diLei']),
                new StringProperty("senLinLB", "senLinLB", false, false, [this, 'senLinLB']),
                new StringProperty("labelMaterial", "labelMaterial", false, false, [this, 'labelMaterial']),
                new NumberProperty("heightOffset", "heightOffset", false, false, [this, 'heightOffset']),
            ]),
        ];
    }
}


export namespace ESForestTileset {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        url: "" as string | ESJResource,
        treeTypes: reactJsonWithUndefined<ESTreeType[]>(undefined),
        xiaoBanWidget: reactJsonWithUndefined<ESXiaoBanWidget>(undefined),
        youShiSZ: "StringTable'/ESFoliage/You_Shi_SZ.You_Shi_SZ'",
        diLei: "StringTable'/ESFoliage/Di_Lei.Di_Lei'",
        senLinLB: "StringTable'/ESFoliage/Sen_Lin_LB.Sen_Lin_LB'",
        labelMaterial: "Material'/ESFoliage/ES3DWidgetMaterial.ES3DWidgetMaterial'",
        heightOffset: 40,
    });
}
extendClassProps(ESForestTileset.prototype, ESForestTileset.createDefaultProps);
export interface ESForestTileset extends UniteChanged<ReturnType<typeof ESForestTileset.createDefaultProps>> { }
