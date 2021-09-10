import numpy as np
import copy

def fit_sudoku(x):
  return sum(x**2)

# Seleciona indivíduos para cruzamento com método da roleta
def roulette_wheel_selection(p):
  c = np.cumsum(p)
  r = sum(p) * np.random.rand()
  ind = np.argwhere(r <= c)

  return ind[0][0]

# Executa operação de cruzamento usando dois indivíduos
def crossover(p1, p2):
  c1 = copy.deepcopy(p1)
  c2 = copy.deepcopy(p2)

  # Uniform crossover
  alpha = np.random.uniform(0, 1, *(c1['genes'].shape))
  print('OI', alpha)
  c1['genes'] = alpha*p1['genes'] + (1-alpha)*p2['genes']
  c2['genes'] = alpha*p2['genes'] + (1-alpha)*p1['genes']

  return c1, c2

# Executa mutação, parece ser em um ponto
def mutate(c, mu, sigma):
  # c: child chromosome
  # mu: mutation rate. % of gene to be modified
  # sigma: step size of mutation

  y = copy.deepcopy(c)
  flag = np.random.rand(*(c['genes'].shape)) <= mu  # array of True and Flase, indicating at which position to perform mutation
  ind = np.argwhere(flag)
  y['genes'][ind] += sigma * np.random.randn(*ind.shape)

  return y

# Define o min e max bound dos genes
def bounds(c, minGenes, maxGenes):
  c['genes'] = np.maximum(c['genes'], minGenes)
  c['genes'] = np.minimum(c['genes'], maxGenes)

# Ordena pelo fit
def sort(arr):
  n = len(arr)

  for i in range(n-1):

    for j in range(0, n-i-1):
            if arr[j]['fit'] > arr[j+1]['fit'] :
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

# Função que executa os passos do AG
# Recebe os parâmetos de execução
# Principais: função de avaliação, número de variáveis, limite inferior e superior dos valores das variáveis
# Número de gerações (maxit), número de indivíduos da população
def geneticSolution(fitFunction, numberGenes, minGenes, maxGenes, maxIterations, numberPopulation, numberChildren, mu, sigma, beta):

  # Cria a população inicial
  population = {}
  for i in range(numberPopulation):
    population[i] = {'genes': None, 'fit': None}

  # Inicia variaveis com melhor solução e fit 0
  bestSolution = copy.deepcopy(population)
  bestSolutionFit = 0

  # Inicializa população inicial - primeira geração - random
  # Calcula o fit e pega a melhor solução
  for i in range(numberPopulation):
      population[i]['genes'] = np.random.randint(minGenes, maxGenes, numberGenes)
      population[i]['fit'] = fitFunction(population[i]['genes'])

      if population[i]['fit'] > bestSolutionFit:
        bestSolution = copy.deepcopy(population[i])

  print(population)

  # Melhor fit de cada geração
  bestIterationFit = np.empty(maxIterations)

  # Loop de gerações
  for iteration in range(maxIterations):

    # Pega os fit da população, soma, faz uma média
    fits = []
    for i in range(len(population)):
      fits.append(population[i]['fit'])
    fits = np.array(fits)
    avg_fit = np.mean(fits)
    if avg_fit != 0:
      fits = fits/avg_fit

    probs = np.exp(beta*fits) # probabilidade exponencial ao fit

    # aqui cria nova populção
    for _ in range(numberChildren//2):                                            # we will be having two off springs for each crossover
                                                                                # hence divide number of children by 2
      # Seleciona dois indivíduos para cruzamento
      p1 = population[roulette_wheel_selection(probs)]
      p2 = population[roulette_wheel_selection(probs)]

      # Cruzamento de dois individuos
      c1, c2 = crossover(p1, p2)

      # Faz uma mutação genética
      c1 = mutate(c1, mu, sigma)
      c2 = mutate(c2, mu, sigma)
      print(c1, c2)

      # Apply bounds
      bounds(c1, minGenes, maxGenes)
      bounds(c2, minGenes, maxGenes)

      # calcula o fit dos filhos
      c1['fit'] = fitFunction(c1['genes'])
      c2['fit'] = fitFunction(c1['genes'])

      if c1['fit'] > bestSolutionFit:
        bestSolutionFit = c1['fit']
        bestSolution = copy.deepcopy(c1)

      if c2['fit'] > bestSolutionFit:
        bestSolutionFit = c2['fit']
        bestSolution = copy.deepcopy(c2)

    # Adiciona indivíduos na população e faz sort
    population[len(population)] = c1
    population[len(population)] = c2
    population = sort(population)

    # Pega o melhor fit da geração
    bestIterationFit[iteration] = bestSolutionFit

    # Show generation information
    # print('Iteration {}: Best Fit = {}'. format(iteration, bestIterationFit[iteration]))

  out = population
  bestSolution = bestSolution
  bestIterationFit = bestIterationFit
  return (out, bestSolution, bestIterationFit)


sudoku = [[3, None, 4, None],[None, 1, None, 2],[None, 4, None, 3],[2, None, 1, None]]

fitFunction = fit_sudoku
numberGenes = 10 # campos em branco no sudoku
minGenes = 1
maxGenes = 9

maxIterations = 1
numberPopulation = 20
beta = 1
propChildren = 1                                          # proportion of children to population
numberChildren = int(np.round(propChildren * numberPopulation/2)*2)   # making sure it always an even number
mu = 0.2                                                   # mutation rate 20%, 205 of 5 is 1, mutating 1 gene
sigma = 0.1                                                # step size of mutation


# Run GA
out = geneticSolution(fitFunction, numberGenes, minGenes, maxGenes, maxIterations, numberPopulation, numberChildren, mu, sigma, beta)
