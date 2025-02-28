import { ESGeoLineString } from "earthsdk3";
import { CzmESGeoVector, CzmPolyline } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import { flyWithPositions } from "@czmSrc/utils";

export class CzmESGeoLineString<T extends ESGeoLineString = ESGeoLineString> extends CzmESGeoVector<T> {
    static readonly type = this.register<ESGeoLineString, ESCesiumViewer>("ESCesiumViewer", ESGeoLineString.type, this);
    // private _sPositionsEditing = this.disposeVar(new PositionsEditing([this.sceneObject, 'points'], false, [this.sceneObject, 'editing'], this.czmViewer));
    // get sPositionsEditing() { return this._sPositionsEditing; }

    private _geoPolyline;
    get geoPolyline() { return this._geoPolyline; }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._geoPolyline = this.disposeVar(new CzmPolyline(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const geoPolyline = this._geoPolyline;

        this.dispose(track([geoPolyline, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([geoPolyline, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([geoPolyline, 'positions'], [sceneObject, 'points']));

        this.dispose(track([geoPolyline, 'width'], [sceneObject, 'strokeWidth']));
        this.dispose(track([geoPolyline, 'color'], [sceneObject, 'strokeColor']));
        this.dispose(track([geoPolyline, 'ground'], [sceneObject, 'strokeGround']));

        {
            const updateProp = () => {
                geoPolyline.show = sceneObject.show && sceneObject.stroked;
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.strokedChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoPolyline } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            super.flyTo(duration, id);
            return true;
        } else {
            if (geoPolyline.positions) {
                flyWithPositions(czmViewer, sceneObject, id, geoPolyline.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoPolyline } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            super.flyIn(duration, id);
            return true
        } else {
            if (geoPolyline.positions) {
                flyWithPositions(czmViewer, sceneObject, id, geoPolyline.positions, duration);
                return true;
            }
            return false;
        }
    }
}
