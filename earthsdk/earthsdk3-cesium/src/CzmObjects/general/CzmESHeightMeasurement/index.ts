import { ESHeightMeasurement } from "earthsdk3";
import { CzmESVisualObject } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions, getCzmPickedInfoFromPickedInfo, getPointerEventButton } from "../../../utils";
import { bind, createNextAnimateFrameEvent, JsonValue, track } from "xbsj-base";
import { GeoHeightMeasurement } from "./GeoHeightMeasurement";

export class CzmESHeightMeasurement extends CzmESVisualObject<ESHeightMeasurement> {
    static readonly type = this.register("ESCesiumViewer", ESHeightMeasurement.type, this);

    private _geoHeightMeasurement;
    get czmHeightMeasurement() { return this._geoHeightMeasurement; }

    constructor(sceneObject: ESHeightMeasurement, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._geoHeightMeasurement = this.disposeVar(new GeoHeightMeasurement(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const { czmHeightMeasurement } = this;
        this.dispose(track([czmHeightMeasurement, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmHeightMeasurement, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmHeightMeasurement, 'positions'], [sceneObject, 'points']));
        this.dispose(bind([czmHeightMeasurement, 'editing'], [sceneObject, 'editing']));

        {
            const updateProp = () => {
                const stroked = sceneObject.stroked
                if (!stroked) {
                    czmHeightMeasurement.width = 0;
                    return
                } else {
                    czmHeightMeasurement.width = sceneObject.strokeWidth;
                }

                czmHeightMeasurement.width = sceneObject.strokeWidth;
                czmHeightMeasurement.color = sceneObject.strokeColor;

                const strokeMaterial = sceneObject.strokeMaterial ?? 'normal'
                if (strokeMaterial === 'hasDash') {
                    czmHeightMeasurement.hasDash = true
                    czmHeightMeasurement.hasArrow = false
                } else if (strokeMaterial === 'hasArrow') {
                    czmHeightMeasurement.hasDash = false
                    czmHeightMeasurement.hasArrow = true
                } else if (strokeMaterial === 'normal') {
                    czmHeightMeasurement.hasDash = false
                    czmHeightMeasurement.hasArrow = false
                } else {
                    czmHeightMeasurement.hasDash = false
                    czmHeightMeasurement.hasArrow = false
                }

                const strokeStyle = sceneObject.strokeStyle
                if (strokeStyle.material === 'hasDash' && strokeStyle.materialParams) {
                    try {
                        const params = strokeStyle.materialParams as ({ [x: string]: JsonValue })
                        if (Reflect.has(params, 'gapColor')) {
                            czmHeightMeasurement.gapColor = params.gapColor as [number, number, number, number] ?? [0, 0, 0, 0];
                        }
                        if (Reflect.has(params, 'dashLength')) {
                            czmHeightMeasurement.dashLength = params.dashLength as number
                        }
                        if (Reflect.has(params, 'dashPattern')) {
                            czmHeightMeasurement.dashPattern = params.dashPattern as number
                        }
                    } catch (error) {
                        console.error(error)
                    }
                } else {
                    czmHeightMeasurement.gapColor = [0, 0, 0, 0];
                    czmHeightMeasurement.dashLength = 0;
                    czmHeightMeasurement.dashPattern = 0;
                }
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.strokeStyleChanged,
                sceneObject.strokedChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }

        this.dispose(czmHeightMeasurement.pickedEvent.disposableOn(pickedInfo => {
            if (getPointerEventButton(pickedInfo) === 0 && (sceneObject.allowPicking ?? false)) {
                const pickInfo = getCzmPickedInfoFromPickedInfo(pickedInfo)
                sceneObject.pickedEvent.emit({ attachedInfo: pickInfo });
            }
        }));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmHeightMeasurement } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmHeightMeasurement.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmHeightMeasurement.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmHeightMeasurement } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (czmHeightMeasurement.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmHeightMeasurement.positions, duration);
                return true;
            }
            return false;
        }
    }
}
