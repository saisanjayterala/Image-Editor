const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let originalImageData;

const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const rotationSlider = document.getElementById('rotation');
const resetButton = document.getElementById('reset');
const downloadButton = document.getElementById('download');

document.getElementById('imageUpload').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
});

function applyFilters() {
    if (!originalImageData) return;
    
    ctx.putImageData(originalImageData, 0, 0);
    
    // Apply brightness and contrast
    const brightness = parseInt(brightnessSlider.value);
    const contrast = parseInt(contrastSlider.value);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = applyBrightnessContrast(data[i], brightness, contrast);
        data[i + 1] = applyBrightnessContrast(data[i + 1], brightness, contrast);
        data[i + 2] = applyBrightnessContrast(data[i + 2], brightness, contrast);
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Apply rotation
    const rotation = parseInt(rotationSlider.value);
    if (rotation !== 0) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.drawImage(tempCanvas, -canvas.width / 2, -canvas.height / 2);
        ctx.restore();
    }
}

function applyBrightnessContrast(value, brightness, contrast) {
    value += brightness;
    value = (value - 128) * (contrast / 100 + 1) + 128;
    return Math.max(0, Math.min(255, value));
}

brightnessSlider.addEventListener('input', applyFilters);
contrastSlider.addEventListener('input', applyFilters);
rotationSlider.addEventListener('input', applyFilters);

resetButton.addEventListener('click', function() {
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
    rotationSlider.value = 0;
    if (originalImageData) {
        ctx.putImageData(originalImageData, 0, 0);
    }
});

downloadButton.addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'edited_image.png';
    link.href = canvas.toDataURL();
    link.click();
});