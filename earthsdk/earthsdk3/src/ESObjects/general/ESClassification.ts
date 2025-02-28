// import { GroupProperty, NumberProperty } from "xbsj-xe2/dist-node/xe2-base-objects";
// import { PartialWithUndefinedReactivePropsToNativeProps, ReactivePropsToNativePropsAndChanged, extendClassProps } from "xbsj-xe2/dist-node/xe2-base-utils";
// import { ESFillStyle, ESGeoVector } from "../../base/objs";

import { extendClassProps, UniteChanged } from "xbsj-base";
import { ESJFillStyle, GroupProperty, NumberProperty } from "../../ESJTypes";
import { ESGeoVector } from "../base";

export class ESClassification extends ESGeoVector {
    static readonly type = this.register('ESClassification', this, { chsName: '倾斜单体化', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "平尾箭头" });
    get typeName() { return 'ESClassification'; }
    override get defaultProps() { return ESClassification.createDefaultProps(); }
    constructor(id?: string) {
        super(id);
        this.fillGround = true; //默认地面
    }
    static override defaults = {
        ...ESGeoVector.defaults,
        fillStyle: {
            material: '',
            materialParams: {},
            ground: true,
            color: [1, 1, 1, 1]
        } as ESJFillStyle,
        filled: true
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new NumberProperty('高度', '高度', false, false, [this, 'height'], 10),
            ]
        }
    }
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('高度', '高度', false, false, [this, 'height']),
            ]),
        ];
    }
}

export namespace ESClassification {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
        height: 10,
        filled: true
    });
}
extendClassProps(ESClassification.prototype, ESClassification.createDefaultProps);
export interface ESClassification extends UniteChanged<ReturnType<typeof ESClassification.createDefaultProps>> { }
