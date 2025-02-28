import { CanvasPoi, CanvasPrimitivesContext, Destroyable, Event, FloatDiv, Transition } from "xbsj-base";
import * as Cesium from 'cesium';
import { CzmCanvasPoi } from "./CzmCanvasPoi";
import { CzmDivPoi } from "./CzmDivPoi";
import { CzmPoisContext } from "./CzmPoisContext";
import { WinPosFromCartesian } from "../../../../../utils";

export type CzmCanvasAndDivSwitchPoiStatus = "Canvas" | "Div";

export class CzmCanvasAndDivSwitchPoi<T extends CanvasPoi, R extends FloatDiv> extends Destroyable {
    private _czmCanvasPoi: CzmCanvasPoi<T>;
    private _czmDivPoi: CzmDivPoi<R>;
    private _show: boolean = true;
    private _winPosFromCartesian: WinPosFromCartesian;
    private _switchTransition: Transition;
    private _status: CzmCanvasAndDivSwitchPoiStatus = 'Canvas';
    private _statusChanged?: Event<[CzmCanvasAndDivSwitchPoiStatus]>; // status: CzmCanvasAndDivSwitchPoiStatus
    constructor(
        canvasPoiClass: new (canvasPrimitivesContext: CanvasPrimitivesContext) => T,
        floatDivClass: new () => R,
        private _czmPoisContext: CzmPoisContext,
        outWinPosFromCartesian?: WinPosFromCartesian,
    ) {
        super();

        const { viewer, cameraChanged } = this._czmPoisContext;
        this._winPosFromCartesian = outWinPosFromCartesian || this.disposeVar(new WinPosFromCartesian(viewer, true, cameraChanged));

        this._czmCanvasPoi = new CzmCanvasPoi(canvasPoiClass, this._czmPoisContext, this._winPosFromCartesian);
        this.dispose(() => this._czmCanvasPoi.destroy());
        this._czmDivPoi = new CzmDivPoi(floatDivClass, this._czmPoisContext, this._winPosFromCartesian);
        this.dispose(() => this._czmDivPoi.destroy());

        this._switchTransition = new Transition(300);
        this.dispose(this._switchTransition.currentChanged.disposableOn((target, current) => {
            this._updateShow();
            this._czmCanvasPoi.canvasPoi.opacity = 1 - current;
            this._czmDivPoi.divPoi.floatDiv.opacity = current;
        }));
        
        this._updateShow();
    }

    private _updateShow() {
        this._czmCanvasPoi.show = this._show && this._switchTransition.current < 1;
        this._czmDivPoi.show = this._show && this._switchTransition.current > 0;
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

    set cartesian(value: Cesium.Cartesian3) {
        this._winPosFromCartesian.cartesian = value;
    }

    get cartesian() {
        return this._winPosFromCartesian.cartesian;
    }

    get winPosFromCartesian() {
        return this._winPosFromCartesian;
    }

    set status(value: CzmCanvasAndDivSwitchPoiStatus) {
        if (this._status !== value) {
            this._status = value;
            this._switchTransition.target = this._status === 'Canvas' ? 0 : 1;
            this._statusChanged && this._statusChanged.emit(this._status);
        }
    }

    get status() {
        return this._status;
    }

    get statusChanged() {
        if (!this._statusChanged) {
            this._statusChanged = new Event();
        }
        return this._statusChanged;
    }

    get czmCanvasPoi() {
        return this._czmCanvasPoi;
    }

    get czmDivPoi() {
        return this._czmDivPoi;
    }
}