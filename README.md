# ✈️ Analisador de Conexões de Aeroportos

Projeto acadêmico desenvolvido para a disciplina de **Teoria de Grafos**, com o objetivo de representar a malha aérea brasileira por meio de um grafo dirigido e explorar algoritmos de busca de caminhos.

A aplicação possui uma interface web interativa que permite consultar rotas entre aeroportos, visualizar conexões no mapa e comparar caminhos com diferentes quantidades de escalas.

## 🚀 Funcionalidades

- **Busca de rotas:** pesquisa por cidade, nome do aeroporto ou código IATA.
- **Visualização interativa:** mapa com aeroportos e conexões aéreas.
- **Rotas diretas:** consulta de voos sem escalas.
- **Rotas com conexões:** identificação de caminhos entre aeroportos.
- **Limite de escalas:** opção para restringir a busca a voos diretos, até uma escala ou até duas escalas.
- **Filtro por companhia aérea:** seleção entre GOL, LATAM e Azul.
- **Rotas predefinidas:** exemplos de trajetos para facilitar a exploração.
- **Visualização do algoritmo:** animação do processo de busca e dos aeroportos visitados.
- **Detalhes dos aeroportos:** consulta de informações e voos diretos ao selecionar pontos no mapa.

## 🧠 Conceitos de Teoria de Grafos

O projeto utiliza os seguintes conceitos:

| Conceito | Aplicação |
|---|---|
| Vértices | Aeroportos identificados por seus códigos IATA |
| Arestas dirigidas | Voos de um aeroporto para outro |
| Caminhos | Sequências de voos que conectam origem e destino |
| Escalas | Aeroportos intermediários percorridos em uma rota |
| Busca em largura (BFS) | Exploração de caminhos com menor número de arestas, quando utilizada pelo algoritmo |
| Dijkstra | Busca de caminhos de menor custo acumulado, quando configurada com pesos |

Um grafo é **dirigido** porque a existência de um voo de A para B não implica necessariamente a existência de um voo equivalente de B para A.

> **Observação:** o resultado de uma rota depende das conexões disponíveis, dos filtros selecionados e dos critérios implementados na aplicação.

## 🛠️ Tecnologias utilizadas

- **HTML5:** estrutura da interface.
- **CSS3:** estilos, layout responsivo e efeitos visuais.
- **JavaScript:** lógica da aplicação, interações e visualização dos algoritmos.
- **SVG:** representação gráfica do mapa e das conexões entre aeroportos.

## 📁 Estrutura do projeto

A aplicação utiliza os seguintes arquivos principais:

| Arquivo | Descrição |
|---|---|
| `index.html` | Estrutura principal da página |
| `style.css` | Estilos da interface |
| `dados.js` | Dados dos aeroportos e das conexões |
| `algoritmos.js` | Implementação dos algoritmos de busca e caminhos |
| `app.js` | Interações da interface e renderização dos resultados |

## ▶️ Como executar

1. Clone este repositório ou baixe os arquivos do projeto.
2. Mantenha os arquivos HTML, CSS e JavaScript na mesma pasta, respeitando a estrutura esperada pelos imports e referências.
3. Abra o arquivo `index.html` em um navegador moderno.

Para uma execução local mais consistente, você também pode iniciar um servidor HTTP na pasta do projeto:

```bash
python -m http.server 8000
```

Depois, acesse:

`http://localhost:8000`

## 🎓 Objetivo acadêmico

O projeto busca demonstrar, de forma visual e interativa, como estruturas de grafos e algoritmos de busca podem ser aplicados à análise de conexões aéreas.

Além da implementação dos conceitos de Teoria de Grafos, a aplicação explora a representação visual de dados e a interação do usuário com os resultados dos algoritmos.

## 👥 Autores

- Guilherme Belém
- Gabriel Fontes
- João Victor Camargo
- Leonardo Seiiji Sakoda Sassaki

---

Projeto acadêmico — **Engenharia de Computação | Teoria de Grafos**.
