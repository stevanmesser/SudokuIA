var asciichart = require ('asciichart')

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rouleteWhellSelection(population) {
  const selectedIndex = getRandomInt(0, population.length - 1)
  return population[selectedIndex]
}

function crossover(i1, i2) {
  const selectedIndex = getRandomInt(0, i1.data.length - 2)
  const c1 = {
    data: [
      ...i1.data.filter((_, index) => index <= selectedIndex),
      ...i2.data.filter((_, index) => index > selectedIndex)
    ]
  }
  const c2 = {
    data: [
      ...i2.data.filter((_, index) => index <= selectedIndex),
      ...i1.data.filter((_, index) => index > selectedIndex)
    ]
  }

  return {c1, c2}

}

function mutate(i, createGenome, mutationRate, sigma) {
  const selectedIndex = getRandomInt(0, i.data.length - 1)
  return {
    data: i.data.map((d, index) => index === selectedIndex ? createGenome() : d)
  }
}

function fitFunction(data) {
  return data.reduce((sum, i) => sum + i, 0)
}


function getBestSolution(population) {
  return population.reduce((best, i) => (!best || i.fit > best.fit) ? i : best, null)
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

function geneticSolution({ createGenome, genomeSize, numberPopulation, fitFunction, iterations, mutationRate, sigma, beta }) {
  let population = Array(numberPopulation)
    .fill(null)
    .map(() => {
      const data = Array(genomeSize).fill(null).map(() => createGenome())
      return {
        data,
        fit: fitFunction(data)
      }
    })

  const bestSolutions = Array(iterations).fill(null)

  for (let iteration = 0; iteration < iterations; iteration++) {

    // const sumFit = population.reduce((sum, { fit }) => sum + fit, 0)
    // const avgFit = sumFit / population.length
    // population.forEach(i => {
    //   i.prob = Math.exp(beta * (i.fit / avgFit))
    // })

    const newPopulation = []
    for (let children = 0; children < 10; children++) {
      const i1 = rouleteWhellSelection(population)
      const i2 = rouleteWhellSelection(population)

      let { c1, c2 } = crossover(i1, i2)

      c1 = mutate(c1, createGenome, mutationRate, sigma)
      c2 = mutate(c2, createGenome, mutationRate, sigma)

      c1.fit = fitFunction(c1.data)

      if (!bestSolutions[iteration]) {
        bestSolutions[iteration] = c1
      } else {
        if (c1.fit > bestSolutions[iteration].fit) {
          bestSolutions[iteration] = c1
        }
      }

      c2.fit = fitFunction(c2.data)
      if (c2.fit > bestSolutions[iteration].fit) {
        bestSolutions[iteration] = c2
      }

      newPopulation.push(c1)
      newPopulation.push(c2)
    }

    population.push(...newPopulation)
    population = population.sort(compare).slice(0, 100)
  }


  console.log(asciichart.plot(bestSolutions.map(best => best.fit)))
}

// --------------

const sudoku = [
  [3, null, 4, null],
  [null, 1, null, 2],
  [null, 4, null, 3],
  [2, null, 1, null]
]

const sudokuSize = sudoku.length

function createGenome() {
  return getRandomInt(1,sudokuSize)
}

geneticSolution({
  fitFunction,
  createGenome,
  genomeSize: sudokuSize * 2,
  numberPopulation: 50,
  iterations: 200,
  mutationRate: 0.2,
  sigma: 0.1,
  beta: 1,
})
