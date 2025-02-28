import { bind, Destroyable, Event, extendClassProps, Listener, reactArray, ReactivePropsToNativePropsAndChanged, track } from "xbsj-base";
import { GeoPolylineEditorImpl } from "./GeoPolylineEditorImpl";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmArcType } from "../../../../ESJTypesCzm";

const baseImageUrl = `\${earthsdk3-assets-script-dir}/assets/img/`;

export class GeoPolylineEditor extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _inner;
    get inner() { return this._inner; }
    /**
     * 每次调用都会创建一个新的数组，谨慎使用，避免影响性能！
     * @returns 
     */
    getPositions() { return this._inner.getPositions(); }
    resetPositions(value?: [number, number, number][]) { this._inner.resetPositions(value); }
    forceResetPositions(value?: [number, number, number][]) { this._inner.forceResetPositions(value); }
    get positions() { return this.getPositions(); }
    get positionsChanged() { return this._inner.positionsChanged; }

    get czmViewer() { return this._czmViewer; }

    constructor(private _czmViewer: ESCesiumViewer) {
        super();
        this._inner = this.disposeVar(new GeoPolylineEditorImpl(this));
        this.dispose(bind([this._inner, 'enabled'], [this, 'enabled']));
        this.dispose(bind([this._inner, 'loop'], [this, 'loop']));
        this.dispose(bind([this._inner, 'debug'], [this, 'debug']));
        {
            const update = () => {
                this.inner.polylineWrapper.color = [...this.polylineColor];
            }
            update()
            this.dispose(this.polylineColorChanged.don(update));
        }
        this.dispose(track([this._inner.polylineWrapper, 'show'], [this, 'polylineShow'], s => s));
        this.dispose(track([this._inner.polylineWrapper, 'width'], [this, 'polylineWidth']));
        this.dispose(track([this._inner.polylineWrapper, 'arcType'], [this, 'polylineArcType']));
        this.dispose(track([this._inner, 'maxPointsNum'], [this, 'maxPointsNum']));

        this.dispose(track([this._inner, 'noModifingAfterAdding'], [this, 'noModifingAfterAdding']));
        this.dispose(track([this._inner, 'hideCursorInfo'], [this, 'hideCursorInfo']));

        this.dispose(track([this._inner, 'moveWithFirstPosition'], [this, 'moveWithFirstPosition']));

        this.dispose(this.flyToEvent.disposableOn(duration => this._inner.flyTo(duration)));
    }
}

export namespace GeoPolylineEditor {
    export const createDefaultProps = () => ({
        enabled: false,
        loop: false,
        debug: false,
        polylineShow: true,
        polylineWidth: 1,
        polylineColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        polylineArcType: 'GEODESIC' as CzmArcType,
        maxPointsNum: Number.MAX_SAFE_INTEGER,
        firstControlPointImageUrl: baseImageUrl + 'point-green.png',
        otherControlPointImageUrl: baseImageUrl + 'point-yellow.png',
        middlePointImageUrl: baseImageUrl + 'point-green.png',
        noModifingAfterAdding: false,
        hideCursorInfo: false,
        moveWithFirstPosition: false,
    });
}
extendClassProps(GeoPolylineEditor.prototype, GeoPolylineEditor.createDefaultProps);
export interface GeoPolylineEditor extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoPolylineEditor.createDefaultProps>> { }
