

import { extendClassProps, JsonValue, UniteChanged } from "xbsj-base";
import { ESGeoPolygon } from "./ESGeoPolygon";
import { ESJFillStyle } from "../../ESJTypes";
/**
 * https://www.wolai.com/earthsdk/owzYtkDnctKcA9CCiYAX2i
 */
export class ESAreaMeasurement extends ESGeoPolygon {
    static override readonly type = this.register('ESAreaMeasurement', this, { chsName: '面积测量', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "面积测量" });
    override get typeName() { return 'ESAreaMeasurement'; }
    override get defaultProps() { return ESAreaMeasurement.createDefaultProps(); }

    override get fillMaterial() { return this.fillStyle.material; }
    override set fillMaterial(value: string) { this.fillStyle = { ...this.fillStyle, material: value } }

    override  get fillMaterialParams() { return this.fillStyle ? this.fillStyle.materialParams : ESAreaMeasurement.defaults.fillStyle.materialParams; }
    override set fillMaterialParams(value: JsonValue | undefined) { this.fillStyle = { ...this.fillStyle ?? ESAreaMeasurement.defaults.fillStyle, materialParams: value ?? ESAreaMeasurement.defaults.fillStyle.materialParams } }

    static override defaults = {
        ...ESGeoPolygon.defaults,
        fillStyle: {
            color: [1, 1, 1, 1],
            material: "Material'/EarthSDKForUE/M_ES_Material.M_ES_Material'",
            materialParams: { Opacity: 0.4 },
            ground: false,
        } as ESJFillStyle,
    };

    constructor(id?: string) {
        super(id);
        this.fillStyle.ground = true;
        this.strokeStyle.width = 2;
    }

    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
        ]
    }
}

export namespace ESAreaMeasurement {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        stroked: true,
        filled: true
    });
}
extendClassProps(ESAreaMeasurement.prototype, ESAreaMeasurement.createDefaultProps);
export interface ESAreaMeasurement extends UniteChanged<ReturnType<typeof ESAreaMeasurement.createDefaultProps>> { }
