import { Listener, Event, reactJsonWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged } from "xbsj-base";
import { ESSceneObject } from "../base";
import { BooleanProperty, DateProperty, EnumProperty, ESJClockStepType, ESJResource, EvalStringProperty, FunctionProperty, GroupProperty, JsonProperty, NumberProperty, Property, StringProperty } from "../../ESJTypes";

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

export class ESCzml extends ESSceneObject {
    static readonly type = this.register('ESCzml', this, { chsName: 'ESCzml', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "Czml数据加载" });
    get typeName() { return 'ESCzml'; }
    override get defaultProps() { return ESCzml.createDefaultProps(); }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }


    private _resetClockEvent = this.disposeVar(new Event());
    get resetClockEvent() { return this._resetClockEvent; }
    resetClock() { this._resetClockEvent.emit(); }

    constructor(id?: string) {
        super(id);
    }

    static override defaults = {
        ...ESSceneObject.defaults,
        show: true,
        allowPicking: true,
        data: data,
        dataMd: dataMd,
        autoResetClock: true,
        clockEnabled: false,
        startTime: () => Date.now(),
        stopTime: () => Date.now() + 24 * 60 * 60 * 1000,
        currentTime: () => Date.now(),
        multiplier: 1,
        clockStep: 'SYSTEM_CLOCK_MULTIPLIER' as ESJClockStepType,
        clockRange: 'UNBOUNDED' as ESJClockStepType,
        shouldAnimate: false,
        uri: '${xe2-assets-script-dir}/xe2-assets/scene-manager/misc/simple.czml',
        defaultLoadFuncStr: defaultLoadFuncStr,
        defaultLoadFuncDocStr: defaultLoadFuncDocStr,
    };
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'basic',
            basic: [
                ...properties.basic,
                new JsonProperty('数据', '数据', true, false, [this, 'data'], ESCzml.defaults.data, ESCzml.defaults.dataMd),
                new JsonProperty('路径', '路径', false, false, [this, 'uri'], ''),
                new BooleanProperty('启用', '启用', false, false, [this, 'clockEnabled'], false),
                new NumberProperty('倍速', '倍速.', false, false, [this, 'multiplier'], ESCzml.defaults.multiplier),
                new BooleanProperty('自动设置时钟', '自动设置时钟', false, false, [this, 'autoResetClock'], true),
                new DateProperty('开始时间', '开始时间', true, false, [this, 'startTime'], ESCzml.defaults.startTime),
                new DateProperty('结束时间', '结束时间', true, false, [this, 'stopTime'], ESCzml.defaults.stopTime),
                new DateProperty('当前时间', '当前时间', true, false, [this, 'currentTime'], ESCzml.defaults.currentTime),
                new EnumProperty('clockStep', 'clockStep', false, false, [this, 'clockStep'], [['TICK_DEPENDENT', 'TICK_DEPENDENT'], ['SYSTEM_CLOCK_MULTIPLIER', 'SYSTEM_CLOCK_MULTIPLIER'], ['SYSTEM_CLOCK', 'SYSTEM_CLOCK']], 'SYSTEM_CLOCK_MULTIPLIER'),
                new EnumProperty('clockRange', 'clockRange', false, false, [this, 'clockRange'], [['UNBOUNDED', 'UNBOUNDED'], ['CLAMPED', 'CLAMPED'], ['LOOP_STOP', 'LOOP_STOP']], 'UNBOUNDED'),
                new BooleanProperty('是否启用动画', '是否启用动画', false, false, [this, 'shouldAnimate'], false),
            ],
            general: [
                ...properties.general,
                new StringProperty('唯一标识', 'id', false, true, [this, 'id']),
                new StringProperty('名称', 'name', true, false, [this, 'name']),
                new BooleanProperty('是否显示', 'show', false, false, [this, 'show'], true),
                new BooleanProperty('开启碰撞', 'collision', false, false, [this, 'collision'], false),
                new BooleanProperty('允许拾取', 'allowPicking', false, false, [this, 'allowPicking'], false),
            ],
        }
    };
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new BooleanProperty('是否显示', 'A boolean Property specifying the visibility .', false, false, [this, 'show']),
                new BooleanProperty('允许拾取', '是否允许拾取', false, false, [this, 'allowPicking']),
                new FunctionProperty("飞入", "飞入", ['number'], (duration: number) => this.flyTo(duration), [1000]),
                new JsonProperty('数据', '数据', true, false, [this, 'data'], ESCzml.defaults.data, ESCzml.defaults.dataMd),
                new JsonProperty('路径', '路径', false, false, [this, 'uri']),
                new BooleanProperty('自动设置时钟', '自动设置时钟', false, false, [this, 'autoResetClock']),
                new FunctionProperty('重设时钟', '根据当前加载的数据重设始终', [], () => this.resetClock(), []),
                new EvalStringProperty('loadFnStr', 'loadFnStr', true, false, [this, 'loadFuncStr'], ESCzml.defaults.defaultLoadFuncStr, ESCzml.defaults.defaultLoadFuncDocStr),

            ]),
            new GroupProperty('时钟', '时钟', [
                new BooleanProperty('启用', '启用', false, false, [this, 'clockEnabled']),
                new DateProperty('开始时间', '开始时间', true, false, [this, 'startTime'], ESCzml.defaults.startTime),
                new DateProperty('结束时间', '结束时间', true, false, [this, 'stopTime'], ESCzml.defaults.stopTime),
                new DateProperty('当前时间', '当前时间', true, false, [this, 'currentTime'], ESCzml.defaults.currentTime),
                new NumberProperty('倍速', '倍速.', false, false, [this, 'multiplier'], ESCzml.defaults.multiplier),
                new EnumProperty('clockStep', 'clockStep', false, false, [this, 'clockStep'], [['TICK_DEPENDENT', 'TICK_DEPENDENT'], ['SYSTEM_CLOCK_MULTIPLIER', 'SYSTEM_CLOCK_MULTIPLIER'], ['SYSTEM_CLOCK', 'SYSTEM_CLOCK']]),
                new EnumProperty('clockRange', 'clockRange', false, false, [this, 'clockRange'], [['UNBOUNDED', 'UNBOUNDED'], ['CLAMPED', 'CLAMPED'], ['LOOP_STOP', 'LOOP_STOP']]),
                new BooleanProperty('是否启用动画', '是否启用动画', false, false, [this, 'shouldAnimate']),
            ]),
        ]
    }
}

export namespace ESCzml {
    export const createDefaultProps = () => {
        return {
            show: true,
            uri: '' as string | ESJResource,
            allowPicking: false,
            data: reactJsonWithUndefined(undefined), // 每个时间段展示的内容
            autoResetClock: true,
            clockEnabled: false,
            startTime: undefined as number | undefined,
            stopTime: undefined as number | undefined,
            currentTime: undefined as number | undefined,
            multiplier: 1,
            clockStep: 'SYSTEM_CLOCK_MULTIPLIER',
            clockRange: 'UNBOUNDED',
            shouldAnimate: false,
            loadFuncStr: undefined as string | undefined,
            ...ESSceneObject.createDefaultProps(),
        }
    };
}
extendClassProps(ESCzml.prototype, ESCzml.createDefaultProps);
export interface ESCzml extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESCzml.createDefaultProps>> { }
