const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let originalImageData;

const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const rotationSlider = document.getElementById('rotation');
const cropBtn = document.getElementById('cropBtn');
const flipHorizontalBtn = document.getElementById('flipHorizontal');
const flipVerticalBtn = document.getElementById('flipVertical');
const resetButton = document.getElementById('reset');
const downloadButton = document.getElementById('download');
const cropBox = document.getElementById('cropBox');
const filterButtons = document.querySelectorAll('.filter-btn');

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
    
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    imageData = applyBasicAdjustments(imageData, brightness, contrast, saturation);
    
    const activeFilter = document.querySelector('.filter-btn.active').id;
    switch (activeFilter) {
        case 'filter-grayscale':
            imageData = applyGrayscale(imageData);
            break;
        case 'filter-sepia':
            imageData = applySepia(imageData);
            break;
        case 'filter-invert':
            imageData = applyInvert(imageData);
            break;
        case 'filter-blur':
            imageData = applyBlur(imageData, 30);
            break;
        case 'filter-emboss':
            imageData = applyEmboss(imageData);
            break;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
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

function applyBasicAdjustments(imageData, brightness, contrast, saturation) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        // Brightness
        r += brightness;
        g += brightness;
        b += brightness;
        
        // Contrast
        r = ((r - 128) * (contrast / 100 + 1)) + 128;
        g = ((g - 128) * (contrast / 100 + 1)) + 128;
        b = ((b - 128) * (contrast / 100 + 1)) + 128;
        
        // Saturation
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = Math.max(0, Math.min(255, r + saturation * (r - gray) / 100));
        g = Math.max(0, Math.min(255, g + saturation * (g - gray) / 100));
        b = Math.max(0, Math.min(255, b + saturation * (b - gray) / 100));
        
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }
    return imageData;
}

function applyGrayscale(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
    }
    return imageData;
}

function applySepia(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    }
    return imageData;
}

function applyInvert(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
    }
    return imageData;
}

function applyBlur(imageData, intensity) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const blurRadius = Math.floor(intensity / 10);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, count = 0;

            for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const i = (ny * width + nx) * 4;
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }
            }

            const i = (y * width + x) * 4;
            data[i] = r / count;
            data[i + 1] = g / count;
            data[i + 2] = b / count;
        }
    }

    return imageData;
}

function applyEmboss(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const outputData = new ImageData(width, height);
    const output = outputData.data;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            const topLeft = ((y - 1) * width + (x - 1)) * 4;
            const bottomRight = ((y + 1) * width + (x + 1)) * 4;

            output[i] = 128 + (data[i] - data[topLeft]);
            output[i + 1] = 128 + (data[i + 1] - data[topLeft + 1]);
            output[i + 2] = 128 + (data[i + 2] - data[topLeft + 2]);
            output[i + 3] = data[i + 3];
        }
    }

    return outputData;
}

brightnessSlider.addEventListener('input', applyFilters);
contrastSlider.addEventListener('input', applyFilters);
saturationSlider.addEventListener('input', applyFilters);
rotationSlider.addEventListener('input', applyFilters);

filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        applyFilters();
    });
});

cropBtn.addEventListener('click', function() {
    if (!isCropping) {
        isCropping = true;
        cropBox.style.display = 'block';
        cropBtn.textContent = 'Apply Crop';
    } else {
        isCropping = false;
        cropBox.style.display = 'none';
        cropBtn.textContent = 'Crop';
        
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
    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.getElementById('filter-none').classList.add('active');
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