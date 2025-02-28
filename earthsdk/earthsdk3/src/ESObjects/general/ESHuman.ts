import { extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey, Event } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { EnumProperty, ESJVector3D, FunctionProperty, GroupProperty } from "../../ESJTypes";

export class ESHuman extends ESObjectWithLocation {
    static readonly type = this.register('ESHuman', this, { chsName: '人员', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "工人 警察 路人" });
    get typeName() { return 'ESHuman'; }
    override get defaultProps() { return ESHuman.createDefaultProps(); }

    private _aiMoveToEvent = this.dv(new Event<[ESJVector3D, number]>());
    get aiMoveToEvent() { return this._aiMoveToEvent }
    aiMoveTo(Destination: ESJVector3D, Time: number) { this._aiMoveToEvent.emit(Destination, Time); }

    private _stopAIMoveEvent = this.dv(new Event<[]>());
    get stopAIMoveEvent() { return this._stopAIMoveEvent }
    stopAIMove() { this._stopAIMoveEvent.emit(); }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        // 工人 警察 路人
        modes: [["工人", 'worker'], ["警察", "police"], ["路人", "pedestrian"], ["陌生人", "stranger"], ["男士", 'suitMan'], ["女士", 'suitWoman']] as [name: string, value: string][],
        mode: 'worker' as 'worker' | 'police' | 'pedestrian',
        animations: [["站立", 'standing'], ["行走", "walking"], ["奔跑", "running"]] as [name: string, value: string][],
        animation: 'standing' as 'standing' | 'walking' | 'running',
        czmAnimationsStand: [{
            "index": 0,
            "name": "Stand",
            "loop": "REPEAT",
            "animationTime": "(duration) => Date.now() / 1000 / duration"
        }],
        czmAnimationsWalk: [{
            "index": 2,
            "name": "Walk",
            "loop": "REPEAT",
            "animationTime": "(duration) => Date.now() / 1000 / duration"
        }],
        czmAnimationsRun: [{
            "index": 1,
            "name": "Run",
            "loop": "REPEAT",
            "animationTime": "(duration) => Date.now() / 1000 / duration"
        }]
    }

    constructor(id?: SceneObjectKey) {
        super(id);
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new EnumProperty('模式', 'mode', true, false, [this, 'mode'], ESHuman.defaults.modes, ESHuman.defaults.mode),
                new EnumProperty('动画', 'animation', true, false, [this, 'animation'], ESHuman.defaults.animations, ESHuman.defaults.animation),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new FunctionProperty('自动寻路', 'aiMoveTo', ['numbers', 'number'], (Destination: ESJVector3D, Time: number) => this.aiMoveTo(Destination, Time), [[0, 0, 0], 0]),
                new FunctionProperty('stopAIMove', 'stopAIMove', [], () => this.stopAIMove(), []),
                new EnumProperty('mode', 'mode', false, false, [this, 'mode'], ESHuman.defaults.modes),
                new EnumProperty('动画', 'animation', false, false, [this, 'animation'], ESHuman.defaults.animations),
            ]),
        ];
    }
}

export namespace ESHuman {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        mode: 'worker',
        animation: 'standing',
        allowPicking: true,
    });
}
extendClassProps(ESHuman.prototype, ESHuman.createDefaultProps);
export interface ESHuman extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESHuman.createDefaultProps>> { }
