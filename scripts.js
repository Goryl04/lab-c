document.addEventListener("DOMContentLoaded", () => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  let map = L.map('map').setView([53.4285, 14.5528], 15);
  L.tileLayer.provider('Esri.WorldImagery').addTo(map);
  let userMarker = null;

  document.getElementById("my_location").addEventListener("click", () => {
    if (!navigator.geolocation) {
      console.log("No geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;

      map.setView([lat, lon], 17);

      if (userMarker) {
        map.removeLayer(userMarker);
      }
      userMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup("Your location").openPopup();
    }, positionError => {
      console.error(positionError);
    });
  });
});

document.getElementById("download_map").addEventListener("click", () => {
  const puzzlePieces = document.getElementById("puzzle-pieces");
  const puzzleBoard = document.getElementById("puzzle-board");
  const rasterMap = document.getElementById("rasterMap");
  const rasterContext = rasterMap.getContext("2d");

  puzzlePieces.innerHTML = "";
  puzzleBoard.innerHTML = "";

  for(let i = 0; i < 16; i++) {
    const cell = document.createElement("div");
    cell.classList.add("puzzle-cell");
    cell.dataset.index = i;
    cell.addEventListener("dragover", dragOver);
    cell.addEventListener("drop", drop);
    puzzleBoard.appendChild(cell);
  }

  leafletImage(map, function(err, canvas) {
    if (err) {
      console.error("Error while generating the image: ", err);
      return;
    }


  })
})
