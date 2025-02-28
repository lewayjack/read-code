import { Destroyable, Event, Listener, react, ObjResettingWithEvent } from "xbsj-base";
import { FirstPersonController } from "../FirstPersonController";
import { KeyboardCameraControllerRunning } from "./KeyboardCameraControllerRunning";
import { CzmCameraActionType } from "../../../../ESJTypesCzm";

export class KeyboardCameraController extends Destroyable {
    get firstPersonController() { return this._firstPersonController; }

    private _enabled = this.dv(react<boolean>(false));
    get enabled() { return this._enabled.value; }
    set enabled(value: boolean) { this._enabled.value = value; }
    get enabledChanged() { return this._enabled.changed; }

    static readonly defaultKeyStatusMap: { [k: string]: CzmCameraActionType } = {
        ShiftLeft: 'WithCamera',
        ShiftRight: 'WithCamera',
        KeyW: 'MoveForward',
        KeyS: 'MoveBackword',
        KeyA: 'MoveLeft',
        KeyD: 'MoveRight',
        ArrowUp: 'MoveForward',
        ArrowDown: 'MoveBackword',
        ArrowLeft: 'MoveLeft',
        ArrowRight: 'MoveRight',
        KeyR: 'SpeedUp',
        KeyF: 'SpeedDown',
        KeyQ: 'SwitchAlwaysWithCamera',
    };

    private _keyStatusMap = this.dv(react<{ [k: string]: CzmCameraActionType }>(KeyboardCameraController.defaultKeyStatusMap));
    get keyStatusMap() { return this._keyStatusMap.value; }
    set keyStatusMap(value: { [k: string]: CzmCameraActionType }) { this._keyStatusMap.value = value; }
    get keyStatusMapChanged() { return this._keyStatusMap.changed; }

    /**
     * 米/毫秒
     */
    private _speed = this.dv(react<number>(1));
    get speed() { return this._speed.value; }
    set speed(value: number) { this._speed.value = value; }
    get speedChanged() { return this._speed.changed; }

    /**
     * 度/毫秒
     */
    private _rotateSpeed = this.dv(react<number>(0.01));
    get rotateSpeed() { return this._rotateSpeed.value; }
    set rotateSpeed(value: number) { this._rotateSpeed.value = value; }
    get rotateSpeedChanged() { return this._rotateSpeed.changed; }

    private _alwaysWithCamera = this.dv(react<boolean>(false));
    get alwaysWithCamera() { return this._alwaysWithCamera.value; }
    set alwaysWithCamera(value: boolean) { this._alwaysWithCamera.value = value; }
    get alwaysWithCameraChanged() { return this._alwaysWithCamera.changed; }

    private _keyDownEvent = this.dv(new Event<[KeyboardEvent]>());
    get keyDownEvent() { return this._keyDownEvent as Listener<[KeyboardEvent]>; }
    keyDown(event: KeyboardEvent) { this._keyDownEvent.emit(event); }

    private _keyUpEvent = this.dv(new Event<[KeyboardEvent]>());
    get keyUpEvent() { return this._keyUpEvent as Listener<[KeyboardEvent]>; }
    keyUp(event: KeyboardEvent) { this._keyUpEvent.emit(event); }

    private _abortEvent = this.dv(new Event());
    get abortEvent() { return this._abortEvent as Listener; }
    abort() { this._abortEvent.emit(); }

    constructor(private _firstPersonController: FirstPersonController) {
        super();

        this.dv(new ObjResettingWithEvent(this.enabledChanged, () => {
            if (!this.enabled) return undefined;
            return new KeyboardCameraControllerRunning(this);
        }));
    }
}
