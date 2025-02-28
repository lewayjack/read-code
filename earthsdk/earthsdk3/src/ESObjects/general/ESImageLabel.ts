import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESLabel } from "../base";
import { ESJResource, ESJVector2D, GroupProperty, JsonProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/nQC5LdV6sHdtLxve1bnbLz
 */
export class ESImageLabel extends ESLabel {
    static readonly type = this.register('ESImageLabel', this, { chsName: '图片标签', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "基础图片标签。" });
    get typeName() { return 'ESImageLabel'; }
    override get defaultProps() { return ESImageLabel.createDefaultProps(); }

    static override defaults = {
        ...ESLabel.defaults,
        url: 'inner://CameraBlue.png',
        anchor: [0.5, 1] as ESJVector2D,
        renderMode: 4,
    }

    constructor(id?: SceneObjectKey) {
        super(id);
        this.anchor = ESImageLabel.defaults.anchor;
        this.renderMode = ESImageLabel.defaults.renderMode;
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new JsonProperty("图片路径", "图片路径", false, false, [this, 'url'], ESImageLabel.defaults.url),
                // new BooleanProperty('屏幕渲染', '是否开启屏幕渲染模式', false, false, [this, 'screenRender'], true),
                // new BooleanProperty('尺寸自适应', '尺寸是否根据内容自动计算', false, false, [this, 'sizeByContent'], true),
                // new Number2Property('尺寸大小', '尺寸自适应关闭才会生效', false, false, [this, 'size'], [100, 100]),
                // new Number2Property('偏移比例', '偏移比例(anchor)', false, false, [this, 'anchor'], ESImageLabel.defaults.anchor),
                // new EnumProperty('渲染模式', '八种渲染模式(0~7),当Widget中透明度只有(0,1)两种时可以选择2', false, false, [this, 'renderMode'], renderModeEnum, 0),
                // new EnumProperty('旋转类型', '三种漫游旋转类型(0,1,2)', false, false, [this, 'rotationType'], rotationTypeEnum, 1),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty("图片路径", "图片路径", false, false, [this, 'url']),
            ]),
        ];
    }
}
export namespace ESImageLabel {
    export const createDefaultProps = () => ({
        ...ESLabel.createDefaultProps(),
        url: 'inner://CameraBlue.png' as string | ESJResource,
    });
}
extendClassProps(ESImageLabel.prototype, ESImageLabel.createDefaultProps);
export interface ESImageLabel extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESImageLabel.createDefaultProps>> { }
