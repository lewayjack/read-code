import { EditingProcessing } from ".";
import { PointAdding } from "./PointAdding";
import { PreviousPointDeleting } from "./PreviousPointDeleting";
import { GeoPolylineEditorImpl } from "..";
import { createProcessingFromAsyncFunc, Destroyable, Event, step } from "xbsj-base";

export class AddingEditingProcessing extends Destroyable {
    get editing() { return this._editing; }

    private _overEvent = this.disposeVar(new Event());
    get overEvent() { return this._overEvent; }

    private _deletePreviousPointEvent = this.disposeVar(new Event());
    deletePreviousPoint() { this._deletePreviousPointEvent.emit(); }

    private _cancelEvent = this.disposeVar(new Event());
    cancel() { this._cancelEvent.emit(); }

    constructor(private _editing: EditingProcessing, index?: number) {
        super();

        const { impl } = this._editing;
        const processing = this.disposeVar(createProcessingFromAsyncFunc(async (cancelsManager) => {
            let currentIndex = index ?? this._editing.impl.positionEditors.length;
            impl.menuPoisEnabled = false;
            do {
                if (impl.maxPointsNum !== undefined) {
                    if (impl.positionEditors.length >= impl.maxPointsNum) {
                        (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`impl.positionEditors.length >= impl.maxPointsNum`);
                        break;
                    }
                }

                const next = await cancelsManager.promise(step(cancelsManager, async (cancelsManager) => {
                    const pa = cancelsManager.disposer.disposeVar(new PointAdding(this, currentIndex));
                    const pd = cancelsManager.disposer.disposeVar(new PreviousPointDeleting(this, currentIndex));
                    cancelsManager.disposer.dispose(this._deletePreviousPointEvent.disposableOn(() => pd.do()));
                    return await cancelsManager.promise(new Promise<boolean>(resolve => {
                        cancelsManager.disposer.dispose(pa.overEvent.disposableOnce(success => {
                            if (success) {
                                currentIndex++;
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        }));
                        cancelsManager.disposer.dispose(pd.overEvent.disposableOnce(success => {
                            if (success) {
                                currentIndex--;
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        }));
                        cancelsManager.disposer.dispose(this._cancelEvent.disposableOn(() => resolve(false)));
                    }));
                }));
                if (!next) break;
            } while (true);
            this._overEvent.emit();
        }));
        processing.start();
    }
}
