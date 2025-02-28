import { clamp0_360, clampN180_180, geoHeading, geoRhumbHeading, PickedInfo } from "earthsdk3";
import { CzmPolyline, GeoCustomDivPoi, PositionsEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { angleToHumanStr, createInnerHtmlWithWhiteTextBlackBackground, getPointerEventButton } from "../../../utils";
import { Destroyable, Listener, Event, react, createNextAnimateFrameEvent, reactPositions, reactArray, extendClassProps, ReactivePropsToNativePropsAndChanged, track, bind, SceneObjectKey } from "xbsj-base";

export type GeoDirectionMeasurementAngleMode = '-180~180' | '0~360';
export type GeoDirectionMeasurementTextFuncType = (heading: number) => string;
export class GeoDirectionMeasurement extends Destroyable {
    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _heading = this.disposeVar(react(0));
    get heading() { return this._heading.value; }
    get headingChanged() { return this._heading.changed; }

    // XE2['xe2-cesium-objects']
    // enum LonLatFormat
    // DECIMAL_DEGREE   度格式，dd.ddddd°
    // DEGREES_DECIMAL_MINUTES  度分格式，dd°mm.mmm'
    // SEXAGESIMAL_DEGREE  度分秒格式，dd°mm'ss"

    static defaultTextFunc_度格式 = (heading: number) => {
        return `${heading.toFixed(5)}°`;
    };

    static defaultTextFunc_度分格式 = (heading: number) => {
        return `${angleToHumanStr(heading, true)}`;
    };

    static defaultTextFunc_度分秒格式 = (heading: number) => {
        return `${angleToHumanStr(heading, false)}`;
    };

    private _textFunc = this.disposeVar(react<GeoDirectionMeasurementTextFuncType | undefined>(undefined));
    get textFunc() { return this._textFunc.value; }
    set textFunc(value: GeoDirectionMeasurementTextFuncType | undefined) { this._textFunc.value = value; }
    get textFuncChanged() { return this._textFunc.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], false, [this, 'editing'], czmViewer, 2));
        const sceneObject = this;
        {
            const update = () => {
                if (!this.positions) {
                    return;
                }

                if (this.positions.length >= 2) {
                    let heading = 0;
                    if (this.arcType === undefined || this.arcType === 'GEODESIC') {
                        heading = geoHeading(this.positions[0], this.positions[1]);
                    } else if (this.arcType === 'RHUMB') {
                        heading = geoRhumbHeading(this.positions[0], this.positions[1]);
                    } else if (this.arcType === 'NONE') {
                        heading = geoHeading(this.positions[0], this.positions[1]);
                    } else {
                        console.warn(`未知的arcType: ${this.arcType}，导致距离无法计算！`);
                    }
                    this._heading.value = this.angleMode === '-180~180' ? clampN180_180(heading) : clamp0_360(heading);
                }
            }
            update();
            const updateDistancesEvent = this.disposeVar(createNextAnimateFrameEvent(
                this.positionsChanged,
                this.arcTypeChanged,
                this.angleModeChanged,
            ));
            this.dispose(updateDistancesEvent.disposableOn(update));
        }
        const geoPolyline = this.disposeVar(new CzmPolyline(czmViewer, id));

        geoPolyline.loop = false;

        this.dispose(track([geoPolyline, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([geoPolyline, 'arcType'], [sceneObject, 'arcType']));
        this.dispose(bind([geoPolyline, 'color'], [sceneObject, 'color']));
        this.dispose(bind([geoPolyline, 'dashLength'], [sceneObject, 'dashLength']));
        this.dispose(bind([geoPolyline, 'dashPattern'], [sceneObject, 'dashPattern']));
        // this.dispose(bind([geoPolyline, 'editing'], [directionMeasurement, 'editing']));
        this.dispose(bind([geoPolyline, 'gapColor'], [sceneObject, 'gapColor']));
        this.dispose(bind([geoPolyline, 'hasArrow'], [sceneObject, 'hasArrow']));
        this.dispose(bind([geoPolyline, 'hasDash'], [sceneObject, 'hasDash']));
        this.dispose(bind([geoPolyline, 'positions'], [sceneObject, 'positions']));
        this.dispose(bind([geoPolyline, 'show'], [sceneObject, 'show']));
        this.dispose(bind([geoPolyline, 'width'], [sceneObject, 'width']));
        this.dispose(bind([geoPolyline, 'depthTest'], [sceneObject, 'depthTest']));
        this.dispose(bind([geoPolyline, 'ground'], [sceneObject, 'strokeGround']));

        this.dispose(sceneObject.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }
            geoPolyline.flyTo(duration);
        }));

        const geoDivPoi = this.disposeVar(new GeoCustomDivPoi(czmViewer, id));
        this.dispose(bind([geoDivPoi, 'shadowDom'], [sceneObject, 'shadowDom']));
        this.dispose(bind([geoDivPoi, 'cssAllInitial'], [sceneObject, 'cssAllInitial']));
        this.dispose(bind([geoDivPoi, 'show'], [sceneObject, 'show']));
        {
            const update = () => {
                if (sceneObject.positions && sceneObject.positions.length >= 2) {
                    geoDivPoi.position = sceneObject.positions[1];
                } else {
                    geoDivPoi.position = undefined;
                }
            };
            update();
            this.dispose(sceneObject.positionsChanged.disposableOn(update));
        }
        {
            const update = () => {
                const { heading } = sceneObject;
                // text = angleToHumanStr(heading);
                const text = (sceneObject.textFunc ?? GeoDirectionMeasurement.defaultTextFunc_度格式)(heading);
                geoDivPoi.innerHTML = createInnerHtmlWithWhiteTextBlackBackground(`方向: ${text}`, 24);
            };
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(sceneObject.headingChanged, sceneObject.textFuncChanged));
            this.dispose(event.disposableOn(update));
        }
        this.ad(geoDivPoi.pickedEvent.don((pickedInfo) => {
            if (getPointerEventButton(pickedInfo) === 0)
                this.pickedEvent.emit(pickedInfo);
        }))
    }
    static defaults = {
        positions: [],
    }
}

export namespace GeoDirectionMeasurement {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        positions: reactPositions(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        width: 8, // undfined时为1.0，A numeric Property specifying the width in pixels.
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        hasDash: false,
        gapColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]), // default [0, 0, 0, 0]
        dashLength: 16, // default 16
        dashPattern: 255, // default 255
        hasArrow: true,
        arcType: 'GEODESIC',
        editing: false,
        depthTest: false, //深度检测
        shadowDom: false,
        cssAllInitial: false,
        angleMode: '-180~180' as GeoDirectionMeasurementAngleMode,
        strokeGround: false,
    });
}
extendClassProps(GeoDirectionMeasurement.prototype, GeoDirectionMeasurement.createDefaultProps);
export interface GeoDirectionMeasurement extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoDirectionMeasurement.createDefaultProps>> { }

