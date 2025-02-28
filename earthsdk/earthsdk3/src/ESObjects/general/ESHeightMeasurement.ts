import { extendClassProps, UniteChanged } from "xbsj-base";
import { ESGeoVector } from "../base";
/**
 * https://www.wolai.com/earthsdk/8nkhuLbWJ44X4sV5hD5HPU
 */
export class ESHeightMeasurement extends ESGeoVector {
    static readonly type = this.register('ESHeightMeasurement', this, { chsName: '高度测量', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "高度测量" });
    get typeName() { return 'ESHeightMeasurement'; }
    override get defaultProps() { return ESHeightMeasurement.createDefaultProps(); }
    constructor(id?: string) {
        super(id);
        this.stroked = true;
        this.strokeStyle.width = 2;
    }
    static override defaults = { ...ESGeoVector.defaults };

    override getProperties(language?: string) {
        return [...super.getProperties(language)]
    }
}

export namespace ESHeightMeasurement {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
    });
}
extendClassProps(ESHeightMeasurement.prototype, ESHeightMeasurement.createDefaultProps);
export interface ESHeightMeasurement extends UniteChanged<ReturnType<typeof ESHeightMeasurement.createDefaultProps>> { }
