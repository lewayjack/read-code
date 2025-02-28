import { bind, extendClassProps, UniteChanged } from "xbsj-base";
import { ESSceneObject } from "../../base";
import { AbsolutePlayer } from "./AbsolutePlayer";
import { BooleanProperty, DateProperty, GroupProperty, NumberProperty, PlayerProperty } from "../../../ESJTypes";

export class ESPlayer extends ESSceneObject {
    static readonly type = this.register('ESPlayer', this, { chsName: 'ESPlayer', tags: ['ESObjects', '_ES_Impl_UE'], description: "ESPlayer" });
    get typeName() { return 'ESPlayer'; }
    override get defaultProps() { return ESPlayer.createDefaultProps(); }
    static override defaults = {
        ...ESSceneObject.defaults,
        currentTime: 0,
        startTime: 0,
        stopTime: 0,
        playing: false,
        loop: false,
        speed: 1,
    };

    private _absolutePlayer = this.dv(new AbsolutePlayer());
    get absolutePlayer() { return this._absolutePlayer; }

    get ratio() { return this._absolutePlayer.ratio; }
    get ratioChanged() { return this._absolutePlayer.ratioChanged; }
    set ratio(value: number) { this._absolutePlayer.ratio = value; }

    constructor(id?: string) {
        super(id);

        const player = this.absolutePlayer;

        this.d(bind([player, 'currentTime'], [this, 'currentTime']));
        this.d(bind([player, 'startTime'], [this, 'startTime']));
        this.d(bind([player, 'stopTime'], [this, 'stopTime']));
        this.d(bind([player, 'playing'], [this, 'playing']));
        this.d(bind([player, 'loop'], [this, 'loop']));
        this.d(bind([player, 'speed'], [this, 'speed']));
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new PlayerProperty('播放器', '播放器', [this, 'playing'], [this, 'ratio'], [this, 'loop']),
                new DateProperty('currentTime', 'currentTime', false, false, [this, 'currentTime']),
                new DateProperty('startTime', 'startTime', false, false, [this, 'startTime']),
                new DateProperty('stopTime', 'stopTime', false, false, [this, 'stopTime']),
                new BooleanProperty('playing', 'playing', false, false, [this, 'playing']),
                new BooleanProperty('loop', 'loop', false, false, [this, 'loop']),
                new NumberProperty('speed', 'speed', false, false, [this, 'speed']),
            ]),
        ];
    }
}

export namespace ESPlayer {
    export const createDefaultProps = () => ({
        ...ESSceneObject.createDefaultProps(),
        currentTime: 0,
        startTime: 0,
        stopTime: 0,
        playing: false,
        loop: false,
        speed: 1,
    });
}
extendClassProps(ESPlayer.prototype, ESPlayer.createDefaultProps);
export interface ESPlayer extends UniteChanged<ReturnType<typeof ESPlayer.createDefaultProps>> { }
