import { ES3DTileset, ESPolygonFlattenedPlane, ESSceneObjectWithId } from "earthsdk3";
import { CzmESGeoVector } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions } from "../../../utils";
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, SceneObjectWithId, track } from "xbsj-base";
import { CzmPolygonFlattenedPlane } from "./CzmPolygonFlattenedPlane";

export * from './CzmFlattenedPlane';

class TilesIdResetting extends Destroyable {
    constructor(private _czmESPolygonFlattenedPlane: CzmESPolygonFlattenedPlane, private _eS3DTileset: ES3DTileset) {
        super();

        this._eS3DTileset.flattenedPlaneEnabled = true
        this._czmESPolygonFlattenedPlane.polygonFlattenedPlane.czmFlattenedPlaneId = this._eS3DTileset.flattenedPlaneId

        this.dispose(() => this._eS3DTileset.flattenedPlaneEnabled = false)
    }
}

export class CzmESPolygonFlattenedPlane<T extends ESPolygonFlattenedPlane = ESPolygonFlattenedPlane> extends CzmESGeoVector<T> {
    static readonly type = this.register<ESPolygonFlattenedPlane, ESCesiumViewer>("ESCesiumViewer", ESPolygonFlattenedPlane.type, this);

    private _polygonFlattenedPlane;
    get polygonFlattenedPlane() { return this._polygonFlattenedPlane; }

    private _tilesSceneObjectWithId;
    get tilesSceneObjectWithId() { return this._tilesSceneObjectWithId; }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._polygonFlattenedPlane = this.disposeVar(new CzmPolygonFlattenedPlane(czmViewer, sceneObject.id));
        this._tilesSceneObjectWithId = this.disposeVar(new ESSceneObjectWithId());
        this.dispose(track([this._tilesSceneObjectWithId, 'id'], [this.sceneObject, 'targetID']));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const polygonFlattenedPlane = this._polygonFlattenedPlane;

        polygonFlattenedPlane.enabled = true
        this.dispose(track([polygonFlattenedPlane, 'show'], [sceneObject, 'show']));
        this.dispose(bind([polygonFlattenedPlane, 'positions'], [sceneObject, 'points']));
        this.dispose(track([polygonFlattenedPlane, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([polygonFlattenedPlane, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([polygonFlattenedPlane, 'czmFlattenedPlaneId'], [sceneObject, 'czmFlattenedPlaneId']));
        this.dispose(track([polygonFlattenedPlane.polygon, 'stroked'], [sceneObject, 'stroked']));
        this.dispose(track([polygonFlattenedPlane.polygon, 'strokeColor'], [sceneObject, 'strokeColor']));
        this.dispose(track([polygonFlattenedPlane.polygon, 'strokeWidth'], [sceneObject, 'strokeWidth']));
        this.dispose(track([polygonFlattenedPlane.polygon, 'filled'], [sceneObject, 'filled']));
        this.dispose(track([polygonFlattenedPlane.polygon, 'fillColor'], [sceneObject, 'fillColor']));
        this.dispose(track([polygonFlattenedPlane.polygon, 'strokeGround'], [sceneObject, 'strokeGround']));
        this.dispose(track([polygonFlattenedPlane.polygon, 'fillGround'], [sceneObject, 'fillGround']));
        const event = this.disposeVar(createNextAnimateFrameEvent(this.tilesSceneObjectWithId.sceneObjectChanged, this.sceneObject.showChanged))
        this.disposeVar(new ObjResettingWithEvent(event, () => {
            const { sceneObject } = this.tilesSceneObjectWithId;
            if (!sceneObject) return undefined;
            if (!(sceneObject instanceof ES3DTileset)) return undefined;
            if (!this.sceneObject.show) return;

            return new TilesIdResetting(this, sceneObject as ES3DTileset);
        }));

    }

    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, polygonFlattenedPlane } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (polygonFlattenedPlane.positions) {
                flyWithPositions(czmViewer, sceneObject, id, polygonFlattenedPlane.positions, duration);
                return true;
            }
            return false;
        }
    }
}
