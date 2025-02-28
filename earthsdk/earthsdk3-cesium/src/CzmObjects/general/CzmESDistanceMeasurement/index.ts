import { ESDistanceMeasurement } from "earthsdk3";
import { CzmESVisualObject } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions, getCzmPickedInfoFromPickedInfo, getPointerEventButton } from "../../../utils";
import { bind, createNextAnimateFrameEvent, JsonValue, track } from "xbsj-base";
import { GeoDistanceMeasurement } from "./GeoDistanceMeasurement";

export class CzmESDistanceMeasurement extends CzmESVisualObject<ESDistanceMeasurement> {
    static readonly type = this.register("ESCesiumViewer", ESDistanceMeasurement.type, this);

    private _czmDistanceMeasurement;
    get czmDistanceMeasurement() { return this._czmDistanceMeasurement; }

    constructor(sceneObject: ESDistanceMeasurement, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmDistanceMeasurement = this.disposeVar(new GeoDistanceMeasurement(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const { czmDistanceMeasurement } = this;
        this.dispose(track([czmDistanceMeasurement, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmDistanceMeasurement, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmDistanceMeasurement, 'positions'], [sceneObject, 'points']));
        this.dispose(bind([czmDistanceMeasurement, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([czmDistanceMeasurement, 'strokeGround'], [sceneObject, 'strokeGround']));
        {
            const updateProp = () => {
                const stroked = sceneObject.stroked
                if (!stroked) {
                    czmDistanceMeasurement.width = 0;
                    return
                } else {
                    czmDistanceMeasurement.width = sceneObject.strokeWidth;
                }

                czmDistanceMeasurement.width = sceneObject.strokeWidth;
                czmDistanceMeasurement.color = sceneObject.strokeColor;

                const strokeMaterial = sceneObject.strokeMaterial ?? 'normal'
                if (strokeMaterial === 'hasDash') {
                    czmDistanceMeasurement.hasDash = true
                    czmDistanceMeasurement.hasArrow = false
                } else if (strokeMaterial === 'hasArrow') {
                    czmDistanceMeasurement.hasDash = false
                    czmDistanceMeasurement.hasArrow = true
                } else if (strokeMaterial === 'normal') {
                    czmDistanceMeasurement.hasDash = false
                    czmDistanceMeasurement.hasArrow = false
                } else {
                    czmDistanceMeasurement.hasDash = false
                    czmDistanceMeasurement.hasArrow = false
                }

                const strokeStyle = sceneObject.strokeStyle
                if (strokeStyle.material === 'hasDash' && strokeStyle.materialParams) {
                    try {
                        const params = strokeStyle.materialParams as ({ [x: string]: JsonValue })
                        if (Reflect.has(params, 'gapColor')) {
                            czmDistanceMeasurement.gapColor = params.gapColor as [number, number, number, number] ?? [0, 0, 0, 0];
                        }
                        if (Reflect.has(params, 'dashLength')) {
                            czmDistanceMeasurement.dashLength = params.dashLength as number
                        }
                        if (Reflect.has(params, 'dashPattern')) {
                            czmDistanceMeasurement.dashPattern = params.dashPattern as number
                        }
                    } catch (error) {
                        console.error(error)
                    }
                } else {
                    czmDistanceMeasurement.gapColor = [0, 0, 0, 0];
                    czmDistanceMeasurement.dashLength = 0;
                    czmDistanceMeasurement.dashPattern = 0;
                }
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.strokeStyleChanged,
                sceneObject.strokedChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }

        this.dispose(czmDistanceMeasurement.pickedEvent.disposableOn(pickedInfo => {
            if (getPointerEventButton(pickedInfo) === 0 && (sceneObject.allowPicking ?? false)) {
                const pickInfo = getCzmPickedInfoFromPickedInfo(pickedInfo)
                sceneObject.pickedEvent.emit({ attachedInfo: pickInfo });
            }
        }));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmDistanceMeasurement } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmDistanceMeasurement.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmDistanceMeasurement.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmDistanceMeasurement } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (czmDistanceMeasurement.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmDistanceMeasurement.positions, duration);
                return true;
            }
            return false;
        }
    }
}
