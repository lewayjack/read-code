import { ESJClockRangeType, ESJClockStepType, ESSceneObject, PickedInfo } from "earthsdk3";
import { CzmClock, ESJResource } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, Listener, react, Event, bind, reactJsonWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, createProcessingFromAsyncFunc, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
const data = [
    {
        "id": "document",
        "version": "1.0"
    },
    {
        "id": "Vehicle",
        "availability": "2012-08-04T16:00:00Z/2012-08-04T16:14:15.251Z",
        "billboard": {
            "eyeOffset": {
                "cartesian": [
                    0,
                    0,
                    0
                ]
            },
            "horizontalOrigin": "CENTER",
            "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEISURBVEhLvVXBDYQwDOuojHKj8LhBbpTbpBCEkZsmIVTXq1RVQGrHiWlLmTTqPiZBlyLgy/KSZQ5JSHDQ/mCYCsC8106kDU0AdwRnvYZArWRcAl0dcYJq1hWCb3hBrumbDAVMwAC82WoRvgMnVMDBnB0nYZFTbE6BBvdUGqVqCbjBIk3PyFFR/NU7EKzru+qZsau3ryPwwCRLKYOzutZuCL6fUmWeJGzNzL/RxAMrUmASSCkkAayk2IxPlwhAAYGpsiHQjbLccfdOY5gKkCXAMi7SscAwbQpAnKyctWyUZ6z8ja3OGMepwD8asz+9FnSvbhU8uVOHFIwQsI3/p0CfhuqCSQuxLqsN6mu8SS+N42MAAAAASUVORK5CYII=",
            "pixelOffset": {
                "cartesian2": [
                    0,
                    0
                ]
            },
            "scale": 0.8333333333333334,
            "show": [
                {
                    "interval": "2012-08-04T16:00:00Z/2012-08-04T18:00:00Z",
                    "boolean": true
                }
            ],
            "verticalOrigin": "BOTTOM"
        },
        "label": {
            "fillColor": [
                {
                    "interval": "2012-08-04T16:00:00Z/2012-08-04T18:00:00Z",
                    "rgba": [
                        255,
                        255,
                        0,
                        255
                    ]
                }
            ],
            "font": "bold 10pt Segoe UI Semibold",
            "horizontalOrigin": "LEFT",
            "outlineColor": {
                "rgba": [
                    0,
                    0,
                    0,
                    255
                ]
            },
            "pixelOffset": {
                "cartesian2": [
                    10,
                    0
                ]
            },
            "scale": 1,
            "show": [
                {
                    "interval": "2012-08-04T16:00:00Z/2012-08-04T18:00:00Z",
                    "boolean": true
                }
            ],
            "style": "FILL",
            "text": "Vehicle",
            "verticalOrigin": "CENTER"
        },
        "path": {
            "material": {
                "solidColor": {
                    "color": {
                        "interval": "2012-08-04T16:00:00Z/2012-08-04T18:00:00Z",
                        "rgba": [
                            255,
                            255,
                            0,
                            255
                        ]
                    }
                }
            },
            "width": [
                {
                    "interval": "2012-08-04T16:00:00Z/2012-08-04T18:00:00Z",
                    "number": 5
                }
            ],
            "show": [
                {
                    "interval": "2012-08-04T16:00:00Z/2012-08-04T18:00:00Z",
                    "boolean": true
                }
            ]
        },
        "position": {
            "interpolationAlgorithm": "LAGRANGE",
            "interpolationDegree": 1,
            "epoch": "2012-08-04T16:00:00Z",
            "cartesian": [
                0,
                -2379754.6637012,
                -4665332.88013588,
                3628133.68924173,
                100,
                -2379510.08905552,
                -4665419.64840452,
                3628182.20006795,
                200,
                -2379568.4769522,
                -4665555.3441867,
                3627970.83323261,
                300,
                -2379638.93786855,
                -4665691.63561896,
                3627750.82085873,
                400,
                -2379709.29834665,
                -4665827.9679646,
                3627530.80187124,
                500,
                -2379837.28064915,
                -4665847.7494347,
                3627422.12874017,
                600,
                -2379624.98289073,
                -4665907.50853722,
                3627484.1191848,
                700,
                -2379386.12743523,
                -4666029.54174431,
                3627483.83297459,
                800,
                -2379147.26777171,
                -4666151.56669944,
                3627483.5403492,
                900,
                -2378908.40390057,
                -4666273.58340244,
                3627483.24130864,
                1000,
            ]
        }
    }
]

const dataMd = `\
第一个packet代表了cesium场景（cesium时间轴的范围，当前时刻，倍速等信息）之外，其他的packet都可以理解为描述某一时间范围内的entity的行为。
\`\`\`
[{
    "id": "document",
    "name": "CZML Path",
    "version": "1.0",
    "clock": {
        "interval": "2012-08-04T10:00:00Z/2012-08-04T15:00:00Z",
        "currentTime": "2012-08-04T10:00:00Z",
        "multiplier": 10
    }
}, {
    "id": "path",
    "name": "path with GPS flight data",
    "description": "<p>Hang gliding flight log data from Daniel H. Friedman.<br>Icon created by Larisa Skosyrska from the Noun Project</p>",
    "availability": "2012-08-04T10:00:00Z/2012-08-04T15:00:00Z",
    "path": {
        "material": {
            "polylineOutline": {
                "color": {
                    "rgba": [255, 0, 255, 255]
                },
                "outlineColor": {
                    "rgba": [0, 255, 255, 255]
                },
                "outlineWidth": 5
            }
        },
        "width": 8,
        "leadTime": 10,
        "trailTime": 1000,
        "resolution": 5
    },
    "billboard": {
        "image": "data:image/png;base64,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",
        "scale": 1.5,
        "eyeOffset": {
            "cartesian": [0.0, 0.0, -10.0]
        }
    },
    "position": {
        "epoch": "2012-08-04T10:00:00Z",
        "cartographicDegrees": [
            0, -122.93797, 39.50935, 1776,
            10, -122.93822, 39.50918, 1773,
            20, -122.9385, 39.50883, 1772,
            30, -122.93855, 39.50842, 1770,
            40, -122.93868, 39.50792, 1770,
            50, -122.93877, 39.50743, 1767,
            60, -122.93862, 39.50697, 1771,
            70, -122.93828, 39.50648, 1765,
        ]
    }
}]
\`\`\`
`

const defaultLoadFuncStr = `\
(dataSource) => {
    var entities = dataSource.entities.values;
 
    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      if (Cesium.defined(entity.billboard)) {
        // entity.label = undefined; // 去掉文字的显示
 
        entity.point = new Cesium.PointGraphics({
            color: Cesium.Color.BLUE,
            pixelSize: 30
        });
      }
    }   
}
`;

const defaultLoadFuncDocStr = `\
data 路径都可以使用下面回调函数
\`\`\`
${defaultLoadFuncStr}
\`\`\`

`
const now = Date.now();
const currentTime = new Date(now).toISOString();
const stopTime = new Date(now + 24 * 60 * 60 * 1000).toISOString();

export class CzmCzml extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }
    //@ts-ignore
    private _loadFuncReact = this.disposeVar(react<((dataSource: Cesium.CzmlDataSource) => void) | undefined>(undefined));
    get loadFun() { return this._loadFuncReact.value; }
    //@ts-ignore
    set loadFun(value: ((dataSource: Cesium.CzmlDataSource) => void) | undefined) { this._loadFuncReact.value = value; }
    get loadFunChanged() { return this._loadFuncReact.changed; }

    private _clock;
    get clock() { return this._clock }

    private _resetClockEvent = this.disposeVar(new Event());
    get resetClockEvent() { return this._resetClockEvent; }
    resetClock() { this._resetClockEvent.emit(); }

    private _dataSource = this.disposeVar(react<Cesium.CzmlDataSource | undefined>(undefined));
    get dataSource() { return this._dataSource.value; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._clock = this.disposeVar(new CzmClock(czmViewer));

        this.dispose(bind([this.clock, 'startTime'], [this, 'startTime']));
        this.dispose(bind([this.clock, 'stopTime'], [this, 'stopTime']));
        this.dispose(bind([this.clock, 'currentTime'], [this, 'currentTime']));
        this.dispose(bind([this.clock, 'multiplier'], [this, 'multiplier']));
        this.dispose(bind([this.clock, 'clockStep'], [this, 'clockStep']));
        this.dispose(bind([this.clock, 'clockRange'], [this, 'clockRange']));
        this.dispose(bind([this.clock, 'shouldAnimate'], [this, 'shouldAnimate']));
        this.dispose(bind([this.clock, 'enabled'], [this, 'clockEnabled']));

        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        this.dispose(this.flyToEvent.disposableOn((duration) => {
            if (!czmViewer.actived) return;
            if (!this.dataSource) return;
            if (duration !== undefined) {
                viewer.flyTo(this.dataSource, { duration: duration / 1000 });
            } else {
                viewer.flyTo(this.dataSource)
            }
        }));

        const resetPrimitive = () => {
            if (this.dataSource) {
                viewer.dataSources.remove(this.dataSource, true);
                this._dataSource.value = undefined;
            }
        };
        this.dispose(resetPrimitive);

        const resetClock = () => {
            if (!this.dataSource) {
                console.warn(`resetClock warn: dataSource is undefined!`)
                return;
            }
            const { dataSource } = this;
            this.startTime = Cesium.JulianDate.toDate(dataSource.clock.startTime).getTime();
            this.stopTime = Cesium.JulianDate.toDate(dataSource.clock.stopTime).getTime();
            this.currentTime = Cesium.JulianDate.toDate(dataSource.clock.currentTime).getTime();
            this.multiplier = dataSource.clock.multiplier;
            this.clockStep = CzmClock.getClockStep(dataSource.clock.clockStep);
            this.clockRange = CzmClock.getClockRange(dataSource.clock.clockRange);
        };
        this.dispose(this.resetClockEvent.disposableOn(resetClock));

        const updateShow = () => {
            if (!this.dataSource) return;
            this.dataSource.show = this.show ?? CzmCzml.defaults.show;
        };
        updateShow();
        this.dispose(this.showChanged.disposableOn(updateShow));

        const data = this.disposeVar(react<string | undefined>(undefined));
        {
            const update = () => {
                const getData = () => {
                    if (!this.uri) return;
                    if (this.uri && typeof this.uri != 'string') {
                        Cesium.Resource.fetchXML({
                            url: this.uri.url,
                            headers: this.uri.headers,
                            queryParameters: this.uri.queryParameters,
                            templateValues: this.uri.templateValues,
                            proxy: this.uri.proxy,
                            retryCallback: this.uri.retryCallback,
                            retryAttempts: this.uri.retryAttempts,
                            request: this.uri.request
                        })?.then(res => {
                            return res
                        })
                    } else {
                        return ESSceneObject.context.getStrFromEnv(this.uri)
                    }
                }
                data.value = this.data ?? getData();
            };
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this.uriChanged,
                this.dataChanged,
            ));
            this.dispose(event.disposableOn(update));
        }

        {
            const processing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
                resetPrimitive();

                if (!data.value) return;

                let dataSource: Cesium.CzmlDataSource | undefined;
                try {
                    dataSource = await Cesium.CzmlDataSource.load(data.value);
                } catch (error) {
                    console.error(`加载czml错误：${error}`);
                    console.error(error);
                }

                if (!dataSource) return;

                cancelsManager.check();
                dataSource.entities.values.forEach(element => {
                    //@ts-ignore
                    Cesium.Entity.prototype && (dataSource.ESSceneObjectID = id);
                });

                viewer.dataSources.add(dataSource);
                this._dataSource.value = dataSource;
                updateShow();

                if (this.autoResetClock ?? CzmCzml.defaults.autoResetClock) {
                    resetClock();
                }

                if (!this.loadFun) return;
                try {
                    this.loadFun(dataSource);
                } catch (error) {
                    console.error(error);
                }
            }));

            const update = () => {
                processing.isRunning && processing.cancel();
                processing.restart();
            };
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                data.changed,
                this.loadFunChanged,
            ))
            this.dispose(event.disposableOn(update));
        }

        {
            const update = () => {
                if (this.loadFuncStr) {
                    try {
                        const func = Function(`"use strict";return (${this.loadFuncStr})`)();
                        this.loadFun = func;
                    } catch (error) {
                        console.error(error);
                        this.loadFun = undefined;
                    }
                } else {
                    this.loadFun = undefined;
                }
            };
            update();
            this.dispose(this.loadFuncStrChanged.disposableOn(update));
        }
    }

    static defaults = {
        show: true,
        allowPicking: true,
        data: data,
        dataMd: dataMd,
        autoResetClock: true,
        clockEnabled: false,
        startTime: CzmClock.defaults.startTime,
        stopTime: CzmClock.defaults.stopTime,
        currentTime: CzmClock.defaults.currentTime,
        multiplier: CzmClock.defaults.multiplier,
        clockStep: CzmClock.defaults.clockStep,
        clockRange: CzmClock.defaults.clockRange,
        shouldAnimate: CzmClock.defaults.shouldAnimate,
        uri: '${xe2-assets-script-dir}/xe2-assets/scene-manager/misc/simple.czml',
        defaultLoadFuncStr: defaultLoadFuncStr,
        defaultLoadFuncDocStr: defaultLoadFuncDocStr,
    };
}

export namespace CzmCzml {
    export const createDefaultProps = () => {
        return {
            show: undefined as boolean | undefined,
            uri: undefined as string | undefined | ESJResource,
            allowPicking: undefined as boolean | undefined,
            data: reactJsonWithUndefined(undefined), // 每个时间段展示的内容
            autoResetClock: undefined as boolean | undefined,
            clockEnabled: undefined as boolean | undefined,
            startTime: undefined as number | undefined,
            stopTime: undefined as number | undefined,
            currentTime: undefined as number | undefined,
            multiplier: undefined as number | undefined,
            clockStep: undefined as ESJClockStepType | undefined,
            clockRange: undefined as ESJClockRangeType | undefined,
            shouldAnimate: undefined as boolean | undefined,
            loadFuncStr: undefined as string | undefined,
        }
    };
}
extendClassProps(CzmCzml.prototype, CzmCzml.createDefaultProps);
export interface CzmCzml extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmCzml.createDefaultProps>> { }
