import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { geoPolylineToBezierSpline } from "../../../utils";
import { bind, createNextAnimateFrameEvent, Destroyable, extendClassProps, reactArray, ReactivePropsToNativePropsAndChanged, reactPositions, track, Event, Listener, react, SceneObjectKey } from "xbsj-base";
import { GeoPolylinePath } from "./GeoPolylinePath";
import { PointEditing, PositionsEditing } from "../../../CzmObjects";

export class GeoBezierPath extends Destroyable {
    private _geoPolylinePath;

    get geoPolylinePath() { return this._geoPolylinePath; }

    get geoPath() { return this._geoPolylinePath.geoPath; }

    get ratio() { return this._geoPolylinePath.ratio; }
    set ratio(value: number) { this._geoPolylinePath.ratio = value; }
    get ratioChanged() { return this._geoPolylinePath.ratioChanged; }

    get player() { return this._geoPolylinePath.player; }

    get currentInfo() { return this._geoPolylinePath.currentInfo; }
    get currentInfoChanged() { return this._geoPolylinePath.currentInfoChanged; }
    get currentIndex() { return this._geoPolylinePath.currentIndex; }
    get currentIndexChanged() { return this._geoPolylinePath.currentIndexChanged; }
    get currentPosition() { return this._geoPolylinePath.currentPosition; }
    get currentPositionChanged() { return this._geoPolylinePath.currentPositionChanged; }
    get currentRotation() { return this._geoPolylinePath.currentRotation; }
    get currentRotationChanged() { return this._geoPolylinePath.currentRotationChanged; }

    get accumDistances() { return this._geoPolylinePath.accumDistances; }
    get accumDistancesChanged() { return this._geoPolylinePath.accumDistances; }
    get totalDistance() { return this._geoPolylinePath.totalDistance; }
    get totalDistanceChanged() { return this._geoPolylinePath.totalDistanceChanged; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _currentDistance = this.disposeVar(react(0));
    get currentDistance() { return this._currentDistance.value; }
    set currentDistance(value: number) { this._currentDistance.value = value; }
    get currentDistanceChanged() { return this._currentDistance.changed; }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _pointEditor;
    get pointEditor() { return this._pointEditor; }


    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._geoPolylinePath = this.disposeVar(new GeoPolylinePath(czmViewer, id));
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], [this, 'loop'], [this, 'editing'], czmViewer));
        this._pointEditor = this.disposeVar(new PointEditing([this, 'positions'], [this, 'pointEditing'], czmViewer));

        this._geoPolylinePath.rotLerpMode = 'Lerp';

        this.dispose(bind([this._geoPolylinePath, 'show'], [this, 'show']));
        this.dispose(bind([this._geoPolylinePath, 'currentPoiShow'], [this, 'currentPoiShow']));
        this.dispose(bind([this._geoPolylinePath, 'polylineShow'], [this, 'polylineShow']));
        this.dispose(bind([this._geoPolylinePath, 'width'], [this, 'width']));
        this.dispose(bind([this._geoPolylinePath, 'ground'], [this, 'ground']));
        this.dispose(bind([this._geoPolylinePath, 'color'], [this, 'color']));
        this.dispose(bind([this._geoPolylinePath, 'hasDash'], [this, 'hasDash']));
        this.dispose(bind([this._geoPolylinePath, 'gapColor'], [this, 'gapColor']));
        this.dispose(bind([this._geoPolylinePath, 'dashLength'], [this, 'dashLength']));
        this.dispose(bind([this._geoPolylinePath, 'dashPattern'], [this, 'dashPattern']));
        this.dispose(bind([this._geoPolylinePath, 'hasArrow'], [this, 'hasArrow']));
        this.dispose(bind([this._geoPolylinePath, 'arcType'], [this, 'arcType']));
        this.dispose(bind([this._geoPolylinePath, 'currentDistance'], [this, 'currentDistance']));
        this.dispose(bind([this._geoPolylinePath, 'loop'], [this, 'loop']));
        this.dispose(bind([this._geoPolylinePath, 'currentTime'], [this, 'currentTime']));
        this.dispose(bind([this._geoPolylinePath, 'duration'], [this, 'duration']));
        this.dispose(bind([this._geoPolylinePath, 'playing'], [this, 'playing']));
        this.dispose(bind([this._geoPolylinePath, 'speed'], [this, 'speed']));

        this.dispose(bind([this._geoPolylinePath, 'depthTest'], [this, 'depthTest']));

        this.dispose(track([this._geoPolylinePath, 'leadTime'], [this, 'leadTime']));
        this.dispose(track([this._geoPolylinePath, 'trailTime'], [this, 'trailTime']));

        this.dispose(track([this._geoPolylinePath, 'allowPicking'], [this, 'allowPicking']));

        const updatePositionsEvent = this.disposeVar(createNextAnimateFrameEvent(this.positionsChanged, this.resolutionChanged, this.sharpnessChanged));
        const updatePolylinePostions = () => {
            try {
                if (this.positions && this.positions.length >= 2) {
                    const positions = geoPolylineToBezierSpline(this.positions, this.resolution, this.sharpness);
                    this._geoPolylinePath.positions = positions;
                } else {
                    this._geoPolylinePath.positions = undefined;
                }
            } catch (error) {
                console.error(error);
                this._geoPolylinePath.positions = undefined;
            }
        }
        updatePolylinePostions();
        this.dispose(updatePositionsEvent.disposableOn(updatePolylinePostions));

        this.dispose(this._flyToEvent.disposableOn(duration => {
            this._geoPolylinePath.flyTo(duration);
        }));
    }

    get timePosRots() {
        return this.geoPath.timePosRots;
    }
}

export namespace GeoBezierPath {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        currentPoiShow: true, // boolean} [show=true] A boolean Property specifying the visibility
        polylineShow: true, // boolean} [show=true] A boolean Property specifying the visibility
        positions: reactPositions(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        width: 1, // undfined时为1.0，A numeric Property specifying the width in pixels.
        ground: false,
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        hasDash: false,
        gapColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]), // default [0, 0, 0, 0]
        dashLength: 16, // default 16
        dashPattern: 255, // default 255
        hasArrow: false,
        arcType: 'GEODESIC',
        editing: false,
        pointEditing: false,

        loop: false,
        currentTime: 0,
        duration: 3000,
        speed: 1,
        playing: false,

        resolution: 1000,
        sharpness: 0.85,
        depthTest: false, //深度检测
        leadTime: 0,
        trailTime: 0,
    });
}
extendClassProps(GeoBezierPath.prototype, GeoBezierPath.createDefaultProps);
export interface GeoBezierPath extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoBezierPath.createDefaultProps>> { }