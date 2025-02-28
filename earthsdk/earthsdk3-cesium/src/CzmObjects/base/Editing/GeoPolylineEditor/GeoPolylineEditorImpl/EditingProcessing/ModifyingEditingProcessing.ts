import { Destroyable, Event } from "xbsj-base";
import { EditingProcessing } from ".";
import { PointModifying } from "./PointModifying";
import { PolylinePositionEditor } from "../PolylinePositionEditor";


export class ModifyingEditingProcessing extends Destroyable {
    // overEvent返回索引，表示要在此处增加元素，如果为-1，则表示直接结束
    private _overEvent = this.disposeVar(new Event<[number]>());

    get overEvent() { return this._overEvent; }

    get editing() { return this._editing; }

    private _cancelEvent = this.disposeVar(new Event());
    cancel() { this._cancelEvent.emit(); }

    private _forceModifyPosEditorEvent = this.disposeVar(new Event<[PolylinePositionEditor]>());
    modify(posEditor: PolylinePositionEditor) {
        this._forceModifyPosEditorEvent.emit(posEditor);
    }

    constructor(private _editing: EditingProcessing) {
        super();

        const { impl } = this._editing;
        impl.menuPoisEnabled = true;
        this.dispose(() => impl.menuPoisEnabled = false);

        let currentPointModifying: PointModifying | undefined;
        const resetPointModifying = () => {
            currentPointModifying?.destroy();
            currentPointModifying = undefined;
            this._editing.status = 'Modifying';
        };
        this.dispose(resetPointModifying);

        const modify = (posEditor: PolylinePositionEditor) => {
            resetPointModifying();
            this._editing.status = 'Modifying_Point';
            currentPointModifying = new PointModifying(this, posEditor);
            currentPointModifying.dispose(currentPointModifying.overEvent.disposableOn(() => {
                resetPointModifying();
            }));
        };

        this.dispose(this._forceModifyPosEditorEvent.disposableOn(modify));

        this.dispose(impl.menuPoisCommand.disposableOn((posEditor, commandName) => {
            if (commandName === 'delete') {
                const n = impl.positionEditors.indexOf(posEditor);
                if (n === -1) {
                    console.error(`posEditor not found`);
                    throw new Error(`posEditor not found`);
                }
                impl.positionEditors.splice(n, 1);
                // this._overEvent.emit(-1);
            } else if (commandName === 'modify') {
                modify(posEditor);
            } else if (commandName === 'add') {
                const n = impl.positionEditors.indexOf(posEditor);
                if (n === -1) {
                    console.error(`posEditor not found`);
                    throw new Error(`posEditor not found`);
                }
                this._overEvent.emit(n + 1);
            } else if (commandName === 'dbclick') {
                this._overEvent.emit(-1);
            } else {
                alert(`未知的commandName(${commandName})`);
            }
        }));

        this.dispose(this._cancelEvent.disposableOn(() => {
            // if (currentPointModifying) {
            //     resetPointModifying();
            // } else {
                this._overEvent.emit(-1);
            // }
        }));
    }
}
