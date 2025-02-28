import { createProcessingFromAsyncFunc, extendClassProps, ObservableArray, react, sleep, UniteChanged, UniteJson } from "xbsj-base";
import { BooleanProperty, ESJViewInfo, FunctionProperty, GroupProperty, JsonProperty, NumberProperty, ViewPlayerProperty } from "../../../ESJTypes";
import { equalsN3, map } from "../../../utils";
import { ESSceneObject } from "../../base";
import { ViewWrapper } from "./ViewWrapper";
/**
 * https://www.wolai.com/earthsdk/eV1jsaXWLWjaetTVCeSvww
 */
export class ESCameraViewCollection extends ESSceneObject {
    static readonly type = this.register('ESCameraViewCollection', this, { chsName: '视角集合', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "视角集合" });
    get typeName() { return 'ESCameraViewCollection'; }
    override get defaultProps() { return ESCameraViewCollection.createDefaultProps(); }
    override get json() { return { ...(this._innerGetJson() as Object), views: this.views, } as JsonType; }
    override set json(value: JsonType) { this._innerSetJson(value); this.views = value.views; }

    private _currentViewIndex = this.dv(react<number>(-1));
    get currentViewIndex() { return this._currentViewIndex.value; }
    get currentViewIndexChanged() { return this._currentViewIndex.changed; }

    private _viewWrappers = this.dv(new ObservableArray<ViewWrapper>());
    private _currentViewWrapper = this.dv(react<ViewWrapper | undefined>(undefined));
    emitViewsWarpper() { this._viewWrappers.changedEvent.emit(this._viewWrappers); }

    private _container = this.dv(react<HTMLDivElement | undefined>(undefined));
    get container() { return this._container.value; }
    get containerChanged() { return this._container.changed; }
    set container(value: HTMLDivElement | undefined) { this._container.value = value; }

    get views() { return map(this._viewWrappers, e => e.viewInfo); }
    get viewsChanged() { return this._viewWrappers.changedEvent; }
    set views(value: ESJViewInfo[]) {
        if (value.length === this._viewWrappers.length) {
            const vs = this._viewWrappers;
            if (value.every((e, i) => {
                const e2 = vs.get(i).view;
                return e.duration === e2.duration && equalsN3(e.position, e2.position) &&
                    equalsN3(e.rotation, e2.rotation) && e.thumbnail === e2.thumbnail && e.name === e2.name;
            })) {
                return;
            }
        }
        this.clearAllViews();
        for (let e of value) this._viewWrappers.push(new ViewWrapper(this, e));
    }

    /**
     * 获取当前视角的index
     * @param viewWrapper 当前选中的视角
     * @returns 选中视角的index
     */
    private _getIndex(viewWrapper: ViewWrapper) {
        return this._viewWrappers.indexOf(viewWrapper);
    }

    /**
     * 删除所有视角
     */
    clearAllViews() {
        for (let e of this._viewWrappers) {
            e.destroy();
        }
        this._viewWrappers.length = 0;
    }

    /**
     * 添加视角
     * @param name 视角名称 string | undefined ,默认 `视角${views.length+ 1}`
     * @param size 截图尺寸 [number, number]  | undefined,默认[64, 64]
     */
    add(name: string = `视角${this.views.length + 1}`, size: [number, number] = [64, 64]) {
        this._viewWrappers.push(new ViewWrapper(this, undefined, { name, size }));
    }
    /**
     * 更新视角
     * @param index 更新指定位置的视角 number
     * @param name 视角名称 string | undefined
     * @param size 截图尺寸 [number, number]  | undefined,默认[64, 64]
     */
    update(index: number, name?: string, size: [number, number] = [64, 64]) {
        if (index >= this._viewWrappers.length || index < 0) {
            console.warn(`index >= this._viewWrappers.length || index < 0`);
            return false;
        }
        const vr = this._viewWrappers.get(index);
        name && (vr.view.name = name);
        vr.view.resetWithCurrentCamera();
        vr.view.capture(size[0], size[1]);
    }

    /**
     * 添加视角
     */
    addView() { this._viewWrappers.push(new ViewWrapper(this)); }

    /**
     * 插入视角
     * @param index 当前视角的index
     * @returns 
     */
    insertView(index: number) {
        if (this._viewWrappers.length + 1 <= index || index < 0) {
            console.error(`this._views.length <= index || index < 0`);
            return;
        }
        this._viewWrappers.splice(index, 0, new ViewWrapper(this));
    }

    /**
     * 设置当前视角
     * @param index 当前视角的index
     * @returns 
     */
    setCurrentView(index: number) {
        if (index >= this._viewWrappers.length || index < 0) {
            console.warn(`index >= this._viewWrappers.length || index < 0`);
            return false;
        }
        const vr = this._viewWrappers.get(index);
        this._currentViewWrapper.value = vr;
        return true;
    }



    /**
     * 重置视角
     * @param index 当前视角的index
     * @returns 
     */
    resetView(index: number) {
        if (index >= this._viewWrappers.length || index < 0) {
            console.warn(`index >= this._viewWrappers.length || index < 0`);
            return;
        }
        const vr = this._viewWrappers.get(index);
        vr.view.resetWithCurrentCamera();
        vr.view.capture();
    }
    /**
     * 重置视角名称
     * @param index 当前视角的index
     * @returns 
     */
    resetViewName(index: number, value: string) {
        if (index >= this._viewWrappers.length || index < 0) {
            console.warn(`index >= this._viewWrappers.length || index < 0`);
            return;
        }
        const vr = this._viewWrappers.get(index);
        vr.view.name = value
    }

    /**
     * 修改指定视角
     * @param index 当前视角的index
     * @returns 
     */
    updateView(index: number, val: ESJViewInfo) {
        if (index >= this._viewWrappers.length || index < 0) {
            console.warn(`index >= this._viewWrappers.length || index < 0`);
            return false;
        }
        const vr = this._viewWrappers.get(index);
        vr.view.position = val.position
        vr.view.rotation = val.rotation ?? [0, 0, 0]
        vr.view.duration = val.duration ?? 1
        vr.view.thumbnail = val.thumbnail ?? ""
        vr.view.name = val.name ?? ''
        // vr.view.resetWithCurrentCamera();
        // vr.view.capture();
    }

    /**
     * 飞入指定视角
     * @param index 
     */
    flyToView(index: number) {
        if (this.setCurrentView(index)) {
            if (!this._currentViewWrapper.value) throw new Error(`this._currentViewWrapper.value`);
            this._currentViewWrapper.value.view.flyIn();
        }
    }

    /**
     * 上一个视角
     * @returns 
     */
    flyToPrevView() {
        const c = this._currentViewWrapper.value;
        if (!c) {
            this.flyToView(0);
            return true;
        }
        const index = this._getIndex(c);
        if (this.loop ?? ESCameraViewCollection.defaults.loop) {
            this.flyToView((this._viewWrappers.length + index - 1) % this._viewWrappers.length);
            return true;
        } else {
            if (index - 1 < 0) {
                // console.warn(`index - 1 < 0`);
                return false;
            }
            this.flyToView(index - 1);
            return true;
        }
    }

    /**
    * 当前视角移动到上一个视角
    * @returns 
    */
    moveToPreView() {
        const c1 = this._currentViewWrapper.value;
        if (!c1) return;
        const i1 = this._getIndex(c1);
        if (i1 === 0) return;
        const demo = this._viewWrappers.splice(i1 - 1, 1, c1)[0]
        this._viewWrappers.set(i1, demo)
    }
    /**
   * 当前视角移动到下一个视角
   * @returns 
   */
    moveToNextView() {
        const c1 = this._currentViewWrapper.value;
        if (!c1) return;
        const i1 = this._getIndex(c1);
        if (i1 === this._viewWrappers.length - 1) return;
        const demo = this._viewWrappers.splice(i1 + 1, 1, c1)[0]
        this._viewWrappers.set(i1, demo)
    }

    /**
     * 下一个视角
     * @returns 
     */
    flyToNextView() {
        const c = this._currentViewWrapper.value;
        if (!c) {
            this.flyToView(0);
            return true;
        }
        const index = this._getIndex(c);
        if (this.loop ?? ESCameraViewCollection.defaults.loop) {
            this.flyToView((index + 1) % this._viewWrappers.length);
            return true;
        } else {
            if (index + 1 > this._viewWrappers.length - 1) {
                // console.warn(`index - 1 < 0`);
                return false;
            }
            this.flyToView(index + 1);
            return true;
        }
    }

    /**
     * 停止 
     */
    stop() {
        this._currentViewWrapper.value = undefined;
        this.playing = false;
    }

    /**
     * 删除指定视角
     * @param index 要删除视角的index
     * @returns 
     */
    deleteView(index: number) {
        if (index < 0 || index >= this._viewWrappers.length) {
            console.warn(`index < 0 || index >= this._viewWrappers.length`);
            return;
        }
        const viewWrapper = this._viewWrappers.get(index);
        viewWrapper.destroy();
        this._viewWrappers.splice(index, 1);
    }

    /**
     * 删除当前视角
     * @returns 
     */
    deleteCurrentView() {
        const c = this._currentViewWrapper.value;
        if (!c) {
            console.warn(`!this._currentViewWrapper.value`);
            return;
        }
        const index = this._getIndex(c);
        if (index === -1) {
            console.warn(`index === -1`);
            return;
        }
        this.deleteView(index);
    }

    /**
     * 转换图片路径
     * @param url 图片路径
     * @returns 转化以后的图片路径
     */
    transitionImageUrl(url: string) {
        return ESSceneObject.context.getStrFromEnv(url)
    }

    constructor(id?: string) {
        super(id);
        {
            const processing = this.dv(createProcessingFromAsyncFunc(async cancelsManager => {
                do {
                    if (!this.flyToNextView()) break;
                    await cancelsManager.promise(sleep(this.intervalTime ?? ESCameraViewCollection.defaults.intervalTime));
                } while (true);
                this.playing = false;
            }));

            const update = () => {
                if (this.playing) {
                    processing.restart();
                } else {
                    processing.cancel();
                }
            };
            update();
            this.d(this.playingChanged.don(update));
        }

        {
            const update = () => {
                if (!this._currentViewWrapper.value) return;
                const index = this._viewWrappers.indexOf(this._currentViewWrapper.value);
                if (index === -1) {
                    this._currentViewWrapper.value = undefined;
                }
            };
            update();
            this.d(this._viewWrappers.changedEvent.don(update));
        }

        {
            const update = () => {
                const c = this._currentViewWrapper.value;
                this._currentViewIndex.value = c ? this._getIndex(c) : -1;
            };
            update();
            this.d(this._viewWrappers.changedEvent.don(update));
            this.d(this._currentViewWrapper.changed.don(update));
        }

        this.d(() => {
            this.clearAllViews();
        });
    }

    static override defaults = {
        ...ESSceneObject.defaults,
        loop: true,
        playing: false,
        intervalTime: 5000,
        duration: 1,
        views: [],
    };

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESCameraViewCollection', 'ESCameraViewCollection', [
                new FunctionProperty('添加视角', '添加视角', [], () => this.addView(), []),
                new FunctionProperty('插入视角', '插入视角', ['number'], (index: number) => this.insertView(index), [0]),
                new FunctionProperty('清空所有视角', '清空所有视角', [], () => this.clearAllViews(), []),
                new FunctionProperty('当前位置插入视角', '当前位置插入视角', [], () => this.insertView(this.currentViewIndex + 1), []),

                new FunctionProperty('上一个视角', '上一个视角', [], () => this.flyToPrevView(), []),
                new FunctionProperty('下一个视角', '下一个视角', [], () => this.flyToNextView(), []),

                new FunctionProperty('当前视角移动到上一个视角', '当前视角移动到上一个视角', [], () => this.moveToPreView(), []),
                new FunctionProperty('当前视角移动到下一个视角', '当前视角移动到下一个视角', [], () => this.moveToNextView(), []),

                new FunctionProperty('飞入指定视角', '飞入指定视角', ['number'], (index: number) => this.flyToView(index), [0]),
                new FunctionProperty('设置当前视角', '设置当前视角', ['number'], (index: number) => this.setCurrentView(index), [0]),
                new FunctionProperty('删除当前视角', '删除当前视角', [], () => this.deleteCurrentView(), []),
                new FunctionProperty('删除指定视角', '删除指定视角', ['number'], (index: number) => this.deleteView(index), [0]),
                new FunctionProperty('重置视角', '重置视角', ['number'], (index: number) => this.resetView(index), [0]),
                new NumberProperty('当前序号', '当前序号', false, true, [this, 'currentViewIndex']),
                new ViewPlayerProperty('播放', '播放', [this, 'playing'], () => this.stop(), [this, 'loop'], ESCameraViewCollection.defaults),
                new BooleanProperty('是否播放', '是否播放.', false, false, [this, 'playing']),
                new FunctionProperty('停止', '停止', [], () => this.stop(), []),
                new BooleanProperty('是否循环', '是否循环.', false, false, [this, 'loop']),
                new NumberProperty('间隔时间', '间隔时间(s)', false, false, [this, 'intervalTime']),
                new JsonProperty('视角集合', '类型为ESJViewInfo[]', true, false, [this, 'views'], ESCameraViewCollection.defaults.views),
            ]),
        ]
    }
}

export namespace ESCameraViewCollection {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        playing: false,  //开始播放
        loop: true,  //循环播放
        intervalTime: 5000,  //间隔时间
    });
}
extendClassProps(ESCameraViewCollection.prototype, ESCameraViewCollection.createDefaultProps);
export interface ESCameraViewCollection extends UniteChanged<ReturnType<typeof ESCameraViewCollection.createDefaultProps>> { }
type JsonType = UniteJson<ReturnType<typeof ESCameraViewCollection.createDefaultProps> & { type: string } & { views: ESJViewInfo[] }>;
