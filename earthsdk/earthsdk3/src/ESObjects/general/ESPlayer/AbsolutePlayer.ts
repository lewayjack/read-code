import { bind, clamp, Destroyable, extendClassProps, UniteChanged } from "xbsj-base";
import { ESSceneObject } from "../../base";
import { Player } from "../../../utils";
export class AbsolutePlayer extends Destroyable {
    private _player = this.disposeVar(new Player());
    get player() { return this._player; }

    get ratio() { return this._player.ratio; }
    get ratioChanged() { return this._player.ratioChanged; }
    set ratio(value: number) { this._player.ratio = value; }

    constructor() {
        super();

        const player = this._player;

        {
            const update = () => {
                const duration = (this.stopTime ?? 0) - (this.startTime ?? 0);
                player.duration = duration > 0 ? duration : 0;
            };
            update();
            this.d(this.startTimeChanged.don(update));
            this.d(this.stopTimeChanged.don(update));
        }

        this.d(bind([player, 'playing'], [this, 'playing']));
        this.d(bind([player, 'loop'], [this, 'loop']));
        this.d(bind([player, 'speed'], [this, 'speed']));

        {
            this.d(player.currentTimeChanged.don(() => {
                if (this.startTime === undefined) return;
                if (player.currentTime === undefined) return;
                this.currentTime = player.currentTime + this.startTime;
            }));

            this.d(this.currentTimeChanged.don(() => {
                if (this.currentTime === undefined) return;
                if (this.startTime === undefined) return;
                const currentTime = this.currentTime - this.startTime;
                player.currentTime = clamp(currentTime, 0, player.duration);
            }));
        }
    }
}

export namespace AbsolutePlayer {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        currentTime: undefined as number | undefined,
        startTime: undefined as number | undefined,
        stopTime: undefined as number | undefined,
        playing: undefined as boolean | undefined,
        loop: undefined as boolean | undefined,
        speed: undefined as number | undefined,
    });
}
extendClassProps(AbsolutePlayer.prototype, AbsolutePlayer.createDefaultProps);
export interface AbsolutePlayer extends UniteChanged<ReturnType<typeof AbsolutePlayer.createDefaultProps>> { }
