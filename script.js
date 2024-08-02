const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();

document.getElementById('imageUpload').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
});

document.getElementById('brightnessUp').addEventListener('click', function() {
    adjustBrightness(10);
});

document.getElementById('brightnessDown').addEventListener('click', function() {
    adjustBrightness(-10);
});

function adjustBrightness(value) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] += value;     // red
        data[i + 1] += value; // green
        data[i + 2] += value; // blue
    }
    ctx.putImageData(imageData, 0, 0);
}

document.getElementById('download').addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'edited_image.png';
    link.href = canvas.toDataURL();
    link.click();
});