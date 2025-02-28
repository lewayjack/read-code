import { Destroyable, Event, track } from "xbsj-base";
import { PolylinePositionEditor } from "../PolylinePositionEditor";
import { ModifyingEditingProcessing } from "./ModifyingEditingProcessing";


export class PointModifying extends Destroyable {
    private _overed = false;
    private _overEvent = this.disposeVar(new Event());
    get overEvent() { return this._overEvent; }

    constructor(private _modifying: ModifyingEditingProcessing, private _posEditor: PolylinePositionEditor) {
        super();

        this.dispose(this._posEditor.toDestroyEvent.disposableOn(() => {
            if (this._overed) return;
            this._overed = true;
            this._overEvent.emit();
        }));

        const { geoCoordinatesEditor } = this._modifying.editing;
        geoCoordinatesEditor.enabled = true;
        geoCoordinatesEditor.heading = 0;

        if (!this._posEditor.position) {
            console.error(`!this._posEditor.position`);
            throw new Error(`!this._posEditor.position`);
        }
        geoCoordinatesEditor.position = this._posEditor.position;
        this.dispose(track([this._posEditor, 'position'], [geoCoordinatesEditor, 'position']));

        this.dispose(() => {
            geoCoordinatesEditor.enabled = false;
        });

        this.dispose(geoCoordinatesEditor.enabledChanged.disposableOnce(enabled => {
            if (enabled) return;
            if (this._overed) return;
            this._overed = true;
            this._overEvent.emit();
        }));
    }
}
