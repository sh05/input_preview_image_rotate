// https://egashira.jp/image-resize-before-upload
// 縮小する画像のサイズ
var maxWidth = 300;
var maxHeight = 300;
var deg = 0;

// ファイル選択
document.getElementById('file').addEventListener('change', resize);
// アップロード
document.getElementById('submit').addEventListener('click', upload);

function upload(e){
  e.preventDefault();

  var dataurl = document.getElementById('previewImage').src;
  var filename = document.getElementById('previewImage').getAttribute('alt');
  var blob = dataURLtoBlob(dataurl);
  var fd = new FormData();
  fd.append('image', blob, filename);
  fd.append('name', 'name')
  // ajax post
  var xhr = new XMLHttpRequest();

  xhr.open('POST', '/image');
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.send(fd);
  xhr.onload = function(){
    alert(xhr.responseText);
  }
}

function resize(e){
  var file = e.target.files[0];

  if (!file.type.match(/^image\/(png|jpeg|gif)$/)) return;

  var img = new Image();
  var reader = new FileReader();

  var previewImage = document.getElementById("previewImage");
  if(previewImage != null) {
    preview.innerHTML = "";
  }

  reader.onload = function(e) {
    var data = e.target.result;

    img.onload = function() {

      var iw = img.naturalWidth, ih = img.naturalHeight;
      var width = iw, height = ih;

      var orientation = 1;

      // ９０度回転など、縦横が入れ替わる場合には事前に最大幅、高さを入れ替えておく
      if (orientation > 4) {
        var tmpMaxWidth = maxWidth;
        maxWidth = maxHeight;
        maxHeight = tmpMaxWidth;
      }

      if(width > maxWidth || height > maxHeight) {
        var ratio = width/maxWidth;
        if(ratio <= height/maxHeight) {
          ratio = height/maxHeight;
        }
        width = Math.floor(img.width/ratio);
        height = Math.floor(img.height/ratio);
      }

      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      ctx.save();

      // EXIFのOrientation情報からCanvasを回転させておく
      transformCoordinate(canvas, width, height, orientation);

      var d = 1024; // size of tiling canvas
      var tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = tmpCanvas.height = d;
      var tmpCtx = tmpCanvas.getContext('2d');
      var dw = Math.ceil(d * width / iw);
      var dh = Math.ceil(d * height / ih);
      var sy = 0;
      var dy = 0;
      while (sy < ih) {
        var sx = 0;
        var dx = 0;
        while (sx < iw) {
          tmpCtx.clearRect(0, 0, d, d);
          tmpCtx.drawImage(img, -sx, -sy);
          // 何度もImageDataオブジェクトとCanvasの変換を行ってるけど、Orientation関連で仕方ない。本当はputImageDataであれば良いけどOrientation効かない
          var imageData = tmpCtx.getImageData(0, 0, d, d);
          var resampled = resample_hermite(imageData, d, d, dw, dh);
          ctx.drawImage(resampled, 0, 0, dw, dh, dx, dy, dw, dh);
          sx += d;
          dx += dw;
        }
        sy += d;
        dy += dh;
      }
      ctx.restore();
      tmpCanvas = tmpCtx = null;

      var displaySrc = ctx.canvas.toDataURL('image/jpeg', .9);
      var displayImg = document.createElement('img');
      displayImg.id = 'previewImage';
      displayImg.setAttribute('src', displaySrc);
      displayImg.setAttribute('alt', file.name);
      displayImg.setAttribute('style','max-width:90%;max-height:90%');

      var rotateButton = document.getElementById("rotateButton");
      var btn = document.createElement("button");
      btn.innerHTML = "右回転";
      btn.setAttribute("type", 'button');
      btn.setAttribute("onclick", 'rotateImage()')

      var preview = document.getElementById("preview");
      preview.appendChild(btn);
      preview.innerHTML += "<br>";
      preview.appendChild(displayImg);

    }
    img.src = data;
  }
  reader.readAsDataURL(file);
}

function rotateImage() {
  var img = document.getElementById("previewImage");
  var iw = img.naturalWidth, ih = img.naturalHeight;
  var width = iw, height = ih;

  var orientation = 6;

  // ９０度回転など、縦横が入れ替わる場合には事前に最大幅、高さを入れ替えておく
  var tmpMaxWidth = maxWidth;
  maxWidth = maxHeight;
  maxHeight = tmpMaxWidth;

  if(width > maxWidth || height > maxHeight) {
    var ratio = width/maxWidth;
    if(ratio <= height/maxHeight) {
      ratio = height/maxHeight;
    }
    width = Math.floor(img.width/ratio);
    height = Math.floor(img.height/ratio);
  }

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  ctx.save();

  // EXIFのOrientation情報からCanvasを回転させておく
  transformCoordinate(canvas, width, height, orientation);

  var d = 1024; // size of tiling canvas
  var tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = tmpCanvas.height = d;
  var tmpCtx = tmpCanvas.getContext('2d');
  var dw = Math.ceil(d * width / iw);
  var dh = Math.ceil(d * height / ih);
  var sy = 0;
  var dy = 0;
  while (sy < ih) {
    var sx = 0;
    var dx = 0;
    while (sx < iw) {
      tmpCtx.clearRect(0, 0, d, d);
      tmpCtx.drawImage(img, -sx, -sy);
      // 何度もImageDataオブジェクトとCanvasの変換を行ってるけど、Orientation関連で仕方ない。本当はputImageDataであれば良いけどOrientation効かない
      var imageData = tmpCtx.getImageData(0, 0, d, d);
      var resampled = resample_hermite(imageData, d, d, dw, dh);
      ctx.drawImage(resampled, 0, 0, dw, dh, dx, dy, dw, dh);
      sx += d;
      dx += dw;
    }
    sy += d;
    dy += dh;
  }
  ctx.restore();
  tmpCanvas = tmpCtx = null;

  var preview = document.getElementById("preview");
  var pastDisplayImg = document.getElementById("previewImage");

  var displaySrc = ctx.canvas.toDataURL('image/jpeg', .9);
  var displayImg = document.createElement('img');

  displayImg.id = 'previewImage';
  displayImg.setAttribute('src', displaySrc);
  displayImg.setAttribute('alt', pastDisplayImg.alt);
  displayImg.setAttribute('style','max-width:90%;max-height:90%');

  preview.removeChild(pastDisplayImg);
  preview.appendChild(displayImg);

}

function transformCoordinate(canvas, width, height, orientation) {
  if (orientation > 4) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }
  var ctx = canvas.getContext('2d');
  switch (orientation) {
    case 2:
      // horizontal flip
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      // 180 rotate left
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      break;
    case 4:
      // vertical flip
      ctx.translate(0, height);
      ctx.scale(1, -1);
      break;
    case 5:
      // vertical flip + 90 rotate right
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6:
      // 90 rotate right
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -height);
      break;
    case 7:
      // horizontal flip + 90 rotate right
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(width, -height);
      ctx.scale(-1, 1);
      break;
    case 8:
      // 90 rotate left
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-width, 0);
      break;
    default:
      break;
  }
}

function dataURLtoBlob(dataurl) {
  var bin = atob(dataurl.split("base64,")[1]);
  var len = bin.length;
  var barr = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    barr[i] = bin.charCodeAt(i);
  }
  return new Blob([barr], {
    type: 'image/jpeg',
  });
};

// hermite filterかけてジャギーを削除する
function resample_hermite(img, W, H, W2, H2){
  var canvas = document.createElement('canvas');
  canvas.width = W2;
  canvas.height = H2;
  var ctx = canvas.getContext('2d');
  var img2 = ctx.createImageData(W2, H2);
  var data = img.data;
  var data2 = img2.data;
  var ratio_w = W / W2;
  var ratio_h = H / H2;
  var ratio_w_half = Math.ceil(ratio_w/2);
  var ratio_h_half = Math.ceil(ratio_h/2);
  for(var j = 0; j < H2; j++){
    for(var i = 0; i < W2; i++){
      var x2 = (i + j*W2) * 4;
      var weight = 0;
      var weights = 0;
      var gx_r = 0, gx_g = 0,  gx_b = 0, gx_a = 0;
      var center_y = (j + 0.5) * ratio_h;
      for(var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++){
        var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
        var center_x = (i + 0.5) * ratio_w;
        var w0 = dy*dy;
        for(var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++){
          var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
          var w = Math.sqrt(w0 + dx*dx);
          if(w >= -1 && w <= 1){
            weight = 2 * w*w*w - 3*w*w + 1;
            if(weight > 0){
              dx = 4*(xx + yy*W);
              gx_r += weight * data[dx];
              gx_g += weight * data[dx + 1];
              gx_b += weight * data[dx + 2];
              gx_a += weight * data[dx + 3];
              weights += weight;
            }
          }
        }
      }
      data2[x2]       = gx_r / weights;
      data2[x2 + 1] = gx_g / weights;
      data2[x2 + 2] = gx_b / weights;
      data2[x2 + 3] = gx_a / weights;
    }
  }
  ctx.putImageData(img2, 0, 0);
  return canvas;
};
