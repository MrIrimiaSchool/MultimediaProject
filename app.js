var canvas = document.getElementById('drawingCanvas');
var ctx = canvas.getContext('2d');
var drawing = false;
var currentTool = 'line';
var currentColor = '#000000';
var lineWidth = 5;
var startX = 0;
var startY = 0;
var shapes = [];
var selectedShapeIndex = -1;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

document.getElementById('lineTool').addEventListener('click', function() {
    currentTool = 'line';
});
document.getElementById('ellipseTool').addEventListener('click', function() {
    currentTool = 'ellipse';
});
document.getElementById('rectangleTool').addEventListener('click', function() {
    currentTool = 'rectangle';
});
document.getElementById('colorPicker').addEventListener('change', function(e) {
    currentColor = e.target.value;
});
document.getElementById('lineWidth').addEventListener('change', function(e) {
    lineWidth = e.target.value;
});
document.getElementById('clearCanvas').addEventListener('click', clearCanvas);
document.getElementById('exportPng').addEventListener('click', function() {
    exportWithBackground("image/png", "canvas-image.png");
});
document.getElementById('exportJpeg').addEventListener('click', function() {
    exportWithBackground("image/jpeg", "canvas-image.jpeg");
});
document.getElementById('exportSvg').addEventListener('click', function() {
    exportToSvg();
});

document.getElementById('applyBackgroundColor').addEventListener('click', applyBackgroundColor);
document.getElementById('updateShapeProperties').addEventListener('click', updateSelectedShape);

fillCanvasBackground();

function startDrawing(e) {
    drawing = true;
    startX = lastX = e.offsetX;
    startY = lastY = e.offsetY;
}

function draw(e) {
    if (!drawing) return;
    if (currentTool === 'line') {
        shapes.push({ type: 'line', x1: lastX, y1: lastY, x2: e.offsetX, y2: e.offsetY, color: currentColor, lineWidth: lineWidth });
        redrawCanvas();
    } else {
        redrawCanvas();
        drawShape({ type: currentTool, x1: startX, y1: startY, x2: e.offsetX, y2: e.offsetY, color: currentColor, lineWidth: lineWidth });
    }
    lastX = e.offsetX;
    lastY = e.offsetY;
}

function stopDrawing(e) {
    if (!drawing) return;
    if (currentTool !== 'line') {
        shapes.push({ type: currentTool, x1: startX, y1: startY, x2: e.offsetX, y2: e.offsetY, color: currentColor, lineWidth: lineWidth });
        updateShapeList();
    }
    redrawCanvas();
    drawing = false;
}

function fillCanvasBackground() {
    var bgColor = canvas.style.backgroundColor || '#FFFFFF';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawShape(shape) {
    ctx.beginPath();
    ctx.lineWidth = shape.lineWidth;
    ctx.strokeStyle = shape.color;
    switch (shape.type) {
        case 'line':
            ctx.moveTo(shape.x1, shape.y1);
            ctx.lineTo(shape.x2, shape.y2);
            break;
        case 'rectangle':
            ctx.rect(shape.x1, shape.y1, shape.x2 - shape.x1, shape.y2 - shape.y1);
            break;
        case 'ellipse':
            ctx.ellipse(shape.x1, shape.y1, Math.abs(shape.x2 - shape.x1), Math.abs(shape.y2 - shape.y1), 0, 0, 2 * Math.PI);
            break;
    }
    ctx.stroke();
}

function redrawCanvas() {
    fillCanvasBackground();
    shapes.forEach(drawShape);
}

function updateShapeList() {
    var shapeListElement = document.getElementById('shapeList');
    shapeListElement.innerHTML = '';
    var nonLineShapeIndex = 0;
    shapes.forEach(function (shape, index) {
        if (shape.type !== 'line') {
            var listItem = document.createElement('li');
            listItem.textContent = shape.type + ' ' + (nonLineShapeIndex + 1);
            listItem.onclick = function () {
                selectedShapeIndex = index;
                document.getElementById('shapeX').value = shape.x1;
                document.getElementById('shapeY').value = shape.y1;
            };
            var deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = function (e) {
                e.stopPropagation();
                shapes.splice(index, 1);
                updateShapeList();
                redrawCanvas();
            };
            listItem.appendChild(deleteButton);
            shapeListElement.appendChild(listItem);
            nonLineShapeIndex++;
        }
    });
}

function updateSelectedShape() {
    if (selectedShapeIndex >= 0 && selectedShapeIndex < shapes.length) {
        var shape = shapes[selectedShapeIndex];
        var newX = parseInt(document.getElementById('shapeX').value, 10);
        var newY = parseInt(document.getElementById('shapeY').value, 10);
        var deltaX = newX - shape.x1;
        var deltaY = newY - shape.y1;
        shape.x1 = newX;
        shape.y1 = newY;
        shape.x2 += deltaX;
        shape.y2 += deltaY;
        redrawCanvas();
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fillCanvasBackground();
    shapes = [];
    updateShapeList();
}

function exportToSvg() {
    var svgString = '<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">';
    shapes.forEach(function(shape) {
        if (shape.type === 'line') {
            svgString += `<line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" stroke="${shape.color}" stroke-width="${shape.lineWidth}" />`;
        } else if (shape.type === 'rectangle') {
            let width = shape.x2 - shape.x1;
            let height = shape.y2 - shape.y1;
            svgString += `<rect x="${shape.x1}" y="${shape.y1}" width="${width}" height="${height}" stroke="${shape.color}" stroke-width="${shape.lineWidth}" fill="none" />`;
        } else if (shape.type === 'ellipse') {
            let rx = Math.abs(shape.x2 - shape.x1);
            let ry = Math.abs(shape.y2 - shape.y1);
            svgString += `<ellipse cx="${shape.x1}" cy="${shape.y1}" rx="${rx}" ry="${ry}" stroke="${shape.color}" stroke-width="${shape.lineWidth}" fill="none" />`;
        }
    });
    svgString += '</svg>';
    var blob = new Blob([svgString], {type: "image/svg+xml"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'drawing.svg';
    a.click();
}

function applyBackgroundColor() {
    var bgColor = document.getElementById('backgroundColorPicker').value;
    canvas.style.backgroundColor = bgColor;
    redrawCanvas();
}

function exportWithBackground(format, filename) {
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    var tempCtx = tempCanvas.getContext('2d');
    var bgColor = canvas.style.backgroundColor || '#FFFFFF';
    tempCtx.fillStyle = bgColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    var image = tempCanvas.toDataURL(format);
    var link = document.createElement('a');
    link.href = image;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
