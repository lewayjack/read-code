import { EnumProperty, ESGeoVector, GroupProperty, Number2Property, NumberProperty, StringProperty } from "earthsdk3";
import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";

export class ESRoad extends ESGeoVector {
    static readonly type = this.register('ESRoad', this, { chsName: '贴地道路', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "最大宽度到1000米" });
    get typeName() { return 'ESRoad'; }
    override get defaultProps() { return ESRoad.createDefaultProps(); }

    static override defaults = {
        ...ESGeoVector.defaults,
        width: 50,
        arcType: 'GEODESIC',
        imageUrl: '${earthsdk3-assets-script-dir}/assets/img/roads/4.jpg',
        repeat: [100, 1] as [number, number],
    };

    constructor(id?: SceneObjectKey) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('线宽', '道路宽度，单位是米！', false, false, [this, 'width']),
                new EnumProperty('弧线类型', '弧线类型', false, false, [this, 'arcType'], [['直线', 'NONE'], ['地理直线', 'GEODESIC'], ['地理恒向线', 'RHUMB']]),
                new StringProperty('道路图片', '道路图片', false, false, [this, 'imageUrl']),
                new Number2Property('重复次数', '重复次数，该参数以后会取消！', false, false, [this, 'repeat']),
            ]),
        ];
    }
}

export namespace ESRoad {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
        width: 50, // undfined时为1.0，A numeric Property specifying the width in pixels.
        arcType: 'GEODESIC',
        // material: reactJson({ type: 'Color' } as CzmMaterialJsonType),
        imageUrl: '${earthsdk3-assets-script-dir}/assets/img/roads/4.jpg',
        repeat: [100, 1],
        stroked: true,
    });
}
extendClassProps(ESRoad.prototype, ESRoad.createDefaultProps);
export interface ESRoad extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESRoad.createDefaultProps>> { }
