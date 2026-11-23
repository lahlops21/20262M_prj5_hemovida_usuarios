-- HemoVida - MS4 (Usuarios). Banco: 20262M_prj5_hemovida_usuarios
-- Rode UMA vez, em qualquer cliente (Workbench, HeidiSQL, DBeaver), com o banco ja selecionado.
-- Depois confira com:  npm run prisma:check   (nao use "prisma migrate dev" neste projeto)

CREATE TABLE IF NOT EXISTS `usuario` (
  `usuario_id`            BIGINT(20)   NOT NULL AUTO_INCREMENT,
  `usuario_perfil`        ENUM('ADMIN','RECEPCAO','ENFERMAGEM','GESTOR_ESTOQUE','GESTOR_DEMANDA','DOADOR') NOT NULL,
  `usuario_nome_completo` VARCHAR(150) NULL,   -- doador: o nome fica no MS1

  -- Equipe interna (login por e-mail + senha)
  `usuario_email`         VARCHAR(200) NULL,
  `usuario_senha_hash`    VARCHAR(255) NULL,   -- hash bcrypt, nunca a senha
  `usuario_matricula`     VARCHAR(30)  NULL,

  -- Doador (login por CPF + data de nascimento, validada no MS1)
  `usuario_cpf`           CHAR(11)     NULL,

  -- Hospital do GESTOR_DEMANDA. Sem chave estrangeira: o hospital mora no banco do MS3.
  `usuario_hospital_id`   BIGINT(20)   NULL,

  `usuario_status`        TINYINT(1)   NOT NULL DEFAULT 1,   -- 1 ativo, 0 inativo
  `usuario_data_criacao`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `usuario_email_UNIQUE` (`usuario_email`),
  UNIQUE KEY `usuario_cpf_UNIQUE` (`usuario_cpf`),
  UNIQUE KEY `usuario_matricula_UNIQUE` (`usuario_matricula`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ATENCAO: nao ha CHECK de proposito. O banco da disciplina e MySQL 5.7, que le o CHECK
-- e IGNORA em silencio. A regra "doador tem CPF; equipe tem e-mail, senha e nome" e
-- validada na aplicacao (DTOs e service do MS4).
