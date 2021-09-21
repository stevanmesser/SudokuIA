const asciichart = require("asciichart");
const axios = require("axios");
const { geneticSolution, getRandomInt } = require("./genericAlgorithm");
const Table = require("cli-table");

// --------------

// https://github.com/bertoort/sugoku

async function generateSudoku() {
   const response = await axios.get(
      "https://sugoku.herokuapp.com/board?difficulty=random"
   );
   return response.data.board;
}

// const sudoku = [
//   [3, null, 4, null],
//   [null, 1, null, 2],
//   [null, 4, null, 3],
//   [2, null, 1, null]
// ]

function fillSudoku(sudoku, resolution) {
   let index = -1;
   return sudoku.map((line) =>
      line.map((item) => {
         if (!item) {
            index++;
            return resolution[index];
         }
         return item;
      })
   );
}

function createFitFunction(sudoku) {
   return (resolution, log = false) => {
      const data = fillSudoku(sudoku, resolution);

      const sudokuSize = data.length;
      const nroQuad = Math.sqrt(data.length);

      let points = 0;

      // linha - horizontal
      for (let i = 0; i < sudokuSize; i++) {
         const line = data[i];

         let lineOK = true;

         for (let j = 0; j < sudokuSize; j++) {
            const hasRepeated = line.find(
               (item, index) => item === line[j] && index !== j
            );
            if (hasRepeated) {
               lineOK = false;
               break;
            }
         }

         if (log) {
            console.log(`Line ${i}: ${lineOK}`);
         }

         if (lineOK) points++;
      }

      // coluna - vertical
      for (let i = 0; i < sudokuSize; i++) {
         const column = data[i];

         let columnOK = true;

         for (let j = 0; j < sudokuSize; j++) {
            for (let k = 0; k < sudokuSize; k++) {
               if ((column[j] === column[k]) & (j !== k)) {
                  columnOK = false;
                  break;
               }
            }
         }

         if (log) {
            console.log(`Column ${i}: ${columnOK}`);
         }

         if (columnOK) points++;
      }

      // quadrantes
      for (let i = 0; i < nroQuad; i++) {
         const lineExp = nroQuad * i;

         for (let j = 0; j < nroQuad; j++) {
            const columnExp = nroQuad * j;

            const alreadyUsed = [];

            for (let k = 0; k < nroQuad; k++) {
               for (let l = 0; l < nroQuad; l++) {
                  const item = data[lineExp + k][columnExp + l];
                  alreadyUsed.push(item);
               }
            }

            const hasDuplicated = alreadyUsed.find((item1, index1) => {
               return alreadyUsed.find((item2, index2) => {
                  return item1 === item2 && index1 !== index2;
               });
            });

            if (log) {
               console.log(
                  `Quadrant ${lineExp} - ${columnExp}: ${!hasDuplicated}`
               );
            }

            if (!hasDuplicated) {
               points = points + 2.5;
            }
         }
      }

      return points;
   };
}

function countEmptyFields(sudoku) {
   return sudoku.reduce((sum, line) => {
      return (
         sum +
         line.reduce((sumLine, column) => (!column ? sumLine + 1 : sumLine), 0)
      );
   }, 0);
}

function printSudoku(sudoku) {
   return sudoku.reduce((sum, line) => {
      return (
         sum +
         line.reduce((sumLine, column) => (!column ? sumLine + 1 : sumLine), 0)
      );
   }, 0);
}

function printSudoku(sudoku) {
   const table = new Table();

   table.push(...sudoku);

   console.log(table.toString());
}

function chunkArray(myArray, chunk_size) {
   var index = 0;
   var arrayLength = myArray.length;
   var tempArray = [];

   for (index = 0; index < arrayLength; index += chunk_size) {
      myChunk = myArray.slice(index, index + chunk_size);
      // Do something if you want with the group
      tempArray.push(myChunk);
   }

   return tempArray;
}

function reduceArray(array, newSize) {
   const returnArray = [];
   const valuesToSum = array.length / newSize;
   for (let i = 0; i < array.length; i += valuesToSum) {
      let sum = 0;
      let j;
      let start_i = Math.floor(i);
      for (
         j = start_i;
         j < Math.min(start_i + valuesToSum, array.length);
         j++
      ) {
         sum += array[j];
      }
      returnArray.push(sum / (j - start_i));
   }
   return returnArray;
}

async function process() {
   const sudoku = await generateSudoku();

   const emptyFieldsCount = countEmptyFields(sudoku);
   const sudokuSize = sudoku.length;
   const fitFunction = createFitFunction(sudoku);

   function createGenome() {
      return getRandomInt(1, sudokuSize);
   }
   fitFunction(
      Array(emptyFieldsCount)
         .fill(null)
         .map(() => createGenome())
   );

   const { bestSolutions, bestSolution } = geneticSolution({
      fitFunction: createFitFunction(sudoku),
      createGenome,
      genomeSize: emptyFieldsCount,
      numberPopulation: 5000,
      iterations: 50000,
      mutationRate: 0.2,
      sigma: 0.1,
      beta: 1,
   });

   printSudoku(fillSudoku(sudoku, bestSolution.data));
   const fit = fitFunction(bestSolution.data, true);
   console.log(fit);

   const bestFits = bestSolutions.map((best) => best.fit);
   const chunks = chunkArray(bestFits, 100);
   console.log(
      asciichart.plot(reduceArray(bestFits, 200), { height: 20 }) + "\n"
   );
}

process();
