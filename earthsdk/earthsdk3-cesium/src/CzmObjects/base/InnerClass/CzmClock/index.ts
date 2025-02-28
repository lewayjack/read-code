import { ESJClockRangeType, ESJClockStepType, getDefaultValue } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { Destroyable, extendClassProps, ObjResettingWithEvent, ReactivePropsToNativePropsAndChanged } from "xbsj-base";
import { czmSubscribeAndEvaluate } from "../../../../utils";
import * as Cesium from 'cesium';

class ClockEnabled extends Destroyable {
    constructor(sceneObject: CzmClock, czmViewer: ESCesiumViewer) {
        super();

        const viewer = czmViewer.viewer;
        if (!viewer) {
            throw new Error(`!viewer`);
        }

        const czmJulianDateToTimeStamp = CzmClock.czmJulianDateToTimeStamp;
        const getClockRange = CzmClock.getClockRange;
        const getClockStep = CzmClock.getClockStep;

        {
            const updateFunc = () => viewer.clockViewModel.startTime = Cesium.JulianDate.fromDate(new Date(sceneObject.startTime ?? getDefaultValue(CzmClock.defaults.startTime)));
            updateFunc();
            // Cesium.JulianeDate.toString函数有bug，获取不到正确的结果，所以没法用！
            // this.dispose(czmSubscribeAndEvaluate<Cesium.JulianDate>(viewer.clockViewModel, 'startTime', v => clock.startTime = v.toString()));
            this.dispose(czmSubscribeAndEvaluate<Cesium.JulianDate>(viewer.clockViewModel, 'startTime', v => sceneObject.startTime = czmJulianDateToTimeStamp(v)));
            this.dispose(sceneObject.startTimeChanged.disposableOn(updateFunc));
        }
        {
            const updateFunc = () => viewer.clockViewModel.stopTime = Cesium.JulianDate.fromDate(new Date(sceneObject.stopTime ?? getDefaultValue(CzmClock.defaults.stopTime)));
            updateFunc();
            this.dispose(czmSubscribeAndEvaluate<Cesium.JulianDate>(viewer.clockViewModel, 'stopTime', v => sceneObject.stopTime = czmJulianDateToTimeStamp(v)));
            this.dispose(sceneObject.stopTimeChanged.disposableOn(updateFunc));
        }
        {
            const updateFunc = () => viewer.clockViewModel.currentTime = Cesium.JulianDate.fromDate(new Date(sceneObject.currentTime ?? getDefaultValue(CzmClock.defaults.currentTime)));
            updateFunc();
            this.dispose(czmSubscribeAndEvaluate<Cesium.JulianDate>(viewer.clockViewModel, 'currentTime', v => sceneObject.currentTime = czmJulianDateToTimeStamp(v)));
            this.dispose(sceneObject.currentTimeChanged.disposableOn(updateFunc));
        }
        {
            const updateFunc = () => viewer.clockViewModel.multiplier = sceneObject.multiplier ?? CzmClock.defaults.multiplier;
            updateFunc();
            this.dispose(czmSubscribeAndEvaluate<number>(viewer.clockViewModel, 'multiplier', v => {
                if (sceneObject.multiplier ?? CzmClock.defaults.multiplier !== v) {
                    sceneObject.multiplier = v;
                }
            }));
            this.dispose(sceneObject.currentTimeChanged.disposableOn(updateFunc));
        }

        {
            const updateFunc = () => viewer.clockViewModel.clockStep = Cesium.ClockStep[sceneObject.clockStep ?? CzmClock.defaults.clockStep];
            updateFunc();
            this.dispose(czmSubscribeAndEvaluate<Cesium.ClockStep>(viewer.clockViewModel, 'clockStep', v => {
                const clockStep = getClockStep(v);
                if (sceneObject.clockStep ?? CzmClock.defaults.clockStep !== clockStep) {
                    sceneObject.clockStep = clockStep;
                }
            }));
            this.dispose(sceneObject.clockStepChanged.disposableOn(updateFunc));
        }

        {
            const updateFunc = () => viewer.clockViewModel.clockRange = Cesium.ClockRange[sceneObject.clockRange ?? CzmClock.defaults.clockRange];
            updateFunc();
            this.dispose(czmSubscribeAndEvaluate<Cesium.ClockRange>(viewer.clockViewModel, 'clockRange', v => {
                const clockRange = getClockRange(v);
                if (sceneObject.clockRange ?? CzmClock.defaults.clockRange !== clockRange) {
                    sceneObject.clockRange = clockRange;
                }
            }));
            this.dispose(sceneObject.clockRangeChanged.disposableOn(updateFunc));
        }

        {
            const updateFunc = () => viewer.clockViewModel.shouldAnimate = sceneObject.shouldAnimate ?? CzmClock.defaults.shouldAnimate;
            updateFunc();
            this.dispose(czmSubscribeAndEvaluate<boolean>(viewer.clockViewModel, 'shouldAnimate', v => {
                if (sceneObject.shouldAnimate ?? CzmClock.defaults.shouldAnimate !== v) {
                    sceneObject.shouldAnimate = v;
                }
            }));
            this.dispose(sceneObject.shouldAnimateChanged.disposableOn(updateFunc));
        }
    }
}

export class CzmClock extends Destroyable {
    static czmJulianDateToTimeStamp = czmJulianDateToTimeStamp;
    static getClockRange = getClockRange;
    static getClockStep = getClockStep;
    constructor(czmViewer: ESCesiumViewer) {
        super();
        this.disposeVar(new ObjResettingWithEvent(this.enabledChanged, () => {
            if (this.enabled ?? CzmClock.defaults.enabled) {
                return new ClockEnabled(this, czmViewer);
            } else {
                return undefined;
            }
        }));
    }

    static defaults = {
        enabled: false,
        startTime: () => Date.now(),
        stopTime: () => Date.now() + 24 * 60 * 60 * 1000,
        currentTime: () => Date.now(),
        multiplier: 1,
        clockStep: 'SYSTEM_CLOCK_MULTIPLIER' as ESJClockStepType,
        clockRange: 'UNBOUNDED' as ESJClockRangeType,
        shouldAnimate: false,
    };
}

export namespace CzmClock {
    export const createDefaultProps = () => ({
        enabled: undefined as boolean | undefined,
        startTime: undefined as number | undefined,   //	JulianDate		optionalThe start time of the clock.
        stopTime: undefined as number | undefined,   //	JulianDate		optionalThe stop time of the clock.
        currentTime: undefined as number | undefined,   //	JulianDate		optionalThe current time.
        multiplier: undefined as number | undefined,   //	Number	1.0	optionalDetermines how much time advances when Clock#tick is called, negative values allow for advancing backwards.
        clockStep: undefined as ESJClockStepType | undefined,   //	ClockStep	ClockStep.SYSTEM_CLOCK_MULTIPLIER	optionalDetermines if calls to Clock#tick are frame dependent or system clock dependent.
        clockRange: undefined as ESJClockRangeType | undefined,   //	ClockRange	ClockRange.UNBOUNDED	optionalDetermines how the clock should behave when Clock#startTime or Clock#stopTime is reached.
        // canAnimate: true,   //	Boolean	true	optionalIndicates whether Clock#tick can advance time. This could be false if data is being buffered, for example. The clock will only tick when both Clock#canAnimate and Clock#shouldAnimate are true.
        shouldAnimate: undefined as boolean | undefined,   //	Boolean	false	optionalIndicates whether Clock#tick should attempt to advance time. The clock will only tick when both Clock#canAnimate and Clock#shouldAnimate are true.
    });
}
extendClassProps(CzmClock.prototype, CzmClock.createDefaultProps);
export interface CzmClock extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmClock.createDefaultProps>> { }

function czmJulianDateToTimeStamp(julianDate: Cesium.JulianDate) {
    const date = Cesium.JulianDate.toDate(julianDate);
    return date.getTime();
}

function getClockRange(value: Cesium.ClockRange) {
    if (value === Cesium.ClockRange.CLAMPED) {
        return 'CLAMPED';
    } else if (value === Cesium.ClockRange.LOOP_STOP) {
        return 'LOOP_STOP';
    } else if (value === Cesium.ClockRange.UNBOUNDED) {
        return 'UNBOUNDED';
    } else {
        throw new Error(`getClockRange error: ${value}`);
    }
}

function getClockStep(value: Cesium.ClockStep) {
    if (value === Cesium.ClockStep.SYSTEM_CLOCK) {
        return 'SYSTEM_CLOCK';
    } else if (value === Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER) {
        return 'SYSTEM_CLOCK_MULTIPLIER';
    } else if (value === Cesium.ClockStep.TICK_DEPENDENT) {
        return 'TICK_DEPENDENT';
    } else {
        throw new Error(`clockStep未知类型: ${value}`);
    }
}
