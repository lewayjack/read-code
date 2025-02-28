import { extendClassProps, UniteChanged } from "xbsj-base";
import { ESGeoVector } from "../base";

/**
 * https://www.wolai.com/earthsdk/37rp47JvTtZqEJESf5AuQu
 */
export class ESDirectionMeasurement extends ESGeoVector {
    static readonly type = this.register('ESDirectionMeasurement', this, { chsName: '方位角测量', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "方位角测量" });
    get typeName() { return 'ESDirectionMeasurement'; }
    override get defaultProps() { return ESDirectionMeasurement.createDefaultProps(); }

    override get strokeWidth() { return this.strokeStyle.width; }
    override set strokeWidth(value: number) { this.strokeStyle = { ...this.strokeStyle, width: value } }

    constructor(id?: string) {
        super(id);

        {
            this.stroked = true;
            this.strokeStyle = {
                width: 10,
                widthType: 'screen',
                color: [1, 1, 1, 1],
                material: '',
                materialParams: {},
                ground: false
            }

        }
    }
    static override defaults = {
        ...ESGeoVector.defaults
    };

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
        ]
    }
}

export namespace ESDirectionMeasurement {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
    });
}
extendClassProps(ESDirectionMeasurement.prototype, ESDirectionMeasurement.createDefaultProps);
export interface ESDirectionMeasurement extends UniteChanged<ReturnType<typeof ESDirectionMeasurement.createDefaultProps>> { }
