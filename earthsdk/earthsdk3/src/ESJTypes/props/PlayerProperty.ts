import { ReactParamsType, react, getReactFuncs } from "xbsj-base";
import { Property } from "./Property";

function createPlayingRatio(currentTimeReact: ReactParamsType<number | undefined>, durationReact: ReactParamsType<number | undefined>) {
    const [getCurrent, setCurrent, currentChanged] = getReactFuncs<number | undefined>(currentTimeReact);
    const [getDuration, setDuration, durationChanged] = getReactFuncs<number | undefined>(durationReact);

    const ratio = react((getCurrent() ?? 0) / (getDuration() ?? 3000));

    const updateRatio = () => {
        const r = ratio.value;
        const d = getDuration() ?? 3000;
        const c = getCurrent() ?? 0;

        if (!Number.isFinite(d) || !Number.isFinite(c)) {
            console.warn(`duration || currentTime error: duration: ${d} currentTime: ${c}`);
            return;
        }

        if (Math.abs(r * d - c) < 0.001) {
            return;
        }
        if (d <= 0) {
            ratio.value = 0;
        } else {
            ratio.value = c / d;
        }
    };
    ratio.dispose(currentChanged.disposableOn(updateRatio));
    ratio.dispose(durationChanged.disposableOn(updateRatio));
    ratio.dispose(ratio.changed.disposableOn(() => {
        const r = ratio.value;
        const d = getDuration() ?? 3000;
        const c = getCurrent() ?? 0;

        if (!Number.isFinite(d) || !Number.isFinite(c)) {
            console.warn(`duration || currentTime error: duration: ${d} currentTime: ${c}`);
            return;
        }

        if (Math.abs(r * d - c) < 0.001) {
            return;
        }
        setCurrent(r * d);
    }));

    return ratio;
}

export type PlayerPropertyDefaults = {
    playing: boolean;
    ratio: number;
    loop: boolean;
};

export class PlayerProperty extends Property {
    static createPlayingRatio = createPlayingRatio;
    private _defaults = { playing: false, ratio: 0, loop: false, };
    constructor(
        name: string,
        description: string,
        private _playingReact: ReactParamsType<boolean | undefined>,
        private _ratioReact: ReactParamsType<number | undefined>,
        private _loopReact: ReactParamsType<boolean | undefined>,
        defaults?: Partial<PlayerPropertyDefaults>,
    ) {
        super(name, description);
        if (defaults) {
            this._defaults.playing = defaults.playing ?? this._defaults.playing;
            this._defaults.ratio = defaults.ratio ?? this._defaults.ratio;
            this._defaults.loop = defaults.loop ?? this._defaults.loop;
        }
    }
    override get type() { return 'PlayerProperty'; }
    get playingReact() { return this._playingReact; }
    get ratioReact() { return this._ratioReact; }
    get loopReact() { return this._loopReact; }
    get defaults() { return this._defaults; }
}
