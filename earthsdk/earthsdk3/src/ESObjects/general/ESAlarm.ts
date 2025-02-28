import { createNextAnimateFrameEvent, extendClassProps, PartialWithUndefinedReactivePropsToNativeProps, react, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { EnumProperty, GroupProperty, NumberProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/rPp3n9HcJpbQuiRQAFzQyB
 */
export class ESAlarm extends ESObjectWithLocation {
    static readonly type = this.register('ESAlarm', this, { chsName: '报警', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "警告类" });
    get typeName() { return 'ESAlarm'; }
    override get defaultProps() { return ESAlarm.createDefaultProps(); }

    private _isFlyInCreated = this.dv(react<boolean>(false));
    get isFlyInCreated() { return this._isFlyInCreated.value; }
    set isFlyInCreated(value: boolean) { this._isFlyInCreated.value = value; }
    get isFlyInCreatedChanged() { return this._isFlyInCreated.changed; }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        modes: [["柱状警告", 'cylinder'], ["圆形警告", "circle"]] as [name: string, value: string][],
        radius: 100,
        czmAnimations:
            [
                {
                    "index": 0,
                    "loop": "REPEAT",
                    "animationTime": "(duration) => Date.now() / 1000 / duration * 2"
                }
            ]
    }

    constructor(id?: SceneObjectKey) {
        super(id);
        this.collision = false;
        // ue创建完成飞行
        this.d(this.createdEvent.don(() => {
            setTimeout(() => {
                const editing = this.editing ?? false;
                if (editing || !this.position) {
                    const updateEvent = this.dv(createNextAnimateFrameEvent(
                        this.positionChanged,
                        this.editingChanged,
                    ));
                    this.d(updateEvent.donce(() => {
                        if (this.editing || !this.position) return;
                        if (!this.isFlyInCreated) return;
                        this.flyTo();
                    }));
                } else {
                    if (!this.isFlyInCreated) return;
                    this.flyTo();
                }
            }, 1000);
        }));
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new EnumProperty('模式', 'mode', false, false, [this, 'mode'], ESAlarm.defaults.modes, 'cylinder'),
                new NumberProperty('半径', 'radius', false, false, [this, 'radius'], 10),
            ]
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new EnumProperty('mode', 'mode', false, false, [this, 'mode'], ESAlarm.defaults.modes),
                new NumberProperty('半径', 'radius', false, false, [this, 'radius']),
            ]),
        ];
    }
}

export namespace ESAlarm {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        mode: "cylinder",
        radius: 10,
    });
}
extendClassProps(ESAlarm.prototype, ESAlarm.createDefaultProps);
export interface ESAlarm extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESAlarm.createDefaultProps>> { }
