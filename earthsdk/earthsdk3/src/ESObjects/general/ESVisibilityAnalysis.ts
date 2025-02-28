import { extendClassProps, reactArray, UniteChanged } from "xbsj-base";
import { ColorProperty, ESJVector4D, GroupProperty, NumberProperty } from "../../ESJTypes";
import { ESGeoVector } from "../base";

/**
 * https://www.wolai.com/earthsdk/riDycLwA9NsKsvHc51fohg
 */
export class ESVisibilityAnalysis extends ESGeoVector {
    static readonly type = this.register('ESVisibilityAnalysis', this, { chsName: '通视分析,视线分析', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "通视分析,视线分析" });
    get typeName() { return 'ESVisibilityAnalysis'; }
    override get defaultProps() { return ESVisibilityAnalysis.createDefaultProps(); }
    static override defaults = {
        ...ESGeoVector.defaults,
        visibleColor: [0, 1, 0, 1] as ESJVector4D,
        invisibleColor: [1, 0, 0, 1] as ESJVector4D,
        heightOffset: 0,
    }

    constructor(id?: string) {
        super(id);
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new ColorProperty('可视区域颜色', '可视区域颜色.', false, false, [this, 'visibleColor'], ESVisibilityAnalysis.defaults.visibleColor),
                new ColorProperty('遮挡区域颜色', '遮挡区域颜色.', false, false, [this, 'invisibleColor'], ESVisibilityAnalysis.defaults.invisibleColor),
                new NumberProperty('视点高度偏移', "heightOffset", false, false, [this, 'heightOffset'], ESVisibilityAnalysis.defaults.heightOffset),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new ColorProperty('可视区域颜色', '可视区域颜色.', false, false, [this, 'visibleColor'], ESVisibilityAnalysis.defaults.visibleColor),
                new ColorProperty('遮挡区域颜色', '遮挡区域颜色.', false, false, [this, 'invisibleColor'], ESVisibilityAnalysis.defaults.invisibleColor),
                new NumberProperty('视点高度偏移', "heightOffset", false, false, [this, 'heightOffset'], ESVisibilityAnalysis.defaults.heightOffset),
            ]),
        ]
    }
}

export namespace ESVisibilityAnalysis {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
        visibleColor: reactArray<ESJVector4D>([0, 1, 0, 1]),
        invisibleColor: reactArray<ESJVector4D>([1, 0, 0, 1]),
        heightOffset: 0,
    })
}
extendClassProps(ESVisibilityAnalysis.prototype, ESVisibilityAnalysis.createDefaultProps);
export interface ESVisibilityAnalysis extends UniteChanged<ReturnType<typeof ESVisibilityAnalysis.createDefaultProps>> { };

