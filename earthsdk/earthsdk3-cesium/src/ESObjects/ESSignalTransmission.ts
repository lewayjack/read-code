import { BooleanProperty, EnumProperty, ESGeoVector, GroupProperty, NumberProperty, Player, PlayerProperty, UriProperty } from "earthsdk3";
import { bind, extendClassProps, ReactivePropsToNativePropsAndChanged, SceneObjectKey } from "xbsj-base";
/**
 * https://www.wolai.com/earthsdk/n5kP12TYpDWzVYeM5mjVcK
 */
export class ESSignalTransmission extends ESGeoVector {
    static readonly type = this.register('ESSignalTransmission', this, { chsName: '信号传输器', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "信号传输器" });
    get typeName() { return 'ESSignalTransmission'; }
    override get defaultProps() { return ESSignalTransmission.createDefaultProps(); }

    private _player;
    get player() { return this._player; }

    get ratio() { return this._player.ratio; }
    set ratio(value: number) { this._player.ratio = value; }
    get ratioChanged() { return this._player.ratioChanged; }

    constructor(id?: SceneObjectKey) {
        super(id);
        this._player = this.disposeVar(new Player());
        {
            const d = ESSignalTransmission.defaults;
            this.dispose(bind([this._player, 'loop'], [this, 'loop'], b => b ?? d.loop, a => a ?? d.loop));
            this.dispose(bind([this._player, 'currentTime'], [this, 'currentTime'], b => b ?? d.currentTime, a => a ?? d.currentTime));
            this.dispose(bind([this._player, 'duration'], [this, 'duration'], b => b ?? d.duration, a => a ?? d.duration));
            this.dispose(bind([this._player, 'playing'], [this, 'playing'], b => b ?? d.playing, a => a ?? d.playing));
            this.dispose(bind([this._player, 'speed'], [this, 'speed'], b => b ?? d.speed, a => a ?? d.speed));
        }
    }

    static override defaults = {
        ...ESGeoVector.defaults,
        loop: true,
        currentTime: 0,
        playerCurrentTime: 0,
        duration: 3000,
        speed: 1,
        playing: true,
        startTime: 0,
        transmissionTime: 3000,
        color: [0, 1, 0, 1] as [number, number, number, number],
        width: 3,
        heightRatio: 1,
        arcType: 'GEODESIC',
        brightening: false,
        depthTest: true,
        imageUrl: '${esobjs-xe2-plugin-assets-script-dir}/xe2-assets/esobjs-xe2-plugin/images/signal.png',
        repeat: 5,
        bidirectional: 0,
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new NumberProperty('起始时间', '信号起始传输时间', false, false, [this, 'startTime']),
                new NumberProperty('传输时间', '信号实际传输时间', false, false, [this, 'transmissionTime']),
                new NumberProperty('高度比率', '当只有两个位置点时才有效，此时信号线会自动变成有高度的曲线', false, false, [this, 'heightRatio']),
                new EnumProperty('弧线类型', '弧线类型', false, false, [this, 'arcType'], [['直线', 'NONE'], ['地理直线', 'GEODESIC'], ['地理恒向线', 'RHUMB']]),
                new BooleanProperty('变亮', '变亮', false, false, [this, 'brightening']),
                new BooleanProperty('深度监测', '深度监测', false, false, [this, 'depthTest']),
                new UriProperty('图片路径', "图片路径，若无图片，则显示内部的OD线样式", true, false, [this, 'imageUrl'], ESSignalTransmission.defaults.imageUrl),
                new NumberProperty('图像重复次数', '图像重复次数，有图像时才有效', false, false, [this, 'repeat']),
                new EnumProperty('运动方向', '运动方向，注意对图片来说只有正反向。', false, false, [this, 'bidirectional'], [['正向', 0], ['反向', 1], ['双向', 2], ['无', 3]]),
            ]),
            new GroupProperty('播放器', '播放器', [
                new PlayerProperty('播放器', '播放器', [this, 'playing'], [this, 'ratio'], [this, 'loop']),
                new BooleanProperty('是否循环', '是否循环.', false, false, [this, 'loop']),
                new NumberProperty('当前时间', '当前时间', false, false, [this.player, 'currentTime']),
                new NumberProperty('过渡时间', '过渡时间', false, false, [this, 'duration']),
                new BooleanProperty('是否播放', '是否播放.', false, false, [this, 'playing']),
                new NumberProperty('播放速度', '播放速度.', false, false, [this, 'speed']),
            ]),
        ]
    }
}

export namespace ESSignalTransmission {
    export const createDefaultProps = () => ({
        imageUrl: undefined as string | undefined,
        repeat: 5,
        bidirectional: 0,
        startTime: 0,
        transmissionTime: 3000,
        arcType: 'GEODESIC',
        brightening: false,
        depthTest: true,
        heightRatio: 1,
        loop: true,
        currentTime: 0,
        duration: 3000,
        speed: 1,
        playing: true,
        ...ESGeoVector.createDefaultProps(),
    });
}
extendClassProps(ESSignalTransmission.prototype, ESSignalTransmission.createDefaultProps);
export interface ESSignalTransmission extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESSignalTransmission.createDefaultProps>> { }