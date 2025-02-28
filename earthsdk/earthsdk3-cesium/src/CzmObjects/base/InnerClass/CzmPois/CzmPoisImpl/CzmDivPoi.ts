import { WinPosFromCartesian } from "../../../../../utils";
import { Destroyable, DivPoi, FloatDiv, Event } from "xbsj-base";
import { CzmPoisContext } from "./CzmPoisContext";
import * as Cesium from "cesium";

export type IconDetailSwitchPoiStyle = 'canvas' | 'div';

export class CzmDivPoi<T extends FloatDiv> extends Destroyable {
    _divPoi: DivPoi<T>;
    _show: boolean = true;
    _occludedByEarth: boolean = true;
    _winPosFromCartesian: WinPosFromCartesian;
    _zOrderChanged?: Event;
    _zOrder: number | undefined = undefined;
    depth: number = 0;
    constructor(
        customDivClass: new () => T,
        private _czmPoisContext: CzmPoisContext,
        outWinPosFromCartesian?: WinPosFromCartesian,
    ) {
        super();

        const { viewer, divContainer, cameraChanged } = this._czmPoisContext;
        this._winPosFromCartesian = outWinPosFromCartesian || this.disposeVar(new WinPosFromCartesian(viewer, true, cameraChanged));

        this._divPoi = new DivPoi(customDivClass, divContainer);
        this.dispose(() => this._divPoi.destroy());
        // @ts-ignore
        this.dispose(this._winPosFromCartesian.changed.disposableOn((valid, winPosAndDepth) => {
            this._occludedByEarth = !valid || this._czmPoisContext.isPointOccludedByEarth(this._winPosFromCartesian.cartesian);
            const { left, top, depth } = winPosAndDepth;
            const { floatDiv } = this._divPoi;
            floatDiv.winPos = [left, top];
            // zIndex接受不了浮点数，只能用整型，然后顺序又刚好是反的，所以需要1.0 - depth
            // 修复近距离观察DivPoi时不可见的问题
            // | 0 只能处理32位整型，会出现depth很小时zIndex变成负值的情况！ Math.round可以得到大于32位整型的数字！
            // floatDiv.element.style.zIndex = `${((1. - depth) * 100000000000) | 0}`;
            this.depth = Math.round((1. - depth) * 100000000000);
            floatDiv.element.style.zIndex = `${this.zOrder || this.depth}`;

            this._updateShow();
        }));
        this.d(this.zOrderChanged.don(() => {
            const { floatDiv } = this._divPoi;
            floatDiv.element.style.zIndex = `${this.zOrder || this.depth}`;
            this._updateShow();
        }))
    }

    get divPoi() {
        return this._divPoi;
    }

    _updateShow() {
        this._divPoi.show = this._show && !this._occludedByEarth && this._winPosFromCartesian.winPosValid;
    }

    set cartesian(value: Cesium.Cartesian3) {
        this._winPosFromCartesian.cartesian = value;
    }

    get cartesian() {
        return this._winPosFromCartesian.cartesian;
    }

    get winPosFromCartesian() {
        return this._winPosFromCartesian;
    }

    set show(value: boolean) {
        if (this._show !== value) {
            this._show = value;
            this._updateShow();
        }
    }

    get show() {
        return this._show;
    }

    set zOrder(value: number | undefined) {
        if (this._zOrder !== value) {
            this._zOrder = value;
            this.zOrderChanged.emit();
        }
    }
    get zOrder() {
        return this._zOrder;
    }
    get zOrderChanged() {
        if (!this._zOrderChanged) {
            this._zOrderChanged = new Event();
        }

        return this._zOrderChanged;
    }
}