import { ESDirectionMeasurement } from "earthsdk3";
import { CzmESVisualObject } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions, getCzmPickedInfoFromPickedInfo, getPointerEventButton } from "../../../utils";
import { bind, createNextAnimateFrameEvent, JsonValue, track } from "xbsj-base";
import { GeoDirectionMeasurement } from "./GeoDirectionMeasurement";

export class CzmESDirectionMeasurement extends CzmESVisualObject<ESDirectionMeasurement> {
    static readonly type = this.register("ESCesiumViewer", ESDirectionMeasurement.type, this);
    private _czmDirectionMeasurement;
    get czmDirectionMeasurement() { return this._czmDirectionMeasurement; }

    constructor(sceneObject: ESDirectionMeasurement, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmDirectionMeasurement = this.disposeVar(new GeoDirectionMeasurement(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmDirectionMeasurement = this._czmDirectionMeasurement;
        // @ts-ignore
        czmDirectionMeasurement.angleMode = '0~360';
        this.dispose(track([czmDirectionMeasurement, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmDirectionMeasurement, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmDirectionMeasurement, 'positions'], [sceneObject, 'points']));
        this.dispose(bind([czmDirectionMeasurement, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([czmDirectionMeasurement, 'strokeGround'], [sceneObject, 'strokeGround']));
        {
            const updateProp = () => {
                const stroked = sceneObject.stroked
                if (!stroked) {
                    czmDirectionMeasurement.width = 0;
                    return
                } else {
                    czmDirectionMeasurement.width = sceneObject.strokeWidth;
                }

                czmDirectionMeasurement.width = sceneObject.strokeWidth;
                czmDirectionMeasurement.color = sceneObject.strokeColor;

                const strokeMaterial = sceneObject.strokeMaterial ?? 'normal'
                if (strokeMaterial === 'hasDash') {
                    czmDirectionMeasurement.hasDash = true
                    czmDirectionMeasurement.hasArrow = false
                } else if (strokeMaterial === 'hasArrow') {
                    czmDirectionMeasurement.hasDash = false
                    czmDirectionMeasurement.hasArrow = true
                } else if (strokeMaterial === 'normal') {
                    czmDirectionMeasurement.hasDash = false
                    czmDirectionMeasurement.hasArrow = false
                } else {
                    czmDirectionMeasurement.hasDash = false
                    czmDirectionMeasurement.hasArrow = true
                }

                const strokeStyle = sceneObject.strokeStyle
                if (strokeStyle.material === 'hasDash' && strokeStyle.materialParams) {
                    try {
                        const params = strokeStyle.materialParams as ({ [x: string]: JsonValue })
                        if (Reflect.has(params, 'gapColor')) {
                            czmDirectionMeasurement.gapColor = params.gapColor as [number, number, number, number] ?? [0, 0, 0, 0];
                        }
                        if (Reflect.has(params, 'dashLength')) {
                            czmDirectionMeasurement.dashLength = params.dashLength as number
                        }
                        if (Reflect.has(params, 'dashPattern')) {
                            czmDirectionMeasurement.dashPattern = params.dashPattern as number
                        }
                    } catch (error) {
                        console.error(error)
                    }
                } else {
                    czmDirectionMeasurement.gapColor = [0, 0, 0, 0];
                    czmDirectionMeasurement.dashLength = 0;
                    czmDirectionMeasurement.dashPattern = 0;
                }
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.strokeStyleChanged,
                sceneObject.strokedChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }

        this.dispose(czmDirectionMeasurement.pickedEvent.disposableOn(pickedInfo => {
            if (getPointerEventButton(pickedInfo) === 0 && (sceneObject.allowPicking ?? false)) {
                const pickInfo = getCzmPickedInfoFromPickedInfo(pickedInfo)
                sceneObject.pickedEvent.emit({ attachedInfo: pickInfo });
            }
        }));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmDirectionMeasurement } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmDirectionMeasurement.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmDirectionMeasurement.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmDirectionMeasurement } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (czmDirectionMeasurement.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmDirectionMeasurement.positions, duration);
                return true;
            }
            return false;
        }
    }
}
