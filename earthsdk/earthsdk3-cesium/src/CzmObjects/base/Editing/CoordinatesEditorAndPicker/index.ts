import { createProcessingFromAsyncFunc, Destroyable, extendClassProps, Listener, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, setPromiseCancel, bind } from "xbsj-base";
import { GeoCoordinatesEditor } from "./../../../../CzmObjects";
import { GeoCoordinatesPicker } from "./GeoCoordinatesPicker";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
export * from './GeoCoordinatesPicker';

function getPromiseFromEvent<T extends any[]>(event: Listener<T>) {
    // @ts-ignore
    const [cancelFunc, promise] = getPromiseFromEventInner<T>(event);
    setPromiseCancel(promise, cancelFunc);
    return promise;
}

export class GeoCoordinatesEditorAndPicker extends Destroyable {

    private _editor: GeoCoordinatesEditor;
    get editor() { return this._editor; }

    private _picker: GeoCoordinatesPicker;
    get picker() { return this._picker; }

    get picking() { return this._picker.enabled; }
    get pickingChanged() { return this._picker.enabledChanged; }

    constructor(czmViewer: ESCesiumViewer) {
        super();
        // 初始化
        this._editor = this.disposeVar(new GeoCoordinatesEditor(czmViewer));
        this._picker = this.disposeVar(new GeoCoordinatesPicker(czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const { editor, picker } = this;
        editor.enabled = false;
        picker.enabled = false;
        // 双击取消编辑
        this.ad(czmViewer.dblclickEvent.don(() => {
            this.enabled = false;
        }))
        // class Intercation extends Destroyable {
        //     constructor(viewer: ESViewer) {
        //         super();
        //         this.dispose(viewer.interaction.pointerClick.dbclickEvent.disposableOn(() => {
        //             this.enabled = false;
        //         }));
        //     }
        // }
        // this.registerAttachedObjectForContainer(viewer => new Intercation(viewer));

        {
            const updateProp = () => {
                picker.axisPixelSize = editor.axisPixelSize = this.axisPixelSize;
            };
            updateProp();
            this.dispose(this.axisPixelSizeChanged.disposableOn(updateProp));
        }

        {
            const updateProp = () => {
                picker.axisSnapPixelSize = editor.axisSnapPixelSize = this.axisSnapPixelSize;
            };
            updateProp();
            this.dispose(this.axisSnapPixelSizeChanged.disposableOn(updateProp));
        }

        {
            const updateProp = () => {
                picker.heading = editor.heading = this.heading;
            };
            updateProp();
            this.dispose(this.headingChanged.disposableOn(updateProp));
        }

        {
            this.dispose(bind([this, 'virtualHeight'], [picker, 'virtualHeight']));
        }

        {
            const updateProp = () => {
                if (this.position) {
                    editor.position = picker.position = this.position;
                }
            };
            updateProp();
            this.dispose(this.positionChanged.disposableOn(updateProp));
        }

        {
            const processing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
                // cancelsManager.disposer.dispose(() => {
                //     picker.enabled = false;
                //     editor.enabled = false;
                // });

                if (!this.enabled) {
                    picker.enabled = editor.enabled = false;
                    return;
                }

                if (!this.position) {
                    picker.enabled = true;
                    const promise = new Promise<void>((resolve, reject) => {
                        cancelsManager.disposer.dispose(picker.enabledChanged.disposableOn(() => {
                            resolve();
                        }));
                    });
                    // await cancelsManager.promise(getPromiseFromEvent(picker.enabledChanged));
                    await cancelsManager.promise(promise);

                    if (this.noModifingAfterAdding) {
                        return;
                    }
                }

                if (!this.position) {
                    return;
                }

                editor.enabled = true;

                const promise = new Promise<void>((resolve, reject) => {
                    cancelsManager.disposer.dispose(editor.enabledChanged.disposableOn(() => {
                        if (!editor.enabled) {
                            resolve();
                        } else {
                            console.error(`不应该走到此处！`);
                        }
                    }));
                    cancelsManager.disposer.dispose(this.positionChanged.disposableOn(() => {
                        if (!this.position) {
                            resolve();
                        }
                    }))
                });
                await cancelsManager.promise(promise);

                this.enabled = false;
            }));

            this.dispose(this.enabledChanged.disposableOn(() => processing.restart()));
        }

        {
            this.dispose(picker.positionChanged.disposableOn(position => {
                this.position = position;
            }));

            this.dispose(editor.positionChanged.disposableOn(position => {
                this.position = position;
            }));
        }
    }
}

export namespace GeoCoordinatesEditorAndPicker {
    export const createDefaultProps = () => ({
        enabled: false, // boolean} [show=true] A boolean Property specifying the visibility of the box.
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单位
        heading: 0, // 偏航角，度为单位
        axisPixelSize: 100,
        axisSnapPixelSize: 5,
        virtualHeight: undefined as number | undefined,
        noModifingAfterAdding: false,
        hideCursorInfo: false, // 暂未使用
    });
}
extendClassProps(GeoCoordinatesEditorAndPicker.prototype, GeoCoordinatesEditorAndPicker.createDefaultProps);
export interface GeoCoordinatesEditorAndPicker extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoCoordinatesEditorAndPicker.createDefaultProps>> { }

