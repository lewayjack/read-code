import { extendClassProps, reactJsonWithUndefined, UniteChanged } from "xbsj-base";
import { ESJResource, ESJVector2D, GroupProperty, JsonProperty, NumberProperty } from "../../ESJTypes";
import { ESVisualObject } from "../base";


export type ESPoiType = { type: string, povit: ESJVector2D, widget: string, worldScale: number, hiddenDistance: number }

const poiTypeDefault = {
    defaultValue: [
        {
            type: '2',
            widget: `WidgetBlueprint'/ESFoliage/PoiSheng.PoiSheng'`,
            povit: [0.5, 1],
            worldScale: 0.1,
            hiddenDistance: 40
        }, {
            type: '3',
            widget: `WidgetBlueprint'/ESFoliage/PoiShi.PoiShi'`,
            povit: [0.5, 1],
            worldScale: 0.1,
            hiddenDistance: 40
        }, {
            type: '4',
            widget: `WidgetBlueprint'/ESFoliage/PoiShi.PoiShi'`,
            povit: [0.5, 1],
            worldScale: 0.1,
            hiddenDistance: 40
        }, {
            type: '5',
            widget: `WidgetBlueprint'/ESFoliage/PoiXiang.PoiXiang'`,
            povit: [0.5, 1],
            worldScale: 0.1,
            hiddenDistance: 40
        }, {
            type: '6',
            widget: `WidgetBlueprint'/ESFoliage/PoiCun.PoiCun'`,
            povit: [0.5, 1],
            worldScale: 0.1,
            hiddenDistance: 40
        }
    ],
    sampleValue: `
## 参数类型为 ESPoiType[]
${'```'}js
type Vector2D = [number, number]

type ESPoiType = { 
    type: string, 
    povit: Vector2D, 
    widget: string, 
    worldScale: number, 
    hiddenDistance: number 
}

${'```'}
`
}

export class ESPoiTileset extends ESVisualObject {
    static readonly type = this.register('ESPoiTileset', this, { chsName: 'ESPoiTileset', tags: ['ESObjects', '_ES_Impl_UE'], description: "ESPoiTileset" });
    get typeName() { return 'ESPoiTileset'; }
    override get defaultProps() { return ESPoiTileset.createDefaultProps(); }

    static override defaults = {
        ...ESVisualObject.defaults,
        // url: '',
        // heightOffset: 40,
        poiTypes: poiTypeDefault.defaultValue,
    }

    constructor(id?: string) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty("路径", "路径", false, false, [this, 'url']),
                new JsonProperty('poiTypes', '类型为 {type: string, povit: Vector2D, widget: string, worldScale: number, hiddenDistance: number}[]', false, false, [this, 'poiTypes'], ESPoiTileset.defaults.poiTypes, poiTypeDefault.sampleValue),
                new NumberProperty("heightOffset", "heightOffset", false, false, [this, 'heightOffset']),
            ]),
        ];
    }
}

export namespace ESPoiTileset {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        url: "" as string | ESJResource,
        poiTypes: reactJsonWithUndefined<ESPoiType[]>(undefined),
        heightOffset: 40,
    });
}
extendClassProps(ESPoiTileset.prototype, ESPoiTileset.createDefaultProps);
export interface ESPoiTileset extends UniteChanged<ReturnType<typeof ESPoiTileset.createDefaultProps>> { }
