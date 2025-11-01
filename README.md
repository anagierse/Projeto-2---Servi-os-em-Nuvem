# Projeto 2 – Serviços em Nuvem

> CRUD completo integrado à AWS (EC2 + RDS + API Gateway + Lambda + Jenkins CI/CD)

---

## Equipe

| RA | Nome | Responsabilidade |
|----|------|------------------|
| 10428453 | **Ana Clara Gierse Raymundo** | Infraestrutura AWS e Pipeline (CI/CD) |
| 10428547 | **Erica Gonçalves de Oliveira** | Desenvolvimento do Frontend |
| 10428459 | **Luana Domingos Branco** | Relatório e Edição do Vídeo |
| 10426310 | **Victor Luiz de Sá Alves** | Backend Flask e Função Lambda |

---

## 1. Introdução

O objetivo deste projeto é demonstrar a criação de uma aplicação **CRUD** integrada a diversos **serviços AWS**, incluindo:

- **EC2 (Docker Containers)** para Backend e Frontend  
- **RDS (PostgreSQL)** em subnet privada  
- **API Gateway** como ponto de entrada para a aplicação  
- **Lambda /report** para geração de estatísticas via consumo da API  
- **Pipeline CI/CD com Jenkins e CodeBuild** para automação do deploy  

O domínio escolhido foi o **gerenciamento de receitas**, com API REST em **Flask** e interface web em **Nginx**.


---

##  2. Arquitetura Geral do Sistema

### 🔹 Fluxos Principais
- **CRUD:** Usuário → EC2 (Frontend) → API Gateway → EC2 (Backend) → RDS (Privado)
- **Relatório:** API Gateway → Lambda `/report`
- **CI/CD:** GitHub → Jenkins Pipeline → CodeBuild → EC2

### 🗺️ Diagrama 
<img width="1164" height="152" alt="image" src="https://github.com/user-attachments/assets/bc5a696c-a719-4e1e-ac7c-64da5711b718" />


| Camada | Serviço AWS | Descrição | Requisito |
|--------|--------------|------------|------------|
| **Backend** | EC2 + Docker | API REST Flask (CRUD de Receitas) | Containerizado e conectado ao RDS |
| **Banco de Dados** | Amazon RDS (PostgreSQL) | Persistência dos dados das receitas | Subnet privada, sem porta pública |
| **Gateway** | API Gateway | Roteamento `/receitas/*` → Backend e `/report` → Lambda | Entrada pública única |
| **Lambda** | AWS Lambda (Python) | Gera estatísticas de receitas via API | Não acessa o banco diretamente |
| **CI/CD** | Jenkins + GitHub + CodeBuild | Pipeline automatizado de build e deploy | Deploy contínuo em EC2 |

---

## ☁️ 3. Infraestrutura AWS

### 🔸 3.1 VPC, Subnets e NAT
- **VPC:** `receitas-vpc-vpc`
- **Subnets Públicas:** `receitas-vpc-subnet-public1-us-east-1a` (com Internet Gateway)
- **Subnets Privadas:** `receitas-vpc-subnet-private1-us-east-1a`
- **NAT Gateway:** permite acesso da subnet privada à Internet para atualizações

### 🔸 3.2 Security Groups
**EC2 - Receitas**
- Porta 22 (SSH), 3000 (Backend), 8080 (Jenkins), 80 (Frontend), 5432 (RDS)  
- Source: `0.0.0.0/0`

**RDS - Receitas**
- Porta 5432 (PostgreSQL)
- Source: Security Group da EC2

### 🔸 3.3 Banco de Dados (RDS)
- Engine: **PostgreSQL**
- Porta: **5432**
- Acesso: apenas via EC2 (subnet privada)

### 🔸 3.4 EC2
- SO: **Ubuntu**
- Containers: Frontend (porta 80) e Backend (porta 3000)
- IP Público: **23.22.57.128**

### 🔸 3.5 API Gateway
- Rotas CRUD: `/receitas`, `/receitas/{id}`
- Rota `/report` → Lambda Function

### 🔸 3.6 Lambda /report
- Linguagem: **Python**
- Função: Consome a API `/receitas`, calcula estatísticas e retorna JSON.
- Exemplo de métricas:
  - Total de receitas
  - Tempo médio de preparo
  - Receita mais rápida e mais demorada
  - Distribuição por porções

---

## 4. Backend e Frontend

### ⚙️ Backend (Flask)
- Porta: **3000**
- Framework: **Flask + Gunicorn**
- Dependências:
  ```
  Flask
  gunicorn
  flask-cors
  psycopg2-binary
  ```

**Rotas:**

| Método | Rota | Função |
|--------|-------|---------|
| GET | `/receitas` | Lista todas as receitas |
| GET | `/receitas/<id>` | Retorna uma receita específica |
| POST | `/receitas` | Cria uma nova receita |
| PUT | `/receitas/<id>` | Atualiza uma receita |
| DELETE | `/receitas/<id>` | Remove uma receita |
| GET | `/report` | Retorna estatísticas (Lambda) |

### 🌐 Frontend (Nginx)
- Porta: **80**
- Baseado em Bootstrap + JavaScript
- Consome a API Gateway e a rota `/report` da Lambda
- Configuração Nginx:
  ```nginx
  server {
      listen 80;
      root /usr/share/nginx/html;
      index index.html;
      location / {
          try_files $uri $uri/ =404;
      }
  }
  ```

---

##  5. CI/CD com Jenkins

A pipeline foi configurada para **automatizar o build e o deploy** do sistema após cada push no GitHub. Jenikins está rodando na EC2 em um container docker.

### Etapas:
1. **Checkout:** Clona o repositório.
2. **Build:** Cria imagens Docker para Backend e Frontend.
3. **Deploy:** Remove containers antigos e inicia novos.
4. **Verificação:** Testa a API e o site via `curl`.

A pipeline está definida no arquivo `Jenkinsfile` e executa automaticamente em caso de sucesso.

---

## 6. Execução Local

```bash
# COnectar a EC2 através do ssh
cd ~/Projeto-2---Servi-os-em-Nuvem/Code

docker compose up --build -d
```

---

## 🏁 8. Conclusão

O projeto demonstra com sucesso a **integração entre múltiplos serviços AWS**, seguindo práticas de segurança e modularização.  
A arquitetura entregue mostra:
- Backend e Frontend containerizados;
- Banco de dados isolado em subnet privada;
- Gateway com roteamento e segurança configurados;
- Lambda Serverless operacional;
- Pipeline automatizado de deploy.

