import { ColorProperty, ESJVector4D, FunctionProperty, NumberProperty } from "../../../ESJTypes";
import { ESGeoPolygon } from "../ESGeoPolygon";
import { Event, UniteChanged, extendClassProps, reactArray } from "xbsj-base";
export class ESSunshineAnalysis extends ESGeoPolygon {
    static override readonly type = this.register('ESSunshineAnalysis', this, { chsName: '日照分析', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "日照分析" });
    override get typeName() { return 'ESSunshineAnalysis'; }
    override get defaultProps() { return ESSunshineAnalysis.createDefaultProps(); }

    private _startEvent = this.dv(new Event());
    get startEvent() { return this._startEvent; }
    start() { this._startEvent.emit(); }

    private _stopEvent = this.dv(new Event());
    get stopEvent() { return this._stopEvent; }
    stop() { this._stopEvent.emit(); }

    static override defaults = {
        ...ESGeoPolygon.defaults,
    };

    constructor(id?: string) {
        super(id);
        this.filled = false;
        this.stroked = false;
    }

    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new ColorProperty('起始颜色', '起始颜色', false, false, [this, 'startColor']),
            new ColorProperty('结束颜色', '结束颜色', false, false, [this, 'endColor']),
            new NumberProperty('计算进度', '计算进度', true, true, [this, 'progress']),
            new NumberProperty('底面高度', '底面高度m', false, false, [this, 'extrudedHeight']),
            new NumberProperty('高度', '高度m', false, false, [this, 'height']),
            new NumberProperty('采样间距', '采样间距m', false, false, [this, 'sampleDistance']),
            new NumberProperty('起始时间', 'startTime,时间戳', false, false, [this, 'startTime']),
            new NumberProperty('结束时间', 'endTime,时间戳', false, false, [this, 'endTime']),
            new NumberProperty('时间跨度', '时间跨度,默认1小时时间戳', false, false, [this, 'spanTime']),
            new FunctionProperty("开始分析", "开始分析", [], () => this.start(), []),
            new FunctionProperty("结束分析", "结束分析", [], () => this.stop(), []),
        ]
    }
}

export namespace ESSunshineAnalysis {
    export const createDefaultProps = () => ({
        ...ESGeoPolygon.createDefaultProps(),
        extrudedHeight: 0, //底面高度 m
        height: 30, //高度 m
        sampleDistance: 10,//采样距离 m
        startColor: reactArray<ESJVector4D>([1, 1, 0, 1]),
        endColor: reactArray<ESJVector4D>([1, 0, 0, 1]),
        startTime: 0,//时间戳8点
        endTime: 36000000,//时间戳18点
        spanTime: 1,//范围，多长时间计算一次，默认一小时
        progress: 0,//计算进度0~100
    });
}
extendClassProps(ESSunshineAnalysis.prototype, ESSunshineAnalysis.createDefaultProps);
export interface ESSunshineAnalysis extends UniteChanged<ReturnType<typeof ESSunshineAnalysis.createDefaultProps>> { }
