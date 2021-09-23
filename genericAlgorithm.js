const cliProgress = require("cli-progress");
const rouletteWheelSelection = require("roulette-wheel-selection");

function getRandomInt(min, max) {
   return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selection(population) {
   const selectedIndex = getRandomInt(0, population.length - 1);
   return population[selectedIndex];
}

function crossover(i1, i2) {
   const c1 = { data: [] };
   const c2 = { data: [] };

   i1.data.forEach((_, index) => {
      if (Math.random() >= 0.5) {
         c1.data.push(i1.data[index]);
         c2.data.push(i2.data[index]);
      } else {
         c1.data.push(i2.data[index]);
         c2.data.push(i1.data[index]);
      }
   });

   return { c1, c2 };
}

function mutate(i, createGenome, mutationRate) {
   const mutationFlag = i.data.map(() => Math.random() <= mutationRate);
   return {
      data: i.data.map((d, index) =>
         mutationFlag[index] ? createGenome() : d
      ),
   };
}

function getBestSolution(population) {
   return population.reduce(
      (best, i) => (!best || i.fit > best.fit ? i : best),
      null
   );
}

function compare(a, b) {
   if (a.fit > b.fit) {
      return -1;
   }
   if (a.fit < b.fit) {
      return 1;
   }
   return 0;
}

function geneticSolution({
   createGenome,
   genomeSize,
   initialPopulation,
   maxPopulation,
   numberChildrens,
   fitFunction,
   iterations,
   mutationRate,
   beta,
}) {
   let population = Array(initialPopulation)
      .fill(null)
      .map(() => {
         const data = Array(genomeSize)
            .fill(null)
            .map(() => createGenome());
         return {
            data,
            fit: fitFunction(data),
         };
      });

   const bestSolutions = Array(iterations).fill(null);

   const bar1 = new cliProgress.SingleBar(
      {
         format:
            "Genetic Algorithm Progress | {bar} " +
            "| {percentage}% | {value}/{total} Iterations | ETA: {eta}s | Fit: {fit}",
         barCompleteChar: "\u2588",
         barIncompleteChar: "\u2591",
         hideCursor: true,
      }
      // cliProgress.Presets.shades_classic
   );
   bar1.start(iterations, 0);

   for (let iteration = 0; iteration < iterations; iteration++) {
      const newPopulation = [];
      for (
         let children = 0;
         children < Math.round(numberChildrens / 2);
         children++
      ) {
         const i1 = selection(population);
         const i2 = selection(population);

         let { c1, c2 } = crossover(i1, i2);

         c1 = mutate(c1, createGenome, mutationRate);
         c2 = mutate(c2, createGenome, mutationRate);

         c1.fit = fitFunction(c1.data);

         if (!bestSolutions[iteration]) {
            bestSolutions[iteration] = c1;
         } else {
            if (c1.fit > bestSolutions[iteration].fit) {
               bestSolutions[iteration] = c1;
            }
         }

         c2.fit = fitFunction(c2.data);
         if (c2.fit > bestSolutions[iteration].fit) {
            bestSolutions[iteration] = c2;
         }

         newPopulation.push(c1);
         newPopulation.push(c2);
      }

      population.push(...newPopulation);
      population = population.sort(compare).slice(0, maxPopulation);
      bar1.update(iteration + 1, { fit: getBestSolution(population).fit });
   }
   bar1.stop();
   return { bestSolutions, bestSolution: getBestSolution(population) };
}

module.exports = { geneticSolution, getRandomInt };
