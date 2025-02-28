//类名变更：GeoPolygon------>CzmPolygonWithHeight
import { PickedInfo } from "earthsdk3";
import { PointEditing, PositionsCenter, PositionsEditing } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { Destroyable, Listener, Event, ObjResettingWithEvent, reactArray, reactPositions, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, track, createNextAnimateFrameEvent, SceneObjectKey, createGuid, react } from "xbsj-base";
import { GroundPolygon } from "./GroundPolygon";
import { DepthPolygon } from "./DepthPolygon";
import { Polygon } from "./Polygon";
import { CzmViewDistanceRangeControl } from "../../../../utils";

export * from './CzmPolygonPrimitiveWithHeight';
export * from './CzmPolygonGroundPrimitiveWithHeight';

export class CzmPolygonWithHeight extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _sPointEditing;
    get sPointEditing() { return this._sPointEditing; }

    private _positionsCenter;
    get positionsCenter() { return this._positionsCenter; }

    private _polygonOrGroundPolygonResetting: ObjResettingWithEvent<GroundPolygon | Polygon | DepthPolygon, Listener<[boolean | undefined, boolean | undefined]>>;
    get polygonOrGroundPolygonResetting() { return this._polygonOrGroundPolygonResetting; }

    private _czmViewVisibleDistanceRangeControl;
    get czmViewVisibleDistanceRangeControl() { return this._czmViewVisibleDistanceRangeControl; }
    get visibleAlpha() { return this._czmViewVisibleDistanceRangeControl.visibleAlpha; }
    get visibleAlphaChanged() { return this._czmViewVisibleDistanceRangeControl.visibleAlphaChanged; }
    
    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], true, [this, 'editing'], czmViewer));
        this._sPointEditing = this.disposeVar(new PointEditing([this, 'positions'], [this, 'pointEditing'], czmViewer));
        this._positionsCenter = this.disposeVar(new PositionsCenter([this, 'positions']));
        this._czmViewVisibleDistanceRangeControl = this.disposeVar(new CzmViewDistanceRangeControl(
            czmViewer,
            [this, 'viewDistanceRange'],
            this.positionsCenter.centerReact,
            // [this.sceneObject, 'radius'],
        ));
        this.dispose(track([this._czmViewVisibleDistanceRangeControl, 'debug'], [this, 'viewDistanceDebug']));
        const event = this.disposeVar(createNextAnimateFrameEvent(this.groundChanged, this.depthChanged, this.strokeGroundChanged));
        this._polygonOrGroundPolygonResetting = this.disposeVar(new ObjResettingWithEvent(event, () => {
            const polygonGround = this.ground;
            if (polygonGround) {
                return new GroundPolygon(this, czmViewer);
            } else {
                return (this.depth !== undefined && this.depth > 0) ? new DepthPolygon(this, czmViewer) : new Polygon(this, czmViewer)
            }
        }));
    }

    static defaults = {
        positions: [],
        viewDistanceRange: [1000, 10000, 30000, 60000] as [number, number, number, number],
    };
}

export namespace CzmPolygonWithHeight {
    export const createDefaultProps = () => ({
        show: true,
        allowPicking: false,
        ground: false,
        strokeGround: false,
        outline: true,
        outlineColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        outlineWidth: 2,
        fill: true,
        color: reactArray<[number, number, number, number]>([1, 1, 1, .5]),
        editing: false,
        pointEditing: false,
        positions: reactPositions(undefined),
        depth: 0,
        zIndex: 0,

        viewDistanceRange: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        viewDistanceDebug: false,
        depthTest: false, //深度检测
    });
}
extendClassProps(CzmPolygonWithHeight.prototype, CzmPolygonWithHeight.createDefaultProps);
export interface CzmPolygonWithHeight extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolygonWithHeight.createDefaultProps>> { }
