
export const GetVertex = function () {
    const vertex = new Float32Array([
        1,-1,1,
        -1,-1,1,
        0,1,1
    ]);

    return vertex;
}
export const GetIndices = function () {
    const indices = new Uint32Array([
        0, 1, 2
    ]);

    return indices;
}
export const GetColors = function () {
    const colors = new Float32Array([
        1,0,0,
        0,1,0,
        0,0,1
    ]);
    return colors;
}


