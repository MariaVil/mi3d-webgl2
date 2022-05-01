export async function imgload(url) {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer();
    const bufferArray = new Uint8Array(buffer)
    return parseByteArray(bufferArray)
}

function parseByteArray(byteArray) {
    try {
        var img = {
            rows: 256, columns: 216, slices: 32, 
            pixelSpacingX: 0.9, pixelSpacingY: 0.9, pixelSpacingZ: 5, 
            xort: [-1, 0, 0], yort: [0, 1, 0], zort: [0, 0, 1],
            pixelData: []};

        img.pixelData = new Uint16Array(byteArray.buffer, 0, img.rows * img.columns * img.slices);
        var l = img.pixelData.length;
        var fa = new Float32Array(l);
        for(var i = 0; i < l; i++) {
            fa[i] = img.pixelData[i];
        }

        img.pixelData = fa;
        return img;
    }
    catch(err)
    {
        // we catch the error and display it to the user
        alert(err);
    }
}