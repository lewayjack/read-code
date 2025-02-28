import { BooleanProperty, EnumProperty, ESGeoVector, GroupProperty, JsonProperty, NumberProperty, PlayerProperty } from "earthsdk3";
import { GeoPolylinePath } from "../../CzmObjects";
import { extendClassProps, react, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";

export class ESGeoBezierPath extends ESGeoVector {
    static readonly type = this.register('ESGeoBezierPath', this, { chsName: '贝塞尔曲线路径', tags: ['GeoObjects'], description: "贝塞尔曲线路径" });
    get typeName() { return 'ESGeoBezierPath'; }
    override get defaultProps() { return ESGeoBezierPath.createDefaultProps(); }

    override  _deprecated = [
        "ground"
    ];
    private _deprecatedWarningFunc = (() => { this._deprecatedWarning(); })();

    private _geoPolylinePath!: GeoPolylinePath;
    get geoPolylinePath() { return this._geoPolylinePath; }
    set geoPolylinePath(value: GeoPolylinePath) { this._geoPolylinePath = value; }
    get geoPath() { return this._geoPolylinePath.geoPath; }

    get ratio() { return this._geoPolylinePath.ratio; }
    set ratio(value: number) { this._geoPolylinePath.ratio = value; }
    get ratioChanged() { return this._geoPolylinePath.ratioChanged; }


    private _currentDistance = this.disposeVar(react(0));
    get currentDistance() { return this._currentDistance.value; }
    set currentDistance(value: number) { this._currentDistance.value = value; }
    get currentDistanceChanged() { return this._currentDistance.changed; }

    constructor(id?: SceneObjectKey) {
        super(id);
        {
            this.stroked = true;
        }

    }
    static override defaults = {
        ...ESGeoVector.defaults,
        currentPoiShow: true,
        currentDistance: 0,
        resolution: 1000,
        sharpness: 0.85,
        timePosRots: [],
        leadTime: 0,
        trailTime: 0,
        loop: false,
        currentTime: 0,
        duration: 3000,
        playing: false,
        speed: 1,
        ground: false,
        depthTest: false,
        arcType: 'GEODESIC'
    };

    get timePosRots() {
        return this.geoPath.timePosRots;
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new BooleanProperty('是否显示当前', '是否显示当前.', false, false, [this, 'currentPoiShow']),
                new NumberProperty('当前距离', '当前距离', false, false, [this, 'currentDistance']),
                new NumberProperty('分辨率', '分辨率', false, false, [this, 'resolution']),
                new NumberProperty('锐化程度', '锐化程度', false, false, [this, 'sharpness']),
            ]),
            new GroupProperty('GeoPath', 'GeoPath', [
                new JsonProperty('timePosRots', '类型为[timeStamp: number, position: [longitude: number, latitude: number, height: number], rotation: [heading: number, pitch: number, roll: number] | undefined];', false, true, [this, 'timePosRots'], ESGeoBezierPath.defaults.timePosRots),
                new NumberProperty('折线超前显示时长', '折线超前显示时长', false, false, [this, 'leadTime']),
                new NumberProperty('折线滞后显示时长', '折线滞后显示时长', false, false, [this, 'trailTime']),
            ]),
            new GroupProperty('播放器', '播放器', [
                new PlayerProperty('播放器', '播放器', [this, 'playing'], [this._geoPolylinePath, 'ratio'], [this, 'loop']),
                new BooleanProperty('是否循环', '是否循环.', false, false, [this, 'loop']),
                new NumberProperty('当前时间', '当前时间', false, false, [this, 'currentTime']),
                new NumberProperty('过渡时间', '过渡时间', false, false, [this, 'duration']),
                new BooleanProperty('是否播放', '是否播放.', false, false, [this, 'playing']),
                new NumberProperty('播放速度', '播放速度.', false, false, [this, 'speed']),
            ]),
            new GroupProperty('折线', '折线', [
                new BooleanProperty('是否贴地', '是否贴地.', false, false, [this, 'ground']),
                new BooleanProperty('是否开启深度检测', 'A boolean Property specifying the visibility.', false, false, [this, 'depthTest']),
                new EnumProperty('弧线类型', '弧线类型', false, false, [this, 'arcType'], [['直线', 'NONE'], ['地理直线', 'GEODESIC'], ['地理恒向线', 'RHUMB']]),
            ]),
        ]
    }
}

export namespace ESGeoBezierPath {
    export const createDefaultProps = () => ({
        currentPoiShow: true,
        ground: false,
        arcType: 'GEODESIC',
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
        ...ESGeoVector.createDefaultProps(),
    });
}
extendClassProps(ESGeoBezierPath.prototype, ESGeoBezierPath.createDefaultProps);
export interface ESGeoBezierPath extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESGeoBezierPath.createDefaultProps>> { }