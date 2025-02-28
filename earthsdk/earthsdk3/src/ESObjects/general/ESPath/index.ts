import { ESGeoLineString } from "../ESGeoLineString";
import { ESGeoVector } from "../../base";
import { DatesProperty, EnumProperty, ESJStrokeStyle, GroupProperty, JsonProperty, Number3Property, NumberProperty } from "../../../ESJTypes";
import { extendClassProps, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactJson, SceneObjectKey, Event, react, createNextAnimateFrameEvent } from "xbsj-base";
import { clamp0_360 } from "@sdkSrc/utils";
import { ESPathImpl, TimePosRotType } from "./ESPathImpl";
export * from './ESPathImpl';
export class ESPath extends ESGeoLineString {
    static override readonly type = this.register('ESPath', this, { chsName: 'ESPath', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESPath" });
    override get typeName() { return 'ESPath'; }
    override get defaultProps() { return ESPath.createDefaultProps(); }

    private _path;
    get path() { return this._path; }

    get currentPosition() { return this._path.currentPosition; }
    private _currentPositionChanged = this.disposeVar(new Event<[[number, number, number] | undefined]>());
    get currentPositionChanged() { return this._currentPositionChanged; }

    get currentRotation() {
        const r = this._path.currentRotation;
        if (!r) return undefined;
        return [clamp0_360(r[0] - 90), r[1], r[2]] as [number, number, number];
    }
    private _currentRotationChanged = this.disposeVar(new Event<[[number, number, number] | undefined]>());
    get currentRotationChanged() { return this._currentRotationChanged; }

    get current() {
        return {
            position: this.currentPosition,
            rotation: this.currentRotation,
        };
    }
    private _currentChanged = this.disposeVar(new Event<[{ position: [number, number, number] | undefined, rotation: [number, number, number] | undefined }]>());
    get currentChanged() { return this._currentChanged; }

    static override defaults = {
        ...ESGeoVector.defaults,
        materialModes: [["单箭头", 'singleArrow'], ["多箭头", "multipleArrows"], ["纯色", "pureColor"]] as [name: string, value: string][],
    };

    override  _deprecated = [
        {
            "materialMode": {
                "blue": "multipleArrows",
                "purple": "singleArrow",
            }
        },
        "show"
    ];
    private _deprecatedWarningFunc = (() => { this._deprecatedWarning(); })();

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new DatesProperty('时间序列', '时间序列', true, false, [this, 'timeStamps'], []),
                // new Number3Property('当前位置', '当前位置', true, true, [this, 'currentPosition']),
                new NumberProperty('线条流速', '速度 m/s', false, false, [this, 'speed'], 1),
                new EnumProperty('模式', 'materialMode', false, false, [this, 'materialMode'], ESPath.defaults.materialModes, 'singleArrow'),
                new JsonProperty('拐弯半径', '拐弯半径，单位米', false, false, [this, 'rotationRadius']),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new DatesProperty('时间序列', '时间序列', true, false, [this, 'timeStamps'], []),
                new Number3Property('当前位置', '当前位置', true, true, [this, 'currentPosition']),
                new NumberProperty('速度', '速度 m/s', false, false, [this, 'speed']),
                new EnumProperty('materialMode', 'materialMode', false, false, [this, 'materialMode'], ESPath.defaults.materialModes),
                new JsonProperty('拐弯半径', '拐弯半径，单位米', false, false, [this, 'rotationRadius'], [5]),
            ]),
        ];
    }

    constructor(id?: SceneObjectKey) {
        super(id);
        this.strokeStyle = {
            width: 10,
            widthType: 'world',
            color: [1, 0, 0.73, 1],
            material: '',
            materialParams: {},
            ground: false,
        };
        this._path = this.disposeVar(new ESPathImpl());
        this.dispose(this._path.currentInfoChanged.disposableOn(() => this._currentPositionChanged.emit(this._path.currentPosition)));
        this.dispose(this._path.currentInfoChanged.disposableOn(() => this._currentRotationChanged.emit(this.currentRotation)));
        this.dispose(this._path.currentInfoChanged.disposableOn(() => this._currentChanged.emit(this.current)));
        this._path.show = true;
        this._path.polylineShow = false;
        this._path.currentPoiShow = false;
        {
            const update = () => {
                if (!this.timeStamps || !this.points) {
                    this._path.timePosRots = undefined;
                    return;
                }
                const tn = this.timeStamps.length;
                const pn = this.points.length;
                const mn = Math.min(tn, pn);
                const timePosRots: TimePosRotType[] = [];
                for (let i = 0; i < mn; ++i) {
                    timePosRots.push([this.timeStamps[i], this.points[i]]);
                }
                this._path.timePosRots = timePosRots;
                if (this.rotationRadius.some(item => item > 0)) {
                    this._path.addAroundPoints(this.rotationRadius, true);
                    this._path.computeRotIfUndefinedUsingLerp(true);
                    this._path.rotLerpMode = 'Lerp';
                } else {
                    this._path.computeRotIfUndefinedUsingPrevLine(true);
                    this._path.rotLerpMode = 'Next';
                }
            };
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this.timeStampsChanged,
                this.pointsChanged,
                this.rotationRadiusChanged,
            ));
            update();
            this.dispose(event.disposableOn(update));
        }
    }
}

export namespace ESPath {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
        timeStamps: reactArrayWithUndefined<number[]>(undefined),
        speed: 1,
        materialMode: 'singleArrow',
        stroked: true,
        strokeStyle: reactJson<ESJStrokeStyle>({
            width: 10,
            widthType: 'world',
            color: [1, 0, 0.73, 1],
            material: '',
            materialParams: {},
            ground: false,
        }),
        rotationRadius: [5],
    });
}
extendClassProps(ESPath.prototype, ESPath.createDefaultProps);
export interface ESPath extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESPath.createDefaultProps>> { }
