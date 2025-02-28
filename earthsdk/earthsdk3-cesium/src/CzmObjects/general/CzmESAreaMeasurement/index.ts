import { ESAreaMeasurement, SceneObjectPickedInfo } from "earthsdk3";
import { CzmESGeoVector } from "../..";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions, getCzmPickedInfoFromPickedInfo } from "../../../utils";
import { bind, createNextAnimateFrameEvent, JsonValue, track } from "xbsj-base";
import { GeoAreaMeasurement } from "./GeoAreaMeasurement";

export class CzmESAreaMeasurement<T extends ESAreaMeasurement = ESAreaMeasurement> extends CzmESGeoVector<T> {
    static readonly type = this.register<ESAreaMeasurement, ESCesiumViewer>("ESCesiumViewer", ESAreaMeasurement.type, this);
    private _czmAreaMeasurement;
    get czmAreaMeasurement() { return this._czmAreaMeasurement; }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmAreaMeasurement = this.disposeVar(new GeoAreaMeasurement(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        sceneObject.strokeGround = false;
        sceneObject.fillGround = false;

        const czmAreaMeasurement = this._czmAreaMeasurement;
        this.dispose(track([czmAreaMeasurement, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmAreaMeasurement, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmAreaMeasurement, 'positions'], [sceneObject, 'points']));
        this.dispose(bind([czmAreaMeasurement, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([czmAreaMeasurement, 'strokeGround'], [sceneObject, 'strokeGround']));
        this.d(bind([czmAreaMeasurement, 'ground'], [sceneObject, 'fillGround']));
        {
            const updateProp = () => {
                const stroked = sceneObject.stroked
                if (!stroked) {
                    czmAreaMeasurement.width = 0;
                    return
                } else {
                    czmAreaMeasurement.width = sceneObject.strokeWidth;
                }
                czmAreaMeasurement.color = sceneObject.strokeColor
                const strokeStyle = sceneObject.strokeStyle;
                if (strokeStyle.material === 'hasDash' && strokeStyle.materialParams) {
                    try {
                        const params = strokeStyle.materialParams as ({ [x: string]: JsonValue })
                        if (Reflect.has(params, 'gapColor')) {
                            czmAreaMeasurement.gapColor = params.gapColor as [number, number, number, number] | undefined ?? [0, 0, 0, 0];
                        }
                        if (Reflect.has(params, 'dashLength')) {
                            czmAreaMeasurement.dashLength = params.dashLength as number
                        }
                        if (Reflect.has(params, 'dashPattern')) {
                            czmAreaMeasurement.dashPattern = params.dashPattern as number
                        }
                    } catch (error) {
                        console.error(error)
                    }
                } else {
                    czmAreaMeasurement.gapColor = [0, 0, 0, 0];
                    czmAreaMeasurement.dashLength = 0
                    czmAreaMeasurement.dashPattern = 0
                }

                const strokeMaterial = sceneObject.strokeMaterial ?? 'normal'
                if (strokeMaterial === 'hasDash') {
                    czmAreaMeasurement.hasDash = true
                    czmAreaMeasurement.hasArrow = false
                } else if (strokeMaterial === 'hasArrow') {
                    czmAreaMeasurement.hasDash = false
                    czmAreaMeasurement.hasArrow = true
                } else if (strokeMaterial === 'normal') {
                    czmAreaMeasurement.hasDash = false
                    czmAreaMeasurement.hasArrow = false
                } else {
                    czmAreaMeasurement.hasDash = false
                    czmAreaMeasurement.hasArrow = false
                }
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.strokeStyleChanged,
                sceneObject.strokedChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }
        {
            const updateProp = () => {
                const filled = sceneObject.filled
                if (!filled) {
                    czmAreaMeasurement.fillColor = [1, 1, 1, 0];
                    return
                } else {
                    czmAreaMeasurement.fillColor = sceneObject.fillColor;
                }
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.fillStyleChanged,
                sceneObject.filledChanged
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }

        this.dispose(czmAreaMeasurement.pickedEvent.disposableOn(pickedInfo => {
            if (sceneObject.allowPicking ?? false) {
                const pickInfo = getCzmPickedInfoFromPickedInfo(pickedInfo)
                sceneObject.pickedEvent.emit({ attachedInfo: pickInfo });
            }
        }));
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
            return false;
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
            return false;
        }
    }
}
