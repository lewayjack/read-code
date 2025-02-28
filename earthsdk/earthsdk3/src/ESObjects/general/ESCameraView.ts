import { Event, extendClassProps, react, UniteChanged } from "xbsj-base";
import { ESObjectWithLocation } from "../base";
import { FunctionProperty, GroupProperty, NumberProperty, StringProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/sb6BoXk1ALsXvGf76g1tLW
 */
export class ESCameraView extends ESObjectWithLocation {
    static readonly type = this.register('ESCameraView', this, { chsName: '视角', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "视角" });
    get typeName() { return 'ESCameraView'; }
    override get defaultProps() { return ESCameraView.createDefaultProps(); }

    private _thumbnail = this.dv(react<string>(''));
    get thumbnail() { return this._thumbnail.value; }
    set thumbnail(value: string) { this._thumbnail.value = value; }
    get thumbnailChanged() { return this._thumbnail.changed; }

    private _duration = this.dv(react<number>(1));
    get duration() { return this._duration.value; }
    set duration(value: number) { this._duration.value = value; }
    get durationChanged() { return this._duration.changed; }

    private _resetWithCurrentCameraEvent = this.dv(new Event());
    get resetWithCurrentCameraEvent() { return this._resetWithCurrentCameraEvent; }
    /**
     * 设置为当前视角
     */
    resetWithCurrentCamera() { this._resetWithCurrentCameraEvent.emit(); }

    private _captureEvent = this.dv(new Event<[x?: number, y?: number]>());
    get captureEvent() { return this._captureEvent; }
    /**
     * 获取缩略图
     * @param x 缩略图的宽度
     * @param y 缩略图的
     */
    capture(x?: number, y?: number) { this._captureEvent.emit(x, y); }

    /**
     * 用于在创建时自动执行
     */
    execOnCreating() {
        this.resetWithCurrentCamera();
    }

    /**
     * 以当前相机的姿态重置相机姿态 resetCamera名称修改initByCurrent
     * @returns 
     */
    async initByCurrent() {
        this.resetWithCurrentCamera();
    }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        thumbnailWidth: 64,
        thumbnailHeight: 64,
        duration: 1,
        thumbnail: ''
    };

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESCameraView', 'ESCameraView', [
                new FunctionProperty('设置为当前视角', 'resetWithCurrentCamera', [], () => this.resetWithCurrentCamera(), []),
                new FunctionProperty('获取缩略图', '获取缩略图', ['number', 'number'], (x, y) => this.capture(x, y), [ESCameraView.defaults.thumbnailWidth, ESCameraView.defaults.thumbnailHeight]),
                new StringProperty("缩略图", "缩略图", true, false, [this, 'thumbnail']),
                new NumberProperty("飞行时间", "飞行时间(秒)", true, false, [this, 'duration']),
            ])
        ];
    }
}

export namespace ESCameraView {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
    });
}
extendClassProps(ESCameraView.prototype, ESCameraView.createDefaultProps);
export interface ESCameraView extends UniteChanged<ReturnType<typeof ESCameraView.createDefaultProps>> { }
