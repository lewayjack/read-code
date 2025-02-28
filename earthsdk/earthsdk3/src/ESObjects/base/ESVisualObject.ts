import {
    BooleanProperty, ESJFlyInParam, ESJFlyToParam, ESJPickedInfo, ESPropertiesType, FunctionProperty,
    GroupProperty, JsonProperty, NumberProperty, StringProperty
} from "../../ESJTypes";
import { Event, extendClassProps, Listener, reactJsonWithUndefined, UniteChanged } from "xbsj-base";
import { ESSceneObject } from "./ESSceneObject";
import { ESViewer } from "../../ESViewer";

export abstract class ESVisualObject extends ESSceneObject {
    /**
         * 弃用变量管理器
         * 请勿使用该属性
         */
    _deprecated: ({ [k: string]: any } | string)[] = [];
    /**
      * 弃用变量管理器
      * 请勿使用该方法
      */
    _deprecatedWarning() {
        const includes = this._deprecated;
        for (let i = 0; i < includes.length; i++) {
            const element = includes[i];
            if (typeof element === "string") {
                const flag = Reflect.has(this, element + 'Changed');
                if (flag) {
                    //@ts-ignore
                    this.d(this[element + 'Changed'].don(() => {
                        console.warn(`注意：${this.typeName} 的 ${element} 属性下版本将会被移除！`);
                    }));
                }
            } else {
                Object.keys(element).forEach((item: any) => {
                    const flag = Reflect.has(this, item + 'Changed');
                    if (flag) {
                        //@ts-ignore
                        this.d(this[item + 'Changed'].don((val) => {
                            const valueProp = element[item];
                            if (typeof valueProp === "string") {
                                console.warn(`注意：${this.typeName} 的 ${item} 属性下版本将会被移除！`);
                            } else {
                                Object.keys(valueProp).forEach((key => {
                                    if (val === key) {
                                        console.warn(`注意：${this.typeName} 的 ${item} 属性值 ${key} 下版本将会被移除,推荐使用属性值 ${valueProp[key]}`);
                                    }
                                }))
                            }
                        }))
                    }
                })
            }
        }
    }
    static _lastFlyInId = 0;
    private _flyInEvent = this.dv(new Event<[duration: number, id: number]>());
    get flyInEvent(): Listener<[duration: number, id: number]> { return this._flyInEvent; }
    flyIn(duration: number = 1) { this._flyInEvent.emit(duration, ESVisualObject._lastFlyInId); }

    static _lastFlyToId = 0;
    private _flyToEvent = this.dv(new Event<[duration: number, id: number]>());
    get flyToEvent(): Listener<[duration: number, id: number]> { return this._flyToEvent; }
    flyTo(duration: number = 1) { this._flyToEvent.emit(duration, ESVisualObject._lastFlyToId); }

    // flyTo的mode cancelled表示飞行过程中被强制取消了 over表示飞行正常结束 error表示出现其他错误
    private _flyOverEvent = this.disposeVar(new Event<[id: number, mode: 'cancelled' | 'over' | 'error', viewer: ESViewer]>());
    get flyOverEvent() { return this._flyOverEvent; }

    private _pickedEvent = this.dv(new Event<[ESJPickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    private _calcFlyToParamEvent = this.dv(new Event());
    get calcFlyToParamEvent(): Listener { return this._calcFlyToParamEvent; }
    calcFlyToParam() { this._calcFlyToParamEvent.emit(); }

    private _calcFlyInParamEvent = this.dv(new Event());
    get calcFlyInParamEvent(): Listener { return this._calcFlyInParamEvent; }
    calcFlyInParam() { this._calcFlyInParamEvent.emit(); }

    emptyFlyToParam() { this.flyToParam = undefined; }
    emptyFlyInParam() { this.flyInParam = undefined; }

    /**
     * 是否使用ESObjectWithLocation类中的calcFlyToParam
     */
    public useCalcFlyToParamInESObjectWithLocation = false;

    static override defaults = {
        ...ESSceneObject.defaults,
        show: true,
        collision: true,
        allowPicking: false,
        flyToParam: { distance: 0, heading: 0, pitch: 0, flyDuration: 1, hDelta: 0, pDelta: 0 } as ESJFlyToParam,
        flyInParam: { position: [0, 0, 0], rotation: [0, 0, 0], flyDuration: 1 } as ESJFlyInParam,
    };
    override  getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'general',
            general: [
                ...properties.general,
                new StringProperty('唯一标识', 'id', false, true, [this, 'id']),
                new StringProperty('名称', 'name', true, false, [this, 'name']),
                new BooleanProperty('是否显示', 'show', false, false, [this, 'show'], ESVisualObject.defaults.show),
                new BooleanProperty('开启碰撞', 'collision', false, false, [this, 'collision'], ESVisualObject.defaults.collision),
                new BooleanProperty('允许拾取', 'allowPicking', false, false, [this, 'allowPicking'], ESVisualObject.defaults.allowPicking),
                new FunctionProperty("保存观察视角", "保存当前flyToParam", [], () => this.calcFlyToParam(), []),
                new FunctionProperty("清空飞向参数", "清空飞向参数", [], () => this.emptyFlyToParam(), []),
                new FunctionProperty("清空飞入参数", "清空飞入参数", [], () => this.emptyFlyInParam(), []),
                new FunctionProperty('保存飞入参数', '保存飞入参数flyInParam', [], () => this.calcFlyInParam(), []),
            ],
        };
    };

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESVisualObject', 'ESVisualObject', [
                new BooleanProperty('是否显示', '是否显示.', false, false, [this, 'show'], ESVisualObject.defaults.show),
                new BooleanProperty('是否开启碰撞监测', 'collision,是否开启碰撞监测.', false, false, [this, 'collision'], ESVisualObject.defaults.collision),
                new BooleanProperty('是否允许拾取', '是否允许被鼠标点击拾取.', false, false, [this, 'allowPicking'], ESVisualObject.defaults.allowPicking),
                new GroupProperty('飞行定位', '飞向参数', [
                    new FunctionProperty("飞向", "飞向", ['number'], (duration: number) => this.flyTo(duration), [1]),
                    new JsonProperty('flyToParam', 'flyToParam', true, false, [this, 'flyToParam'], ESVisualObject.defaults.flyToParam),
                    new FunctionProperty("获取当前参数", "获取当前flyToParam", [], () => this.calcFlyToParam(), []),
                    new NumberProperty('flyToDistance', 'flyToDistance', true, false, [this, 'flyToDistance'], ESVisualObject.defaults.flyToParam.distance),
                    new NumberProperty('flyToHeading', 'flyToHeading', true, false, [this, 'flyToHeading'], ESVisualObject.defaults.flyToParam.heading),
                    new NumberProperty('flyToPitch', 'flyToPitch', true, false, [this, 'flyToPitch'], ESVisualObject.defaults.flyToParam.pitch),
                    new NumberProperty('flyToFlyDuration', 'flyToFlyDuration', true, false, [this, 'flyToFlyDuration'], ESVisualObject.defaults.flyToParam.flyDuration),
                    new NumberProperty('flyToHDelta', 'flyToHDelta', true, false, [this, 'flyToHDelta'], ESVisualObject.defaults.flyToParam.hDelta),
                    new NumberProperty('flyToPDelta', 'flyToPDelta', true, false, [this, 'flyToPDelta'], ESVisualObject.defaults.flyToParam.pDelta),
                ]),
                new GroupProperty('飞入定位', '飞入参数', [
                    new FunctionProperty("飞入", "飞入", ["number"], (duration: number) => this.flyIn(duration), [1]),
                    new JsonProperty('flyInParam', 'flyInParam', true, false, [this, 'flyInParam'], ESVisualObject.defaults.flyInParam),
                    new FunctionProperty('获取当前相机参数', '获取当前相机参数', [], () => this.calcFlyInParam(), []),
                ]),
            ]),
        ];
    }
    get flyToDistance() { return this.flyToParam && this.flyToParam.distance; }
    get flyToHeading() { return this.flyToParam && this.flyToParam.heading; }
    get flyToPitch() { return this.flyToParam && this.flyToParam.pitch; }
    get flyToFlyDuration() { return this.flyToParam && this.flyToParam.flyDuration; }
    get flyToHDelta() { return this.flyToParam && this.flyToParam.hDelta; }
    get flyToPDelta() { return this.flyToParam && this.flyToParam.pDelta; }

    get flyToDistanceChanged() { return this.flyToParamChanged; }
    get flyToHeadingChanged() { return this.flyToParamChanged; }
    get flyToPitchChanged() { return this.flyToParamChanged; }
    get flyToFlyDurationChanged() { return this.flyToParamChanged; }
    get flyToHDeltaChanged() { return this.flyToParamChanged; }
    get flyToPDeltaChanged() { return this.flyToParamChanged; }

    set flyToDistance(value: number | undefined) { this.flyToParam = (value !== undefined) ? ({ ...(this.flyToParam ?? ESVisualObject.defaults.flyToParam), distance: value }) : undefined; }
    set flyToHeading(value: number | undefined) { this.flyToParam = (value !== undefined) ? ({ ...(this.flyToParam ?? ESVisualObject.defaults.flyToParam), heading: value }) : undefined; }
    set flyToPitch(value: number | undefined) { this.flyToParam = (value !== undefined) ? ({ ...(this.flyToParam ?? ESVisualObject.defaults.flyToParam), pitch: value }) : undefined; }
    set flyToFlyDuration(value: number | undefined) { this.flyToParam = (value !== undefined) ? ({ ...(this.flyToParam ?? ESVisualObject.defaults.flyToParam), flyDuration: value }) : undefined; }
    set flyToHDelta(value: number | undefined) { this.flyToParam = (value !== undefined) ? ({ ...(this.flyToParam ?? ESVisualObject.defaults.flyToParam), hDelta: value }) : undefined; }
    set flyToPDelta(value: number | undefined) { this.flyToParam = (value !== undefined) ? ({ ...(this.flyToParam ?? ESVisualObject.defaults.flyToParam), pDelta: value }) : undefined; }
}

export namespace ESVisualObject {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        /**
         * https://www.wolai.com/earthsdk/u1sLHxcj6PErXf8ubcvC4j#aV7NLcX7GfjAvfEJwY3qVR
         */
        show: true,
        collision: true,
        allowPicking: false,
        flyToParam: reactJsonWithUndefined<ESJFlyToParam>(undefined),
        flyInParam: reactJsonWithUndefined<ESJFlyInParam>(undefined),
    });
}
extendClassProps(ESVisualObject.prototype, ESVisualObject.createDefaultProps);
export interface ESVisualObject extends UniteChanged<ReturnType<typeof ESVisualObject.createDefaultProps>> { }
