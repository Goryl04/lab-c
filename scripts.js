document.addEventListener("DOMContentLoaded", () => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission().then(() => {});
  }

  let map = L.map('map').setView([53.4285, 14.5528], 15);

  L.tileLayer.provider('Esri.WorldImagery', {
    crossOrigin: true
  }).addTo(map);

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

      userMarker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup("Your location")
        .openPopup();

    }, positionError => {
      console.error(positionError);
    });
  });

  document.getElementById("download_map").addEventListener("click", () => {
    const puzzlePieces = document.getElementById("puzzle");
    const puzzleBoard = document.getElementById("puzzle_solution");
    const rasterMap = /** @type {HTMLCanvasElement} */ (document.getElementById("rasterMap"));
    const rasterContext = rasterMap.getContext("2d");

    if (!rasterContext) {
      console.error("Canvas context error");
      return;
    }

    puzzlePieces.innerHTML = "";
    puzzleBoard.innerHTML = "";

    rasterMap.width = 400;
    rasterMap.height = 400;

    for (let i = 0; i < 16; i++) {
      const cell = document.createElement("div");
      cell.classList.add("puzzle-cell");
      cell.dataset.index = i.toString();
      cell.addEventListener("dragover", dragOver);
      cell.addEventListener("drop", drop);
      puzzleBoard.appendChild(cell);
    }

    leafletImage(map, function (err, canvas) {
      if (err) {
        console.error("Leaflet error:", err);
        return;
      }

      rasterContext.clearRect(0, 0, 400, 400);
      rasterContext.drawImage(canvas, 0, 0, 400, 400);

      const pieces = [];
      const pieceSize = 100;

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          let pCanvas = document.createElement("canvas");
          pCanvas.width = pieceSize;
          pCanvas.height = pieceSize;
          let pCtx = pCanvas.getContext("2d");

          pCtx.drawImage(
            rasterMap,
            col * pieceSize, row * pieceSize, pieceSize, pieceSize,
            0, 0, pieceSize, pieceSize
          );

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

      puzzlePieces.addEventListener("dragover", dragOver);
      puzzlePieces.addEventListener("drop", drop);
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
    const target = e.currentTarget;

    if (target.classList.contains("puzzle-cell")) {
      if (target.children.length === 0) {
        target.appendChild(draggedElement);
      } else {
        const existing = target.firstElementChild;
        target.removeChild(existing);
        target.appendChild(draggedElement);
        document.getElementById("puzzle").appendChild(existing);
      }
      verifyPuzzle();
    } else if (target.id === "puzzle") {
      target.appendChild(draggedElement);
      verifyPuzzle();
    }
  }

  function verifyPuzzle() {
    setTimeout(() => {
      const cells = document.querySelectorAll(".puzzle-cell");
      let correctCount = 0;
      let totalOnBoard = 0;

      cells.forEach(cell => {
        const piece = cell.firstElementChild;
        if (piece) {
          totalOnBoard++;
          if (cell.dataset.index === piece.dataset.correctIndex) {
            correctCount++;
          }
        }
      });
      console.debug(`Currently correct pieces: ${correctCount} / 16, on board: ${totalOnBoard}`);

      if (totalOnBoard === 16 && correctCount === 16) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Success!", { body: "You've completed the puzzle!" });
        } else {
          alert("Success! You've completed the puzzle!");
        }
      }
    }, 100);
  }
});
