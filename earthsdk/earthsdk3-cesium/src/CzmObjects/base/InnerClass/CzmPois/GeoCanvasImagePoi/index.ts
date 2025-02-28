import { AttachedPickedInfo, PickedInfo } from "earthsdk3";
import { GeoCanvasPoi } from "../../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../../ESCesiumViewer";
import { bind, Destroyable, Event, extendClassProps, Listener, react, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, track } from "xbsj-base";
import { GeoCanvasImagePoiImpl } from "./impl";
import { CanvasImagePoi } from "./impl/CanvasImagePoi";
import { getFuncFromStr } from "../../../../../utils";

export class GeoCanvasImagePoi extends Destroyable {
    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _clickEvent = this.disposeVar(new Event<[PointerEvent]>());
    get clickEvent() { return this._clickEvent; }

    private _clickOutEvent = this.disposeVar(new Event<[PointerEvent]>());
    get clickOutEvent() { return this._clickOutEvent; }

    private _dbclickEvent = this.disposeVar(new Event<[PointerEvent]>());
    get dbclickEvent() { return this._dbclickEvent; }

    private _dbclickOutEvent = this.disposeVar(new Event<[PointerEvent]>());
    get dbclickOutEvent() { return this._dbclickOutEvent; }

    private _clickFunc = this.disposeVar(react<((event: PointerEvent) => void) | undefined>(undefined));
    get clickFunc() { return this._clickFunc.value; }
    set clickFunc(value: ((event: PointerEvent) => void) | undefined) { this._clickFunc.value = value; }
    get clickFuncChanged() { return this._clickFunc.changed; }
    private _clickFuncInit = (() => {
        this.dispose(this.clickEvent.disposableOn(event => this.clickFunc && this.clickFunc(event)));
    })();

    static defaults = {
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
        scale: [1, 1],
    };

    private _geoCanvasPoi
    get geoCanvasPoi() { return this._geoCanvasPoi; }

    get sPositionEditing() { return this._geoCanvasPoi.sPositionEditing; }

    constructor(czmViewer: ESCesiumViewer) {
        super();
        this._geoCanvasPoi = this.disposeVar(new GeoCanvasPoi(czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const { geoCanvasPoi } = this;
        geoCanvasPoi.canvasPoiClassAndCreateFunc = [CanvasImagePoi, (canvasImagePoi) => new GeoCanvasImagePoiImpl(this, canvasImagePoi as CanvasImagePoi)];
        // this.dispose(this.components.disposableAdd(geoCanvasPoi));

        this.dispose(bind([geoCanvasPoi, 'show'], [this, 'show']));
        this.dispose(bind([geoCanvasPoi, 'enabled'], [this, 'enabled']));
        this.dispose(bind([geoCanvasPoi, 'position'], [this, 'position']));
        this.dispose(bind([geoCanvasPoi, 'positionEditing'], [this, 'positionEditing']));
        this.dispose(track([geoCanvasPoi, 'viewDistanceRange'], [this, 'viewDistanceRange']));
        this.dispose(track([geoCanvasPoi, 'viewDistanceDebug'], [this, 'viewDistanceDebug']));
        this.dispose(track([geoCanvasPoi, 'zOrder'], [this, 'zOrder']));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            geoCanvasPoi.flyTo(duration);
        }));
        this.dispose(this._clickEvent.disposableOn((e) => {
            if (!this.pickOnClick) return;
            this.pickedEvent.emit(new AttachedPickedInfo({ type: 'viewerPicking', pointerEvent: e }));
        }));

        {
            const update = () => {
                const clickFunc = getFuncFromStr<(event: MouseEvent) => void>(this.clickFuncStr, ['event']);
                clickFunc && (this.clickFunc = clickFunc);
            };
            update();
            this.dispose(this.clickFuncStrChanged.disposableOn(update));
        }
    }
}

export namespace GeoCanvasImagePoi {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        enabled: true,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 必须是3的倍数！A Property specifying the array of Cartesian3 positions that define the line strip.
        positionEditing: false,
        fgColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        bgColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]), // default [1, 1, 1, 1]
        tooltip: "",
        tooltipShow: true,
        title: "",
        size: reactArray<[width: number, height: number]>([32, 32]),
        scale: reactArray<[number, number]>([1, 1]),
        originRatioAndOffset: reactArray<[leftRatio: number, topRatio: number, leftOffset: number, topOffset: number]>([0.5, 1.0, 0.0, 0.0]),
        hovered: false, // false,
        imageUri: '${earthsdk3-assets-script-dir}/assets/img/location.png',
        opacity: 1, // 1,

        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,

        pickOnClick: false,

        clickFuncStr: '',
        zOrder: 0,
    });
}
extendClassProps(GeoCanvasImagePoi.prototype, GeoCanvasImagePoi.createDefaultProps);
export interface GeoCanvasImagePoi extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoCanvasImagePoi.createDefaultProps>> { }

