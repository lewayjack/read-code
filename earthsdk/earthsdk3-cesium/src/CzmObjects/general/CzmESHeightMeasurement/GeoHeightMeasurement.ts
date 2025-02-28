import { geoDistance, geoRhumbDistance, lbhToXyz, PickedInfo } from "earthsdk3";
import { CzmPolyline, GeoCustomDivPoi, PositionsEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createInnerHtmlWithWhiteTextBlackBackground, getPointerEventButton } from "../../../utils";
import { Destroyable, Listener, Event, react, reactArrayWithUndefined, reactPositions, reactArray, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, track, bind, SceneObjectKey } from "xbsj-base";
import { distanceToHumanStr } from "../CzmESAreaMeasurement/utils";

function getDistance(xyz0: [number, number, number], xyz1: [number, number, number]) {
    const d0 = xyz0[0] - xyz1[0];
    const d1 = xyz0[1] - xyz1[1];
    const d2 = xyz0[2] - xyz1[2];
    const d = Math.sqrt(d0 * d0 + d1 * d1 + d2 * d2);
    return d;
}


export class GeoHeightMeasurement extends Destroyable {
    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }


    private _distance = this.disposeVar(react(0));
    get distance() { return this._distance.value; }
    get distanceChanged() { return this._distance.changed; }

    private _surfaceDistance = this.disposeVar(react(0));
    get surfaceDistance() { return this._surfaceDistance.value; }
    get surfaceDistanceChanged() { return this._surfaceDistance.changed; }

    private _height = this.disposeVar(react(0));
    get height() { return this._height.value; }
    get heightChanged() { return this._height.changed; }

    private _middlePosition = this.disposeVar(reactArrayWithUndefined<[number, number, number] | undefined>(undefined));
    get middlePosition() { return this._middlePosition.value; }
    get middlePositionChanged() { return this._middlePosition.changed; }

    // private _distancePosition = this.disposeVar(reactArrayWithUndefined<[number, number, number] | undefined>(undefined));
    // get distancePosition() { return this._distancePosition.value; }
    // get distancePositionChanged() { return this._distancePosition.changed; }

    // private _surfaceDistancePosition = this.disposeVar(reactArrayWithUndefined<[number, number, number] | undefined>(undefined));
    // get surfaceDistancePosition() { return this._surfaceDistancePosition.value; }
    // get surfaceDistancePositionChanged() { return this._surfaceDistancePosition.changed; }

    private _heightPosition = this.disposeVar(reactArrayWithUndefined<[number, number, number] | undefined>(undefined));
    get heightPosition() { return this._heightPosition.value; }
    get heightPositionChanged() { return this._heightPosition.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], false, [this, 'editing'], czmViewer, 2));

        const updateDistances = () => {
            if (!this.positions) {
                return;
            }

            if (this.positions.length >= 2) {
                this._middlePosition.value = [this.positions[0][0], this.positions[0][1], this.positions[1][2]];
                this._heightPosition.value = [this.positions[0][0], this.positions[0][1], 0.5 * (this.positions[1][2] + this.positions[0][2])];

                if (this.arcType === undefined || this.arcType === 'GEODESIC') {
                    const sd = this._surfaceDistance.value = geoDistance(this.positions[0], this.positions[1]);
                    const sh = this._height.value = this.positions[1][2] - this.positions[0][2];
                    this._distance.value = Math.sqrt(sd * sd + sh * sh);
                } else if (this.arcType === 'RHUMB') {
                    const sd = this._surfaceDistance.value = geoRhumbDistance(this.positions[0], this.positions[1]);
                    const sh = this._height.value = this.positions[1][2] - this.positions[0][2];
                    this._distance.value = Math.sqrt(sd * sd + sh * sh);
                } else if (this.arcType === 'NONE') {
                    const xyz0 = lbhToXyz(this.positions[0]);
                    const xyz1 = lbhToXyz(this.positions[1]);
                    this._distance.value = getDistance(xyz0, xyz1);
                    this._surfaceDistance.value = getDistance(lbhToXyz(this._middlePosition.value), xyz1);
                    this._height.value = this.positions[1][2] - this.positions[0][2];
                } else {
                    console.warn(`未知的arcType: ${this.arcType}，导致距离无法计算！`);
                }
            }
        }

        updateDistances();
        const updateDistancesEvent = this.disposeVar(createNextAnimateFrameEvent(this.positionsChanged, this.arcTypeChanged));
        this.dispose(updateDistancesEvent.disposableOn(updateDistances));
        {
            const geoPolyline = this.disposeVar(new CzmPolyline(czmViewer, id));
            geoPolyline.ground = false;
            geoPolyline.loop = false;

            this.dispose(track([geoPolyline, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(bind([geoPolyline, 'arcType'], [this, 'arcType']));
            this.dispose(bind([geoPolyline, 'color'], [this, 'color']));
            this.dispose(bind([geoPolyline, 'dashLength'], [this, 'dashLength']));
            this.dispose(bind([geoPolyline, 'dashPattern'], [this, 'dashPattern']));
            // this.dispose(bind([geoPolyline, 'editing'], [distanceMeasurement, 'editing']));
            this.dispose(bind([geoPolyline, 'gapColor'], [this, 'gapColor']));
            this.dispose(bind([geoPolyline, 'hasArrow'], [this, 'hasArrow']));
            this.dispose(bind([geoPolyline, 'hasDash'], [this, 'hasDash']));
            // this.dispose(bind([geoPolyline, 'positions'], [distanceMeasurement, 'positions']));
            this.dispose(bind([geoPolyline, 'show'], [this, 'show']));
            this.dispose(bind([geoPolyline, 'width'], [this, 'width']));
            this.dispose(bind([geoPolyline, 'depthTest'], [this, 'depthTest']));

            {
                geoPolyline.loop = true;
                const updatePositions = () => {
                    if (this.positions && this.positions.length === 2) {
                        const [p0, p1] = this.positions;
                        geoPolyline.positions = [p0, p1, [p0[0], p0[1], p1[2]]];
                    }
                };
                updatePositions();
                this.dispose(this.positionsChanged.disposableOn(updatePositions));
            }

            this.dispose(this.flyToEvent.disposableOn(duration => {
                if (!czmViewer.actived) {
                    return;
                }
                geoPolyline.flyTo(duration);
            }));

            const geoDivPoi = this.disposeVar(new GeoCustomDivPoi(czmViewer, id));
            this.dispose(track([geoDivPoi, 'shadowDom'], [this, 'shadowDom']));
            this.dispose(track([geoDivPoi, 'cssAllInitial'], [this, 'cssAllInitial']));
            this.dispose(track([geoDivPoi, 'show'], [this, 'show']));
            {
                const update = () => {
                    geoDivPoi.position = this.heightPosition;
                };
                update();
                this.dispose(this.heightPositionChanged.disposableOn(update));
            }
            {
                const update = () => {
                    geoDivPoi.innerHTML = createInnerHtmlWithWhiteTextBlackBackground(`高度: ${distanceToHumanStr(this.height)}`, 0);
                };
                update();
                this.dispose(this.heightChanged.disposableOn(update));
            }
            this.ad(geoDivPoi.pickedEvent.don((pickedInfo) => {
                if (getPointerEventButton(pickedInfo) === 0)
                    this.pickedEvent.emit(pickedInfo);
            }))
        }
    }
}

export namespace GeoHeightMeasurement {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        positions: reactPositions(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        width: 1, // undfined时为1.0，A numeric Property specifying the width in pixels.
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        hasDash: false,
        gapColor: reactArrayWithUndefined<[number, number, number, number]>([0, 0, 0, 0]), // default [0, 0, 0, 0]
        dashLength: 16, // default 16
        dashPattern: 255, // default 255
        hasArrow: false,
        arcType: 'GEODESIC',
        editing: false,
        depthTest: false, //深度检测
        shadowDom: false,
        cssAllInitial: false,
    });
}
extendClassProps(GeoHeightMeasurement.prototype, GeoHeightMeasurement.createDefaultProps);
export interface GeoHeightMeasurement extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoHeightMeasurement.createDefaultProps>> { }
