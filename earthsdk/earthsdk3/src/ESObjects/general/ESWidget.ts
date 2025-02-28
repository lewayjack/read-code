import { extendClassProps, reactArray, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESLabel } from "../base";
import { GroupProperty, JsonProperty, NumberProperty, PositionProperty, StringProperty } from "./../../ESJTypes";

const infoMD = `
#### 默认值如下
${'```'}js
    { 
        "Title": "示例",
        "Key":"Value",
        "内容": "这是一个示例\\n帮助你理解info的数据形式\\nnum:1\\nkey:'value'\\n"
    }
${'```'}`

export type ESWidgetInfoType = {
    [xx: string]: any
}
const rotationTypeEnum = [['固定朝向', 0], ['面向屏幕旋转', 1], ['绕自身Z轴旋转', 2]] as [string, number][];
/**
 * https://www.wolai.com/earthsdk/79HfDhosrSfpcfTnvRryyG
 */
export class ESWidget extends ESLabel {
    static readonly type = this.register('ESWidget', this, { chsName: '部件', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ES组件" });
    get typeName() { return 'ESWidget'; }
    override get defaultProps() { return ESWidget.createDefaultProps(); }

    static override defaults = {
        ...ESLabel.defaults,
        info: {
            "title": '标题示例',
            "内容": '内容示例',
        } as ESWidgetInfoType,
        widgetClass: "WidgetBlueprint'/EarthSDKForUE/Widget/WBP_ES_DefaultInfo.WBP_ES_DefaultInfo'",
        actorTag: '',
        socketName: '',
        positionOffset: [0, 0, 0] as [number, number, number],
        rotationOffset: [0, 0, 0] as [number, number, number],
        allowTextEditing: true,
        opacity: 1,
    }

    constructor(id?: SceneObjectKey) {
        super(id);
        this.anchor = [0.5, 1];
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new JsonProperty('信息', 'info', true, false, [this, 'info'], ESWidget.defaults.info, infoMD),
                // new BooleanProperty('屏幕渲染', '是否开启屏幕渲染模式', false, false, [this, 'screenRender'], true),
                // new BooleanProperty('尺寸自适应', '尺寸是否根据内容自动计算', false, false, [this, 'sizeByContent'], true),
                // new Number2Property('尺寸大小', '尺寸自适应关闭才会生效', false, false, [this, 'size'], [100, 100]),
                // new Number2Property('偏移比例', '偏移比例(anchor)', false, false, [this, 'anchor'], [0.5, 1]),
                // new EnumProperty('漫游旋转类型', '三种漫游旋转类型(0,1,2)', false, false, [this, 'rotationType'], rotationTypeEnum, 1),
                // new Number3Property('坐标偏移', 'positionOffset(米)', false, false, [this, 'positionOffset']),
                // new Number3Property('旋转偏移', 'rotationOffset(米)', false, false, [this, 'rotationOffset']),
                // new StringProperty("actorTag", "actorTag", false, false, [this, 'actorTag']),
                // new StringProperty("widgetClass", "widgetClass", false, false, [this, 'widgetClass']),
                // new StringProperty("socketName", "socketName", false, false, [this, 'socketName']),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty('信息', 'info', true, false, [this, 'info'], ESWidget.defaults.info, infoMD)
            ]),
            new GroupProperty('ue', 'ue', [
                new PositionProperty('坐标偏移', 'positionOffset(米)', false, false, [this, 'positionOffset']),
                new PositionProperty('旋转偏移', 'rotationOffset(米)', false, false, [this, 'rotationOffset']),
                new StringProperty("actorTag", "actorTag", false, false, [this, 'actorTag']),
                new StringProperty("widgetClass", "widgetClass", false, false, [this, 'widgetClass']),
                new StringProperty("socketName", "socketName", false, false, [this, 'socketName']),
            ]),
            new GroupProperty('czm', 'czm', [
                new NumberProperty('透明度', '透明度', true, false, [this, 'opacity'], ESWidget.defaults.opacity),
            ])
        ]
    }
}

export namespace ESWidget {
    export const createDefaultProps = () => ({
        ...ESLabel.createDefaultProps(),
        info: {
            "title": '标题示例',
            "内容": '内容示例',
        } as ESWidgetInfoType,
        widgetClass: undefined as string | undefined,
        actorTag: "",
        socketName: "",
        positionOffset: reactArray<[number, number, number]>([0, 0, 0]),
        rotationOffset: reactArray<[number, number, number]>([0, 0, 0]),
        opacity: 1,
    });
}
extendClassProps(ESWidget.prototype, ESWidget.createDefaultProps);
export interface ESWidget extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESWidget.createDefaultProps>> { }