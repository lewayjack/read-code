import { CzmESVisualObject } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions } from "../../../utils";
import { bind, createNextAnimateFrameEvent, JsonValue, track } from "xbsj-base";
import { GeoBezierPath } from "./GeoBezierPath";
import { ESGeoBezierPath } from "../../../ESObjects";

export * from './GeoPolylinePath';

export class CzmESGeoBezierPath extends CzmESVisualObject<ESGeoBezierPath> {
    static readonly type = this.register("ESCesiumViewer", ESGeoBezierPath.type, this);
    private _czmBezierPath;
    get czmBezierPath() { return this._czmBezierPath; }

    constructor(sceneObject: ESGeoBezierPath, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmBezierPath = this.disposeVar(new GeoBezierPath(czmViewer, sceneObject.id));
        sceneObject.geoPolylinePath = this._czmBezierPath.geoPolylinePath;
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmBezierPath = this._czmBezierPath;
        this.dispose(track([czmBezierPath, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmBezierPath, 'currentPoiShow'], [sceneObject, 'currentPoiShow']));
        this.dispose(track([czmBezierPath, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmBezierPath, 'positions'], [sceneObject, 'points']));
        this.dispose(bind([czmBezierPath, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([czmBezierPath, 'currentDistance'], [sceneObject, 'currentDistance']));
        this.dispose(track([czmBezierPath, 'resolution'], [sceneObject, 'resolution']));
        this.dispose(track([czmBezierPath, 'sharpness'], [sceneObject, 'sharpness']));
        this.dispose(track([czmBezierPath.geoPath, 'timePosRots'], [sceneObject.geoPath, 'timePosRots']));
        this.dispose(track([czmBezierPath, 'leadTime'], [sceneObject, 'leadTime']));
        this.dispose(track([czmBezierPath, 'trailTime'], [sceneObject, 'trailTime']));
        this.dispose(track([czmBezierPath.geoPolylinePath, 'ratio'], [sceneObject.geoPolylinePath, 'ratio']));
        this.dispose(track([czmBezierPath, 'loop'], [sceneObject, 'loop']));
        this.dispose(track([czmBezierPath, 'currentTime'], [sceneObject, 'currentTime']));
        this.dispose(track([czmBezierPath, 'duration'], [sceneObject, 'duration']));
        this.dispose(track([czmBezierPath, 'playing'], [sceneObject, 'playing']));
        this.dispose(track([czmBezierPath, 'speed'], [sceneObject, 'speed']));
        this.dispose(track([czmBezierPath, 'depthTest'], [sceneObject, 'depthTest']));
        this.dispose(track([czmBezierPath, 'arcType'], [sceneObject, 'arcType']));

        this.dispose(track([czmBezierPath, 'polylineShow'], [sceneObject, 'stroked']));
        this.dispose(track([czmBezierPath, 'width'], [sceneObject, 'strokeWidth']));
        this.dispose(track([czmBezierPath, 'color'], [sceneObject, 'strokeColor']));

        {
            const update = () => {
                czmBezierPath.ground = sceneObject.ground || sceneObject.strokeGround;
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.groundChanged, sceneObject.strokeGroundChanged))
            this.d(event.don(update));
        }
        {
            const updateProp = () => {
                const stroked = sceneObject.stroked
                if (!stroked) {
                    czmBezierPath.hasDash = false
                    czmBezierPath.hasArrow = false
                    return
                }

                const strokeStyle = sceneObject.strokeStyle;
                if (strokeStyle.material === 'hasDash' && strokeStyle.materialParams) {
                    try {
                        const params = strokeStyle.materialParams as ({ [x: string]: JsonValue })
                        if (Reflect.has(params, 'gapColor')) {
                            czmBezierPath.gapColor = (params.gapColor as [number, number, number, number]) ?? [0, 0, 0, 0];
                        }
                        if (Reflect.has(params, 'dashLength')) {
                            czmBezierPath.dashLength = params.dashLength as number
                        }
                        if (Reflect.has(params, 'dashPattern')) {
                            czmBezierPath.dashPattern = params.dashPattern as number
                        }
                    } catch (error) {
                        console.error(error)
                    }
                } else {
                    czmBezierPath.gapColor = [0, 0, 0, 0];
                    czmBezierPath.dashLength = 0;
                    czmBezierPath.dashLength = 0;
                }

                const strokeMaterial = sceneObject.strokeMaterial ?? 'normal'
                if (strokeMaterial === 'hasDash') {
                    czmBezierPath.hasDash = true
                    czmBezierPath.hasArrow = false
                } else if (strokeMaterial === 'hasArrow') {
                    czmBezierPath.hasDash = false
                    czmBezierPath.hasArrow = true
                } else if (strokeMaterial === 'normal') {
                    czmBezierPath.hasDash = false
                    czmBezierPath.hasArrow = false
                } else {
                    czmBezierPath.hasDash = false
                    czmBezierPath.hasArrow = false
                }

            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.strokeStyleChanged,
                sceneObject.strokedChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmBezierPath } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmBezierPath.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmBezierPath.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmBezierPath } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (czmBezierPath.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmBezierPath.positions, duration);
                return true;
            }
            return false;
        }
    }
}
