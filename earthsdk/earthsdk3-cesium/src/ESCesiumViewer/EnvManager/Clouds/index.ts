import * as Cesium from 'cesium';
import { Destroyable, react } from 'xbsj-base';
import { ESCesiumViewer } from '../../index';
import { positionToCartesian, toCartesian2, toCartesian3, toColor } from '@czmSrc/utils';
import { cloudCollection as data } from './data'
export class Clouds extends Destroyable {

    private _show = this.dv(react<boolean>(false));
    get show() { return this._show.value; }
    set show(value: boolean) { this._show.value = value; }
    get showChanged() { return this._show.changed; }

    cloudsPostProcess: Cesium.PostProcessStage | undefined;

    constructor(czmViewer: ESCesiumViewer) {
        super();

        const viewer = czmViewer.viewer;
        if (!viewer) throw new Error('Cesium Viewer is not initialized');

        //TODO: 云层改造支持0~1密度;高度超过多少后就慢慢消失

        // function altostratusLayer() {
        //     // Get position of camera (in Cartesian3)
        //     const cameraPos = camera.positionCartographic;
        //     const cameraPosLat = cameraPos.latitude * 180 / Math.PI;
        //     const cameraPosLon = cameraPos.longitude * 180 / Math.PI;
        //     // Generate some random positions to place clouds around the camera position
        //     const size = 5; // 1 = 1.1132 km. Size of the square area (in degrees) that the clouds will be generated in (1 degrees = 111.32 km)
        //     const step = 0.3;
        //     const maxCloudAltitude = 9e3;
        //     const minCloudAltitude = 5e3;

        //     for (let i = -size / 2; i < size / 2 + step; i += step) {
        //         for (let j = -size / 2; j < size / 2 + step; j += step) {
        //             let latitude = cameraPosLat + i + Math.random() * step;
        //             let longitude = cameraPosLon + j + Math.random() * step;
        //             // Compute a random altitude between two altitudes which clouds typically appears
        //             let altitude = Math.floor(Math.random() * maxCloudAltitude) + minCloudAltitude;
        //             var position = Cesium.Cartesian3.fromDegrees(
        //                 longitude,
        //                 latitude,
        //                 altitude
        //             );

        //             var entity = viewer.entities.add({
        //                 name: 'Altostratus Clouds',
        //                 position: position,
        //                 model: {
        //                     uri: `./assets/flat${Math.floor(Math.random() * 2) + 1}/flat1.gltf`,
        //                     minimumPixelSize: 128,
        //                     scale: 50000,
        //                 },
        //             });
        //             altostratusCloudContainer.add(entity);
        //         }
        //     }

        // }
        const cloudCollection = new Cesium.CloudCollection();
        viewer.scene.primitives.add(cloudCollection);
        this.dispose(() => viewer.scene.primitives.remove(cloudCollection));

        {
            const update = () => {
                cloudCollection.show = this.show;
            };
            update();
            this.dispose(this.showChanged.disposableOn(update));
        }
        {
            const getOption = (option: any) => {
                const opt = {
                    slice: option.slice,
                    brightness: option.brightness,
                    scale: toCartesian2(option.scale),
                    maximumSize: toCartesian3(option.maximumSize),
                    color: toColor(option.color),
                    position: positionToCartesian(option.position)
                }
                return opt;
            };

            const update = () => {
                cloudCollection.removeAll();
                for (let e of data) {
                    cloudCollection.add(getOption(e));
                }
            };
            update();
        }
    }
}
