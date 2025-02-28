import * as Cesium from 'cesium';

const { combine } = Cesium;
// @ts-ignore
const { ShaderDestination } = Cesium;
/**
 * The tileset pipeline stage is responsible for updating the model with behavior
 * specific to 3D Tiles.
 *
 * @namespace FlattenedPipelineStage
 *
 * @private
 */
const FlattenedPipelineStage = {
  name: "FlattenedPipelineStage", // Helps with debugging
};

/**
 * Process a model. This modifies the following parts of the render resources:
 *
 * <ul>
 *  <li>adds a define to the fragment shader to indicate that the model uses polygon offset for the skipLevelOfDetail optimization</li>
 *  <li>adds a function to the uniform map to supply polygon offset values for the skipLevelOfDetail optimization</li>
 *  <li>sets stencil values that enable classification on 3D Tiles</li>
 * </ul>
 *
 * <p>
 * See {@link ModelDrawCommand} for the corresponding skipLevelOfDetail derived commands.
 * </p>
 *
 * @param {ModelRenderResources} renderResources The render resources for this model.
 * @param {ModelExperimental} model The model.
 * @param {FrameState} frameState The frameState.
 *
 * @private
 */
// @ts-ignore
FlattenedPipelineStage.process = function (renderResources, model, frameState: Cesium.FrameState) {
  if (!!model.xbsjFlattened) {
    // Make the log-depth depth fragment write account for the polygon offset, too.
    // Otherwise, the back face commands will cause the higher resolution
    // tiles to disappear.
    const shaderBuilder = renderResources.shaderBuilder;
    shaderBuilder.addDefine(
      "XBSJ_FLATTERN",
      undefined,
      // ShaderDestination.FRAGMENT
      ShaderDestination.BOTH
    );

    shaderBuilder.addUniform(
      "sampler2D",
      "u_flattenedPolygonTexture",
      ShaderDestination.BOTH
    );

    shaderBuilder.addUniform(
      "vec4",
      "u_flattenedBound",
      ShaderDestination.BOTH
    ); 

    shaderBuilder.addUniform(
      "bool",
      "u_flattened",
      ShaderDestination.BOTH
    ); 

    shaderBuilder.addUniform(
      "mat4",
      "u_inverseModelElevationMatrix",
      ShaderDestination.BOTH
    ); 

    shaderBuilder.addUniform(
      "mat4",
      "u_inverseElevationModelMatrix",
      ShaderDestination.BOTH
    ); 

    shaderBuilder.addUniform(
      "bool",
      "u_flattenDiscard",
      ShaderDestination.BOTH
    );

    // This value will be overriden by the depth-only back face derived command.
    // We just prepare it in advance so we don't have to recompile the shader.
    // We don't add a uniform declaration through ShaderBuilder because
    // this is included in writeLogDepth.glsl
    const uniformMap = {
      // u_flattenedTexture: function () {
      //   return model.getXbsjFlattenedTextureFunc() ?? frameState.context.defaultTexture;
      // },
      u_flattenedBound: function () {
        return model.xbsjFlattenedBound ?? Cesium.Cartesian4.ZERO;
      },
      u_flattened: function () {
        return model.xbsjFlattened;
      },
      u_inverseModelElevationMatrix: function () {
        // @ts-ignore
        const uniformStateInverseModel = frameState.context.uniformState.inverseModel ?? Cesium.Matrix4.IDENTITY;
        model._uniformElevationInverseModelMatrix = Cesium.Matrix4.multiply(
          uniformStateInverseModel,
          model.xbsjElevationMatrix ?? Cesium.Matrix4.IDENTITY,
          model._uniformElevationInverseModelMatrix ?? new Cesium.Matrix4(),
        );
        return model._uniformElevationInverseModelMatrix;
      },
      u_inverseElevationModelMatrix: function () {
        // @ts-ignore
        const uniformStateModel = frameState.context.uniformState.model ?? Cesium.Matrix4.IDENTITY;
        model._uniformInverseElevationModelMatrix = Cesium.Matrix4.multiply(
          model.xbsjElevationMatrixInv ?? Cesium.Matrix4.IDENTITY, 
          uniformStateModel,
          model._uniformInverseElevationModelMatrix ?? new Cesium.Matrix4(),
        );
        return model._uniformInverseElevationModelMatrix;
      },
      u_flattenedPolygonTexture: function () {
        if (!model.xbsjGetFlattenedTextureFunc) {
          return frameState.context.defaultTexture;
        }
        return model.xbsjGetFlattenedTextureFunc() ?? frameState.context.defaultTexture;
      }
      // u_flattenDiscard: function () {
      //   var type = typeof model._flattenDiscard;
      //   if (type === 'undefined') {
      //     return false;
      //   } else if (type === 'function') {
      //     var ce = model._flattenDiscard();
      //     return Cesium.defined(ce) ? ce : false;
      //   } else {
      //     return model._flattenDiscard;
      //   }
      // },
    };

    renderResources.uniformMap = combine(
      uniformMap,
      renderResources.uniformMap
    );
    // renderResources.hasSkipLevelOfDetail = true;
  }

  // Set stencil values for classification on 3D Tiles. This is applied to all
  // of the derived commands, not just the back-face derived command.
  // const renderStateOptions = renderResources.renderStateOptions;
  // renderStateOptions.stencilTest = StencilConstants.setCesium3DTileBit();
  // renderStateOptions.stencilMask = StencilConstants.CESIUM_3D_TILE_MASK;
};

export default FlattenedPipelineStage;
