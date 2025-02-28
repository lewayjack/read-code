import { PolylinePositionEditor } from "./PolylinePositionEditor";
import { PolylineWrapper } from "./PolylineWrapper";
import { EditingProcessing } from "./EditingProcessing";
import { GeoPolylineEditor } from '../';
import { Destroyable, Listener, ObservableArray, createNextAnimateFrameEvent, react, Event, ObjResettingWithEvent } from "xbsj-base";
import { CzmArcType } from "../../../../../ESJTypesCzm";
import { ESCesiumViewer } from "../../../../../ESCesiumViewer";

const baseImageUrl = `\${earthsdk3-assets-script-dir}/assets/img/`;

class FirstPositionResetting extends Destroyable {
    constructor(private _firstPositionEditor: PolylinePositionEditor, private _impl: GeoPolylineEditorImpl) {
        super()

        this._firstPositionEditor.positionChanged.disposableOn((v, ov) => {
            if (v === undefined || ov === undefined) return;
            var d = [v[0] - ov[0], v[1] - ov[1], v[2] - ov[2]];
            const l = this._impl.positionEditors.length
            for (let i = 1; i < l; i++) {
                const penN = this._impl.positionEditors.get(i);
                const pp = penN.position;
                if (pp === undefined) continue;
                penN.position = [pp[0] + d[0], pp[1] + d[1], pp[2] + d[2]];
            }
        });
    }
}

export class GeoPolylineEditorImpl extends Destroyable {
    static defaults = {
        enabled: false,
        debug: false,
        polylineShow: false,
        polylineColor: [1, 1, 1, 1] as [number, number, number, number],
        polylineArcType: 'GEODESIC' as CzmArcType,
        polylineWidth: 1,
        maxPointsNum: Number.POSITIVE_INFINITY,
        loop: false,
        firstControlPointImageUrl: baseImageUrl + 'point-green.png',
        otherControlPointImageUrl: baseImageUrl + 'point-yellow.png',
        middlePointImageUrl: baseImageUrl + 'point-green.png',
    };

    get sceneObject() { return this._sceneObject; }

    private _positionEditors = this.disposeVar(new ObservableArray<PolylinePositionEditor>());
    get positionEditors() { return this._positionEditors; }

    private _enabled = this.disposeVar(react<boolean | undefined>(undefined));
    get enabled() { return this._enabled.value; }
    get enabledChanged() { return this._enabled.changed; }
    set enabled(value: boolean | undefined) { this._enabled.value = value; }

    // 创建一个属性名为debug的响应式属性，类型为boolean
    private _debug = this.disposeVar(react<boolean | undefined>(undefined));
    get debug() { return this._debug.value; }
    get debugChanged() { return this._debug.changed; }
    set debug(value: boolean | undefined) { this._debug.value = value; }

    // 创建一个属性名为menuPoisEnabled的响应式属性，类型为boolean
    private _menuPoisEnabled = this.disposeVar(react<boolean>(false));
    get menuPoisEnabled() { return this._menuPoisEnabled.value; }
    get menuPoisEnabledChanged() { return this._menuPoisEnabled.changed; }
    set menuPoisEnabled(value: boolean) { this._menuPoisEnabled.value = value; }

    private _menuPoisCommand = this.disposeVar(new Event<[positionEditor: PolylinePositionEditor, command: string]>());
    get menuPoisCommand() { return this._menuPoisCommand; }

    private _maxPointsNum = this.disposeVar(react<number | undefined>(undefined));
    get maxPointsNum() { return this._maxPointsNum.value; }
    get maxPointsNumChanged() { return this._maxPointsNum.changed; }
    set maxPointsNum(value: number | undefined) { this._maxPointsNum.value = value; }

    // 退出增加状态后不进入修改状态
    private _noModifingAfterAdding = this.disposeVar(react<boolean>(false));
    get noModifingAfterAdding() { return this._noModifingAfterAdding.value; }
    set noModifingAfterAdding(value: boolean) { this._noModifingAfterAdding.value = value; }
    get noModifingAfterAddingChanged() { return this._noModifingAfterAdding.changed; }

    private _hideCursorInfo = this.disposeVar(react<boolean>(false));
    get hideCursorInfo() { return this._hideCursorInfo.value; }
    set hideCursorInfo(value: boolean) { this._hideCursorInfo.value = value; }
    get hideCursorInfoChanged() { return this._hideCursorInfo.changed; }

    // 首个控制点的图片路径
    private _firstControlPointImageUrl = this.disposeVar(react<string | undefined>(undefined));
    get firstControlPointImageUrl() { return this._firstControlPointImageUrl.value; }
    get firstControlPointImageUrlChanged() { return this._firstControlPointImageUrl.changed; }
    set firstControlPointImageUrl(value: string | undefined) { this._firstControlPointImageUrl.value = value; }

    // 其他控制点的图片路径
    private _otherControlPointImageUrl = this.disposeVar(react<string | undefined>(undefined));
    get otherControlPointImageUrl() { return this._otherControlPointImageUrl.value; }
    get otherControlPointImageUrlChanged() { return this._otherControlPointImageUrl.changed; }
    set otherControlPointImageUrl(value: string | undefined) { this._otherControlPointImageUrl.value = value; }

    // 中间点的图片路径
    private _middlePointImageUrl = this.disposeVar(react<string | undefined>(undefined));
    get middlePointImageUrl() { return this._middlePointImageUrl.value; }
    get middlePointImageUrlChanged() { return this._middlePointImageUrl.changed; }
    set middlePointImageUrl(value: string | undefined) { this._middlePointImageUrl.value = value; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _moveWithFirstPosition = this.disposeVar(react<boolean>(false));
    get moveWithFirstPosition() { return this._moveWithFirstPosition.value; }
    set moveWithFirstPosition(value: boolean) { this._moveWithFirstPosition.value = value; }
    get moveWithFirstPositionChanged() { return this._moveWithFirstPosition.changed; }

    /**
     * 每次调用都会创建一个新的数组，谨慎使用，避免影响性能！
     * @returns 
     */
    getPositions() {
        const positions: [number, number, number][] = [];
        for (let e of this._positionEditors) {
            e.position && positions.push([...e.position]);
        }
        return positions;
    }

    resetPositions(value?: [number, number, number][]) {
        if (this.enabled ?? GeoPolylineEditorImpl.defaults.enabled) {
            console.warn(`GeoPolylineEditorImpl.resetPositions error: this.enabled === true`);
            return;
        }

        // console.log(`polylineEditor resetPositions ${value && JSON.stringify(value, undefined, '    ')}`);
        const newPositions = value || [];
        if (newPositions.length === this._positionEditors.length) {
            if (newPositions.every((e, i) => e.every((ee, ii) => {
                const p = this._positionEditors.get(i);
                return p.position && (p.position[ii] === ee);
            }))) {
                // 如果完全相等，则不进行赋值！
                return;
            }
        }
        const toAddItems = value ? value.map(e => new PolylinePositionEditor(this, e)) : [];
        this._positionEditors.splice(0, this._positionEditors.length, ...toAddItems);
    }

    forceResetPositions(value?: [number, number, number][]) {
        if (this.enabled ?? GeoPolylineEditorImpl.defaults.enabled) {
            this.enabled = false;
        }
        this.resetPositions(value);
    }

    get positions() { return this.getPositions(); }

    private _positionsChanged = this.disposeVar(new Event());
    get positionsChanged() { return this._positionsChanged; }

    private _polylineWrapper;
    get polylineWrapper() { return this._polylineWrapper; }

    private _editingProcessing;
    get editingProcessing() { return this._editingProcessing; }

    private _loop = this.disposeVar(react<boolean | undefined>(undefined));
    get loop() { return this._loop.value; }
    get loopChanged() { return this._loop.changed; }
    set loop(value: boolean | undefined) { this._loop.value = value; }

    constructor(private _sceneObject: GeoPolylineEditor) {
        super();
        this._polylineWrapper = this.disposeVar(new PolylineWrapper(this));
        this._editingProcessing = this.disposeVar(new EditingProcessing(this));

        this.dispose(() => this.resetPositions());

        this.dispose(this._positionEditors.changedEvent.disposableOn(() => this._positionsChanged.emit()));

        this.dispose(this._positionEditors.toChangeEvent.disposableOn(changedInfos => {
            for (let { start, deleteCount } of changedInfos) {
                for (let i = start; i < start + deleteCount; ++i) {
                    const toDelEditor = this._positionEditors.get(i);
                    toDelEditor.destroy();
                }
            }
        }));
        this.dispose(() => this._positionEditors.length = 0);

        this.dispose(this.flyToEvent.disposableOn(duration => this._polylineWrapper.flyTo(duration)));

        {
            // menuPoisEnabled属性变化时，同步设置positinEditors中的menuPoi的enabled属性
            this.dispose(this._menuPoisEnabled.changed.disposableOn(() => {
                for (let e of this._positionEditors) {
                    e.menuPoi.enabled = this._menuPoisEnabled.value ?? false;
                }
            }));
            this.dispose(this._positionEditors.toChangeEvent.disposableOn(changedInfos => {
                for (let { items } of changedInfos) {
                    for (const e of items) {
                        e.menuPoi.enabled = this._menuPoisEnabled.value ?? false;
                    }
                }
            }));
        }

        {
            this.dispose(this.editingProcessing.statusChanged.disposableOn(() => {
                const { status, cursorInfo } = this.editingProcessing;
                if (!cursorInfo) return;
                if (!this.hideCursorInfo) {
                    cursorInfo.show = false;
                    return;
                }
                if (status === 'Adding') {
                    cursorInfo.text = `右键/BackSpace键：删除上一个控制点；Esc键或左键双击：退出添加状态，进入修改状态`;
                    cursorInfo.show = true;
                } else if (status === 'Modifying') {
                    cursorInfo.text = `Esc键或左键双击：退出编辑状态`;
                    cursorInfo.show = true;
                } else if (status === 'Modifying_Point') {
                    // cursorInfo.text = `Esc键或左键双击：退出单点修改状态`;
                    cursorInfo.text = `Esc键或左键双击：退出编辑状态`;
                    cursorInfo.show = true;
                } else if (status === 'None') {
                    cursorInfo.text = '';
                    cursorInfo.show = false;
                }
            }));
        }

        {
            this.dispose(_sceneObject.czmViewer.clickEvent.don(e => {
                // 右键按下时，删除上一个控制点
                if (e.pointerEvent?.button === 2) {
                    this.editingProcessing.deletePreviousPointWhileAdding();
                }
            }));
            this.dispose(_sceneObject.czmViewer.dblclickEvent.don(e => {
                // 左键双击后，执行取消操作
                if (e.pointerEvent?.button === 0) {
                    this.editingProcessing.cancel();
                }
            }));
            class Interaction extends Destroyable {
                constructor(impl: GeoPolylineEditorImpl, viewer: ESCesiumViewer) {
                    super();

                    const interaction = viewer;
                    if (!interaction) {
                        // throw new Error(`!interaction`);
                        console.warn(`!interaction`);
                        return;
                    }

                    const { editingProcessing } = impl;
                    this.dispose(interaction.clickEvent.don(e => {
                        // 右键按下时，删除上一个控制点
                        if (e.pointerEvent?.button === 2) {
                            editingProcessing.deletePreviousPointWhileAdding();
                        }
                    }));

                    // this.dispose(interaction.keyUpEvent, (e => {
                    //     // BackSpace键按下时，删除上一个控制点
                    //     if (e.key === 'Backspace') {
                    //         editingProcessing.deletePreviousPointWhileAdding();
                    //     }
                    // }));

                    // this.dispose(interaction.keyUpEvent, (e => {
                    //     // Esc键按下时，取消添加控制点
                    //     if (e.key === 'Escape') {
                    //         editingProcessing.cancel();
                    //     }
                    // }));

                    this.dispose(interaction.dblclickEvent.don(e => {
                        // 左键双击后，执行取消操作
                        if (e.pointerEvent?.button === 0) {
                            editingProcessing.cancel();
                        }
                    }));

                    // this.dispose(interaction.pointerDownEvent, (e => {
                    //     // 触屏时，如果超过一个按键按下时，那么即取消操作。对于任何超过一个的按键，isPrimary都会是false。
                    //     if (!e.isPrimary) {
                    //         editingProcessing.cancel();
                    //     }
                    // }));
                }
            }
            // sceneObject.registerAttachedObjectForContainer(viewer => new Interaction(this, viewer));
        }

        {
            const event = this.disposeVar(createNextAnimateFrameEvent(this.positionEditors.changedEvent, this.moveWithFirstPositionChanged));
            this.disposeVar(new ObjResettingWithEvent(event, () => {
                if (!this.moveWithFirstPosition || this.positionEditors.length <= 1) return undefined;
                return new FirstPositionResetting(this.positionEditors.get(0), this);
            }));
        }
    }
}
