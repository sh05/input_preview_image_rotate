var deg = 0;

function imagePreview(event) {
  var file = event.target.files[0];
  var reader = new FileReader();
  var preview = document.getElementById("preview");
  var previewImage = document.getElementById("previewImage");
  var rotateButton = document.getElementById("rotateButton");
   
  if(previewImage != null) {
    preview.innerHTML = "";
    deg = 0;
  }

  reader.onload = function() {
    var img = document.createElement("img");
    img.setAttribute("src", reader.result);
    img.setAttribute("id", "previewImage");

    var btn = document.createElement("button");
    btn.innerHTML = "右回転";
    btn.setAttribute("type", 'button');
    btn.setAttribute("onclick", 'deg = deg + 90; document.getElementById("previewImage").style.transform = "rotate(" + deg + "deg)";')
    
    preview.appendChild(img);
    preview.appendChild(btn);
  };
 
  reader.readAsDataURL(file);
}
