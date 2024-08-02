const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let originalImageData;

const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const rotationSlider = document.getElementById('rotation');
const filterSelect = document.getElementById('filter');
const cropBtn = document.getElementById('cropBtn');
const resetButton = document.getElementById('reset');
const downloadButton = document.getElementById('download');
const cropBox = document.getElementById('cropBox');

let isCropping = false;
let cropStart = { x: 0, y: 0 };
let cropEnd = { x: 0, y: 0 };

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
    
    // Apply filter
    const filter = filterSelect.value;
    if (filter !== 'none') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (filter === 'grayscale') {
                const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                data[i] = data[i + 1] = data[i + 2] = gray;
            } else if (filter === 'sepia') {
                data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
            }
        }
        ctx.putImageData(imageData, 0, 0);
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
filterSelect.addEventListener('change', applyFilters);

cropBtn.addEventListener('click', function() {
    if (!isCropping) {
        isCropping = true;
        cropBox.style.display = 'block';
        cropBtn.textContent = 'Apply Crop';
    } else {
        isCropping = false;
        cropBox.style.display = 'none';
        cropBtn.textContent = 'Crop Image';
        
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

resetButton.addEventListener('click', function() {
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
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