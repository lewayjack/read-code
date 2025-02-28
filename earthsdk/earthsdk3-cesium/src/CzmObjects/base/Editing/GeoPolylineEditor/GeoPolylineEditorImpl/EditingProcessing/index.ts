import { createProcessingFromAsyncFunc, Destroyable, Event, react, step } from "xbsj-base";
import { GeoPolylineEditorImpl } from "..";
import { AddingEditingProcessing } from "./AddingEditingProcessing";
import { EditingStatusType } from "./EditingStatusType";
import { ModifyingEditingProcessing } from "./ModifyingEditingProcessing";
import { PolylinePositionEditor } from "../PolylinePositionEditor";
import { GeoCoordinatesEditor } from "../../../CoordinateDisplay";
import { GeoCoordinatesPicker } from "../../../CoordinatesEditorAndPicker";
import { CursorFloatDiv, CursorInfo } from "../../../../../../CzmObjects";

export class EditingProcessing extends Destroyable {
    private _status = this.disposeVar(react<EditingStatusType>('None'));
    get status() { return this._status.value; }
    get statusChanged() { return this._status.changed; }
    set status(value: EditingStatusType) { this._status.value = value; }

    private _cursorInfo;
    get cursorInfo() { return this._cursorInfo; }

    private _geoCoordinatesPicker;
    get geoCoordinatesPicker() { return this._geoCoordinatesPicker; }

    private _geoCoordinatesEditor;
    get geoCoordinatesEditor() { return this._geoCoordinatesEditor; }

    private _deletePreviousPointWhileAddingEvent = this.disposeVar(new Event());
    deletePreviousPointWhileAdding() { this._deletePreviousPointWhileAddingEvent.emit(); }

    private _cancelEvent = this.disposeVar(new Event());
    cancel() { this._cancelEvent.emit(); }

    private _forceModifyPosEditorEvent = this.disposeVar(new Event<[PolylinePositionEditor]>());
    modify(posEditor: PolylinePositionEditor) {
        this._forceModifyPosEditorEvent.emit(posEditor);
    }

    private _innerProcessing = this.disposeVar(react<AddingEditingProcessing | ModifyingEditingProcessing | undefined>(undefined));
    get innerProcessing() { return this._innerProcessing.value; }
    get innerProcessingChanged() { return this._innerProcessing.changed; }

    get impl() { return this._impl; }

    constructor(private _impl: GeoPolylineEditorImpl) {
        super();
        const { impl } = this;
        this._geoCoordinatesPicker = this.disposeVar(new GeoCoordinatesPicker(this.impl.sceneObject.czmViewer));
        this._geoCoordinatesEditor = this.disposeVar(new GeoCoordinatesEditor(this.impl.sceneObject.czmViewer));
        if (this.impl.sceneObject.czmViewer.container) {
            this._cursorInfo = this.disposeVar(new CursorInfo(this.impl.sceneObject.czmViewer.container, CursorFloatDiv));
            if (this.cursorInfo) {
                this.cursorInfo.show = true;
                this.cursorInfo.text = '请输入光标提示内容！';
            }
        }
        // this.dispose(impl.sceneObject.components.disposableAdd(this.cursorInfo));

        this.geoCoordinatesPicker.enabled = false;
        // this.dispose(impl.sceneObject.components.disposableAdd(this.geoCoordinatesPicker));

        this.geoCoordinatesEditor.enabled = false;
        // this.dispose(impl.sceneObject.components.disposableAdd(this.geoCoordinatesEditor));

        const processing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
            cancelsManager.disposer.dispose(() => {
                (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`---editing canceled~~~`);
                this.status = 'None'
            });

            let currentAddingIndex = -1;
            // 当没有位置点时或者有一个位置点时，自动进入Adding状态
            if (this.impl.positionEditors.length <= 1) {
                currentAddingIndex = this.impl.positionEditors.length;
            }
            do {
                if (currentAddingIndex !== -1) {
                    // 直接进入Adding状态
                    (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`直接进入Adding状态 currentAddingIndex(${currentAddingIndex})`);
                    this.status = 'Adding';
                    await cancelsManager.promise(step(cancelsManager, async cancelsManager => {
                        const d = cancelsManager.disposer;
                        const adding = d.disposeVar(new AddingEditingProcessing(this, currentAddingIndex));
                        {
                            // 记录状态
                            if (this._innerProcessing.value !== undefined) {
                                console.error(`this._innerProcessing.value !== undefined`);
                            }
                            this._innerProcessing.value = adding;
                            d.dispose(() => {
                                if (this._innerProcessing.value !== adding) {
                                    console.error(`this._innerProcessing.value !== adding`);
                                }
                                this._innerProcessing.value = undefined;
                            });
                        }
                        d.dispose(this._deletePreviousPointWhileAddingEvent.disposableOn(() => adding.deletePreviousPoint()));
                        d.dispose(() => `adding canceled!`);
                        d.dispose(this._cancelEvent.disposableOn(() => adding.cancel()));
                        await cancelsManager.promise(new Promise<void>(resolve => {
                            d.dispose(adding.overEvent.disposableOnce(resolve))
                        }));
                    }));
                    currentAddingIndex = -1;

                    if (this._impl.noModifingAfterAdding) {
                        break;
                    }
                }

                {
                    // 进入Modifying修改状态
                    (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`进入Modifying修改状态`);
                    this.status = 'Modifying';
                    const index = await cancelsManager.promise(step(cancelsManager, async cancelsManager => {
                        const d = cancelsManager.disposer;
                        const modifying = d.disposeVar(new ModifyingEditingProcessing(this));
                        {
                            // 记录状态
                            if (this._innerProcessing.value !== undefined) {
                                console.error(`this._innerProcessing.value !== undefined`);
                            }
                            this._innerProcessing.value = modifying;
                            d.dispose(() => {
                                if (this._innerProcessing.value !== modifying) {
                                    console.error(`this._innerProcessing.value !== modifying`);
                                }
                                this._innerProcessing.value = undefined;
                            });
                        }

                        // 当有位置点时，自动进入第一个位置点的修改状态
                        if (impl.positionEditors.length > 0) {
                            modifying.modify(impl.positionEditors.get(0));
                        }
                        d.dispose(() => `modifying canceled!`);
                        d.dispose(this._cancelEvent.disposableOn(() => modifying.cancel()));
                        d.dispose(this._forceModifyPosEditorEvent.disposableOn(posEditor => modifying.modify(posEditor)));
                        const index = await cancelsManager.promise(new Promise<number>(resolve => {
                            d.dispose(modifying.overEvent.disposableOnce(resolve));
                        }));
                        return index;
                    }));
                    if (index === -1) {
                        (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`退出编辑状态`);
                        break;
                    }
                    // index不是-1，表示要在下一轮中在index处增加元素
                    currentAddingIndex = index;
                    (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`退出修改状态，进入Adding状态currentAddingIndex(${currentAddingIndex})`);
                }
            } while (true);
            this.status = 'None';
            impl.enabled = false;
        }));

        this.dispose(this._impl.enabledChanged.disposableOn(enabled => {
            if (enabled) {
                processing.restart();
            } else {
                processing.cancel();
            }
        }));
    }
}