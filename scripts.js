document.addEventListener("DOMContentLoaded", () => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission().then();
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
    cell.dataset.index = i.toString();
    cell.addEventListener("dragover", dragOver);
    cell.addEventListener("drop", drop);
    puzzleBoard.appendChild(cell);
  }

  leafletImage(map, function(err, canvas) {
    if (err) {
      console.error("Error while generating the image: ", err);
      return;
    }

    rasterContext.clearRect(0, 0, rasterMap.width, rasterMap.height);
    rasterContext.drawImage(canvas, 0, 0, 400, 400);
    const pieces = [];
    const pieceSize = 100;

    for(let row = 0; row < 4; row++) {
      for(let col = 0; col < 4; col++) {
        let pCanvas = document.createElement("canvas");
        pCanvas.width = pieceSize;
        pCanvas.height = pieceSize;
        let pCtx = pCanvas.getContext("2d");

        pCtx.drawImage(
          rasterMap,
          col * pieceSize, row * pieceSize, pieceSize, pieceSize,
          0, 0, pieceSize, pieceSize);

        let piece = document.createElement("img");
        piece.src = pCanvas.toDataURL();
        piece.classList.add("puzzle-piece");
        piece.draggable = true;
        piece.id = `piece-${row * 4 + col}`;
        piece.dataset.correctIndex = (row * 4 + col).toString();
        piece.addEventListener("dragstart", dragStart);
        pieces.push(piece);
      }
    }
    pieces.sort(() => Math.random() - 0.5);
    pieces.forEach(p => puzzlePieces.appendChild(p));
  });
});

let draggedElement = null;

function dragStart(e) {
  draggedElement = e.target;
  e.dataTransfer.setData("text/plain", e.target.id);
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  const cell = e.currentTarget;
  if(cell.classList.contains("puzzle-cell") && cell.children.length === 0) {
    cell.appendChild(draggedElement);
    verifyPuzzle();
  }
}

function verifyPuzzle() {
  const cells = document.querySelectorAll(".puzzle-cell");
  let correctCount = 0;
  cells.forEach(cell => {
    const piece = cell.firstElementChild;
    if (piece && cell.dataset.index === piece.dataset.correctIndex) {
      correctCount++;
    }
  });

  console.debug(`Currently correct pieces: ${correctCount} / 16`);

  if (correctCount === 16) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Success!", {body: "You've completed the puzzle!"});
    } else {
      alert("Success! You've completed the puzzle!");
    }
  }
}
