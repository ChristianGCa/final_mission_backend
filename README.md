# API Aeroflix

## [Front-end](https://github.com/Chris-Mathias/final-mission) do projeto.

# Instalando as dependências

- Primeiro, acesse a pasta do projeto:
`cd final-mission-backend`

- Instalar o Node.js e o npm:
`sudo apt install nodejs npm`

- Instalar o express:
`npm i express`

- Instalar o Prisma:
`npm install prisma --save-dev`

- Instalar o Cliente Prisma:
`npm install @prisma/client`

- Instalar o MongoDB:
`npm install mongodb`

- Instalar jsonwebtoken e bcryptjs para a autenticação e hashing de senhas:
`npm install jsonwebtoken bcryptjs`

- Instalar dotenv para carregar variáveis de ambiente de um arquivo .env para process.env, no Node.js:
`npm install dotenv`


# Instruções

- Crie um arquivo chamado ".env":
`touch .env`

- Abra o novo arquivo e adicione a url do banco em uma variável chamada DATABASE_URL, colocando o nome de usuário, a senha e o nome do banco:<p>
`DATABASE_URL="mongodb+srv://<USUARIO>:<SENHA>@aeroflix.suw3x.mongodb.net/NOME_DO_BANCO?retryWrites=true&w=majority&appName=aeroflix"`

- Adicione também outra variável chamada SECRET_KEY e atribua um código de autenticação:
`SECRET_KEY="senha"`

- Execute para importar o cliente Prisma:
`npx prisma generate`

- Execute para sincronizar os esquemas do prisma para o banco de dados:
`npx prisma db push`

## Rodar o back-end

Entre na pasta do servidor: `cd src`

Execute o servidor: `node server.js`

Para obter uma interface para o banco de dados, abra um novo terminal na pasta do projeto e execute: `npx prisma studio`

# Usando os métodos HTTP

## Criar usuário

POST -> http://localhost:3000/users

Exemplo de JSON no corpo da requisição:
`{
    "name": "Nome",
    "email": "a@email.com",
    "password": "senha",
    "profiles": [
        { "name": "Perfil 1" },
        { "name": "Perfil 2" }
    ]
}`

## Efetuar login

POST -> http://localhost:3000/login

JSON no corpo da requisição (Body):
`{
    "email": "a@email.com",
    "password": "senha",
}`

A API retornará um JSON contendo o Token de autenticação, que será necessário para o usuário fazer outras requisições:

{
    "token": "tokendeautenticacao123456789"
}

## Usando o Token

Podemos usar o Token, por exemplo, para obter o catálogo armazenado no banco de dados:

GET -> http://localhost:3000/catalog

No cabeçalho da requisição (Header):

No postman:

Key: Authorization  |  Value: Authorization:tokendeautenticacao123456789

Ou

`Authorization:tokendeautenticacao123456789`

A API retornará uma lista com todos os itens do catálogo.

## GET

OBS: Todos os métodos abaixo requerem um Token no cabeçalho.

- Obter todos os filmes e séries: GET http://localhost:3000/catalog
- Obter um filme/série  específico: GET http://localhost:3000/catalog?id=123
- Obter somente os filmes: GET http://localhost:3000/catalog?type=movie
- Obter somente as séries: GET http://localhost:3000/catalog?type=series

- Obter todos os usuários: GET http://localhost:3000/users
- Obter um usuário específico: GET http://localhost:3000/users?id=123

- Obter todos os perfis: GET http://localhost:3000/profiles
- Obter perfis de um usuário específico: GET http://localhost:3000/profiles?userId=123

## POST

- Criar um novo perfil: POST http://localhost:3000/profiles com corpo da requisição:
`{
  "name": "Perfil 3",
  "userId": 123
}`

## PUT

- Atualizar um usuário: PUT http://localhost:3000/users/123 com corpo da requisição:
`{
  "name": "João atualizado",
  "password": "senha123",
  "email": "joao@example.com",
  "profiles":[
    {
      "name": "Perfil 1 atualizado"
    },
    {
      "name": "Perfil 2 atualizado"
    }
  ]
}`

## DELETE

- Deletar um usuário: DELETE http://localhost:3000/users/123
- Deletar um perfil: DELETE http://localhost:3000/profiles/123
