const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let originalImageData;

const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const rotationSlider = document.getElementById('rotation');
const filterSelect = document.getElementById('filter');
const cropBtn = document.getElementById('cropBtn');
const flipHorizontalBtn = document.getElementById('flipHorizontal');
const flipVerticalBtn = document.getElementById('flipVertical');
const resetButton = document.getElementById('reset');
const downloadButton = document.getElementById('download');
const cropBox = document.getElementById('cropBox');

let isCropping = false;
let cropStart = { x: 0, y: 0 };
let cropEnd = { x: 0, y: 0 };

document.getElementById('imageUpload').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        img = new Image();
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
    
    const brightness = parseInt(brightnessSlider.value);
    const contrast = parseInt(contrastSlider.value);
    const saturation = parseInt(saturationSlider.value);
    const rotation = parseInt(rotationSlider.value);
    const filter = filterSelect.value;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        // Apply brightness and contrast
        r = applyBrightnessContrast(r, brightness, contrast);
        g = applyBrightnessContrast(g, brightness, contrast);
        b = applyBrightnessContrast(b, brightness, contrast);
        
        // Apply saturation
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = Math.min(255, Math.max(0, r + saturation * (r - gray) / 100));
        g = Math.min(255, Math.max(0, g + saturation * (g - gray) / 100));
        b = Math.min(255, Math.max(0, b + saturation * (b - gray) / 100));
        
        // Apply filter
        if (filter === 'grayscale') {
            const avg = (r + g + b) / 3;
            r = g = b = avg;
        } else if (filter === 'sepia') {
            const tr = 0.393 * r + 0.769 * g + 0.189 * b;
            const tg = 0.349 * r + 0.686 * g + 0.168 * b;
            const tb = 0.272 * r + 0.534 * g + 0.131 * b;
            r = Math.min(255, tr);
            g = Math.min(255, tg);
            b = Math.min(255, tb);
        } else if (filter === 'invert') {
            r = 255 - r;
            g = 255 - g;
            b = 255 - b;
        }
        
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Apply rotation
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
saturationSlider.addEventListener('input', applyFilters);
rotationSlider.addEventListener('input', applyFilters);
filterSelect.addEventListener('change', applyFilters);

cropBtn.addEventListener('click', function() {
    if (!isCropping) {
        isCropping = true;
        cropBox.style.display = 'block';
        cropBtn.textContent = 'Apply Crop';
    } else {
        isCropping = false;
        cropBox.style.display = 'none';
        cropBtn.textContent = 'Start Crop';
        
        const cropWidth = Math.abs(cropEnd.x - cropStart.x);
        const cropHeight = Math.abs(cropEnd.y - cropStart.y);
        const cropX = Math.min(cropStart.x, cropEnd.x);
        const cropY = Math.min(cropStart.y, cropEnd.y);
        
        const imageData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        ctx.putImageData(imageData, 0, 0);
        
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
});

canvas.addEventListener('mousedown', function(e) {
    if (isCropping) {
        const rect = canvas.getBoundingClientRect();
        cropStart.x = e.clientX - rect.left;
        cropStart.y = e.clientY - rect.top;
    }
});

canvas.addEventListener('mousemove', function(e) {
    if (isCropping) {
        const rect = canvas.getBoundingClientRect();
        cropEnd.x = e.clientX - rect.left;
        cropEnd.y = e.clientY - rect.top;
        
        const width = Math.abs(cropEnd.x - cropStart.x);
        const height = Math.abs(cropEnd.y - cropStart.y);
        const left = Math.min(cropStart.x, cropEnd.x);
        const top = Math.min(cropStart.y, cropEnd.y);
        
        cropBox.style.width = width + 'px';
        cropBox.style.height = height + 'px';
        cropBox.style.left = left + 'px';
        cropBox.style.top = top + 'px';
    }
});

flipHorizontalBtn.addEventListener('click', function() {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, -canvas.width, 0);
    ctx.restore();
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

flipVerticalBtn.addEventListener('click', function() {
    ctx.save();
    ctx.scale(1, -1);
    ctx.drawImage(canvas, 0, -canvas.height);
    ctx.restore();
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

resetButton.addEventListener('click', function() {
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
    saturationSlider.value = 0;
    rotationSlider.value = 0;
    filterSelect.value = 'none';
    if (originalImageData) {
        canvas.width = originalImageData.width;
        canvas.height = originalImageData.height;
        ctx.putImageData(originalImageData, 0, 0);
    }
});

downloadButton.addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'edited_image.png';
    link.href = canvas.toDataURL();
    link.click();
});