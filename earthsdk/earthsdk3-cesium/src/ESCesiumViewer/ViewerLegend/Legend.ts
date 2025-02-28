import { Destroyable, react } from "xbsj-base";

// 比例尺计算，返回值是[只含第一位数字的最大整数, 第一位，位数]
var rs = [1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8];
export function getLegendNum(f: number) {
    const n = f | 0;
    if (n < 1 || n > 1e8) return undefined;
    let i = -1;
    while (n >= rs[++i]) { }
    const n0 = (n / rs[i - 1]) | 0;
    return [n0 * rs[i - 1], n0, i];
}

export class Legend extends Destroyable {
    // 比例尺的长度，单位是 像素
    private _lengthInPixels = this.disposeVar(react<number | undefined>(100));
    get lengthInPixels() { return this._lengthInPixels.value; }
    set lengthInPixels(value: number | undefined) { this._lengthInPixels.value = value; }
    get lengthInPixelsChanged() { return this._lengthInPixels.changed; }

    // 分辨率的单位：米/像素
    private _resolution = this.disposeVar(react<number | undefined>(undefined));
    get resolution() { return this._resolution.value; }
    set resolution(value: number | undefined) { this._resolution.value = value; }
    get resolutionChanged() { return this._resolution.changed; }

    // 计算好的像素长度(像素)
    private _computedLengthInPixels = this.disposeVar(react<number | undefined>(undefined));
    get computedLengthInPixels() { return this._computedLengthInPixels.value; }
    get computedLengthInPixelsChanged() { return this._computedLengthInPixels.changed; }

    // 计算好的实际长度(米)
    private _computedLengthInMeters = this.disposeVar(react<number | undefined>(undefined));
    get computedLengthInMeters() { return this._computedLengthInMeters.value; }
    get computedLengthInMetersChanged() { return this._computedLengthInMeters.changed; }

    // 计算好的实际长度字符串
    private _computedLengthInStr = this.disposeVar(react<string | undefined>(undefined));
    get computedLengthInStr() { return this._computedLengthInStr.value; }
    get computedLengthInStrChanged() { return this._computedLengthInStr.changed; }

    constructor() {
        super();

        {
            const update = () => {
                let lip = undefined;
                let lim = undefined;
                do {
                    const { lengthInPixels, resolution } = this;
                    if (lengthInPixels === undefined) break;
                    if (resolution === undefined) break;
                    const result = getLegendNum(lengthInPixels * resolution);
                    if (!result) break;
                    const [m, n, l] = result;
                    lim = m;
                    lip = m / resolution;
                } while (false);

                this._computedLengthInPixels.value = lip;
                this._computedLengthInMeters.value = lim;
            }
            update();
            this.dispose(this.lengthInPixelsChanged.disposableOn(update));
            this.dispose(this.resolutionChanged.disposableOn(update));
        }

        {
            const update = () => {
                const lim = this.computedLengthInMeters;
                if (!lim) {
                    this._computedLengthInStr.value = undefined;
                    return;
                }
                this._computedLengthInStr.value = lim > 1000 ? `${lim / 1000 | 0}km` : `${lim}m`;
            };
            update();
            this.dispose(this.computedLengthInMetersChanged.disposableOn(update));
        }
    }
}
