import { ESSurfaceAreaMeasurement } from "earthsdk3";
import { CzmESGeoPolygon } from "../CzmESGeoPolygon";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import { flyWithPositions } from "../../../utils";
import { CzmSpaceAreaMeasurement } from "./CzmSpaceAreaMeasurement";

export class CzmESSurfaceAreaMeasurement extends CzmESGeoPolygon<ESSurfaceAreaMeasurement> {
    static override readonly type = this.register("ESCesiumViewer", ESSurfaceAreaMeasurement.type, this);
    private _czmAreaMeasurement;
    get czmAreaMeasurement() { return this._czmAreaMeasurement; }

    constructor(sceneObject: ESSurfaceAreaMeasurement, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmAreaMeasurement = this.disposeVar(new CzmSpaceAreaMeasurement(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmAreaMeasurement = this._czmAreaMeasurement;

        this.dispose(track([czmAreaMeasurement, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmAreaMeasurement, 'positions'], [sceneObject, 'points']));
        this.dispose(bind([czmAreaMeasurement, 'editing'], [sceneObject, 'editing']));
        this.dispose(track([czmAreaMeasurement, 'interpolationDistance'], [sceneObject, 'interpolation']));
        this.dispose(track([czmAreaMeasurement, 'offsetHeight'], [sceneObject, 'offsetHeight']));
        {
            const updateProp = () => {
                if (this.geoPolygon)
                    this.geoPolygon.outline = false;
                const stroked = sceneObject.stroked
                if (!stroked) {
                    czmAreaMeasurement.outlineWidth = 0;
                    return
                } else {
                    czmAreaMeasurement.outlineWidth = sceneObject.strokeWidth;
                }

                czmAreaMeasurement.outlineWidth = sceneObject.strokeWidth;
                czmAreaMeasurement.outlineColor = sceneObject.strokeColor;
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.strokeStyleChanged,
                sceneObject.strokedChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }
        this.dispose(sceneObject.startEvent.don(() => { this._czmAreaMeasurement.start() }))
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmAreaMeasurement } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmAreaMeasurement.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmAreaMeasurement.positions, duration);
                return true;
            }
            return true;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmAreaMeasurement } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (czmAreaMeasurement.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmAreaMeasurement.positions, duration);
                return true;
            }
            return true;
        }
    }
}
