import * as Cesium from 'cesium';
import { Destroyable, react, reactArrayWithUndefined } from "xbsj-base";
/**
 * 环绕中心点飞行
 * @class
 * @extends Destroyable
 */
class InnerRotatePoint extends Destroyable {
    get viewer() { return this._viewer; }
    /**
     * 要环绕的点,经纬度
     * @type {[number, number, number]}
     * @instance
     * @default undefined 即屏幕中心,
     * @memberof RotatePoint
     */
    private _position = this.dv(reactArrayWithUndefined<[number, number, number]>(undefined));
    get position() { return this._position.value; }
    set position(value: [number, number, number] | undefined) { this._position.value = value; }
    get positionChanged() { return this._position.changed; }
    /**
     * 距离中心点距离
     * @type {number}
     * @instance
     * @default 50000
     * @memberof RotatePoint
     */
    private _distance = this.dv(react<number>(50000));
    get distance() { return this._distance.value; }
    // set distance(value: number) { this._distance.value = (value == 0 ?? value == undefined ? 0.00001 : value); }
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
     * 相对中心点的偏航角 单位度
     * @type {number}
     * @instance
     * @default 0
     * @memberof RotatePoint
     */
    private _heading = this.dv(react<number>(0));
    get heading() { return this._heading.value; }
    set heading(value: number) { this._heading.value = value; }
    get headingChanged() { return this._heading.changed; }
    /**
     * 相对中心点的俯仰角 单位度
     * @type {number}
     * @instance
     * @default -30
     * @memberof RotatePoint
     */
    private _pitch = this.dv(react<number>(-30));
    get pitch() { return this._pitch.value; }
    set pitch(value: number) { this._pitch.value = value; }
    get pitchChanged() { return this._pitch.changed; }

    private _transform!: Cesium.Matrix4;
    private _headingRadius!: number;
    private _pitchRadius!: number;

    // 节流阀
    private _running = false;
    // private _sseh = this.dv(new Cesium.ScreenSpaceEventHandler(this.viewer.canvas));
    private _sseh: Cesium.ScreenSpaceEventHandler;
    get sseh() { return this._sseh; }

    private _eventDisposer = undefined as (() => void) | undefined;
    constructor(private _viewer: Cesium.Viewer) {
        super();
        const scene = this.viewer.scene;
        const camera = this.viewer.camera;
        this._sseh = this.dv(new Cesium.ScreenSpaceEventHandler(this.viewer.canvas));
        this.d(() => { this.cancel(); })
        {
            const update = () => {
                let cartesian3Pos: Cesium.Cartesian3 | undefined;
                if (this.position == undefined) {
                    var ray = camera.getPickRay(new Cesium.Cartesian2(scene.canvas.width * 0.5, scene.canvas.height * 0.5));
                    if (!ray) return;
                    //获取屏幕中心点，如果获取不到，不进行飞行
                    cartesian3Pos = scene.globe.pick(ray, scene);
                } else {
                    cartesian3Pos = Cesium.Cartesian3.fromDegrees(...this.position)
                }
                if (!cartesian3Pos) return;
                this._transform = Cesium.Transforms.eastNorthUpToFixedFrame(cartesian3Pos);
                this.start();
            }
            update();
            this.d(this.positionChanged.don(update));
        }
        {
            const update = () => {
                this._headingRadius = Cesium.Math.toRadians(this.heading);
            }
            update();
            this.d(this.headingChanged.don(update));
        }
        {
            const update = () => {
                this._pitchRadius = Cesium.Math.toRadians(this.pitch);
            }
            update();
            this.d(this.pitchChanged.don(update));
        }
    }

    /**
     * 开始飞行
     */
    start() {
        if (this._running) return;
        const camera = this.viewer.camera;
        camera.lookAtTransform(this._transform);
        var y = this.distance * Math.sin(this._pitchRadius);
        var z = this.distance * Math.cos(this._pitchRadius);
        var camPosition = new Cesium.Cartesian3(0, y, z);
        camera.flyTo({
            destination: Cesium.Matrix4.multiplyByPoint(this._transform, camPosition, new Cesium.Cartesian3()),
            orientation: {
                heading: this._headingRadius,
                pitch: this._pitchRadius,
                roll: 0.0
            },
            endTransform: this._transform,
            complete: () => {
                this._running = true;
                //设置相机的frame，增加heading值
                let lastT = undefined as number | undefined;
                //添加postUpdate事件来更新camera位置
                this._eventDisposer = this.viewer.scene.postUpdate.addEventListener((scene, time) => {
                    if (!lastT) {
                        lastT = new Date().getTime();
                        return;
                    }
                    //计算时差 秒，
                    const duration = (new Date().getTime() - lastT) / 1000;
                    //计算走过的经度
                    this._headingRadius += duration * Cesium.Math.PI * 2 / this.cycle;
                    //直接设置相机
                    camera.lookAtTransform(this._transform, new Cesium.HeadingPitchRange(this._headingRadius, this._pitchRadius, this.distance));
                    lastT = new Date().getTime();
                })
            },
            duration: 0.5,
            maximumHeight: camera.positionCartographic.height
        })
    }
    /**
     * 取消飞行 
     */
    cancel() {
        if (!this._running)
            return;
        //设置
        const camera = this.viewer.camera;
        camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        //取消postupdate事件
        if (this._eventDisposer) {
            this._eventDisposer();
            this._eventDisposer = undefined;
        }
        this._running = false;
    }

}
export { InnerRotatePoint };

