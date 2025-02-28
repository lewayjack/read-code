import * as Cesium from 'cesium';
import { ES3DTileset, ESGeoPolygon, ESSceneObjectWithId, PickedInfo } from "earthsdk3";
import { CzmES3DTileset, CzmTexture, PointEditing, PositionsCenter, PositionsEditing } from '../../../CzmObjects';
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { Destroyable, Listener, Event, reactPositions, extendClassProps, ReactivePropsToNativePropsAndChanged, track, SceneObjectWithId, ObjResettingWithEvent, createGuid, react } from 'xbsj-base';
import { GeoPolygonCanvas } from './GeoPolygonCanvas';
import { CzmFlattenedPlane } from './CzmFlattenedPlane';

class CzmFlattenedPlaneWithIdResetting extends Destroyable {
    constructor(private _czmPolygonFlattenedPlane: CzmPolygonFlattenedPlane, private _czmFlattenedPlane: CzmFlattenedPlane) {
        super();

        {
            const { polygonCanvas } = this._czmPolygonFlattenedPlane;
            const earthRadius = 6378137;
            const tr = Cesium.Math.toRadians;
            const update = () => {
                const { canvasGeoInfo } = polygonCanvas;
                if (!canvasGeoInfo) return;
                const { rect, height } = canvasGeoInfo;
                const center = [(rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2, height] as [number, number, number];

                const w = tr(rect[2] - rect[0]) * earthRadius * Math.cos(tr(center[1]));
                const h = tr(rect[3] - rect[1]) * earthRadius;
                this._czmFlattenedPlane.position = center;
                this._czmFlattenedPlane.minSize = [-w * .5, -h * .5];
                this._czmFlattenedPlane.maxSize = [w * .5, h * .5];
            };
            update();
            this.dispose(polygonCanvas.canvasGeoInfoChanged.disposableOn(update));
        }

        // this._czmFlattenedPlane.czmTextureId = this._czmPolygonFlattenedPlane.czmTexture.id;
        // this.dispose(() => this._czmFlattenedPlane.czmTextureId = '');
        this._czmFlattenedPlane.czmTextureWithId.id = this._czmPolygonFlattenedPlane.czmTexture.id;
        this.dispose(() => this._czmFlattenedPlane.czmTextureWithId.id = undefined);

        {
            const origin = this._czmFlattenedPlane.showHelper;
            this._czmFlattenedPlane.showHelper = false;
            this.dispose(() => this._czmFlattenedPlane.showHelper = origin);
        }

        this.dispose(track([this._czmFlattenedPlane, 'enabled'], [this._czmPolygonFlattenedPlane, 'enabled']));
    }
}

export class CzmPolygonFlattenedPlane extends Destroyable {
    private _id = this.disposeVar(react<string>(createGuid()));
    get id() { return this._id.value; }
    set id(value: string) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _sPointEditing;
    get sPointEditing() { return this._sPointEditing; }

    private _positionsCenter;
    get positionsCenter() { return this._positionsCenter; }

    private _czmTexture;
    get czmTexture() { return this._czmTexture; }

    private _polygon;
    get polygon() { return this._polygon; }

    private _polygonCanvas;
    get polygonCanvas() { return this._polygonCanvas; }

    private _czmFlattenedPlaneWithId;
    get czmFlattenedPlaneWithId() { return this._czmFlattenedPlaneWithId; }

    private _czmFlattendPlaneWithIdResetting;
    get czmFlattendPlaneWithIdResetting() { return this._czmFlattendPlaneWithIdResetting; }

    constructor(czmViewer: ESCesiumViewer, id?: string) {
        super();
        id && (this._id.value = id);
        {
            this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], true, [this, 'editing'], czmViewer));
            this._sPointEditing = this.disposeVar(new PointEditing([this, 'positions'], [this, 'pointEditing'], czmViewer));
            this._positionsCenter = this.disposeVar(new PositionsCenter([this, 'positions']));
            this._czmTexture = this.disposeVar(new CzmTexture(czmViewer, id));
            this._polygon = this.disposeVar(new ESGeoPolygon());
            {
                czmViewer.add(this._polygon);
                this.ad(() => {
                    czmViewer.delete(this._polygon);
                })
            }
            this.dispose(track([this._polygon, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(track([this._polygon, 'points'], [this, 'positions']));
            this.dispose(track([this._polygon, 'show'], [this, 'show']));
            this._polygonCanvas = this.disposeVar(new GeoPolygonCanvas(czmViewer, id));

            this._polygonCanvas.geoPolygonWithId.sceneObject = this._polygon;
            const update = () => {
                this._czmTexture.copyFromCanvas(this._polygonCanvas.canvas);
            };
            update();
            this.dispose(this._polygonCanvas.canvasChanged.disposableOn(update));
            this.dispose(this._czmTexture.readyEvent.disposableOn(update));
            this._czmFlattenedPlaneWithId = this.disposeVar(new ESSceneObjectWithId());
            this.dispose(track([this._czmFlattenedPlaneWithId, 'id'], [this, 'czmFlattenedPlaneId']));
            this._czmFlattendPlaneWithIdResetting = this.disposeVar(new ObjResettingWithEvent(this.czmFlattenedPlaneWithId.sceneObjectChanged, () => {
                const { sceneObject } = this.czmFlattenedPlaneWithId;
                if (!sceneObject) return undefined;
                let czmFlattenedPlane: CzmFlattenedPlane | undefined = undefined;
                do {
                    const czmSceneObject = czmViewer.getCzmObject(sceneObject);
                    if (sceneObject instanceof ES3DTileset) {
                        czmFlattenedPlane = (czmSceneObject as CzmES3DTileset).flattenedPlane
                    }
                } while (false);
                if (!(czmFlattenedPlane instanceof CzmFlattenedPlane)) return undefined;
                return new CzmFlattenedPlaneWithIdResetting(this, czmFlattenedPlane);
            }));

        }
        this.dispose(this._flyToEvent.disposableOn(duration => {
            this._polygon.flyTo(duration);
        }));
    }
}

export namespace CzmPolygonFlattenedPlane {
    export const createDefaultProps = () => ({
        enabled: true,
        show: true,
        editing: false,
        pointEditing: false,
        positions: reactPositions([]),
        allowPicking: false,
        czmFlattenedPlaneId: '',
    });
}
extendClassProps(CzmPolygonFlattenedPlane.prototype, CzmPolygonFlattenedPlane.createDefaultProps);
export interface CzmPolygonFlattenedPlane extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolygonFlattenedPlane.createDefaultProps>> { }
