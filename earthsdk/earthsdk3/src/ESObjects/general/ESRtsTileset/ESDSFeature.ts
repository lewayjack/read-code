
import { Destroyable } from "xbsj-base";
import { ESRtsTileset } from ".";
import { ES3DTileset } from "../ES3DTileset";

export class ESDSFeature extends Destroyable {
    private _inner3DTileset: ES3DTileset;
    get inner3DTileset() { return this._inner3DTileset; }
    set inner3DTileset(value) { this._inner3DTileset = value; }

    constructor(sceneObject: ESRtsTileset, private _featureId: string) {
        super();
        this._inner3DTileset = new ES3DTileset(this._featureId)

        const url = sceneObject.url;
        if (!url || typeof url !== 'string') {
            throw new Error('ESDSFeature: url is not defined or not a string');
        }

        this.d(sceneObject.components.disposableAdd(this._inner3DTileset));

        //隐藏原来大的中的feature
        sceneObject.setFeatureVisable('id', [{ value: _featureId, visable: false }]);
        this.d(() => { sceneObject.setFeatureVisable('id', [{ value: _featureId, visable: true }]) });

        const ip = sceneObject.tileServiceIp;//http://localhost
        const port = sceneObject.tilesetServePort;//9014
        if (!port) {
            throw new Error('ESDSFeature: tilesetServePort is not defined');
        }
        this.inner3DTileset.url = `${ip}:${port}/featuretiles/tileservice/${_featureId}/tileset.json`;
        this.inner3DTileset.allowPicking = true;

        //将ES3DTileset的pickedEvent事件绑定到ESDSFeature的pickedEvent事件上
        this.d(this.inner3DTileset.pickedEvent.don((pickedInfo) => {
            sceneObject.pickedEvent.emit(pickedInfo);
        }))

        //编辑互斥
        {
            this.d(this.inner3DTileset.rotationEditingChanged.don((value) => {
                value && (this.inner3DTileset.editing = false);
            }))
            this.d(this.inner3DTileset.editingChanged.don((value) => {
                value && (this.inner3DTileset.rotationEditing = false);
            }))
        }
    }
}
