import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey, UniteChanged } from "xbsj-base";
import { ESSceneObject } from "../base";
import { BooleanProperty, ColorProperty, GroupProperty, NumberProperty } from "../../ESJTypes";

export class ESViewerStatusBarScale extends ESSceneObject {
    static readonly type = this.register('ESViewerStatusBarScale', this, { chsName: '比例尺状态栏', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "状态栏" });
    get typeName() { return 'ESViewerStatusBarScale'; }
    override get defaultProps() { return ESViewerStatusBarScale.createDefaultProps(); }

    static override defaults = {
        ...ESSceneObject.defaults,
        show: true,
        height: 30,
        fontSize: 14,
        bgColor: [71, 71, 71, 0.8] as [number, number, number, number]
    }
    constructor(id?: SceneObjectKey) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new BooleanProperty('是否显示', 'A boolean Property specifying the visibility .', false, false, [this, 'show'], ESViewerStatusBarScale.defaults.show),
                new NumberProperty('高度', 'height', true, false, [this, 'height'], ESViewerStatusBarScale.defaults.height),
                new NumberProperty('文字大小', 'fontSize', true, false, [this, 'fontSize'], ESViewerStatusBarScale.defaults.fontSize),
                new ColorProperty('背景颜色', ' 背景颜色', true, false, [this, 'bgColor'], ESViewerStatusBarScale.defaults.bgColor),
            ]),
        ];
    }
}

export namespace ESViewerStatusBarScale {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        show: true,
        height: 30,
        fontSize: 14,
        bgColor: [71 / 255, 71 / 255, 71 / 255, 0.8] as [number, number, number, number]
    });
}
extendClassProps(ESViewerStatusBarScale.prototype, ESViewerStatusBarScale.createDefaultProps);
export interface ESViewerStatusBarScale extends UniteChanged<ReturnType<typeof ESViewerStatusBarScale.createDefaultProps>> { }
