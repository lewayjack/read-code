export type CzmMaterialJsonType = {
    type: 'Color';
    color?: [number, number, number, number];
} | {
    type: 'PolylineArrow';
    color?: [number, number, number, number];
} | {
    type: 'PolylineDash';
    color?: [number, number, number, number];
    gapColor?: [number, number, number, number];
    dashLength?: number;
    dashPattern?: number;
} | {
    type: 'PolylineGlow';
    color?: [number, number, number, number];
    glowPower?: number;
    taperPower?: number;
} | {
    type: 'PolylineOutline';
    color?: [number, number, number, number];
    outlineColor?: [number, number, number, number];
    outlineWidth?: number;
} | {
    type: 'Image';
    image?: string;
    repeat?: [number, number];
} | {
    type: 'DiffuseMap';
    image?: string;
    repeat?: [number, number];
    channels?: string;
} | {
    type: 'AlphaMap';
    image?: string;
    repeat?: [number, number];
    channel?: string;
} | {
    type: 'SpecularMap';
    image?: string;
    repeat?: [number, number];
    channel?: string;

} | {
    type: 'EmissionMap';
    image?: string;
    repeat?: [number, number];
    channels?: string;
} | {
    type: 'BumpMap';
    image?: string;
    repeat?: [number, number];
    channel?: string;
    strength?: number;
} | {
    type: 'NormalMap';
    image?: string;
    repeat?: [number, number];
    channels?: string;
    strength?: number;
} | {
    type: 'Grid';
    color?: [number, number, number, number];
    cellAlpha?: number;// Alpha value for the cells between grid lines. This will be combined with color.alpha.
    lineCount?: [number, number]; //Object with x and y values specifying the number of columns and rows respectively.
    lineThickness?: [number, number]; //Object with x and y values specifying the thickness of grid lines (in pixels where available).
    lineOffset?: [number, number]; //Object with x and y values specifying the offset of grid lines (range is 0 to 1).
} | {
    type: 'Stripe';
    horizontal?: boolean; //Boolean that determines if the stripes are horizontal or vertical.
    evenColor?: [number, number, number, number];// rgba color object for the stripe's first color.
    oddColor?: [number, number, number, number];// rgba color object for the stripe's second color.
    offset?: number; //that controls at which point into the pattern to begin drawing; with 0.0 being the beginning of the even color, 1.0 the beginning of the odd color, 2.0 being the even color again, and any multiple or fractional values being in between.
    repeat?: number;// that controls the total number of stripes, half light and half dark.
} | {
    type: 'Checkerboard';
    lightColor?: [number, number, number, number];
    darkColor?: [number, number, number, number];
    repeat?: [number, number];

} | {
    type: 'Dot';
    lightColor?: [number, number, number, number];
    darkColor?: [number, number, number, number];
    repeat?: [number, number];
} | {
    type: 'Water';
    baseWaterColor?: [number, number, number, number];
    blendColor?: [number, number, number, number];
    specularMap?: string;
    normalMap?: string;
    frequency?: number;
    animationSpeed?: number;
    amplitude?: number;
    specularIntensity?: number;
    fadeFactor?: number;
} | {
    type: 'RimLighting';
    color?: [number, number, number, number];
    rimColor?: [number, number, number, number];
    width?: number;
} | {
    type: 'Fade';
    fadeInColor?: [number, number, number, number];
    fadeOutColor?: [number, number, number, number];
    maximumDistance?: number;
    repeat?: boolean;
    fadeDirection?: [boolean, boolean];
    time?: [number, number];
} | {
    type: 'ElevationContour';
    color?: [number, number, number, number];
    spacing?: number;
    width?: number;

} | {
    type: 'ElevationRamp';
    image?: string;
    minimumHeight?: number;
    maximumHeight?: number;
} | {
    type: 'AspectRamp';
    image?: string;
} | {
    type: 'ElevationBand';
    colors?: string;
    heights?: string;
};