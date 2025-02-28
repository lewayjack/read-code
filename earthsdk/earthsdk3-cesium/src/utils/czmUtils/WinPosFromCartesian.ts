import { Destroyable, Event } from 'xbsj-base';
import * as Cesium from 'cesium';
import { getWinPos, WinPosAndDepth, winPosAndDepthEqual } from './getWinPos';
import { CzmCameraChanged } from './cameraUtils';


// const scratchWinPos: [number, number, number, number] = [0, 0, 0, 0];
const scratchWinPos: WinPosAndDepth = { left: 0, top: 0, right: 0, bottom: 0, depth: 0 };



/**
 * Cesium当中用来获取三维坐标的二维屏幕位置
 * 
 * @example
 * const winPosFromCartesian = new WinPosFromCartesian(viewer, true);
 * this.dispose(() => winPosFromCartesian.destroy());
 * winPosFromCartesian.cartesian = Cesium.Cartesian3.fromDegrees(116.39, 39.9, 100);
 * this.dispose(winPosFromCartesian.changed.disposableOn((valid, winPosAndDepth) => {
 *     const { left, top, depth } = winPosAndDepth;
 *     // xxx
 * }));
 */
export class WinPosFromCartesian extends Destroyable {
    _cartesian: Cesium.Cartesian3 = new Cesium.Cartesian3();
    _winPos: WinPosAndDepth = { left: 0, top: 0, right: 0, bottom: 0, depth: 0 };
    _winPosValid: boolean = false;
    _changedEvent: Event<[boolean, WinPosAndDepth]> = new Event(); // valid: boolean, winPos: WinPosAndDepth
    _enabled: boolean = true;

    constructor(
        private _viewer: Cesium.Viewer,
        enabled: boolean = true,
        czmCameraChanged?: CzmCameraChanged,
    ) {
        super();

        czmCameraChanged = czmCameraChanged || this.disposeVar(new CzmCameraChanged(this._viewer.scene));
        this.dispose(czmCameraChanged.changed.disposableOn(() => this._updateWinPos()));

        this.dispose(() => {
            if (!this._changedEvent.empty) {
                console.warn(`WinPosFromCartesian需要销毁，但是changed事件仍有监听，代码未必有错，但是说明代码不严谨。`);
            }
        });
        this.enabled = enabled;
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(value: boolean) {
        if (this._enabled !== value) {
            this._enabled = value;
            if (value) {
                this._updateWinPos();
            }
        }
    }

    _updateWinPos() {
        if (!this._enabled) {
            return;
        }

        // TODO 不需要每次都getWinPos，而是需要检测camera是否变化，检测cartesian是否变化，然后再计算getWinPos！
        let changed = false;
        const winPos = getWinPos(this._viewer, this._cartesian, scratchWinPos);
        if (!!winPos !== this._winPosValid) {
            changed = true;
            this._winPosValid = !!winPos;
        }

        if (this._winPosValid) {
            if (!winPosAndDepthEqual(this._winPos, scratchWinPos)) {
                changed = true;
                this._winPos.left = scratchWinPos.left;
                this._winPos.top = scratchWinPos.top;
                this._winPos.right = scratchWinPos.right;
                this._winPos.bottom = scratchWinPos.bottom;
                this._winPos.depth = scratchWinPos.depth;
            }
        } else {
            changed = true;
            this._winPos.left = Number.NaN;
            this._winPos.top = Number.NaN;
            this._winPos.right = Number.NaN;
            this._winPos.bottom = Number.NaN;
            this._winPos.depth = Number.NaN;
        }

        if (changed) {
            this._changedEvent.emit(this._winPosValid, this._winPos);
        }
    }

    get cartesian() {
        return this._cartesian;
    }

    set cartesian(value: Cesium.Cartesian3) {
        if (!Cesium.Cartesian3.equals(this._cartesian, value)) {
            Cesium.Cartesian3.clone(value, this._cartesian);
            this._updateWinPos();
        }
    }

    get changed() {
        return this._changedEvent;
    }

    get winPosValid() {
        return this._winPosValid;
    }

    get winPos() {
        return this._winPos;
    }
}