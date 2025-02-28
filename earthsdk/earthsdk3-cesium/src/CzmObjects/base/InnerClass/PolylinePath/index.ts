import { ESPathImpl, Player, PlayerProperty, RotLerpModeType } from "earthsdk3";
import { bind, createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, react, reactArray, reactPositions, track, UniteChanged } from "xbsj-base";
import { CzmPolyline, GeoCanvasPointPoi } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { getDistancesAndTimePosRotsFromPositions } from "../../../../utils";

export class PolylinePath extends Destroyable {
    private _geoPath;
    private _geoPolyline;
    private _geoCanvasPointPoi;
    private _player;
    get geoPath() { return this._geoPath; }
    get geoPolyline() { return this._geoPolyline; }
    get geoCanvasPointPoi() { return this._geoCanvasPointPoi; }
    get player() { return this._player; }

    get currentInfo() { return this._geoPath.currentInfo; }
    get currentInfoChanged() { return this._geoPath.currentInfoChanged; }
    get currentIndex() { return this._geoPath.currentIndex; }
    get currentIndexChanged() { return this._geoPath.currentIndexChanged; }
    get currentPosition() { return this._geoPath.currentPosition; }
    get currentPositionChanged() { return this._geoPath.currentPositionChanged; }
    get currentRotation() { return this._geoPath.currentRotation; }
    get currentRotationChanged() { return this._geoPath.currentRotationChanged; }

    // private _distances = this.disposeVar(reactArray<number[]>([]));
    // get distances() { return this._distances.value; }
    // get distancesChanged() { return this._distances.changed; }
    // get totalDistance() { return this.distances.length > 0 ? this.distances[this.distances.length - 1] : 0; }

    get accumDistances() { return this._geoPath.accumDistances; };
    get accumDistancesChanged() { return this._geoPath.accumDistancesChanged; }
    get totalDistance() { return this._geoPath.totalDistance; }
    get totalDistanceChanged() { return this._geoPath.totalDistanceChanged; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    subPath(startDistance: number, stopDistance: number) {
        const timePosRots = this._geoPath.subPath(startDistance, stopDistance);
        if (!timePosRots) {
            return undefined;
        }
        return timePosRots.map(e => e[1]);
    }

    private _currentDistance = this.disposeVar(react(0));
    get currentDistance() { return this._currentDistance.value; }
    set currentDistance(value: number) { this._currentDistance.value = value; }
    get currentDistanceChanged() { return this._currentDistance.changed; }

    constructor(czmViewer: ESCesiumViewer) {
        super();
        this._geoPath = this.disposeVar(new ESPathImpl());
        this._geoPolyline = this.disposeVar(new CzmPolyline(czmViewer));
        this._geoCanvasPointPoi = this.disposeVar(new GeoCanvasPointPoi(czmViewer));
        this._player = this.disposeVar(new Player());

        this._geoPolyline.show = false;
        this.dispose(bind([this._geoPolyline, 'positions'], [this, 'positions']));

        this.dispose(bind([this._geoPolyline, 'editing'], [this, 'editing']));
        this.dispose(bind([this._geoPolyline, 'pointEditing'], [this, 'pointEditing']));

        this.dispose(track([this._geoPath, 'currentTime'], [this, 'currentDistance']));
        this.dispose(track([this._geoPath, 'leadTime'], [this, 'leadTime']));
        this.dispose(track([this._geoPath, 'trailTime'], [this, 'trailTime']));
        // this.dispose(track([this._geoPath, 'rotLerpMode'], [this, 'rotLerpMode']));
        this.dispose(track([this._geoPath, 'show'], [this, 'show']));
        this.dispose(track([this._geoPath, 'polylineShow'], [this, 'polylineShow']));
        this.dispose(track([this._geoPath, 'currentPoiShow'], [this, 'currentPoiShow']));

        this.dispose(track([this._geoPath, 'width'], [this, 'width']));
        this.dispose(track([this._geoPath, 'ground'], [this, 'ground']));
        this.dispose(track([this._geoPath, 'color'], [this, 'color']));
        this.dispose(track([this._geoPath, 'hasDash'], [this, 'hasDash']));
        this.dispose(track([this._geoPath, 'gapColor'], [this, 'gapColor']));
        this.dispose(track([this._geoPath, 'dashLength'], [this, 'dashLength']));
        this.dispose(track([this._geoPath, 'dashPattern'], [this, 'dashPattern']));
        this.dispose(track([this._geoPath, 'hasArrow'], [this, 'hasArrow']));
        this.dispose(track([this._geoPath, 'depthTest'], [this, 'depthTest']));
        this.dispose(track([this._geoPath, 'arcType'], [this, 'arcType']));

        this.dispose(track([this._geoPath, 'allowPicking'], [this, 'allowPicking']));

        {
            const update = () => {
                this._geoCanvasPointPoi.show = (this.show ?? true) && (this.currentPoiShow ?? true);
            };
            update();
            this.dispose(this.showChanged.disposableOn(update));
            this.dispose(this.currentPoiShowChanged.disposableOn(update));
        }

        this.dispose(track([this._geoCanvasPointPoi, 'position'], [this, 'currentPosition']));

        {
            const update = () => {
                if (this.positions) {
                    const granularity = this.granularity * Math.PI / 180;
                    const result = getDistancesAndTimePosRotsFromPositions(this.positions, this.arcType ?? 'GEODESIC', granularity);
                    if (result) {
                        // this._distances.value = result.distances;
                        this._geoPath.timePosRots = result.timePosRots;
                        if (this.rotationRadius.some(item => item > 0)) {
                            this._geoPath.addAroundPoints(this.rotationRadius, true);
                            this._geoPath.computeRotIfUndefinedUsingLerp(true);
                            this._geoPath.rotLerpMode = 'Lerp';
                        } else {
                            this._geoPath.computeRotIfUndefinedUsingPrevLine(true);
                            this._geoPath.rotLerpMode = this.rotLerpMode;
                        }

                        return;
                    }
                }
                // this._distances.value = [];
                this._geoPath.timePosRots = [];
            }
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(this.positionsChanged, this.arcTypeChanged, this.granularityChanged, this.rotationRadiusChanged, this.rotLerpModeChanged));
            this.dispose(event.disposableOn(update));
        }

        {
            const updateCurrentDistance = () => {
                if ((this._player.duration ?? 3000) <= 0) {
                    this.currentDistance = 0;
                    return;
                }
                const currentDistance = this.totalDistance * ((this._player.currentTime ?? 0) / (this._player.duration ?? 3000));
                if (Math.abs(currentDistance - this.currentDistance) > 0.01) {
                    this.currentDistance = currentDistance;
                }
            }

            updateCurrentDistance();
            this.dispose(this._player.currentTimeChanged.disposableOn(updateCurrentDistance));
        }

        {
            const updateCurrentTime = () => {
                if (this.totalDistance <= 0) {
                    this._player.currentTime = 0;
                    return;
                }
                const currentTime = (this.currentDistance / this.totalDistance) * (this.duration ?? 3000);
                if (Math.abs(currentTime - (this._player.currentTime ?? 0)) > 0.01) {
                    this._player.currentTime = currentTime;
                }
            };
            updateCurrentTime();
            this.dispose(this.currentDistanceChanged.disposableOn(updateCurrentTime));
        }

        this.dispose(bind([this._player, 'loop'], [this, 'loop']));
        this.dispose(bind([this._player, 'currentTime'], [this, 'currentTime']));
        this.dispose(bind([this._player, 'duration'], [this, 'duration']));
        this.dispose(bind([this._player, 'playing'], [this, 'playing']));
        this.dispose(bind([this._player, 'speed'], [this, 'speed']));

        this.dispose(this._flyToEvent.disposableOn(duration => {
            this._geoPolyline.flyTo(duration);
        }));
    }

    private _ratio = this.disposeVar(PlayerProperty.createPlayingRatio([this, 'currentTime'], [this, 'duration']));
    get ratio() { return this._ratio.value; }
    set ratio(value: number) { this._ratio.value = value; }
    get ratioChanged() { return this._ratio.changed; }

    get timePosRots() { return this.geoPath.timePosRots; }
}

export namespace PolylinePath {
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
        arcType: 'GEODESIC' as 'NONE' | 'GEODESIC' | 'RHUMB',
        granularity: 1, // 1度
        editing: false,
        pointEditing: false,

        loop: false,
        currentTime: 0,
        duration: 3000,
        speed: 1,
        playing: false,

        depthTest: false, //深度检测
        leadTime: 0,
        trailTime: 0,
        // 可以传入一个值，也可以传入多个值，多个值，后面夹角不够的话，直接用最后一个
        rotationRadius: [0],
        rotLerpMode: "Next" as RotLerpModeType, // 姿态的插值方式
    });
}
extendClassProps(PolylinePath.prototype, PolylinePath.createDefaultProps);
export interface PolylinePath extends UniteChanged<ReturnType<typeof PolylinePath.createDefaultProps>> { }
