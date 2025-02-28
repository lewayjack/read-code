import { PickedInfo } from "earthsdk3";
import { CzmPolygonWithHeight, PositionsEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, Destroyable, Event, extendClassProps, Listener, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactPositions, SceneObjectKey } from "xbsj-base";
import { geoPolylineToBezierSpline } from "../../../utils";

export class GeoSmoothPolygon extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _geoPolygon;
    get geoPolygon() { return this._geoPolygon; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this.disposeVar(new PositionsEditing(this.positionsReact, false, [this, 'editing'], czmViewer));
        this._geoPolygon = this.disposeVar(new CzmPolygonWithHeight(czmViewer, id));
        const { geoPolygon } = this;

        this.dispose(bind([geoPolygon, 'allowPicking'], [this, 'allowPicking']));
        this.dispose(this.flyToEvent.disposableOn(duration => {
            geoPolygon.flyTo(duration);
        }));

        this.dispose(bind([geoPolygon, 'show'], [this, 'show']));
        this.dispose(bind([geoPolygon, 'fill'], [this, 'filled']));
        this.dispose(bind([geoPolygon, 'strokeGround'], [this, 'strokeGround']));
        this.dispose(bind([geoPolygon, 'ground'], [this, 'ground']));
        this.dispose(bind([geoPolygon, 'outline'], [this, 'outline']));
        this.dispose(bind([geoPolygon, 'outlineColor'], [this, 'outlineColor']));
        this.dispose(bind([geoPolygon, 'outlineWidth'], [this, 'outlineWidth']));
        this.dispose(bind([geoPolygon, 'color'], [this, 'color']));
        this.dispose(bind([geoPolygon, 'depth'], [this, 'depth']));

        const updatePositions = () => {
            if (this.positions && this.positions.length >= 2) {
                const positions = geoPolylineToBezierSpline([...this.positions, this.positions[0]]);
                geoPolygon.positions = positions;
            } else {
                geoPolygon.positions = undefined;
            }
        };
        updatePositions();
        this.dispose(this.positionsChanged.disposableOn(updatePositions));

        // const positionsEditingRef = this.disposeVar(createPositionsEditingRefForComponent([this, 'positions'], true, this.components));
        // this.dispose(bind([this, 'editing'], positionsEditingRef));
    }
}

export namespace GeoSmoothPolygon {
    export const createDefaultProps = () => ({
        show: true,
        allowPicking: false,
        strokeGround: false,
        ground: false,
        outline: false,
        filled: true,
        outlineColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        outlineWidth: 1,
        color: reactArrayWithUndefined<[number, number, number, number] | undefined>([1, 1, 1, .5]),
        editing: false,
        positions: reactPositions(undefined),
        depth: 0,
    });
}
extendClassProps(GeoSmoothPolygon.prototype, GeoSmoothPolygon.createDefaultProps);
export interface GeoSmoothPolygon extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoSmoothPolygon.createDefaultProps>> { };