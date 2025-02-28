import { AttachedPickedInfo, PickedInfo } from "earthsdk3";
import { bind, Destroyable, Event, extendClassProps, Listener, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, SceneObjectKey, track } from "xbsj-base";
import { GeoCanvasPoi } from "../GeoCanvasPoi";
import { ESCesiumViewer } from "../../../../../ESCesiumViewer";
import { GeoCanvasPointPoiImpl } from "./impl";
import { CanvasPointPoi } from "./impl/CanvasPointPoi";

export class GeoCanvasPointPoi extends Destroyable {
    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    static defaults = {
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
    };

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _clickEvent = this.disposeVar(new Event<[PointerEvent]>());
    get clickEvent() { return this._clickEvent; }

    private _dbclickEvent = this.disposeVar(new Event<[PointerEvent]>());
    get dbclickEvent() { return this._dbclickEvent; }

    private _geoCanvasPoi;
    get geoCanvasPoi() { return this._geoCanvasPoi; }

    get sPositionEditing() { return this._geoCanvasPoi.sPositionEditing; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._geoCanvasPoi = this.disposeVar(new GeoCanvasPoi(czmViewer, id));
        const { geoCanvasPoi } = this;
        geoCanvasPoi.canvasPoiClassAndCreateFunc = [CanvasPointPoi, (canvasPointPoi, visibleAlphaChanged) => {
            return new GeoCanvasPointPoiImpl(this, canvasPointPoi as CanvasPointPoi, visibleAlphaChanged);
        }];

        this.dispose(track([geoCanvasPoi, 'show'], [this, 'show']));
        this.dispose(track([geoCanvasPoi, 'enabled'], [this, 'enabled']));
        this.dispose(bind([geoCanvasPoi, 'position'], [this, 'position']));
        this.dispose(bind([geoCanvasPoi, 'positionEditing'], [this, 'positionEditing']));
        this.dispose(track([geoCanvasPoi, 'viewDistanceRange'], [this, 'viewDistanceRange']));
        this.dispose(track([geoCanvasPoi, 'viewDistanceDebug'], [this, 'viewDistanceDebug']));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            geoCanvasPoi.flyTo(duration);
        }));

        this.dispose(this._clickEvent.disposableOn((e) => {
            if (!this.pickOnClick) return;
            this.pickedEvent.emit(new AttachedPickedInfo({ type: 'viewerPicking', pointerEvent: e }));
        }));
    }
}

export namespace GeoCanvasPointPoi {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        enabled: true,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 必须是3的倍数！A Property specifying the array of Cartesian3 positions that define the line strip.
        positionEditing: false,
        radius: 6,
        text: "",
        font: 'bold 10px Arial',
        fontColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        outlineColor: reactArray<[number, number, number, number]>([0, 0, 0, 1]), // default [0, 0, 0, 1]
        selectedColor: reactArray<[number, number, number, number]>([0, 0, 0, 1]), // default [1, 0, 0, 1]
        hovered: false,
        selected: false,

        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,

        pickOnClick: false,
    });
}
extendClassProps(GeoCanvasPointPoi.prototype, GeoCanvasPointPoi.createDefaultProps);
export interface GeoCanvasPointPoi extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoCanvasPointPoi.createDefaultProps>> { }

