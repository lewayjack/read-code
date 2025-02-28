import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESSceneObject } from "../base";
import { BooleanProperty, ColorProperty, GroupProperty, NumberProperty } from "../../ESJTypes";

export class ESViewerStatusBar extends ESSceneObject {
    static readonly type = this.register('ESViewerStatusBar', this, { chsName: '状态栏', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "状态栏" });
    get typeName() { return 'ESViewerStatusBar'; }
    override get defaultProps() { return ESViewerStatusBar.createDefaultProps(); }

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
                new BooleanProperty('是否显示', 'A boolean Property specifying the visibility .', false, false, [this, 'show'], ESViewerStatusBar.defaults.show),
                new NumberProperty('高度', 'height', true, false, [this, 'height'], ESViewerStatusBar.defaults.height),
                new NumberProperty('文字大小', 'fontSize', true, false, [this, 'fontSize'], ESViewerStatusBar.defaults.fontSize),
                new ColorProperty('背景颜色', ' 背景颜色', true, false, [this, 'bgColor'], ESViewerStatusBar.defaults.bgColor),
            ]),
        ];
    }
}

export namespace ESViewerStatusBar {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        show: true,
        height: 30,
        fontSize: 14,
        bgColor: [71 / 255, 71 / 255, 71 / 255, 0.8] as [number, number, number, number]
    });
}
extendClassProps(ESViewerStatusBar.prototype, ESViewerStatusBar.createDefaultProps);
export interface ESViewerStatusBar extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESViewerStatusBar.createDefaultProps>> { }
