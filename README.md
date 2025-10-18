# Projeto Integrador – Cloud Developing 2025/2

> CRUD simples + API Gateway + Lambda /report + RDS + CI/CD

**Grupo**:
1. 10428453 - Ana Clara Gierse Raymundo - Ifraestrutura AWS
2. 10428547 - Erica Gonçalves de Oliveira - responsabilidade
3. 10428459 - Luana Domingos Branco - responsabilidade
4. 10426310 - Victor Luiz de Sá Alves - responsabilidade

## 1. Visão geral
O domínio de negócio escolhido é um Catálogo de Receitas Culinárias.  
O sistema expõe uma API RESTful completa para gerenciar a entidade principal, a Receita, utilizando AWS


O CRUD (Create, Read, Update, Delete) é implementado através das seguintes rotas:

| Método | Rota             | Função                                      | Camada          |
|--------|------------------|---------------------------------------------|-----------------|
| GET    | /receitas        | Lista todas as receitas                     | Backend (Flask) |
| GET    | /receitas/<id>   | Retorna os detalhes de uma receita específica | Backend (Flask) |
| POST   | /receitas        | Cadastra uma nova receita                   | Backend (Flask) |
| PUT    | /receitas/<id>   | Atualiza uma receita existente              | Backend (Flask) |
| DELETE | /receitas/<id>   | Remove uma receita                          | Backend (Flask) |
| GET    | /report          | Retorna estatísticas de uso (ex: total de receitas) | AWS Lambda      |
## 2. Arquitetura

<img width="855" height="932" alt="image" src="https://github.com/user-attachments/assets/88939281-8f66-4764-9bea-05235d1177b0" />


 Camada            | Serviço AWS                 | Descrição Atualizada                                                                                                   | Requisito Principal                                                                 |
|--------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| **Backend**        | EC2 + Docker                | API REST em Python Flask (CRUD de Receitas) com Gunicorn. A imagem Docker é armazenada no ECR.                         | Containerizado (EC2 + Docker) e conectado ao RDS.                                   |
| **Banco de Dados** | Amazon RDS (PostgreSQL/MySQL) | Instância do banco de dados relacional para persistir os dados da entidade Receita.                                    | Instância em subnet privada; sem porta exposta à Internet.                          |
| **Gateway**        | Amazon API Gateway          | Ponto de entrada público único. Roteia rotas de CRUD (`/receitas/*`) para o Backend Flask e a rota `/report` para a Função Serverless. | Roteia todas as rotas CRUD → Backend. Cria rota `/report` → Lambda.                |
| **Função Serverless** | AWS Lambda               | Função Python que executa um `GET /receitas` na sua API (via API Gateway) e devolve estatísticas (ex: total de receitas, tempo médio de preparo). | Recebe `/report`, consome a API (HTTP) e devolve estatísticas JSON. Não acessa o RDS. |
| **CI/CD**          | CodePipeline + GitHub       | (Opcional) Fluxo automatizado: Push no GitHub → Build (CodeBuild) da imagem Python/Flask → Push da imagem para ECR → Deploy (CodeDeploy/EC2). | `push → build → ECR → deploy`. Pipeline descrita como IaC.                          |
## 3. Como rodar localmente

```bash
cp .env.example .env         # configure variáveis
docker compose up --build
# API em http://localhost:3000
