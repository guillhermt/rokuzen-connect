-- Cria o database
DROP DATABASE IF EXISTS rokuzen;

CREATE DATABASE IF NOT EXISTS rokuzen
CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

USE rokuzen;

-- Tabela unidades
CREATE TABLE unidades (
  unidade_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_unidade VARCHAR(150) NOT NULL,
  endereco VARCHAR(255),
  telefone VARCHAR(30),
  ativo CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'S/N',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (unidade_id),
  UNIQUE KEY ux_unidades_nome (nome_unidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela colaboradores
CREATE TABLE colaboradores (
  colaborador_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_colaborador VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  telefone VARCHAR(30),
  ativo CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'S/N',
  tipo_colaborador TINYINT NOT NULL COMMENT 'ex.: 1=admin,2=recepcao,3=terapeuta',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (colaborador_id),
  INDEX idx_colaboradores_tipo (tipo_colaborador),
  senha VARCHAR(255) NOT NULL,
  ultimo_login DATETIME,
  INDEX idx_colaboradores_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
select * from colaboradores;
-- Tabela clientes
CREATE TABLE clientes (
  cliente_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_cliente VARCHAR(200) NOT NULL,
  email_cliente VARCHAR(200),
  telefone_cliente VARCHAR(30),
  data_nascimento DATE,
  respostas_saude JSON NULL COMMENT 'campo JSON com perguntas/respostas de saúde (dor, pressao, gravidez, etc.)',
  primeiro_atendimento DATE NULL,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cliente_id),
  INDEX idx_clientes_email (email_cliente),
  INDEX idx_clientes_telefone (telefone_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela parceiros (opcional, pois atendimentos tem parceiro_id)
CREATE TABLE parceiros (
  parceiro_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_parceiro VARCHAR(200) NOT NULL,
  contato VARCHAR(200),
  ativo CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'S/N',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (parceiro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela pacotes (referenciada por atendimentos.pacote_id)
CREATE TABLE pacotes (
  pacote_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_pacote VARCHAR(200) NOT NULL,
  descricao TEXT,
  qtd_sessoes INT UNSIGNED DEFAULT 0,
  preco DECIMAL(10,2) DEFAULT 0.00,
  ativo CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'S/N',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (pacote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela servicos
CREATE TABLE servicos (
  servico_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  unidade_id BIGINT UNSIGNED NOT NULL,
  nome_servico VARCHAR(200) NOT NULL,
  descricao TEXT,
  duracao_minutos INT UNSIGNED DEFAULT 60,
  valor_padrao DECIMAL(10,2) DEFAULT 0.00,
  ativo CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'S/N',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (servico_id),
  INDEX idx_servicos_unidade (unidade_id),
  CONSTRAINT fk_servicos_unidades FOREIGN KEY (unidade_id) REFERENCES unidades(unidade_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela escalas
CREATE TABLE escalas (
  escala_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id BIGINT UNSIGNED NOT NULL,
  unidade_id BIGINT UNSIGNED NOT NULL,
  inicio_escala DATETIME NOT NULL,
  fim_escala DATETIME NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (escala_id),
  INDEX idx_escalas_colab (colaborador_id),
  INDEX idx_escalas_unidade (unidade_id),
  CONSTRAINT fk_escalas_colaborador FOREIGN KEY (colaborador_id) REFERENCES colaboradores(colaborador_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_escalas_unidade FOREIGN KEY (unidade_id) REFERENCES unidades(unidade_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela ponto_eletronico
CREATE TABLE ponto_eletronico (
  ponto_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  colaborador_id BIGINT UNSIGNED NOT NULL,
  unidade_id BIGINT UNSIGNED NOT NULL,
  entrada DATETIME,
  saida DATETIME,
  esta_presente CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'S/N',
  fez_recepcao CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'S/N',
  pontos_recepcao INT DEFAULT 0,
  cobriu_colega CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'S/N',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ponto_id),
  INDEX idx_ponto_colab (colaborador_id),
  INDEX idx_ponto_unidade (unidade_id),
  CONSTRAINT fk_ponto_colaborador FOREIGN KEY (colaborador_id) REFERENCES colaboradores(colaborador_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ponto_unidade FOREIGN KEY (unidade_id) REFERENCES unidades(unidade_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (esta_presente IN ('S','N')),
  CHECK (fez_recepcao IN ('S','N')),
  CHECK (cobriu_colega IN ('S','N'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela atendimentos
CREATE TABLE atendimentos (
  atendimento_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  unidade_id BIGINT UNSIGNED NOT NULL,
  cliente_id BIGINT UNSIGNED NOT NULL,
  servico_id BIGINT UNSIGNED NOT NULL,
  colaborador_id BIGINT UNSIGNED NOT NULL,
  parceiro_id BIGINT UNSIGNED NULL,
  inicio_atendimento DATETIME NOT NULL,
  fim_atendimento DATETIME NULL,
  valor_servico DECIMAL(10,2) DEFAULT 0.00,
  tipo_pagamento VARCHAR(50) DEFAULT NULL,
  observacao_cliente TEXT,
  foi_marcado_online CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'S/N',
  pacote_id BIGINT UNSIGNED NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (atendimento_id),
  INDEX idx_atend_unidade (unidade_id),
  INDEX idx_atend_cliente (cliente_id),
  INDEX idx_atend_servico (servico_id),
  INDEX idx_atend_colab (colaborador_id),
  INDEX idx_atend_inicio (inicio_atendimento),
  CONSTRAINT fk_atend_unidades FOREIGN KEY (unidade_id) REFERENCES unidades(unidade_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_atend_clientes FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_atend_servicos FOREIGN KEY (servico_id) REFERENCES servicos(servico_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_atend_colaboradores FOREIGN KEY (colaborador_id) REFERENCES colaboradores(colaborador_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_atend_parceiro FOREIGN KEY (parceiro_id) REFERENCES parceiros(parceiro_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_atend_pacote FOREIGN KEY (pacote_id) REFERENCES pacotes(pacote_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (foi_marcado_online IN ('S','N'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exemplo de view: atendimentos resumidos por dia/unidade
CREATE OR REPLACE VIEW vw_atendimentos_resumo_diario AS
SELECT
  DATE(a.inicio_atendimento) AS dia,
  a.unidade_id,
  COUNT(*) AS total_atendimentos,
  SUM(a.valor_servico) AS total_valor
FROM atendimentos a
GROUP BY DATE(a.inicio_atendimento), a.unidade_id;

CREATE TABLE postos (
  posto_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  unidade_id BIGINT UNSIGNED NOT NULL,
  nome_posto VARCHAR(100) NOT NULL,           -- ex: "Maca 1", "Quick 2", "Reflexo 1"
  tipo_posto ENUM('maca', 'quick', 'reflexo', 'consulta') NOT NULL DEFAULT 'maca',
  ativo CHAR(1) DEFAULT 'S',
  em_manutencao CHAR(1) DEFAULT 'N',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_posto_unidade 
    FOREIGN KEY (unidade_id) REFERENCES unidades(unidade_id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de horários disponíveis por posto (ou por unidade geral)
CREATE TABLE horarios (
  horario_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  unidade_id BIGINT UNSIGNED NOT NULL,
  posto_id BIGINT UNSIGNED NULL, -- NULL = horário geral da unidade | com valor = horário específico do posto
  terapeuta_id BIGINT UNSIGNED NULL, -- NULL = qualquer terapeuta pode usar
  dia_semana TINYINT NOT NULL COMMENT '0=Domingo, 1=Segunda ... 6=Sábado',
  horario TIME NOT NULL, -- ex: '09:00:00', '14:30:00'
  ativo CHAR(1) DEFAULT 'S',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_horario_unidade 
    FOREIGN KEY (unidade_id) REFERENCES unidades(unidade_id) ON DELETE CASCADE,
  CONSTRAINT fk_horario_posto 
    FOREIGN KEY (posto_id) REFERENCES postos(posto_id) ON DELETE CASCADE,
  CONSTRAINT fk_horario_terapeuta 
    FOREIGN KEY (terapeuta_id) REFERENCES colaboradores(colaborador_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índice para busca rápida
CREATE INDEX idx_horarios_unidade_dia ON horarios(unidade_id, dia_semana, ativo);

-- Índices compostos úteis (ex: busca por terapeuta em período)
CREATE INDEX idx_atend_colab_periodo ON atendimentos (colaborador_id, inicio_atendimento);

ALTER TABLE atendimentos 
ADD COLUMN posto_id BIGINT UNSIGNED NULL AFTER servico_id,
ADD CONSTRAINT fk_atend_posto 
  FOREIGN KEY (posto_id) REFERENCES postos(posto_id) 
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS postos (
  posto_id INT AUTO_INCREMENT PRIMARY KEY,
  unidade_id INT NOT NULL,
  nome_posto VARCHAR(100) NOT NULL,
  tipo_posto ENUM('maca', 'quick', 'reflexo', 'consulta') DEFAULT 'maca',
  em_manutencao CHAR(1) DEFAULT 'N',
  ativo CHAR(1) DEFAULT 'S',
  FOREIGN KEY (unidade_id) REFERENCES unidades(unidade_id)
);

ALTER TABLE postos 
ADD COLUMN colaborador_id BIGINT UNSIGNED NULL AFTER tipo_posto,
ADD INDEX idx_posto_colaborador (colaborador_id),
ADD CONSTRAINT fk_posto_colaborador 
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(colaborador_id) 
  ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
DELETE FROM colaboradores WHERE tipo_colaborador = 3;

INSERT INTO colaboradores
(nome_colaborador, email, telefone, tipo_colaborador, senha, ativo)
VALUES
('Administrador Geral', 'admin@sistema.com', '0000000000', 1, '$2b$10$D/MKubaWs0hLoLcv1paIg.duMpRVrcnU9Vwq8WLtrueea1d3ixGx6', 'S');