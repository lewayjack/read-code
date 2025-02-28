import * as Cesium from 'cesium';

export function fixCameraLook() {
    const oldTransform = new Cesium.Matrix4();
    function look(camera: Cesium.Camera, angle: number) {
        const pos = camera.positionWC;
        Cesium.Matrix4.clone(camera.transform, oldTransform);
        camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        camera.look(pos, angle);

        // 以下代码会导致大雁塔上空，相机垂直向下时会抖动！ vtxf 20181116
        // roll角度纠正到0！ vtxf 20181026
        // camera.setView({
        //     destination: pos,
        //     orientation: {
        //         heading: camera.heading,
        //         pitch: camera.pitch,
        //         roll: 0.0,
        //     },
        // });
        camera.lookAtTransform(oldTransform);
    }

    const defaultLookAmount = Math.PI / 60.0;
    Cesium.Camera.prototype.lookLeft = function (amount) {
        amount = Cesium.defaultValue(amount, defaultLookAmount);

        // @ts-ignore
        // only want view of map to change in 3D mode, 2D visual is incorrect when look changes
        if (this._mode !== Cesium.SceneMode.SCENE2D) {
            // @ts-ignore
            look(this, -amount);
        }
    };

    Cesium.Camera.prototype.lookRight = function (amount) {
        // @ts-ignore
        this.lookLeft(-amount);
    };
}

