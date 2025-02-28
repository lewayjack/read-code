import {
    BooleanProperty, ESJVector2D, ESJVector3D, ESJWidgetEventInfo,
    EnumProperty, GroupProperty, Number2Property, NumberProperty
} from "../../ESJTypes";
import { Event, UniteChanged, extendClassProps, reactArray } from "xbsj-base";
import { ESObjectWithLocation } from "./ESObjectWithLocation";

const rotationTypeEnum = [['固定朝向', 0], ['面向屏幕旋转', 1], ['绕自身Z轴旋转', 2]] as [string, number][];
const renderModeEnum = [['单面不透明', 0], ['双面不透明', 1], ['单面遮罩', 2], ['双面遮罩', 3], ['单面透明', 4], ['双面透明', 5], ['单面未遮挡透明', 6], ['双面未遮挡透明', 7]] as [string, number][];

export abstract class ESLabel extends ESObjectWithLocation {
    private _widgetEvent = this.dv(new Event<[ESJWidgetEventInfo]>());
    get widgetEvent() { return this._widgetEvent };

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        screenRender: true,
        size: [100, 100] as ESJVector2D,
        anchor: [0.5, 0.5] as ESJVector2D,
        sizeByContent: true,
        renderMode: 0,
        rotationType: 1,
    };
    override getESProperties() {
        const properties = { ...super.getESProperties() };

        return {
            ...properties,
            basic: [
                ...properties.basic,
                new BooleanProperty('屏幕渲染', '是否开启屏幕渲染模式', false, false, [this, 'screenRender'], true),
                new BooleanProperty('尺寸自适应', '尺寸是否根据内容自动计算', false, false, [this, 'sizeByContent'], true),
                new Number2Property('尺寸大小', '尺寸自适应关闭才会生效', false, false, [this, 'size'], [100, 100]),
                new Number2Property('偏移比例', '偏移比例(anchor)', false, false, [this, 'anchor'], [0.5, 1]),
                new Number2Property('像素偏移', '像素偏移(offset)', false, false, [this, 'offset'], [0, 0]),
                // new NumberProperty('渲染模式', '八种渲染模式(0~7),当Widget中透明度只有(0,1)两种时可以选择2', false, false, [this, 'renderMode']),
                new EnumProperty('渲染模式', '八种渲染模式(0~7),当Widget中透明度只有(0,1)两种时可以选择2', false, false, [this, 'renderMode'], renderModeEnum, 0),
                // new NumberProperty('漫游旋转类型', '三种漫游旋转类型', false, false, [this, 'rotationType']),
                new EnumProperty('漫游旋转类型', '三种漫游旋转类型(0,1,2)', false, false, [this, 'rotationType'], rotationTypeEnum, 1),
                // new NumberProperty('排序', 'zOrder排序', false, false, [this, 'zOrder'], 0),
            ],
        }

    };
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('标签属性', '标签对象ESLabel的属性', [
                new BooleanProperty('屏幕渲染', '是否开启屏幕渲染模式', false, false, [this, 'screenRender'], true),
                new BooleanProperty('尺寸自适应', '尺寸是否根据内容自动计算', false, false, [this, 'sizeByContent'], true),
                new Number2Property('尺寸大小', '尺寸自适应关闭才会生效', false, false, [this, 'size'], [100, 100]),
                new Number2Property('偏移比例', '偏移比例(anchor)', false, false, [this, 'anchor'], [0.5, 1]),
                new Number2Property('像素偏移', '像素偏移(offset)', false, false, [this, 'offset'], [0, 0]),
                // new NumberProperty('渲染模式', '八种渲染模式(0~7),当Widget中透明度只有(0,1)两种时可以选择2', false, false, [this, 'renderMode']),
                new EnumProperty('渲染模式', '八种渲染模式(0~7),当Widget中透明度只有(0,1)两种时可以选择2', false, false, [this, 'renderMode'], renderModeEnum, 0),
                // new NumberProperty('漫游旋转类型', '三种漫游旋转类型', false, false, [this, 'rotationType']),
                new EnumProperty('漫游旋转类型', '三种漫游旋转类型(0,1,2)', false, false, [this, 'rotationType'], rotationTypeEnum, 1),
                new NumberProperty('排序', 'zOrder排序', false, false, [this, 'zOrder'], 0),
            ]),
        ];
    }
}

export namespace ESLabel {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        screenRender: true,
        size: reactArray<ESJVector2D>([100, 100]),
        anchor: reactArray<ESJVector2D>([0.5, 1]),
        offset: reactArray<ESJVector2D>([0, 0]),
        sizeByContent: true,
        renderMode: 0,
        rotationType: 1,
        zOrder: 0,
        // UE特有属性
        actorTag: "",
        socketName: "",
        positionOffset: reactArray<ESJVector3D>([0, 0, 0]),
        rotationOffset: reactArray<ESJVector3D>([0, 0, 0]),
    });
}
extendClassProps(ESLabel.prototype, ESLabel.createDefaultProps);
export interface ESLabel extends UniteChanged<ReturnType<typeof ESLabel.createDefaultProps>> { }
