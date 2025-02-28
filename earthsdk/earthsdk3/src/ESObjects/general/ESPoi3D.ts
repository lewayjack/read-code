import { extendClassProps, ReactivePropsToNativePropsAndChanged, reactJson, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { EnumProperty, GroupProperty, JsonProperty } from "../../ESJTypes";

export class ESPoi3D extends ESObjectWithLocation {
    static readonly type = this.register("ESPoi3D", this, { chsName: "ESPoi3D", tags: ["ESObjects", "_ES_Impl_Cesium", "_ES_Impl_UE"], description: "三角形，菱形" });
    get typeName() { return 'ESPoi3D'; }
    override get defaultProps() { return ESPoi3D.createDefaultProps(); }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        //三角形，菱形
        modes: [['三角形', 'triangle'], ['菱形', 'diamond']] as [name: string, value: string][],
        mode: 'triangle' as 'triangle' | 'diamond',
        style: {
            "UI_Color": [0.09803921568627451, 0.40784313725490196, 0.8, 1],
            "FX_Color": [0.09803921568627451, 0.40784313725490196, 0.8, 1],
        } as { [xx: string]: any },
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
                new EnumProperty('模式', 'mode', false, false, [this, 'mode'], ESPoi3D.defaults.modes),
                new JsonProperty('样式', 'style', false, false, [this, 'style'], ESPoi3D.defaults.style),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new EnumProperty('模式', 'mode', false, false, [this, 'mode'], ESPoi3D.defaults.modes),
                new JsonProperty('样式', 'style', false, false, [this, 'style'], ESPoi3D.defaults.style),
            ])
        ]
    }
}

export namespace ESPoi3D {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        mode: 'triangle',
        style: reactJson<{ [xx: string]: any }>(ESPoi3D.defaults.style),
    })
}

extendClassProps(ESPoi3D.prototype, ESPoi3D.createDefaultProps);
export interface ESPoi3D extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESPoi3D.createDefaultProps>> { }