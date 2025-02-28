import {
    BooleanProperty, ESJVector3D, FunctionProperty, GroupProperty,
    Number3Property, NumberProperty, PositionProperty, RotationProperty
} from "../../ESJTypes";
import { Event, extendClassProps, Listener, react, reactArray, UniteChanged } from "xbsj-base";
import { ESVisualObject } from "./ESVisualObject";

export abstract class ESObjectWithLocation extends ESVisualObject {

    private _statusDis = this.dv(react<boolean>(true));
    get statusDis() { return this._statusDis.value; }
    get statusDisChanged() { return this._statusDis.changed; }

    private _smoothMoveEvent = this.dv(new Event<[ESJVector3D, number]>());
    get smoothMoveEvent() { return this._smoothMoveEvent; }
    /**
     * 平滑移动到指定位置
     * @param Destination - 目标位置，格式为[经度, 纬度, 高度]
     * @param Time - 平滑移动所需的时间，单位为秒
     */
    smoothMove(Destination: ESJVector3D, Time: number) { this._smoothMoveEvent.emit(Destination, Time); }

    private _smoothMoveWithRotationEvent = this.dv(new Event<[ESJVector3D, ESJVector3D, number]>());
    get smoothMoveWithRotationEvent() { return this._smoothMoveWithRotationEvent; }
    /**
     * 平滑偏移到指定位置和姿态
     * @param destination - 目标位置，格式为[经度, 纬度, 高度]
     * @param newRotation - 目标姿态，格式为[偏航角, 俯仰角, 翻转角]
     * @param time - 平滑移动所需的时间，单位为秒
     */
    smoothMoveWithRotation(Destination: ESJVector3D, NewRotation: ESJVector3D, Time: number) { this._smoothMoveWithRotationEvent.emit(Destination, NewRotation, Time); }


    private _smoothMoveOnGroundEvent = this.dv(new Event<[number, number, number, string]>());
    get smoothMoveOnGroundEvent() { return this._smoothMoveOnGroundEvent; };
    /**
     * 贴地平滑移动
     * @param Lon - 目标位置的经度
     * @param Lat - 目标位置的纬度
     * @param Time - 平滑移动所需的时间，单位为秒
     * @param Ground - 地面类型，ue特有属性
     */
    smoothMoveOnGround(Lon: number, Lat: number, Time: number, Ground: string) { this._smoothMoveOnGroundEvent.emit(Lon, Lat, Time, Ground); }

    private _smoothMoveWithRotationOnGroundEvent = this.dv(new Event<[ESJVector3D, number, number, number, string]>());
    get smoothMoveWithRotationOnGroundEvent() { return this._smoothMoveWithRotationOnGroundEvent; }
    /**
     * 贴地平滑偏移到指定位置和姿态
     * @param newRotation - 目标姿态，格式为[偏航角, 俯仰角, 翻转角]
     * @param lon - 目标位置的经度
     * @param lat - 目标位置的纬度
     * @param time - 平滑移动所需的时间，单位为秒
     * @param ground - 地面类型，ue特有属性
     */
    smoothMoveWithRotationOnGround(NewRotation: ESJVector3D, Lon: number, Lat: number, Time: number, Ground: string) { this._smoothMoveWithRotationOnGroundEvent.emit(NewRotation, Lon, Lat, Time, Ground); }

    private _automaticLandingEvent = this.dv(new Event<[flag: boolean]>());
    get automaticLandingEvent(): Listener<[flag: boolean]> { return this._automaticLandingEvent; }
    /**
     * 自动落地
     */
    automaticLanding() {
        const flag = this.collision;
        this.collision = false;
        setTimeout(() => { this._automaticLandingEvent.emit(flag); }, 100)
    }

    //下面的未更改, 平滑移动管理器还不能处理
    private _smoothMoveKeepPitchEvent = this.dv(new Event<[ESJVector3D, number]>());
    get smoothMoveKeepPitchEvent() { return this._smoothMoveKeepPitchEvent; }
    smoothMoveKeepPitch(Destination: ESJVector3D, Time: number) { this._smoothMoveKeepPitchEvent.emit(Destination, Time); }

    private _smoothMoveRelativelyEvent = this.dv(new Event<[ESJVector3D, number]>());
    get smoothMoveRelativelyEvent() { return this._smoothMoveRelativelyEvent; }
    smoothMoveRelatively(RelativePosition: ESJVector3D, Time: number) { this._smoothMoveRelativelyEvent.emit(RelativePosition, Time); }

    private _smoothMoveRelativelyWithRotationEvent = this.dv(new Event<[ESJVector3D, ESJVector3D, number]>());
    get smoothMoveRelativelyWithRotationEvent() { return this._smoothMoveRelativelyWithRotationEvent; }
    smoothMoveRelativelyWithRotation(RelativePosition: ESJVector3D, NewRotation: ESJVector3D, Time: number) { this._smoothMoveRelativelyWithRotationEvent.emit(RelativePosition, NewRotation, Time); }


    private _editing = this.dv(react<boolean>(false));
    get editing() { return this._editing.value; }
    set editing(value: boolean) { this._editing.value = value; }
    get editingChanged() { return this._editing.changed; }

    static override defaults = {
        ...ESVisualObject.defaults,
    }


    /**
   * 是否使用ESObjectWithLocation类中的calcFlyToParam
   */
    public override useCalcFlyToParamInESObjectWithLocation = true;

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: "basic",
            location: [
                ...properties.location,
                new BooleanProperty('是否编辑', '是否编辑', false, false, [this, 'editing']),
                new FunctionProperty("自动落地", "自动落地", [], () => this.automaticLanding(), []),
                new PositionProperty('位置数组', '经度，纬度，高度，度为单位', false, false, [this, 'position'], [0, 0, 0]),
                new RotationProperty('姿态数组', '偏航角，俯仰角，翻转角，度为单位', false, false, [this, 'rotation'], [0, 0, 0]),
                new Number3Property('缩放', '缩放', false, false, [this, 'scale'], [1, 1, 1]),
                new NumberProperty('最小可见距离', '单位米', false, false, [this, 'minVisibleDistance'], 0),
                new NumberProperty('最大可见距离', '单位米', false, false, [this, 'maxVisibleDistance'], 0),
            ]
        };
    };

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('位置姿态对象', '位置姿态对象ESObjectWithLocation', [
                new FunctionProperty('平滑移动', 'smoothMove', ['numbers', 'number'], (Destination: [number, number, number], Time: number) => this.smoothMove(Destination, Time), [[0, 0, 0], 0]),
                new FunctionProperty('固定方向平滑移动', 'smoothMoveKeepPitch', ['numbers', 'number'], (Destination: [number, number, number], Time: number) => this.smoothMoveKeepPitch(Destination, Time), [[0, 0, 0], 0]),
                new FunctionProperty('平滑偏移', 'smoothMoveWithRotation', ['numbers', 'numbers', 'number'], (destination: [number, number, number], newRotation: [number, number, number], time: number) => this.smoothMoveWithRotation(destination, newRotation, time), [[0, 0, 0], [0, 0, 0], 0]),
                new FunctionProperty('贴地平滑移动', 'smoothMoveOnGround', ['number', 'number', 'number', 'string'], (Lon: number, Lat: number, Time: number, Ground: string) => this.smoothMoveOnGround(Lon, Lat, Time, Ground), [0, 0, 0, '']),
                new FunctionProperty('贴地平滑偏移', 'smoothMoveWithRotationOnGround', ['numbers', 'number', 'number', 'number', 'string'], (NewRotation: [number, number, number], Lon: number, Lat: number, Time: number, Ground: string) => this.smoothMoveWithRotationOnGround(NewRotation, Lon, Lat, Time, Ground), [[0, 0, 0], 0, 0, 0, '']),
                new FunctionProperty('smoothMoveRelatively', 'smoothMoveRelatively', ['numbers', 'number'], (RelativePosition: [number, number, number], Time: number) => this.smoothMoveRelatively(RelativePosition, Time), [[0, 0, 0], 0]),
                new FunctionProperty('smoothMoveRelativelyWithRotation', 'smoothMoveRelativelyWithRotation', ['numbers', 'numbers', 'number'], (RelativePosition: [number, number, number], NewRotation: [number, number, number], time: number) => this.smoothMoveRelativelyWithRotation(RelativePosition, NewRotation, time), [[0, 0, 0], [0, 0, 0], 0]),

                new PositionProperty('位置数组', '经度，纬度，高度，度为单位', false, false, [this, 'position']),
                new RotationProperty('姿态数组', '偏航角，俯仰角，翻转角，度为单位', false, false, [this, 'rotation']),
                new Number3Property('缩放', '缩放', false, false, [this, 'scale']),
                new BooleanProperty('是否编辑', '是否开启编辑状态', true, false, [this, 'editing'], false),
                new NumberProperty('最小可见距离', '单位米', false, false, [this, 'minVisibleDistance']),
                new NumberProperty('最大可见距离', '单位米', false, false, [this, 'maxVisibleDistance']),
                new BooleanProperty('是否应用距离显隐', '是否应用距离显隐', false, false, [this, 'enableVisibleDistance'])
            ]),
        ];
    }
}

export namespace ESObjectWithLocation {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        position: reactArray<ESJVector3D>([0, 0, 0]),
        rotation: reactArray<ESJVector3D>([0, 0, 0]),
        scale: reactArray<ESJVector3D>([1, 1, 1]),
        minVisibleDistance: react<number>(0),
        maxVisibleDistance: react<number>(0),
    });
}
extendClassProps(ESObjectWithLocation.prototype, ESObjectWithLocation.createDefaultProps);
export interface ESObjectWithLocation extends UniteChanged<ReturnType<typeof ESObjectWithLocation.createDefaultProps>> { }
