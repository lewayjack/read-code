import { extendClassProps, reactArray, ReactivePropsToNativePropsAndChanged, reactJsonWithUndefined, SceneObjectKey, Event } from "xbsj-base";
import { ESLabel } from "../base";
import { FunctionProperty, GroupProperty, JsonProperty, Number3Property, PositionProperty, StringProperty } from "../../ESJTypes";

const infoMD = `
#### 默认值如下
${'```'}js
    { 
        "Title": "示例",
        "Content": "这是一个示例\\n帮助你理解info的数据形式\\nnum:1\\nkey:'value'\\n"
    }
${'```'}`

export type ESUEWidgetInfoType = {
    Title: string;
    Content: string;
}


export class ESUEWidget extends ESLabel {
    static readonly type = this.register('ESUEWidget', this, { chsName: '部件', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "3DTileset" });
    get typeName() { return 'ESUEWidget'; }
    override get defaultProps() { return ESUEWidget.createDefaultProps(); }

    private _callFunctionEvent = this.disposeVar(new Event<[string, { [k: string]: any }]>());
    get callFunctionEvent() { return this._callFunctionEvent; }
    callFunction(fn: string, param: { [k: string]: any }) { this._callFunctionEvent.emit(fn, param); }

    static override defaults = {
        ...ESLabel.defaults,
        info: {
            Title: '标题示例',
            Content: '内容示例',
        } as ESUEWidgetInfoType,
        widgetClass: '',
        socketName: '',
        positionOffset: [0, 0, 0] as [number, number, number],
        actorTag: '',
        rotationOffset: [0, 0, 0] as [number, number, number],
    }

    constructor(id?: SceneObjectKey) {
        super(id);
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new Number3Property('positionOffset', 'positionOffset(米)', false, false, [this, 'positionOffset'], ESUEWidget.defaults.positionOffset),
                new Number3Property('rotationOffset', 'rotationOffset(米)', false, false, [this, 'rotationOffset'], ESUEWidget.defaults.rotationOffset),
                new StringProperty("actorTag", "actorTag", false, false, [this, 'actorTag'], ESUEWidget.defaults.actorTag),
                new StringProperty("widgetClass", "widgetClass", false, false, [this, 'widgetClass'], ESUEWidget.defaults.widgetClass),
                new StringProperty("socketName", "socketName", false, false, [this, 'socketName'], ESUEWidget.defaults.socketName),
                new JsonProperty('info', 'info', true, false, [this, 'info'], ESUEWidget.defaults.info, infoMD)
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new FunctionProperty('callFunction', 'callFunction', ['string', 'string'], (fn, param) => this.callFunction(fn, JSON.parse(param)), ['', '']),
                new PositionProperty('positionOffset', 'positionOffset(米)', false, false, [this, 'positionOffset']),
                new PositionProperty('rotationOffset', 'rotationOffset(米)', false, false, [this, 'rotationOffset']),
                new StringProperty("actorTag", "actorTag", false, false, [this, 'actorTag']),
                new StringProperty("widgetClass", "widgetClass", false, false, [this, 'widgetClass']),
                new StringProperty("socketName", "socketName", false, false, [this, 'socketName']),
                new JsonProperty('info', 'info', true, false, [this, 'info'], ESUEWidget.defaults.info, infoMD)
            ]),
        ]
    }
}

export namespace ESUEWidget {
    export const createDefaultProps = () => ({
        widgetClass: "",
        // socketName: "",
        // positionOffset: reactArray<[number, number, number]>([0, 0, 0]),
        // actorTag: "",
        // rotationOffset: reactArray<[number, number, number]>([0, 0, 0]),
        info: reactJsonWithUndefined<ESUEWidgetInfoType>(undefined),
        ...ESLabel.createDefaultProps(),
    });
}
extendClassProps(ESUEWidget.prototype, ESUEWidget.createDefaultProps);
export interface ESUEWidget extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESUEWidget.createDefaultProps>> { }
