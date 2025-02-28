import { extendClassProps, reactArray, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { BooleanProperty, ColorProperty, GroupProperty, NumberProperty, StringProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/jCohNroEuUaW8sxns466Hj
 */
export class ESClippingPlane extends ESObjectWithLocation {
    static readonly type = this.register('ESClippingPlane', this, { chsName: '裁切', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESClippingPlane" });
    get typeName() { return 'ESClippingPlane'; }
    override get defaultProps() { return ESClippingPlane.createDefaultProps(); }

    constructor(id?: SceneObjectKey) {
        super(id);
    }
    static override defaults = {
        ...ESObjectWithLocation.defaults,
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new BooleanProperty('显示箭头', '显示箭头', false, false, [this, 'showArrow'], true),
                new ColorProperty('线框颜色', 'edgeColor', false, false, [this, 'edgeColor'], [1, 1, 1, 1]),
                new NumberProperty('线框宽度', 'edgetWidth', false, false, [this, 'edgetWidth'], 2),
                new NumberProperty('裁剪宽度', 'width', false, false, [this, 'width'], 200),
                new NumberProperty('裁剪高度', 'height', false, false, [this, 'height'], 200),
                new StringProperty('瓦片图层', 'targetID', false, false, [this, 'targetID'], '')
            ]
        }
    }
    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new GroupProperty('czm', 'czm', [
                    new BooleanProperty('显示箭头', '显示箭头', false, false, [this, 'showArrow']),
                    new ColorProperty('edgeColor', 'edgeColor', false, false, [this, 'edgeColor']),
                    new NumberProperty('edgetWidth', 'edgetWidth', false, false, [this, 'edgetWidth']),
                    new NumberProperty('width', 'width', false, false, [this, 'width']),
                    new NumberProperty('height', 'height', false, false, [this, 'height']),
                    new StringProperty('targetID', 'targetID', false, false, [this, 'targetID']),
                ]),
            ]),
        ];
    }
}

export namespace ESClippingPlane {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        showArrow: true,
        edgeColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        edgetWidth: 2,
        // minSize: reactArray<[number, number]>([-100, -100]),
        // maxSize: reactArray<[number, number]>([100, 100]),
        width: 200,
        height: 200,
        targetID: ""
    });
}
extendClassProps(ESClippingPlane.prototype, ESClippingPlane.createDefaultProps);
export interface ESClippingPlane extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESClippingPlane.createDefaultProps>> { }