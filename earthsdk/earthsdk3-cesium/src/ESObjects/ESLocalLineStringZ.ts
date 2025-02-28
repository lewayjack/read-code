import { BooleanProperty, ColorProperty, DashPatternProperty, ESLocalVector, GroupProperty, Number3sProperty, NumberProperty } from "earthsdk3";
import { extendClassProps, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactPositions, SceneObjectKey } from "xbsj-base";

export class ESLocalLineStringZ extends ESLocalVector {
    static readonly type = this.register('ESLocalLineStringZ', this, { chsName: '局部坐标折线', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESLocalLineStringZ" });
    get typeName() { return 'ESLocalLineStringZ'; }
    override get defaultProps() { return { ...ESLocalLineStringZ.createDefaultProps() }; }

    constructor(id?: SceneObjectKey) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new Number3sProperty('本地位置数组', '本地位置数组', true, false, [this, 'points']),
            ]),
            new GroupProperty('czm', 'czm', [
                new BooleanProperty('首尾相连', '首尾相连', false, false, [this, 'loop']),
                // new NumberProperty('线宽', '线宽', true, false, [this, 'width']),
                // new ColorProperty('颜色', ' A Property specifying the color.', true, false, [this, 'color'], [1, 1, 1, 1]),
                new BooleanProperty('是否为虚线', '是否为虚线.', false, false, [this, 'hasDash']),
                new ColorProperty('间隔颜色', 'A Property specifying the color.', false, false, [this, 'gapColor']),
                new NumberProperty('虚线长度', '虚线长度', false, false, [this, 'dashLength']),
                new DashPatternProperty('虚线图案', '虚线图案', false, false, [this, 'dashPattern']),
                new BooleanProperty('是否带箭头', '是否带箭头.', false, false, [this, 'hasArrow']),
                new BooleanProperty('是否开启深度检测', 'A boolean Property specifying the visibility.', false, false, [this, 'depthTest']),
            ]),
        ];
    }
}

export namespace ESLocalLineStringZ {
    export const createDefaultProps = () => ({
        ...ESLocalVector.createDefaultProps(),
        points: reactPositions(undefined),

        loop: true,
        width: undefined as number | undefined, // undfined时为1.0，A numeric Property specifying the width in pixels.
        color: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined), // default [1, 1, 1, 1]
        hasDash: true,
        gapColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]), // default [0, 0, 0, 0]
        dashLength: 16, // default 16
        dashPattern: 255, // default 255
        hasArrow: true,
        depthTest: false, //深度检测
        stroked: true,
    });
}
extendClassProps(ESLocalLineStringZ.prototype, ESLocalLineStringZ.createDefaultProps);
export interface ESLocalLineStringZ extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESLocalLineStringZ.createDefaultProps>> { }