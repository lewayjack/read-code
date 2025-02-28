
import { Destroyable, react } from "xbsj-base";
import { ESCesiumViewer } from '../../index';
import { InnerRotateGlobe } from "./InnerRotateGlobe";

export class RotateGlobe extends Destroyable {
    private _height = this.dv(react<number>(10000000));
    /**
     * 相机高度
     * @type {number}
     * @instance
     * @default 10000000
     * @memberof RotateGlobe
     */
    get height() { return this._height.value; }
    set height(value: number) { this._height.value = value; }
    get heightChanged() { return this._height.changed; }


    private _cycle = this.dv(react<number>(60));
    /**
     * 飞行一圈的周期，单位为秒
     * @type {number}
     * @instance
     * @default 60
     * @memberof RotateGlobe
     */
    get cycle() { return this._cycle.value; }
    set cycle(value: number) { this._cycle.value = value; }
    get cycleChanged() { return this._cycle.changed; }


    private _latitude = this.dv(react<number>(38.0));
    /**
     * 相机所在纬线高度 单位弧度
     * @type {number}
     * @instance
     * @default 北纬38°
     * @memberof RotateGlobe
     */
    get latitude() { return this._latitude.value; }
    set latitude(value: number) { this._latitude.value = value; }
    get latitudeChanged() { return this._latitude.changed; }

    private _inner: InnerRotateGlobe;
    get inner() { return this._inner; }

    start() { return this._inner.start(); }

    cancel() { return this._inner.cancel(); }

    constructor(private _czmViewer: ESCesiumViewer) {
        super();
        const viewer = this._czmViewer.viewer;
        if (!viewer) throw new Error("未初始化viewer");
        this._inner = this.dv(new InnerRotateGlobe(viewer));

        {
            const update = () => {
                this._inner.height = this.height;
                this._inner.cycle = this.cycle;
                this._inner.latitude = this.latitude * Math.PI / 180;
            };
            update();
            this.d(this.heightChanged.don(update));
            this.d(this.cycleChanged.don(update));
            this.d(this.latitudeChanged.don(update));
        }
    }
}
