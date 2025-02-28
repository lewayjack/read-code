import { ESJColor, ESJStrokeStyle } from "../../ESJTypes";
import { ESGeoLineString } from "./ESGeoLineString";
import { extendClassProps, reactJson, UniteChanged } from "xbsj-base";
/**
 * https://www.wolai.com/earthsdk/wxeuk8gv9v4PzHBZ6pURww
 */
export class ESDistanceMeasurement extends ESGeoLineString {
    static override readonly type = this.register('ESDistanceMeasurement', this, { chsName: '距离测量', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "距离测量" });
    override get typeName() { return 'ESDistanceMeasurement'; }
    override get defaultProps() { return ESDistanceMeasurement.createDefaultProps(); }

    override get strokeColor() { return this.strokeStyle.color; }
    override set strokeColor(value: ESJColor) { this.strokeStyle = { ...this.strokeStyle, color: [...value] } }


    static override defaults = {
        ...ESGeoLineString.defaults,
        strokeStyle: {
            width: 2,
            widthType: 'screen',
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {}
        } as ESJStrokeStyle,
    };
    constructor(id?: string) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
        ]
    }
}

export namespace ESDistanceMeasurement {
    export const createDefaultProps = () => ({
        ...ESGeoLineString.createDefaultProps(),
        strokeStyle: reactJson<ESJStrokeStyle>(ESDistanceMeasurement.defaults.strokeStyle),
    });
}
extendClassProps(ESDistanceMeasurement.prototype, ESDistanceMeasurement.createDefaultProps);
export interface ESDistanceMeasurement extends UniteChanged<ReturnType<typeof ESDistanceMeasurement.createDefaultProps>> { }
