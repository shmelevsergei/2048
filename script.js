import { Grid } from "./grid.js";
import { Tile } from "./tile.js";
import { controllers, buttonUp, buttonLeft, buttonRight, buttonDown, buttonStart, windowStart, buttonLoose, windowLoose } from "./controllers.js";

const gameBoard = document.querySelector('.game-board');
controllers.style.display = "none";

const grid = new Grid(gameBoard);
function generateGrid() {
   grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
   grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
   setupInputOnce();
}
generateGrid();

function setupInputOnce() {
   window.addEventListener("keydown", handleInput, { once: true });
}

function buttonStartClick() {
   buttonStart.addEventListener('click', () => {
      windowStart.classList.add('_show');
      gameBoard.style.display = "grid";
      controllers.style.display = "block";
   })
}
buttonStartClick();

function buttonLooseClick() {
   buttonLoose.addEventListener('click', () => {
      gameBoard.style.display = "grid";
      controllers.style.display = "block";
      location.reload();
      setTimeout(() => {
         windowLoose.classList.remove('_show');
      }, 2000);

   })
}

async function generateNewTile() {
   const newTile = new Tile(gameBoard);
   grid.getRandomEmptyCell().linkTile(newTile);

   if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
      await newTile.waitForAnimationEnd();
      controllers.style.display = "none";
      windowLoose.classList.add('_show');
      buttonLooseClick();
      return;
   }

   setupInputOnce();
}

buttonUp.addEventListener('click', () => {
   if (!canMoveUp()) {
      setupInputOnce();
      return;
   }
   moveUp();
   generateNewTile();

})
buttonLeft.addEventListener('click', () => {
   if (!canMoveLeft()) {
      setupInputOnce();
      return;
   }
   moveLeft();
   generateNewTile();
})
buttonRight.addEventListener('click', () => {
   if (!canMoveRight()) {
      setupInputOnce();
      return;
   }
   moveRight();
   generateNewTile();
})
buttonDown.addEventListener('click', () => {
   if (!canMoveDown()) {
      setupInputOnce();
      return;
   }
   moveDown();
   generateNewTile();
})


async function handleInput(event) {
   switch (event.key) {
      case "ArrowUp":
         if (!canMoveUp()) {
            setupInputOnce();
            return;
         }
         await moveUp();
         break;

      case "ArrowDown":
         if (!canMoveDown()) {
            setupInputOnce();
            return;
         }
         await moveDown();
         break;
      case "ArrowLeft":
         if (!canMoveLeft()) {
            setupInputOnce();
            return;
         }
         await moveLeft();
         break;
      case "ArrowRight":
         if (!canMoveRight()) {
            setupInputOnce();
            return;
         }
         await moveRight();
         break;
      default:
         setupInputOnce();
         return;
   }

   await generateNewTile();
}

async function moveUp() {
   await slideTiles(grid.cellsGroupedByColumn);
}

async function moveDown() {
   await slideTiles(grid.cellsGroupedByReversedColumn);
}

async function moveLeft() {
   await slideTiles(grid.cellsGroupedByRow);
}

async function moveRight() {
   await slideTiles(grid.cellsGroupedByReversedRow);
}

async function slideTiles(groupedCells) {
   const promises = [];

   groupedCells.forEach(group => slideTilesInGroup(group, promises));

   await Promise.all(promises);

   grid.cells.forEach(cell => {
      cell.hasTileForMerge() && cell.mergeTiles();
   })
}

function slideTilesInGroup(group, promises) {
   for (let i = 1; i < group.length; i++) {
      if (group[i].isEmpty()) {
         continue;
      }

      const cellWithTile = group[i];

      let targetCell;
      let j = i - 1;
      while (j >= 0 && group[j].canAccept(cellWithTile.linkedTile)) {
         targetCell = group[j];
         j--;
      }
      if (!targetCell) {
         continue;
      }

      promises.push(cellWithTile.linkedTile.waitForTransitionEnd());

      if (targetCell.isEmpty()) {
         targetCell.linkTile(cellWithTile.linkedTile);
      } else {
         targetCell.linkTileForMerge(cellWithTile.linkedTile);
      }

      cellWithTile.unLinkTile();
   }
}

function canMoveUp() {
   return canMove(grid.cellsGroupedByColumn);
}
function canMoveDown() {
   return canMove(grid.cellsGroupedByReversedColumn);
}
function canMoveLeft() {
   return canMove(grid.cellsGroupedByRow);
}
function canMoveRight() {
   return canMove(grid.cellsGroupedByReversedRow);
}

function canMove(groupedCells) {
   return groupedCells.some(group => canMoveInGroup(group));
}

function canMoveInGroup(group) {
   return group.some((cell, index) => {
      if (index === 0) {
         return false;
      }

      if (cell.isEmpty()) {
         return false;
      }

      const targetCell = group[index - 1];
      return targetCell.canAccept(cell.linkedTile);
   });
}