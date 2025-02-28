import { ESJVector2D, ESJWidgetEventInfo, EvalStringProperty, GroupProperty, Number2Property, NumberProperty } from "../../../ESJTypes";
import { Event, extendClassProps, react, reactArray, UniteChanged } from "xbsj-base";
import { ESObjectWithLocation } from "../../base";
import { defaulInstanceClassStr, defaultInnerHTML, ESGeoDivInstanceClass, instanceClassStrReadMe } from "./mds";

/**
 * https://www.wolai.com/earthsdk/e17QPxZkVnG3ujXj8sJ2un
 */
export class ESGeoDiv extends ESObjectWithLocation {
    static readonly type = this.register('ESGeoDiv', this, { chsName: 'ESGeoDiv', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESGeoDiv" });
    get typeName() { return 'ESGeoDiv'; }
    override get defaultProps() { return ESGeoDiv.createDefaultProps(); }

    private _widgetEvent = this.dv(new Event<[ESJWidgetEventInfo]>());
    get widgetEvent() { return this._widgetEvent };

    private _echartsFunReact = this.dv(react<(() => any) | undefined>(undefined));
    get echartsFun() { return this._echartsFunReact.value; }
    set echartsFun(value: (() => any) | undefined) { this._echartsFunReact.value = value; }
    get echartsFunChanged() { return this._echartsFunReact.changed; }

    private _instanceClassReact = this.dv(react<ESGeoDivInstanceClass | undefined>(undefined));
    get instanceClass() { return this._instanceClassReact.value; }
    set instanceClass(value: ESGeoDivInstanceClass | undefined) { this._instanceClassReact.value = value; }
    get instanceClassChanged() { return this._instanceClassReact.changed; }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        opacity: 1,
        anchor: [0.5, 1] as ESJVector2D,
        instanceClassStr: defaulInstanceClassStr,
        instanceClassStrReadMe: instanceClassStrReadMe,
        innerHTML: defaultInnerHTML,
        zOrder: 0,
    };

    constructor(id?: string) {
        super(id);

        const updateInstanceClassStr = () => {
            try {
                this.instanceClass = this.instanceClassStr && Function(`"use strict";return (${this.instanceClassStr})`)();
            } catch (error) {
                this.instanceClass = undefined;
            }
        };
        updateInstanceClassStr();
        this.d(this.instanceClassStrChanged.don(updateInstanceClassStr));

        {
            const update = () => {
                if (this.innerHTML === undefined) {
                    this.instanceClassStr = undefined;
                    return;
                }

                const instanceClassStr = `class MyDiv {
                    // container是Poi的div
                    // geoCustomDivPoi指向当前的GeoCustomDivPoi场景对象
                    // viewer指定当前的视口
                    constructor(container, eSGeoDiv, viewer) {
                        this._container = container;
                        this._div = document.createElement('div');
                        this._div.style.position = 'relative';
                        this._container.appendChild(this._div);
                        this._div.innerHTML = \`${this.innerHTML}\`;
                    }
                
                    // 销毁函数，注意此函数必需，否则会报错！
                    destroy() {
                        this._container.removeChild(this._div);
                    }
                }`;
                this.instanceClassStr = instanceClassStr;
            };
            update();
            this.d(this.innerHTMLChanged.don(update));
        }
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new NumberProperty('透明度', '透明度', true, false, [this, 'opacity'], ESGeoDiv.defaults.opacity),
                new NumberProperty('zOrder', 'zOrder', true, false, [this, 'zOrder'], ESGeoDiv.defaults.zOrder),
                new Number2Property('偏移比例', '偏移比例.', true, false, [this, 'anchor'], ESGeoDiv.defaults.anchor),
                new EvalStringProperty('innerHTML', '注意设置此属性设置此属性会自动更新instanceClassStr变量', true, false, [this, 'innerHTML'], ESGeoDiv.defaults.innerHTML),
                new EvalStringProperty('实例类', '实例类', true, false, [this, 'instanceClassStr'], ESGeoDiv.defaults.instanceClassStr, ESGeoDiv.defaults.instanceClassStrReadMe),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new Number2Property('偏移比例', '偏移比例.', true, false, [this, 'anchor'], ESGeoDiv.defaults.anchor),
                new NumberProperty('透明度', '透明度', true, false, [this, 'opacity'], ESGeoDiv.defaults.opacity),
                new EvalStringProperty('实例类', '实例类', true, false, [this, 'instanceClassStr'], ESGeoDiv.defaults.instanceClassStr, ESGeoDiv.defaults.instanceClassStrReadMe),
                new EvalStringProperty('innerHTML', '注意设置此属性设置此属性会自动更新instanceClassStr变量', true, false, [this, 'innerHTML'], ESGeoDiv.defaults.innerHTML),
                new NumberProperty('zOrder', 'zOrder', true, false, [this, 'zOrder'], ESGeoDiv.defaults.zOrder),
            ]),
        ]
    }
}

export namespace ESGeoDiv {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        opacity: 1,
        anchor: reactArray<[leftRatio: number, topRatio: number]>([0.5, 1]), // 为undefined时设置为[0.5, 1.0]
        instanceClassStr: undefined as string | undefined,
        innerHTML: defaultInnerHTML as string | undefined,
        zOrder: 0,
    });
}
extendClassProps(ESGeoDiv.prototype, ESGeoDiv.createDefaultProps);
export interface ESGeoDiv extends UniteChanged<ReturnType<typeof ESGeoDiv.createDefaultProps>> { }
