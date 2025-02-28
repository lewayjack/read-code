import { PickedInfo } from "earthsdk3";
import { CzmPolygonWithHeight, PointEditing, PositionsEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, Listener, Event, track, reactArray, reactPositions, extendClassProps, ReactivePropsToNativePropsAndChanged, ObjResettingWithEvent, SceneObjectKey, createGuid, react } from "xbsj-base";
import { CzmClassificationPolygon } from "./CzmClassificationPolygon";
export type GeoClassificationType = 'TERRAIN' | 'CESIUM_3D_TILE' | 'BOTH';

export class GeoClassificationPolygon extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _pointEditor;
    get pointEditor() { return this._pointEditor; }

    private _helperPolygon: CzmPolygonWithHeight;
    get helperPolygon() { return this._helperPolygon; }

    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], true, [this, 'editing'], czmViewer));
        this._pointEditor = this.disposeVar(new PointEditing([this, 'positions'], [this, 'pointEditing'], czmViewer));
        {
            const geoPolygon = this.disposeVar(new CzmPolygonWithHeight(czmViewer, id));
            this._helperPolygon = geoPolygon;
            this.dispose(track([geoPolygon, 'show'], [this, 'showHelper'], a => a));

            {
                const update = () => {
                    geoPolygon.show = (this.showHelper) ||
                        (this.editing) ||
                        (this.pointEditing);
                };
                update();
                this.dispose(this.showHelperChanged.disposableOn(update));
                this.dispose(this.editingChanged.disposableOn(update));
                this.dispose(this.pointEditingChanged.disposableOn(update));
            }

            this.dispose(track([geoPolygon, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(track([geoPolygon, 'outline'], [this, 'outline']));
            this.dispose(track([geoPolygon, 'outlineColor'], [this, 'outlineColor']));
            this.dispose(track([geoPolygon, 'outlineWidth'], [this, 'outlineWidth']));
            geoPolygon.fill = false;
            geoPolygon.color = [0, 0, 0, 0];
            this.dispose(track([geoPolygon, 'positions'], [this, 'positions']));
            this.dispose(track([geoPolygon, 'depth'], [this, 'depth']));
            this.dispose(track([geoPolygon, 'zIndex'], [this, 'zIndex']));
        }
        {
            this.disposeVar(new ObjResettingWithEvent(this.depthChanged, () => {
                if (this.depth === undefined || this.depth < 0) return undefined;
                return new CzmClassificationPolygon(this, czmViewer);
            }));
        }
    }

    static defaults = {
        // show: true,
        // showHelper: false,
        // allowPicking: false,
        // classificationType: 'Both' as GeoClassificationType,
        // outline: true,
        // outlineColor: [1, 1, 1, 1] as [number, number, number, number],
        // outlineWidth: 2,
        // fill: true,
        // color: [1, 1, 1, .5] as [number, number, number, number],
        // editing: false,
        // pointEditing: false,
        positions: [],
        // depth: 0,
        // zIndex: 0,
    };
}

export namespace GeoClassificationPolygon {
    export const createDefaultProps = () => ({
        show: true,
        showHelper: false,
        allowPicking: false,
        classificationType: 'BOTH' as GeoClassificationType,
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
    });
}
extendClassProps(GeoClassificationPolygon.prototype, GeoClassificationPolygon.createDefaultProps);
export interface GeoClassificationPolygon extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoClassificationPolygon.createDefaultProps>> { }
