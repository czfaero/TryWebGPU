
export const GetNodes = function () {
    const nodes = new Float32Array([
        1,-1,1,
        -1,-1,1,
        0,1,1
    ]);

    return nodes;
}
export const GetLinks = function () {
    const links = new Uint32Array([
        0, 1,
        1,2,
        0,2
    ]);

    return links;
}
export const GetNodeColors = function () {
    const colors = new Float32Array([
        1,0,0,
        0,1,0,
        0,0,1
    ]);
    return colors;
}


