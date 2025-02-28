import { clamp, createNextAnimateFrameEvent, Destroyable, extendClassProps, ObservableArray, Player as XrPlayer, react, reactDeepArrayWithUndefined, ReactivePropsToNativePropsAndChanged, SceneObjectWithId } from "xbsj-base";
export type PlayerChannelType = [id: string, startTimeStamp: number, duration: number];

class SubPlayer extends Destroyable {
    private _sceneObjectId = this.disposeVar(new SceneObjectWithId());
    get player() { return this._sceneObjectId.sceneObject instanceof Player ? this._sceneObjectId.sceneObject : undefined }
    get playerChanged() { return this._sceneObjectId.sceneObjectChanged; }
    constructor(private _id: string, private _startTimeStamp: number, private _duration: number, private _parent: Player) {
        super();
        this._sceneObjectId.id = this._id;
        const updateCurrent = () => {
            if (!this.player) {
                return;
            }

            const { currentTime = 0 } = this._parent;
            const diff = currentTime - this._startTimeStamp;
            this.player.currentTime = clamp(diff, 0, this._duration) * (this.player.speed ?? 1);
        };

        updateCurrent();
        this.dispose(this._parent.currentTimeChanged.disposableOn(updateCurrent));
        this.dispose(this.playerChanged.disposableOn(updateCurrent));
    }
}

const channelsReadMe = `\
用来配置子播放器，它是一个数组形式，数组的每个元素仍然是一个数组，形式是[子播放器的ID, 起始时间, 持续时间]。  
注意时间的单位是毫秒。  
示例如下：  
\`\`\`
[
    [
        "9591a729-d90b-40d0-8d1b-f1ac4b5263c1",
        0,
        5000
    ],
    [
        "76ad204f-58c6-4639-8713-ecfab6783b0f",
        7000.002288818359,
        5000
    ]
]
\`\`\`
`

export class Player extends Destroyable {
    private _ratio = this.disposeVar(react(0));
    get ratio() { return this._ratio.value; }
    set ratio(value: number) {
        if (Math.abs(this._ratio.value - value) < 0.001) {
            return;
        }
        this.currentTime = (this.duration ?? Player.defaults.duration) * value;
    }
    get ratioChanged() { return this._ratio.changed; }

    private _subPlayers = this.disposeVar(new ObservableArray<SubPlayer>());
    // get subPlayers() { return this._subPlayers.}

    static defaults = {
        loop: false,
        currentTime: 0,
        duration: 3000,
        speed: 1,
        playing: false,
        channels: true,
        ratio: 0,
    };

    constructor() {
        super();

        const xrPlayer = this.disposeVar(new XrPlayer());

        // this.dispose(bind([xrPlayer, 'loop', 'loopChangedEvent'], [this, 'loop']));
        // this.dispose(bind([xrPlayer, 'currentTime', 'currentTimeChangedEvent'], [this, 'currentTime']));
        // this.dispose(bind([xrPlayer, 'duration', 'durationChangedEvent'], [this, 'duration']));
        // this.dispose(bind([xrPlayer, 'speed', 'speedChangedEvent'], [this, 'speed']));
        // this.dispose(bind([xrPlayer, 'playing', 'playingChangedEvent'], [this, 'playing']));

        {
            const update = () => { xrPlayer.loop = this.loop ?? Player.defaults.loop; };
            update();
            this.dispose(this.loopChanged.disposableOn(update));
        }

        {
            const update = () => {
                if ((this.loop ?? Player.defaults.loop) !== xrPlayer.loop) {
                    this.loop = xrPlayer.loop;
                }
            };
            update();
            this.dispose(xrPlayer.loopChangedEvent.disposableOn(update));
        }

        {
            const update = () => { xrPlayer.currentTime = this.currentTime ?? Player.defaults.currentTime; }
            update();
            this.dispose(this.currentTimeChanged.disposableOn(update));
        }

        {
            const update = () => {
                if ((this.currentTime ?? Player.defaults.currentTime) !== xrPlayer.currentTime) {
                    this.currentTime = xrPlayer.currentTime;
                }
            };
            update();
            this.dispose(xrPlayer.currentTimeChangedEvent.disposableOn(update));
        }

        {
            const update = () => { xrPlayer.duration = this.duration ?? Player.defaults.duration; };
            update();
            this.dispose(this.durationChanged.disposableOn(update));
        }

        {
            const update = () => {
                if ((this.duration ?? Player.defaults.duration) !== xrPlayer.duration) {
                    this.duration = xrPlayer.duration;
                }
            };
            update();
            this.dispose(xrPlayer.durationChangedEvent.disposableOn(update));
        }

        {
            const update = () => { xrPlayer.speed = this.speed ?? Player.defaults.speed; }
            update();
            this.dispose(this.speedChanged.disposableOn(update));
        }

        {
            const update = () => {
                if ((this.speed ?? Player.defaults.speed) !== xrPlayer.speed) {
                    this.speed = xrPlayer.speed;
                }
            };
            update();
            this.dispose(xrPlayer.speedChangedEvent.disposableOn(update));
        }

        {
            const update = () => { xrPlayer.playing = this.playing ?? Player.defaults.playing; }
            update();
            this.dispose(this.playingChanged.disposableOn(update));
        }

        {
            const update = () => {
                if ((this.playing ?? Player.defaults.playing) !== xrPlayer.playing) {
                    this.playing = xrPlayer.playing;
                }
            };
            update();
            this.dispose(xrPlayer.playingChangedEvent.disposableOn(update));
        }

        const updateRatio = () => {
            const d = this.duration ?? Player.defaults.duration;
            if (d > 0) {
                this._ratio.value = (this.currentTime ?? Player.defaults.currentTime) / d;
            } else {
                // do nothing? 
            }
        };
        updateRatio();
        const updateRatioEvent = this.disposeVar(createNextAnimateFrameEvent(this.currentTimeChanged, this.durationChanged));
        this.dispose(updateRatioEvent.disposableOn(updateRatio));

        // channel相关
        this.dispose(() => {
            const { length } = this._subPlayers;
            for (let i = 0; i < length; ++i) {
                const subPlayer = this._subPlayers.get(i);
                subPlayer.destroy();
            }
            this._subPlayers.length = 0;
        });

        // channels -> player
        const updateChannels = () => {
            // TODO 这个地方或许可以做一些优化，subPlayer未必都要删掉，可以比较前后不一致的地方，再做适当的对象增删
            for (let subPlayer of this._subPlayers) {
                subPlayer.destroy();
            }
            this._subPlayers.length = 0;

            if (!this.channels) {
                return;
            }
            const subPlayers = this.channels.map(channel => {
                const [id, startTimeStamp, duration] = channel;
                return new SubPlayer(id, startTimeStamp, duration, this);
            });
            this._subPlayers.splice(0, 0, ...subPlayers);
        };
        updateChannels();
        this.dispose(this.channelsChanged.disposableOn(updateChannels));
    }

    static channelsReadMe = channelsReadMe;
}

export namespace Player {
    export const createDefaultProps = () => ({
        loop: false,
        currentTime: 0,
        duration: 3000,
        speed: 1,
        playing: false,
        channels: reactDeepArrayWithUndefined<PlayerChannelType>(undefined, (a, b) => a?.every((e, i) => e === b[i]), s => [...s]),
    });
}

extendClassProps(Player.prototype, Player.createDefaultProps);
export interface Player extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof Player.createDefaultProps>> { }
