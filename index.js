const asciichart = require("asciichart");
const colors = require("colors/safe");
const axios = require("axios");
const { geneticSolution, getRandomInt } = require("./genericAlgorithm");
const Table = require("cli-table");
const process = require("process");
const fs = require("fs");

const config = require("./config.json");

// --------------

// https://github.com/bertoort/sugoku

async function generateSudoku() {
   const response = await axios.get(
      "https://sugoku.herokuapp.com/board?difficulty=random"
   );

   fs.writeFileSync("board.json", JSON.stringify(response.data.board));

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
               points = points + 2;
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

function printSudoku(sudoku, original) {
   const table = new Table();

   table.push(
      ...sudoku.map((line, lineIndex) =>
         line.map((item, columnIndex) => {
            if (original) {
               return item === original[lineIndex][columnIndex]
                  ? colors.gray(item)
                  : item;
            }
            return item === 0 ? " " : item;
         })
      )
   );

   return table.toString();
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

function printResults(sudoku, bestSolutions, bestSolution, fitFunction) {
   const sudokuSize = sudoku.length;

   const bestFits = bestSolutions.map((best) => best.fit);

   const sudokuPrinted = printSudoku(
      fillSudoku(sudoku, bestSolution.data),
      sudoku
   );
   const fit = fitFunction(bestSolution.data, false);

   const data = new Table();
   data.push([
      colors.inverse(`Best Solution - Fit: ${fit}`) +
         "\n" +
         sudokuPrinted +
         "\n" +
         `Expected FIT: ${sudokuSize * 4}`,
      asciichart.plot(reduceArray(bestFits, 150), { height: 20 }),
   ]);
   console.log(data.toString());
}

async function runGeneticAlgorithm() {
   const sudoku = JSON.parse(fs.readFileSync("board.json"));
   const sudokuSize = sudoku.length;

   const emptyFieldsCount = countEmptyFields(sudoku);
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
      ...config,
   });

   printResults(sudoku, bestSolutions, bestSolution, fitFunction);
}

async function run() {
   const shouldPrint = process.argv.find((arg) => arg === "--print");
   const shouldGenerate = process.argv.find((arg) => arg === "--generate");
   const shouldRun = process.argv.find((arg) => arg === "--run");

   if (shouldGenerate) {
      const sudoku = await generateSudoku();
      if (!shouldRun) {
         const sudokuPrinted = printSudoku(sudoku);
         console.log(sudokuPrinted);
      }
   }
   if (shouldPrint) {
      const sudoku = JSON.parse(fs.readFileSync("board.json"));
      const sudokuPrinted = printSudoku(sudoku);
      console.log(sudokuPrinted);
   }
   if (shouldRun) {
      await runGeneticAlgorithm();
   }
}

run();
