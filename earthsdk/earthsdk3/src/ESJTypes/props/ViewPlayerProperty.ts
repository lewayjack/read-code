import { ReactParamsType } from "xbsj-base";
import { Property } from "./Property";
export type ViewPlayerPropertyDefaults = {
    playing: boolean;
    loop: boolean;
    index: number;
};

export class ViewPlayerProperty extends Property {
    private _defaults = { playing: false, loop: false };
    constructor(
        name: string,
        description: string,
        private _playingReact: ReactParamsType<boolean | undefined>,
        private _stopFn: () => void,
        private _loopReact: ReactParamsType<boolean | undefined>,
        defaults?: Partial<ViewPlayerPropertyDefaults>,
    ) {
        super(name, description);
        if (defaults) {
            this._defaults.playing = defaults.playing ?? this._defaults.playing;
            this._defaults.loop = defaults.loop ?? this._defaults.loop;

        }
    }
    override get type() { return 'ViewPlayerProperty'; }
    get playingReact() { return this._playingReact; }
    get loopReact() { return this._loopReact; }
    get stopFn() { return this._stopFn; }
    get defaults() { return this._defaults; }

}
