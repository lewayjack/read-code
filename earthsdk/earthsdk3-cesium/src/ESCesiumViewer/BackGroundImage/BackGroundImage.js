import * as Cesium from 'cesium';
const BoundingRectangle = Cesium.BoundingRectangle;
const Color = Cesium.Color;
const defined = Cesium.defined;
const destroyObject = Cesium.destroyObject;
const DeveloperError = Cesium.DeveloperError;
const Pass = Cesium.Pass;
const RenderState = Cesium.RenderState;
const ShaderSource = Cesium.ShaderSource;
// const ViewportQuadFS = Cesium.ViewportQuadFS;
const ViewportQuadFS = Cesium._shadersViewportQuadFS;
const BlendingState = Cesium.BlendingState;
const Material = Cesium.Material;

/**
 * A viewport aligned quad.
 *
 * @alias BackGroundImage
 * @constructor
 *
 * @param {BoundingRectangle} [rectangle] The {@link BoundingRectangle} defining the quad's position within the viewport.
 * @param {Material} [material] The {@link Material} defining the surface appearance of the viewport quad.
 *
 * @example
 * var viewportQuad = new Cesium.BackGroundImage(new Cesium.BoundingRectangle(0, 0, 80, 40));
 * viewportQuad.material.uniforms.color = new Cesium.Color(1.0, 0.0, 0.0, 1.0);
 */
export function BackGroundImage(material) {
    /**
     * Determines if the viewport quad primitive will be shown.
     *
     * @type {Boolean}
     * @default true
     */
    this.show = true;

    let rectangle;
    if (!defined(rectangle)) {
        rectangle = new BoundingRectangle();
    }

    /**
     * The BoundingRectangle defining the quad's position within the viewport.
     *
     * @type {BoundingRectangle}
     *
     * @example
     * viewportQuad.rectangle = new Cesium.BoundingRectangle(0, 0, 80, 40);
     */
    this.rectangle = BoundingRectangle.clone(rectangle);

    if (!defined(material)) {
        material = Material.fromType(Material.ColorType, {
            color: new Color(1.0, 1.0, 1.0, 1.0)
        });
    }

    /**
     * The surface appearance of the viewport quad.  This can be one of several built-in {@link Material} objects or a custom material, scripted with
     * {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|Fabric}.
     * <p>
     * The default material is <code>Material.ColorType</code>.
     * </p>
     *
     * @type Material
     *
     * @example
     * // 1. Change the color of the default material to yellow
     * viewportQuad.material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 1.0);
     *
     * // 2. Change material to horizontal stripes
     * viewportQuad.material = Cesium.Material.fromType(Cesium.Material.StripeType);
     *
     * @see {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|Fabric}
     */
    this.material = material;
    this._material = undefined;

    this._overlayCommand = undefined;
    this._rs = undefined;
}

/**
 * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
 * get the draw commands needed to render this primitive.
 * <p>
 * Do not call this function directly.  This is documented just to
 * list the exceptions that may be propagated when the scene is rendered:
 * </p>
 *
 * @exception {DeveloperError} this.material must be defined.
 * @exception {DeveloperError} this.rectangle must be defined.
 */
BackGroundImage.prototype.update = function (frameState) {
    if (!this.show) {
        return;
    }

    //>>includeStart('debug', pragmas.debug);
    if (!defined(this.material)) {
        throw new DeveloperError('this.material must be defined.');
    }
    if (!defined(this.rectangle)) {
        throw new DeveloperError('this.rectangle must be defined.');
    }
    //>>includeEnd('debug');

    this.rectangle.width = frameState.context.drawingBufferWidth;
    this.rectangle.height = frameState.context.drawingBufferHeight;

    var rs = this._rs;
    if ((!defined(rs)) || !BoundingRectangle.equals(rs.viewport, this.rectangle)) {
        this._rs = RenderState.fromCache({
            blending: BlendingState.ALPHA_BLEND,
            viewport: this.rectangle
        });
        // vtxf 发现窗口尺寸改变了以后，背景图没有改变，这里加上这句就好了 20231130
        if (this._overlayCommand) {
            this._overlayCommand.renderState = this._rs;
        }
    }

    var pass = frameState.passes;
    if (pass.render) {
        var context = frameState.context;

        if (this._material !== this.material || !defined(this._overlayCommand)) {
            // Recompile shader when material changes
            this._material = this.material;

            if (defined(this._overlayCommand)) {
                this._overlayCommand.shaderProgram.destroy();
            }

            var fs = new ShaderSource({
                sources: [this._material.shaderSource, ViewportQuadFS]
            });
            this._overlayCommand = context.createViewportQuadCommand(fs, {
                renderState: this._rs,
                uniformMap: this._material._uniforms,
                owner: this
            });
            // this._overlayCommand.pass = Pass.OVERLAY;
        }

        this._material.update(context);

        this._overlayCommand.uniformMap = this._material._uniforms;
        // frameState.commandList.push(this._overlayCommand);
    }

    return this._overlayCommand;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 * <br /><br />
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 *
 * @see BackGroundImage#destroy
 */
BackGroundImage.prototype.isDestroyed = function () {
    return false;
};

/**
 * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
 * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
 * <br /><br />
 * Once an object is destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
 * assign the return value (<code>undefined</code>) to the object as done in the example.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * quad = quad && quad.destroy();
 *
 * @see BackGroundImage#isDestroyed
 */
BackGroundImage.prototype.destroy = function () {
    if (defined(this._overlayCommand)) {
        this._overlayCommand.shaderProgram = this._overlayCommand.shaderProgram && this._overlayCommand.shaderProgram.destroy();
    }
    return destroyObject(this);
};
