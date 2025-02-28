import * as Cesium from 'cesium';
import { Destroyable } from "xbsj-base";

/**
 * 取自EarthSDK1的同名代码Source\scene\CameraFlight\RotateGlobe.js，
 * 只是代码结构适配了EarthSDK2，代码原逻辑不变，代码原逻辑为康总所写
 */
export class InnerRotateGlobe extends Destroyable {
    get viewer() { return this._viewer; }

    /**
     * 相机高度
     * @type {number}
     * @instance
     * @default 10000000
     * @memberof RotateGlobe
     */
    height = 10000000;
    /**
     * 飞行一圈的周期，单位为秒
     * @type {number}
     * @instance
     * @default 60
     * @memberof RotateGlobe
     */
    cycle = 60;
    /**
     * 相机所在纬线高度 单位弧度
     * @type {number}
     * @instance
     * @default 北纬38°
     * @memberof RotateGlobe
     */
    latitude = 38.0 * 3.1415926 / 18;

    private _running = false;
    private _sseh: Cesium.ScreenSpaceEventHandler;
    get sseh() { return this._sseh; }

    private _eventDisposer = undefined as (() => void) | undefined;

    constructor(private _viewer: Cesium.Viewer) {
        super();
        this._sseh = this.dv(new Cesium.ScreenSpaceEventHandler(this._viewer.canvas));
        this._sseh.setInputAction(() => {
            this.cancel();
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        this.d(() => { this.cancel(); })
    }

    /**
     * 开始飞行 自动飞行为互斥状态，这个飞行开始后，cameraflight下其他自动飞行被取消
     */
    start() {
        if (this._running)
            return;
        // this._flight._started(this);
        const camera = this._viewer.camera;
        const carto = camera.positionCartographic
        //飞到当前经度 + 设定的纬度 + 设定的高度  完成后添加 postupdater事件
        camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(carto.longitude, this.latitude, this.height),
            orientation: {
                heading: 0.0,
                pitch: -0.5 * Cesium.Math.PI,
                roll: 0.0
            },
            complete: () => {
                this._running = true;

                var lastT = undefined as number | undefined;
                //添加postupdate事件来更新camera位置
                this._eventDisposer = this.viewer.scene.postUpdate.addEventListener((scene, time) => {
                    if (!lastT) {
                        lastT = new Date().getTime();
                        return;
                    }
                    //计算时差 秒，
                    const duration = (new Date().getTime() - lastT) / 1000;
                    //计算走过的经度
                    const lng = camera.positionCartographic.longitude + duration * Cesium.Math.PI * 2 / this.cycle;
                    //直接设置相机
                    camera.setView({
                        destination: Cesium.Cartesian3.fromRadians(lng, this.latitude, this.height),
                        orientation: {
                            heading: 0.0,
                            pitch: -0.5 * Cesium.Math.PI,
                            roll: 0.0
                        }
                    });
                    lastT = new Date().getTime();
                })
            },
            duration: 0.5
        })
    }

    /**
     * 取消飞行 
     */
    cancel() {
        if (!this._running) return;
        //取消postupdate事件
        if (this._eventDisposer) {
            this._eventDisposer();
            this._eventDisposer = undefined;
        }
        // //
        // this._flight._canceled();
        this._running = false;
    }
}
