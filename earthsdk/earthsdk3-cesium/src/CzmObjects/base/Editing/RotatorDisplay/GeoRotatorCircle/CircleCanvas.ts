import { createNextAnimateFrameEvent, HasOwner, react } from "xbsj-base";
import { GeoRotatorCircle } from ".";
import * as Cesium from 'cesium';
import { computeCzmModelMatrix } from "../../../../../utils";
import { ESJNativeNumber16 } from "earthsdk3";

export class CircleCanvas extends HasOwner<GeoRotatorCircle> {
    private _canvas = document.createElement('canvas');
    get canvas() { return this._canvas; }

    private _ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    get ctx() { return this._ctx; }

    private _flipText = this.ad(react(false));
    get flipText() { return this._flipText.value; }
    set flipText(v) { this._flipText.value = v; }
    get flipTextChanged() { return this._flipText.changed; }

    constructor(owner: GeoRotatorCircle) {
        super(owner);

        const { canvas } = this;
        canvas.width = canvas.height = 256;

        const geoRotatorCircle = this.owner;

        {
            const baseRotation = 0;
            // 更新纹理
            const updateTexture = () => {
                const info = {
                    rotation: geoRotatorCircle.circleRotation * Math.PI / 180,
                    startRotation: geoRotatorCircle.circleStartRotation * Math.PI / 180,
                    endRotation: geoRotatorCircle.circleEndRotation * Math.PI / 180,
                }

                const ctx = this.ctx;
                const color = geoRotatorCircle.color;
                const colorStr = `rgba(${color[0] * 255 | 0}, ${color[1] * 255 | 0}, ${color[2] * 255 | 0}, ${color[3]})`
                ctx.clearRect(0, 0, 256, 256);//清空画布

                // 绘制外圈
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(128, 128, 64, 0, Math.PI * 2, false); //绘制一个圆形
                ctx.strokeStyle = `rgba(0,0,0,${color[3]})`;
                ctx.stroke();

                // 绘制内圈
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(128, 128, 64, 0, Math.PI * 2, false); //绘制一个圆形,叠加在上一个圈上
                ctx.strokeStyle = colorStr;
                ctx.stroke();
                {
                    // 绘制旋转线
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    let startRotation = Cesium.Math.zeroToTwoPi(info.startRotation);
                    let endRotation = Cesium.Math.zeroToTwoPi(info.endRotation);
                    if (endRotation < startRotation)
                        endRotation += Cesium.Math.TWO_PI

                    if (startRotation !== endRotation || startRotation !== 0) {
                        ctx.moveTo(128, 128);
                        ctx.arc(128, 128, 64, startRotation, endRotation, (endRotation - startRotation) > Math.PI);
                        ctx.lineTo(128, 128);
                        ctx.strokeStyle = 'rgba(255, 255, 0, 1.0)';
                        ctx.stroke();
                    }
                }
                let rotation = Cesium.Math.negativePiToPi(info.rotation);
                {
                    // 绘制旋转扇区
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(128, 128);
                    ctx.arc(128, 128, 64, baseRotation, rotation, Cesium.Math.negativePiToPi(rotation - baseRotation) < 0);
                    ctx.lineTo(128, 128);
                    ctx.fillStyle = `rgba(${color[0] * 255 | 0}, ${color[1] * 255 | 0}, ${color[2] * 255 | 0}, 0.5)`;
                    ctx.fill();
                }
                {
                    // 绘制文字
                    ctx.save();
                    ctx.font = "16px console";
                    ctx.textBaseline = "middle";
                    const rotationOnCircle = Cesium.Math.negativePiToPi(rotation - baseRotation);
                    const angle = (rotationOnCircle * 180 / Math.PI * 10 | 0) / 10;
                    const angleStr = `${angle}°`;
                    var width = ctx.measureText(angleStr).width; // TextMetrics object
                    ctx.translate(128, 128);
                    ctx.rotate(Math.PI * 0.5);
                    // ctx.rotate(rotation * 0.5);
                    // baseRotation为pi/2时，以下旋转有一部分不是最短圆弧的中心点
                    // ctx.rotate((rotation + baseRotation) * 0.5);
                    // 需要先把rotation转到-90-270，这样+90再除2就刚好落在最短圆弧中心点
                    rotation = Cesium.Math.negativePiToPi(rotation - baseRotation) + baseRotation; // 对于baseRotation为90时，范围在-90-270；对于baserotation为0时，范围在-180-180
                    ctx.rotate((rotation + baseRotation) * 0.5);
                    ctx.scale(!this.flipText ? 1 : -1, 1);
                    ctx.translate(-128, -128);
                    ctx.fillStyle = 'white';
                    ctx.fillText(angleStr, 128 - width * 0.5, 128 - 64 - 10);
                    ctx.lineWidth = 1;
                    // ctx.strokeStyle = 'black';
                    // ctx.strokeText(angleStr, 128-width*0.5, 128-64-10);
                    ctx.restore();
                }
                this.owner.czmTexture.copyFromCanvas(this.canvas);
            }
            updateTexture();
            const event = this.ad(createNextAnimateFrameEvent(
                geoRotatorCircle.colorChanged,
                geoRotatorCircle.circleRotationChanged,
                geoRotatorCircle.circleStartRotationChanged,
                geoRotatorCircle.circleEndRotationChanged,
                this.flipTextChanged,
            ));
            this.ad(event.don(updateTexture));
            this.ad(geoRotatorCircle.czmTexture.readyEvent.don(updateTexture));
        }
        {
            const update = () => {
                const rm = computeCzmModelMatrix({
                    rotation: this.owner.selfRotation,
                });
                if (!rm) return;
                const m = computeCzmModelMatrix({
                    position: this.owner.position,
                    rotation: this.owner.rotation,
                    localModelMatrix: Cesium.Matrix4.toArray(rm) as ESJNativeNumber16,
                })
                if (!m) return;
                const { viewer } = this.owner.czmViewer;
                if (!viewer) return;
                const dot = Cesium.Cartesian3.dot(viewer.scene.camera.directionWC, new Cesium.Cartesian3(m[8], m[9], m[10]));
                this.flipText = dot > 0;
            }
            update();
            const event = this.ad(createNextAnimateFrameEvent(
                this.owner.czmViewer.cameraChanged,
                this.owner.positionChanged,
                this.owner.rotationChanged,
                this.owner.selfRotationChanged,
            ))
            this.ad(event.don(update));
        }
    }
}
