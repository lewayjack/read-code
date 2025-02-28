import { CanvasPoi, CanvasPrimitivesContext, Event } from "xbsj-base";
import { CzmBasePoi } from "./CzmBasePoi";
import { CzmPoisContext } from "./CzmPoisContext";
import { WinPosFromCartesian } from "../../../../../utils";

export class CzmCanvasPoi<T extends CanvasPoi> extends CzmBasePoi {
    private _canvasPoi: T;
    _zOrderChanged?: Event;
    _zOrder: number | undefined = undefined;
    depth: number = 0;
    constructor(
        canvasPoiClass: new (canvasPrimitivesContext: CanvasPrimitivesContext) => T,
        czmPoisContext: CzmPoisContext,
        outWinPosFromCartesian?: WinPosFromCartesian,
    ) {
        super(czmPoisContext, outWinPosFromCartesian)
        const { canvasPrimitivesContext } = this._czmPoisContext;
        this._canvasPoi = this.disposeVar(new canvasPoiClass(canvasPrimitivesContext));

        const updateWinPosAndDepth = () => {
            if (this.actualShow && this.winPosFromCartesian.winPosValid) {
                const { left, top, depth } = this.winPosFromCartesian.winPos;
                this._canvasPoi.winPos = [left, top];
                this.depth = depth;
                this._canvasPoi.depth = this.zOrder ?? depth;
                this._canvasPoi.show = true;
            } else {
                this._canvasPoi.show = false;
            }
        }
        this.d(this.zOrderChanged.don(() => {
            updateWinPosAndDepth();
        }))
        this.dispose(this.winPosFromCartesian.changed.disposableOn(() => {
            updateWinPosAndDepth();
        }));

        this.dispose(this.actualShowChanged.disposableOn((actualShow) => {
            this._canvasPoi.show = actualShow;
            updateWinPosAndDepth();
        }));
    }

    get canvasPoi() {
        return this._canvasPoi;
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
