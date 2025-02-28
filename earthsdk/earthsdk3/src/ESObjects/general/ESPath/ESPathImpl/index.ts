import { ESJArcType } from "@sdkSrc/ESJTypes";
import { Destroyable, extendClassProps, Listener, Event, react, ReactivePropsToNativePropsAndChanged, Vector, track, createNextAnimateFrameEvent, ObjResettingWithEvent, createProcessingFromAsyncFunc, sleep, reactDeepArrayWithUndefined, reactArray, SceneObjectKey, bind } from "xbsj-base";
import { CurrentInfoType } from "./CurrentInfoType";
import { lbhToXyz, Player } from "@sdkSrc/utils";
import { getCurrent, getLeftRotation, getRightRotation } from "./getCurrent";
import { subPath } from "./subPath";
import { addAroundPoints, computeRotIfUndefinedUsingLerp, computeRotIfUndefinedUsingNextLine, computeRotIfUndefinedUsingPrevLine } from "./computeRotIfUndefined";
import { GetCurrentFuncType } from "./GetCurrentFuncType";
import { timePosRotsMd } from "./timePosRotsMd";
import { parseData } from "./parseData";
import { ESSceneObject } from "@sdkSrc/ESObjects/base";

export type RotLerpModeType = 'Lerp' | 'Prev' | 'Next';
export class ESPathImpl extends Destroyable {
    private _scratchCurrentInfo = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        index: 0,
    } as CurrentInfoType;

    private _currentInfo = this.disposeVar(react<CurrentInfoType | undefined>(undefined, (a, b) => false));
    get currentInfo() { return this._currentInfo.value; }
    get currentInfoChanged() { return this._currentInfo.changed; }

    get currentIndex() { return this._currentInfo.value && this._currentInfo.value.index; }
    get currentIndexChanged() { return this._currentInfo.changed; }

    get currentPosition() { return this._currentInfo.value && this._currentInfo.value.position; }
    get currentPositionChanged() { return this._currentInfo.changed; }

    get currentRotation() { return this._currentInfo.value && this._currentInfo.value.rotation; }
    get currentRotationChanged() { return this._currentInfo.changed; }

    private _player;
    get player() { return this._player; }

    // private _geoPolyline;
    // get geoPolyline() { return this._geoPolyline; }

    // private _geoCanvasPointPoi;
    // get geoCanvasPointPoi() { return this._geoCanvasPointPoi; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _accumDistancesChanged = this.disposeVar(new Event());
    private _accumDistancesChangedInit = this.dispose(this.timePosRotsChanged.disposableOn(() => (this._accumDistancesDirty = true, this._accumDistancesChanged.emit())));
    get accumDistancesChanged() { return this._accumDistancesChanged; }
    private _accumDistancesDirty = false;
    private _accumDistances: number[] = [];
    get accumDistances() {
        do {
            if (!this._accumDistancesDirty) break;

            if (!this.timePosRots || this.timePosRots.length < 2) {
                this._accumDistances = [];
                break;
            }

            const l = this.timePosRots.length;
            let accumDistance = 0;
            const accumDistances = [];
            let lastPos = lbhToXyz(this.timePosRots[0][1]);
            accumDistances.push(accumDistance);
            for (let i = 1; i < l; ++i) {
                const pos = lbhToXyz(this.timePosRots[i][1]);
                const distance = Vector.distance(pos, lastPos);
                lastPos = pos;
                accumDistance += distance;
                accumDistances.push(accumDistance);
            }
            this._accumDistances = accumDistances;
        } while (false);

        return this._accumDistances;
    }

    get totalDistanceChanged() { return this._accumDistancesChanged; }
    get totalDistance() { return this.accumDistances.length > 0 ? this.accumDistances[this.accumDistances.length - 1] : 0; }

    getCurrent(timeStamp: number) {
        if (this.getCurrentFunc) {
            return this.getCurrentFunc(timeStamp, this);
        }
        return this.timePosRots && getCurrent(this.timePosRots, timeStamp, this.rotLerpMode);
    }

    subPath(startTimeStamp: number, stopTimeStamp: number) {
        return this.timePosRots && subPath(this, startTimeStamp, stopTimeStamp);
    }

    static computeRotIfUndefinedUsingPrevLine = computeRotIfUndefinedUsingPrevLine;
    static computeRotIfUndefinedUsingNextLine = computeRotIfUndefinedUsingNextLine;
    static computeRotIfUndefinedUsingLerp = computeRotIfUndefinedUsingLerp;
    static getLeftRotation = getLeftRotation;
    static getRightRotation = getRightRotation;

    computeRotIfUndefinedUsingPrevLine(force: boolean = false) {
        if (!this.timePosRots) {
            console.warn(`timePosRots不存在，无法计算！`);
            return;
        }
        this.timePosRots = ESPathImpl.computeRotIfUndefinedUsingPrevLine(this.timePosRots, force);
    }

    computeRotIfUndefinedUsingNextLine(force: boolean = false) {
        if (!this.timePosRots) {
            console.warn(`timePosRots不存在，无法计算！`);
            return;
        }
        this.timePosRots = ESPathImpl.computeRotIfUndefinedUsingNextLine(this.timePosRots, force);
    }

    computeRotIfUndefinedUsingLerp(force: boolean = false) {
        if (!this.timePosRots) {
            console.warn(`timePosRots不存在，无法计算！`);
            return;
        }
        this.timePosRots = ESPathImpl.computeRotIfUndefinedUsingLerp(this.timePosRots, force);
    }

    /**
     * @deprecated computeRotIfUndefined已弃用，请使用computeRotIfUndefinedUsingPrevLine
     * @param force 即使rotation不是undefined，也会被强制赋值
     */
    computeRotIfUndefined(force: boolean = false) {
        this.computeRotIfUndefinedUsingPrevLine(force);
    }

    /**
     * 在控制点周边增加新的控制点
     * @param intervalDistance 间隔距离，单位是米
     * @param reserveOrigin 保留原控制点
     */
    addAroundPoints(intervalDistance: number[], reserveOrigin: boolean) {
        addAroundPoints(this, intervalDistance, reserveOrigin);
    }

    //TODO:AXEJ 后期修改
    // static subdivide = subdivide;
    // subdivide(arcType: "GEODESIC" | "NONE" | "RHUMB" = "GEODESIC", granularity = Math.PI / 180) {
    //     if (!this.timePosRots) return;
    //     this.timePosRots = ESPathImpl.subdivide(this.timePosRots, arcType, granularity);
    // }

    private _getCurrentFunc = this.disposeVar(react<GetCurrentFuncType | undefined>(undefined));
    get getCurrentFunc() { return this._getCurrentFunc.value; }
    set getCurrentFunc(value: GetCurrentFuncType | undefined) { this._getCurrentFunc.value = value; }
    get getCurrentFuncChanged() { return this._getCurrentFunc.changed; }

    computeTimeFromTimePosRots() {
        const tprs = this.timePosRots;
        if (!tprs || tprs.length <= 1) {
            this.startTime = undefined;
            this.stopTime = undefined;
            this.duration = undefined;
            return;
        }
        this.startTime = tprs[0][0];
        this.stopTime = tprs[tprs.length - 1][0];
        this.duration = this.stopTime - this.startTime;
    }

    static parseData = parseData;

    static defaults = {
        timePosRots: [] as TimePosRotType[],
        startTime: 0,
        stopTime: 3000,
        loop: false,
        duration: 3000,
        playing: false,
        dataText: "",
    };

    constructor(sceneObject?:ESSceneObject, id?: SceneObjectKey) {
        super();
        this._player = this.disposeVar(new Player());
        // this._geoPolyline = this.disposeVar(new ESGeoLineString(id));
        // this._geoCanvasPointPoi = this.disposeVar(new GeoCanvasPointPoi(czmViewer, id));
        const updateCurrent = () => {
            const result = this.getCurrent((this.currentTime ?? 0));
            if (result === undefined) {
                this._currentInfo.value = undefined;
            } else {
                const { index, position, rotation, ratio } = result;
                this._scratchCurrentInfo.index = index;
                this._scratchCurrentInfo.position = position;
                this._scratchCurrentInfo.rotation = rotation;
                this._scratchCurrentInfo.ratio = ratio;
                this._currentInfo.value = this._scratchCurrentInfo;
            }
        }

        updateCurrent();
        this.currentTimeChanged.disposableOn(updateCurrent);
        this.timePosRotsChanged.disposableOn(updateCurrent);
        this.rotLerpModeChanged.disposableOn(updateCurrent);

        this.dispose(bind([this._player, 'loop'], [this, 'loop']));
        // this.dispose(bind([this._player, 'currentTime'], [this, 'currentTime']));
        {
            const update = () => {
                if (this.startTime === undefined || this.currentTime === undefined) return;
                const playerCurrentTime = this.currentTime - this.startTime;
                if (this._player.currentTime === undefined || Math.abs(playerCurrentTime - this._player.currentTime) > 0.01) {
                    this._player.currentTime = playerCurrentTime;
                }
            }
            update();
            this.dispose(this.currentTimeChanged.disposableOn(update));
        }
        {
            const update = () => {
                if (this.startTime === undefined || this._player.currentTime === undefined) return;
                const currentTime = this._player.currentTime + this.startTime;
                if (this.currentTime === undefined || Math.abs(currentTime - this.currentTime) > 0.01) {
                    this.currentTime = currentTime;
                }
            }
            update();
            this.dispose(this._player.currentTimeChanged.disposableOn(update));
        }
        this.dispose(bind([this._player, 'duration'], [this, 'duration']));
        this.dispose(bind([this._player, 'playing'], [this, 'playing']));
        this.dispose(bind([this._player, 'speed'], [this, 'speed']));

        {
            const updateDuration = () => {
                if (this.autoComputeTimeFromTimePosRots ?? true) {
                    this.computeTimeFromTimePosRots();
                }
            };
            updateDuration();
            const updateDurationEvent = this.disposeVar(createNextAnimateFrameEvent(
                this.autoComputeTimeFromTimePosRotsChanged,
                this.timePosRotsChanged,
            ));
            this.dispose(updateDurationEvent.disposableOn(updateDuration));
        }

        {
            // 检查时间顺序是否正确！
            const check = () => {
                const tprs = this.timePosRots;
                if (!tprs) return;
                let currentTime = 0;
                const l = tprs.length;
                for (let i = 0; i < l; ++i) {
                    const time = tprs[i][0];
                    if (time < 0) {
                        console.warn(`地理路径的时间戳不能小于0！`);
                    } else if (time < currentTime) {
                        console.warn(`地理路径的时间戳需要满足从小到大的数据，元素越靠后，时间越靠后！当前不满足条件的元素是index: ${i} time: ${time}`);
                        break;
                    }
                }
            };
            check();
            this.dispose(this.timePosRotsChanged.disposableOn(check));
        }

        {
            // 折线
            // this._geoPolyline.arcType = 'NONE';

            // {
            //     const update = () => {
            //         this._geoPolyline.show = (this.show ?? false) && (this.polylineShow ?? true);
            //     };
            //     update();
            //     this.dispose(this.showChanged.disposableOn(update));
            //     this.dispose(this.polylineShowChanged.disposableOn(update));
            // }

            // this.dispose(track([this._geoPolyline, 'width'], [this, 'width']));
            // this.dispose(track([this._geoPolyline, 'ground'], [this, 'ground']));
            // this.dispose(track([this._geoPolyline, 'color'], [this, 'color']));
            // this.dispose(track([this._geoPolyline, 'hasDash'], [this, 'hasDash']));
            // this.dispose(track([this._geoPolyline, 'gapColor'], [this, 'gapColor']));
            // this.dispose(track([this._geoPolyline, 'dashLength'], [this, 'dashLength']));
            // this.dispose(track([this._geoPolyline, 'dashPattern'], [this, 'dashPattern']));
            // this.dispose(track([this._geoPolyline, 'hasArrow'], [this, 'hasArrow']));
            // this.dispose(track([this._geoPolyline, 'depthTest'], [this, 'depthTest']));
            // this.dispose(track([this._geoPolyline, 'arcType'], [this, 'arcType']));

            // this.dispose(track([this._geoPolyline, 'allowPicking'], [this, 'allowPicking']));

            // this.dispose(this._flyToEvent.disposableOn(duration => {
            //     this._geoPolyline.flyTo(duration);
            // }));

            // const polylinePostionsChanged = this.disposeVar(createNextAnimateFrameEvent(
            //     this.timePosRotsChanged,
            //     this.leadTimeChanged,
            //     this.trailTimeChanged,
            //     this.polylineShowChanged,
            //     this.showChanged,
            // ));
            // this.disposeVar(new ObjResettingWithEvent(polylinePostionsChanged, () => {
            //     if (!this.timePosRots) return undefined;
            //     if (this.timePosRots.length === 0) return undefined;
            //     if (!this.polylineShow || !this.show) return undefined;
            //     return new PolylineResetting(this);
            // }));
        }

        // {
        //     const update = () => {
        //         this._geoCanvasPointPoi.show = (this.show ?? false) && (this.currentPoiShow ?? true);
        //     };
        //     update();
        //     this.dispose(this.showChanged.disposableOn(update));
        //     this.dispose(this.currentPoiShowChanged.disposableOn(update));
        // }

        // this.dispose(track([this._geoCanvasPointPoi, 'position'], [this, 'currentPosition']));

        {
            const fetchPathDataProcessing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
                if (!this.dataUri) {
                    return;
                }

                await cancelsManager.promise(sleep(1000));
                const response = await cancelsManager.promise(fetch(this.dataUri));
                const text = await cancelsManager.promise(response.text());
                this.timePosRots = ESPathImpl.parseData(text);
            }));

            this.dispose(this.dataUriChanged.disposableOn(() => {
                fetchPathDataProcessing.restart();
            }));

            this.dispose(this.dataTextChanged.disposableOn(() => {
                if (!this.dataText) return;
                this.timePosRots = ESPathImpl.parseData(this.dataText);
            }));
        }
    }

    get ratio() { return this.player.ratio; }
    set ratio(value: number) { this.player.ratio = value; }
    get ratioChanged() { return this.player.ratioChanged; }

    static timePosRotsMd = timePosRotsMd;
}

export type TimePosRotType = [timeStamp: number, position: [longitude: number, latitude: number, height: number], rotation?: [heading: number, pitch: number, roll: number] | undefined];

export namespace ESPathImpl {
    export const createDefaultProps = () => ({
        show: false, // boolean} [show=true] A boolean Property specifying the visibility
        currentPoiShow: true, // boolean} [show=true] A boolean Property specifying the visibility

        // timePosRots: [] as TimePosRotType[],
        timePosRots: reactDeepArrayWithUndefined<TimePosRotType>(undefined, (a, b) => {
            // @ts-ignore
            return a[0] === b[0] && a[1].every((e, i) => e === b[1][i]) && (a[2] === b[2] === undefined) || (a[2] !== undefined && b[2] !== undefined && a[2].every((e, i) => b[2][i]));
        }, s => [s[0], [...s[1]], s[2] && [...s[2]] || undefined]), // s[2]有可能是null，加上 !! undefined，是为了让它强制变为undefined!
        // useLastElementTimeAsDuration: undefined as boolean | undefined, // 是否使用最后一个元素的时间作为播放器时长
        autoComputeTimeFromTimePosRots: true,
        leadTime: 0,
        trailTime: 0,
        startTime: undefined as number | undefined,
        stopTime: undefined as number | undefined,

        loop: false,
        currentTime: 0,
        duration: undefined as number | undefined,
        speed: 1,
        playing: false,

        polylineShow: true, // boolean} [show=true] A boolean Property specifying the visibility
        width: 1, // undfined时为1.0，A numeric Property specifying the width in pixels.
        ground: false,
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
        hasDash: false,
        gapColor: reactArray<[number, number, number, number]>([0, 0, 0, 0]), // default [0, 0, 0, 0]
        dashLength: 16, // default 16
        dashPattern: 255, // default 255
        hasArrow: false,
        depthTest: false,
        arcType: 'GEODESIC' as ESJArcType,

        allowPicking: false,

        dataUri: "", // 需要加载的路径
        dataText: undefined as string | undefined, // 给定文本来解析数据

        rotLerpMode: "Lerp" as RotLerpModeType, // 姿态的插值方式

        debug: false,
    });
}
extendClassProps(ESPathImpl.prototype, ESPathImpl.createDefaultProps);
export interface ESPathImpl extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESPathImpl.createDefaultProps>> { }
