import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";

/**
 * https://www.wolai.com/earthsdk/dQJgf3fj4X1xUwZ38dfiMB
 */
export class ESLocationMeasurement extends ESObjectWithLocation {
    static readonly type = this.register('ESLocationMeasurement', this, { chsName: '位置测量点', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "位置测量点" });
    get typeName() { return 'ESLocationMeasurement'; }
    override get defaultProps() { return ESLocationMeasurement.createDefaultProps(); }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
    }
    constructor(id?: SceneObjectKey) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
        ];
    }
}

export namespace ESLocationMeasurement {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
    });
}
extendClassProps(ESLocationMeasurement.prototype, ESLocationMeasurement.createDefaultProps);
export interface ESLocationMeasurement extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESLocationMeasurement.createDefaultProps>> { }