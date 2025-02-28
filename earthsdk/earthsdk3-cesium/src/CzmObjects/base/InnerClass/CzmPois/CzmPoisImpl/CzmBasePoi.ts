import { WinPosFromCartesian } from "../../../../../utils";
import { createNextMicroTaskEvent, Destroyable, react } from "xbsj-base";
import { CzmPoisContext } from "./CzmPoisContext";
import * as Cesium from 'cesium';

export class CzmBasePoi extends Destroyable {
    private _show = this.disposeVar(react(true));
    private _winPosFromCartesian: WinPosFromCartesian;
    private _near = this.disposeVar(react(0));
    private _far = this.disposeVar(react(Number.POSITIVE_INFINITY));
    private _actualShow = this.disposeVar(react(false));

    constructor(
        protected _czmPoisContext: CzmPoisContext,
        outWinPosFromCartesian?: WinPosFromCartesian,
    ) {
        super();

        const { viewer, cameraChanged } = this._czmPoisContext;
        this._winPosFromCartesian = outWinPosFromCartesian || this.disposeVar(new WinPosFromCartesian(viewer, true, cameraChanged));

        let n2 = 0, f2 = Number.POSITIVE_INFINITY;
        this.dispose(this._near.changed.disposableOn(v => n2 = v * v));
        this.dispose(this._far.changed.disposableOn(v => f2 = v * v));

        const ne = this.disposeVar(createNextMicroTaskEvent(this._near.changed, this._far.changed, this._show.changed, this._winPosFromCartesian.changed, cameraChanged.changed));
        this.dispose(ne.disposableOn(() => {
            if (!this.show) {
                this._actualShow.value = false;
                return;
            }
            const distanceSquared = Cesium.Cartesian3.distanceSquared(viewer.camera.positionWC, this._winPosFromCartesian.cartesian);
            const distanceShow = (distanceSquared >= n2) && (distanceSquared <= f2);
            this._actualShow.value = distanceShow && this._winPosFromCartesian.winPosValid && !this._czmPoisContext.isPointOccludedByEarth(this._winPosFromCartesian.cartesian);
        }));
    }

    protected get actualShowChanged() {
        return this._actualShow.changed;
    }

    protected get actualShow() {
        return this._actualShow.value;
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
        this._show.value = value;
    }

    get show() {
        return this._show.value;
    }

    set near(value: number) {
        this._near.value = value;
    }

    get near() {
        return this._near.value;
    }

    set far(value: number) {
        this._far.value = value;
    }

    get far() {
        return this._far.value;
    }
}