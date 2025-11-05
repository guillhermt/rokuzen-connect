# Sistema de Gerenciamento de Atendimento - Rokuzen

[cite_start]Projeto de Extensão desenvolvido para os cursos de Ciência da Computação e Sistema da Informação do Instituto Mauá de Tecnologia (IMT)[cite: 1, 2].

[cite_start]Este projeto consiste em uma interface web responsiva e funcional [cite: 17] [cite_start]para otimizar a gestão de atendimento e recursos da empresa de massagem terapêutica Rokuzen[cite: 10, 19].

## 🎯 O Problema

[cite_start]A Rokuzen enfrentava um desafio significativo na gestão do fluxo de clientes que chegavam sem agendamento prévio[cite: 12]. [cite_start]A ausência de um sistema centralizado para visualizar a disponibilidade de recursos (salas, cadeiras, terapeutas) em tempo real gerava atrasos, confusão no atendimento e dificultava a otimização dos espaços[cite: 13, 14]. [cite_start]A equipe lidava manualmente com escalas e ocupação, impactando a eficiência operacional[cite: 15].

[cite_start]O problema central era a **falta de uma ferramenta centralizada para o gerenciamento dinâmico dos recursos e do atendimento presencial**[cite: 16].

## ✨ A Solução

[cite_start]O objetivo do projeto foi desenvolver uma aplicação web para uso interno que permite[cite: 17]:

* [cite_start]Visualizar em tempo real a ocupação dos postos de trabalho (salas de maca, cadeiras de quick massage, poltronas)[cite: 18].
* [cite_start]Exibir as escalas dos terapeutas e seu status (disponível/ocupado)[cite: 18].
* [cite_start]Controlar o início e o fim de cada sessão de massagem[cite: 18].
* [cite_start]Cadastrar clientes (Nome, Telefone, E-mail) para agendamento[cite: 43].
* [cite_start]Gerenciar diferentes perfis de usuário com permissões distintas (Master, Gerente, Recepção, Terapeuta)[cite: 45].

[cite_start]Com isso, a solução busca otimizar a gestão, reduzir conflitos, minimizar o tempo de espera e melhorar a eficiência operacional[cite: 19].

## 💻 Proposta Tecnológica

O sistema é uma aplicação full-stack, dividida em:

* **Front-End:** Interface web responsiva.
    * *(Ex: React.js, Vue.js, Angular, HTML5, CSS3)*
* **Back-End:** API para gerenciar as regras de negócio, sessões e usuários.
    * *(Ex: Node.js, Python, Java, C#)*
* **Banco de Dados:** Persistência dos dados de clientes, agendamentos e terapeutas.
    * *(Ex: PostgreSQL, MySQL, MongoDB)*

*(Nota: Substitua os exemplos pelas tecnologias específicas que vocês usaram)*

## 🚀 Como Executar o Projeto (Sugestão)

Siga estas instruções para configurar o ambiente de desenvolvimento local.

### Pré-requisitos

* Node.js (v18+)
* NPM ou Yarn
* Git
* Um SGBD (ex: PostgreSQL) em execução

### 1. Clonar o Repositório

```bash
git clone [URL_DO_SEU_REPOSITORIO_AQUI]
cd [NOME_DA_PASTA_DO_PROJETO]
