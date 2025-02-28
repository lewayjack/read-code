import { Destroyable, react, reactArrayWithUndefined } from "xbsj-base";
import { ESCesiumViewer } from "../../index";
import { InnerRotatePoint } from "./InnerRotatePoint";

export class RotatePoint extends Destroyable {
    /**
     * 要环绕的点
     * @type {[number,number,number]|undefined}
     * @instance
     * @default undefined
     * @memberof RotatePoint
     */
    private _position = this.dv(reactArrayWithUndefined<[number, number, number]>(undefined));
    get position() { return this._position.value; }
    set position(value: [number, number, number] | undefined) { this._position.value = value; }
    get positionChanged() { return this._position.changed; }
    /**
     * 相机距离点的距离
     * @type {number}
     * @instance
     * @default 50000
     * @memberof RotatePoint
     */
    private _distance = this.dv(react<number>(50000));
    get distance() { return this._distance.value; }
    set distance(value: number) { this._distance.value = value; }
    get distanceChanged() { return this._distance.changed; }

    /**
     * 飞行一圈的周期，单位为秒
     * @type {number}
     * @instance
     * @default 60
     * @memberof RotatePoint
     */
    private _cycle = this.dv(react<number>(60));
    get cycle() { return this._cycle.value; }
    set cycle(value: number) { this._cycle.value = value; }
    get cycleChanged() { return this._cycle.changed; }

    /**
     * 相机偏航角
     * @type {number}
     * @instance
     * @default 0°
     * @memberof RotatePoint
     */
    private _heading = this.dv(react<number>(0));
    get heading() { return this._heading.value; }
    set heading(value: number) { this._heading.value = value; }
    get headingChanged() { return this._heading.changed; }

    /**
     * 相机俯仰角
     * @type {number}
     * @instance
     * @default -30°
     * @memberof RotatePoint
     */
    private _pitch = this.dv(react<number>(-30));
    get pitch() { return this._pitch.value; }
    set pitch(value: number) { this._pitch.value = value; }
    get pitchChanged() { return this._pitch.changed; }

    private _inner: InnerRotatePoint;
    get inner() { return this._inner; }


    start() {
        return this._inner.start();
    }

    cancel() {
        return this._inner.cancel();
    }

    constructor(private _czmViewer: ESCesiumViewer) {
        super();

        const viewer = this._czmViewer.viewer;
        if (!viewer) throw new Error("viewer is undefined");
        this._inner = this.dv(new InnerRotatePoint(viewer));

        {
            const update = () => {
                this.inner.distance = this.distance;
                this.inner.cycle = this.cycle;
                this.inner.position = this.position;
                this.inner.heading = this.heading;
                this.inner.pitch = this.pitch;
            };
            update();

            this.d(this.distanceChanged.don(update));
            this.d(this.cycleChanged.don(update));
            this.d(this.positionChanged.don(update));
            this.d(this.headingChanged.don(update));
            this.d(this.pitchChanged.don(update));
        }
    }
}
