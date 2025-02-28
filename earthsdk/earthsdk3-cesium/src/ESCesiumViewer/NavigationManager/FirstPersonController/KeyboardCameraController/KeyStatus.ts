import { Destroyable, Event, react, ObjResettingWithEvent } from "xbsj-base";
import { KeyboardCameraControllerRunning } from "./KeyboardCameraControllerRunning";

export class KeyStatus extends Destroyable {
    static getKeyId(options: {
        code: string;
        shiftKey: boolean;
        ctrlKey: boolean;
        altKey: boolean;
        metaKey: boolean;
    }) {
        // const { code, shiftKey, ctrlKey, altKey, metaKey } = options;
        // const s = shiftKey ? 's' : '_';
        // const c = ctrlKey ? 'c' : '_';
        // const a = altKey ? 'a' : '_';
        // const m = metaKey ? 'm' : '_';
        // return `${s}${c}${a}${m}_${code}`;
        return options.code;
    };

    private _currentKeyIds = new Set<string>();
    get currentKeyIds() { return this._currentKeyIds; }
    private _currentKeyIdsChanged = this.dv(new Event());
    get currentKeyIdsChanged() { return this._currentKeyIdsChanged; }

    private _debug = this.dv(react<boolean>(false));
    get debug() { return this._debug.value; }
    set debug(value: boolean) { this._debug.value = value; }
    get debugChanged() { return this._debug.changed; }

    private _debugResetting = this.dv(new ObjResettingWithEvent(this.debugChanged, () => {
        if (!this.debug) return undefined;
        return new (class extends Destroyable {
            constructor(keyStatus: KeyStatus) {
                super();

                const update = () => {
                    console.log([...keyStatus.currentKeyIds].join('\n'));
                };
                update();
                this.d(keyStatus.currentKeyIdsChanged.don(update));
            }
        })(this);
    }));

    constructor(private _keyboardCameraControllerRunning: KeyboardCameraControllerRunning) {
        super();

        const { keyboardCameraController } = this._keyboardCameraControllerRunning;

        {
            const keyDownFunc = (e: KeyboardEvent) => {
                const keyId = KeyStatus.getKeyId(e);
                if (!this._currentKeyIds.has(keyId)) {
                    this._currentKeyIds.add(keyId);
                    this._currentKeyIdsChanged.emit();
                }
            };
            this.d(keyboardCameraController.keyDownEvent.don(keyDownFunc));
        }

        {
            const keyUpFunc = (e: KeyboardEvent) => {
                // up的时候有可能之前按下时同时按下了shift键，但是抬起的时候shift并非按下的状态，
                // 所以这里只要检测到某个按键抬起，就消除所有和该键相关的id
                // const keyId = KeyStatus.getKeyId(e);
                // const ids = [...this._currentKeyIds];
                // let changed = false;
                // for (const id of ids) {
                //     if (id.endsWith(e.code)) {
                //         this._currentKeyIds.delete(id);
                //         changed = true;
                //     }
                // }
                // if (changed) {
                //     this._currentKeyIdsChanged.emit();
                // }
                const keyId = KeyStatus.getKeyId(e);
                if (this._currentKeyIds.has(keyId)) {
                    this._currentKeyIds.delete(keyId);
                    this._currentKeyIdsChanged.emit();
                }
            };
            this.d(keyboardCameraController.keyUpEvent.don(keyUpFunc));
        }

        {
            const abortFunc = () => {
                this._currentKeyIds.clear();
                this._currentKeyIdsChanged.emit();
            };
            this.d(keyboardCameraController.abortEvent.don(abortFunc));
        }
    }
}
