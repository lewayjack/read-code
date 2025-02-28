import { PointEditing, PositionsCenter, PositionsEditing } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmArcType, CzmMaterialJsonType } from "../../../../ESJTypesCzm";
import { createGuid, createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, ObjResettingWithEvent, react, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactPositions, SceneObjectKey, track } from "xbsj-base";
import { CzmPolylinePrimitive } from "./CzmPolylinePrimitive";
import { CzmPolylineGroundPrimitive } from "./CzmPolylineGroundPrimitive";
import { CzmViewDistanceRangeControl } from "../../../../utils";
export * from './CzmPolylinePrimitive';
export * from './CzmPolylineGroundPrimitive';
export class CzmPolyline extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing: PositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _sPointEditing: PointEditing;
    get sPointEditing() { return this._sPointEditing; }

    private _positionsCenter: PositionsCenter;
    get positionsCenter() { return this._positionsCenter; }

    private _polylineOrGroundPolylineResetting: ObjResettingWithEvent<GroundPolyline | Polyline, Listener<[boolean | undefined, boolean | undefined]>>;
    get polylineOrGroundPolylineResetting() { return this._polylineOrGroundPolylineResetting; }

    private _czmViewVisibleDistanceRangeControl: CzmViewDistanceRangeControl;
    get czmViewVisibleDistanceRangeControl() { return this._czmViewVisibleDistanceRangeControl; }
    get visibleAlpha() { return this._czmViewVisibleDistanceRangeControl.visibleAlpha; }
    get visibleAlphaChanged() { return this._czmViewVisibleDistanceRangeControl.visibleAlphaChanged; }

    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }
    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], [this, 'loop'], [this, 'editing'], czmViewer));
        this._sPointEditing = this.disposeVar(new PointEditing([this, 'positions'], [this, 'pointEditing'], czmViewer));
        this._positionsCenter = this.disposeVar(new PositionsCenter([this, 'positions']));
        this._czmViewVisibleDistanceRangeControl = this.disposeVar(new CzmViewDistanceRangeControl(
            czmViewer,
            [this, 'viewDistanceRange'],
            this.positionsCenter.centerReact,
            // [this.sceneObject, 'radius'],
        ));
        this.dispose(track([this._czmViewVisibleDistanceRangeControl, 'debug'], [this, 'viewDistanceDebug']));
        this._polylineOrGroundPolylineResetting = this.disposeVar(new ObjResettingWithEvent(this.groundChanged, () => {
            const polylineGround = this.ground;
            return !polylineGround ? new Polyline(czmViewer, this) : new GroundPolyline(czmViewer, this);
        }));
    }

    static defaults = {
        positions: [],
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
    };
}

export namespace CzmPolyline {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        positions: reactPositions(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        loop: false,
        width: 2.0, // undfined时为1.0，A numeric Property specifying the width in pixels.
        ground: false,

        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        hasDash: false,
        gapColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]), // default [0, 0, 0, 0]
        dashLength: 16, // default 16
        dashPattern: 255, // default 255

        hasArrow: false,
        arcType: 'GEODESIC' as CzmArcType,
        depthTest: false, //深度检测
        editing: false,
        pointEditing: false,
        zIndex: 0,

        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,
    });
}
extendClassProps(CzmPolyline.prototype, CzmPolyline.createDefaultProps);
export interface CzmPolyline extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolyline.createDefaultProps>> { }

class Polyline extends Destroyable {
    constructor(czmViewer: ESCesiumViewer, czmPolyline: CzmPolyline) {
        super();

        const czmPolylinePrimitive = this.disposeVar(new CzmPolylinePrimitive(czmViewer, czmPolyline.id));

        this.dispose(track([czmPolylinePrimitive, 'allowPicking'], [czmPolyline, 'allowPicking']));

        this.dispose(track([czmPolylinePrimitive, 'depthTest'], [czmPolyline, 'depthTest']));

        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            ...getUpdateEvents(czmPolyline),
            czmPolyline.czmViewVisibleDistanceRangeControl.visibleAlphaChanged,
        ));
        {
            const update = () => {
                const { visibleAlpha } = czmPolyline.czmViewVisibleDistanceRangeControl;
                czmPolylinePrimitive.show = (czmPolyline.show) && visibleAlpha > 0;
                czmPolylinePrimitive.arcType = czmPolyline.arcType;
                czmPolylinePrimitive.width = czmPolyline.width;
                czmPolylinePrimitive.positions = getPositions(czmPolyline);
                czmPolylinePrimitive.material = getMaterialJson(czmPolyline);
            }
            update();
            this.dispose(updateEvent.disposableOn(update));
        }

        this.dispose(czmPolyline.flyToEvent.disposableOn(duration => {
            updateEvent.flush();
            if (!czmPolyline.viewDistanceRange) {
                czmPolylinePrimitive.flyTo(duration);
            } else {
                const centerPoint = czmPolyline.positionsCenter.center as [number, number, number]
                const viewDistance = (czmPolyline.viewDistanceRange[1] + czmPolyline.viewDistanceRange[2]) / 2
                // czmViewer.flyTo(centerPoint, viewDistance, undefined, duration)
            }
        }));
    }
}

class GroundPolyline extends Destroyable {
    constructor(czmViewer: ESCesiumViewer, czmPolyline: CzmPolyline) {
        super();

        const czmPolylineGroundPrimitive = this.disposeVar(new CzmPolylineGroundPrimitive(czmViewer, czmPolyline.id));

        this.dispose(track([czmPolylineGroundPrimitive, 'allowPicking'], [czmPolyline, 'allowPicking']));

        this.dispose(track([czmPolylineGroundPrimitive, 'depthTest'], [czmPolyline, 'depthTest']));

        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            ...getUpdateEvents(czmPolyline),
            czmPolyline.czmViewVisibleDistanceRangeControl.visibleAlphaChanged,
        ));
        {
            const update = () => {
                const { visibleAlpha } = czmPolyline.czmViewVisibleDistanceRangeControl;
                czmPolylineGroundPrimitive.show = (czmPolyline.show) && visibleAlpha > 0;
                czmPolylineGroundPrimitive.arcType = czmPolyline.arcType;
                czmPolylineGroundPrimitive.width = czmPolyline.width;
                czmPolylineGroundPrimitive.positions = getPositions(czmPolyline);
                czmPolylineGroundPrimitive.material = getMaterialJson(czmPolyline);
            }
            update();
            this.dispose(updateEvent.disposableOn(update));
        }

        this.dispose(czmPolyline.flyToEvent.disposableOn(duration => {
            updateEvent.flush();

            if (!czmPolyline.viewDistanceRange) {
                czmPolylineGroundPrimitive.flyTo(duration);

            } else {
                const centerPoint = czmPolyline.positionsCenter.center as [number, number, number]
                const viewDistance = (czmPolyline.viewDistanceRange[1] + czmPolyline.viewDistanceRange[2]) / 2
                // czmViewer.flyTo({ distance: viewDistance, flyDuration: (duration ?? 1 )}, centerPoint,)
            }
        }));
    }
}

function getMaterialJson(sceneObject: CzmPolyline) {
    const polylineColor = sceneObject.color;
    const polylineGapColor = sceneObject.gapColor;
    let materialJson: CzmMaterialJsonType | undefined;
    if (sceneObject.hasDash) {
        materialJson = {
            type: 'PolylineDash',
            color: polylineColor,
            gapColor: polylineGapColor,
            dashLength: sceneObject.dashLength,
            dashPattern: sceneObject.dashPattern,
        };
    } else if (sceneObject.hasArrow) {
        materialJson = {
            type: 'PolylineArrow',
            color: polylineColor,
        };
    } else {
        materialJson = {
            type: 'Color',
            color: polylineColor,
        }
    }
    return materialJson;
}

function getPositions(sceneObject: CzmPolyline) {
    const loop = sceneObject.loop;
    if (loop && sceneObject.positions && sceneObject.positions.length >= 3) {
        return [...sceneObject.positions, sceneObject.positions[0]];
    } else {
        return sceneObject.positions;
    }
}

function getUpdateEvents(sceneObject: CzmPolyline) {
    return [
        sceneObject.showChanged,
        sceneObject.positionsChanged,
        sceneObject.loopChanged,
        sceneObject.widthChanged,
        sceneObject.colorChanged,
        sceneObject.hasDashChanged,
        sceneObject.gapColorChanged,
        sceneObject.dashLengthChanged,
        sceneObject.dashPatternChanged,
        sceneObject.hasArrowChanged,
        sceneObject.arcTypeChanged,
        sceneObject.depthTestChanged
    ];
}
