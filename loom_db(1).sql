-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 03/10/2025 às 20:10
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `loom_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `atualizacoes`
--

CREATE TABLE `atualizacoes` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `id_leitura` int(11) NOT NULL,
  `conteudo` text DEFAULT NULL,
  `data_postagem` datetime DEFAULT current_timestamp(),
  `porcentagem_leitura` int(11) DEFAULT NULL,
  `id_usuario` int(11) NOT NULL,
  `gif_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `data_criacao` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `clubes`
--

CREATE TABLE `clubes` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `id_criador` int(11) NOT NULL,
  `visibilidade` enum('publico','privado') DEFAULT 'publico',
  `senha_acesso` varchar(255) DEFAULT NULL,
  `data_criacao` datetime DEFAULT current_timestamp(),
  `modelo` enum('hibrido','online','presencial') DEFAULT 'online',
  `leitura_atual` varchar(255) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `clube_categorias`
--

CREATE TABLE `clube_categorias` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `id_categoria` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `comentarios`
--

CREATE TABLE `comentarios` (
  `id` int(11) NOT NULL,
  `id_atualizacao` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `conteudo` text NOT NULL,
  `data_comentario` datetime DEFAULT current_timestamp(),
  `gif_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curtidas`
--

CREATE TABLE `curtidas` (
  `id` int(11) NOT NULL,
  `id_atualizacao` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `data_curtida` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `denuncias`
--

CREATE TABLE `denuncias` (
  `id` int(11) NOT NULL,
  `id_denunciante` int(11) NOT NULL,
  `id_denunciado` int(11) NOT NULL,
  `id_atualizacao` int(11) NOT NULL,
  `motivo` enum('spam','conteudo_inadequado','assedio','discurso_odio','outro') NOT NULL,
  `descricao` text DEFAULT NULL,
  `status` enum('pendente','analisada','rejeitada') DEFAULT 'pendente',
  `data_denuncia` datetime DEFAULT current_timestamp(),
  `data_analise` datetime DEFAULT NULL,
  `id_admin_analise` int(11) DEFAULT NULL,
  `observacoes_admin` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `encontros`
--

CREATE TABLE `encontros` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_encontro` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time DEFAULT NULL,
  `local` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `tipo` enum('presencial','online','hibrido') NOT NULL,
  `data_criacao` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `leituras`
--

CREATE TABLE `leituras` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `autor` varchar(255) DEFAULT NULL,
  `status` enum('atual','anterior') DEFAULT 'atual',
  `data_inicio` date DEFAULT NULL,
  `data_fim` date DEFAULT NULL,
  `paginas` int(11) DEFAULT NULL,
  `imagemUrl` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `opcoes_votacao`
--

CREATE TABLE `opcoes_votacao` (
  `id` int(11) NOT NULL,
  `id_votacao` int(11) NOT NULL,
  `id_sugestao` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `participacoes`
--

CREATE TABLE `participacoes` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `data_entrada` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `participantes_encontro`
--

CREATE TABLE `participantes_encontro` (
  `id` int(11) NOT NULL,
  `id_encontro` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `status` enum('confirmado','talvez','recusado') DEFAULT 'confirmado',
  `data_resposta` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `sugestoes`
--

CREATE TABLE `sugestoes` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `autor` varchar(255) DEFAULT NULL,
  `justificativa` text DEFAULT NULL,
  `data_sugestao` datetime DEFAULT current_timestamp(),
  `imagemUrl` varchar(255) DEFAULT NULL,
  `paginas` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('usuario','admin') DEFAULT 'usuario',
  `data_criacao` datetime DEFAULT current_timestamp(),
  `estado` enum('ativo','inativo','suspenso') DEFAULT 'ativo',
  `biografia` text DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT 'default-profile.jpg',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expira` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `votacoes`
--

CREATE TABLE `votacoes` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime NOT NULL,
  `encerrada` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `votos`
--

CREATE TABLE `votos` (
  `id` int(11) NOT NULL,
  `id_votacao` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_opcao` int(11) NOT NULL,
  `data_voto` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `atualizacoes`
--
ALTER TABLE `atualizacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `atualizacoes_ibfk_1` (`id_clube`),
  ADD KEY `atualizacoes_ibfk_2` (`id_leitura`),
  ADD KEY `atualizacoes_ibfk_3` (`id_usuario`);

--
-- Índices de tabela `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices de tabela `clubes`
--
ALTER TABLE `clubes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_criador` (`id_criador`);

--
-- Índices de tabela `clube_categorias`
--
ALTER TABLE `clube_categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_clube_categoria` (`id_clube`,`id_categoria`),
  ADD KEY `id_categoria` (`id_categoria`);

--
-- Índices de tabela `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_atualizacao` (`id_atualizacao`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Índices de tabela `curtidas`
--
ALTER TABLE `curtidas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_curtida` (`id_atualizacao`,`id_usuario`),
  ADD KEY `curtidas_ibfk_2` (`id_usuario`);

--
-- Índices de tabela `denuncias`
--
ALTER TABLE `denuncias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_denunciante` (`id_denunciante`),
  ADD KEY `id_denunciado` (`id_denunciado`),
  ADD KEY `id_atualizacao` (`id_atualizacao`),
  ADD KEY `id_admin_analise` (`id_admin_analise`);

--
-- Índices de tabela `encontros`
--
ALTER TABLE `encontros`
  ADD PRIMARY KEY (`id`),
  ADD KEY `encontros_ibfk_1` (`id_clube`);

--
-- Índices de tabela `leituras`
--
ALTER TABLE `leituras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leituras_ibfk_1` (`id_clube`);

--
-- Índices de tabela `opcoes_votacao`
--
ALTER TABLE `opcoes_votacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `opcoes_votacao_ibfk_1` (`id_votacao`),
  ADD KEY `opcoes_votacao_ibfk_2` (`id_sugestao`);

--
-- Índices de tabela `participacoes`
--
ALTER TABLE `participacoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participacao` (`id_usuario`,`id_clube`),
  ADD KEY `participacoes_ibfk_2` (`id_clube`);

--
-- Índices de tabela `participantes_encontro`
--
ALTER TABLE `participantes_encontro`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participante_encontro` (`id_encontro`,`id_usuario`),
  ADD KEY `participantes_encontro_ibfk_2` (`id_usuario`);

--
-- Índices de tabela `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Índices de tabela `sugestoes`
--
ALTER TABLE `sugestoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sugestoes_ibfk_1` (`id_clube`),
  ADD KEY `sugestoes_ibfk_2` (`id_usuario`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_reset_token` (`reset_token`);

--
-- Índices de tabela `votacoes`
--
ALTER TABLE `votacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `votacoes_ibfk_1` (`id_clube`);

--
-- Índices de tabela `votos`
--
ALTER TABLE `votos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_voto_usuario` (`id_votacao`,`id_usuario`),
  ADD KEY `votos_ibfk_2` (`id_usuario`),
  ADD KEY `votos_ibfk_3` (`id_opcao`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `atualizacoes`
--
ALTER TABLE `atualizacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `clubes`
--
ALTER TABLE `clubes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `clube_categorias`
--
ALTER TABLE `clube_categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curtidas`
--
ALTER TABLE `curtidas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `denuncias`
--
ALTER TABLE `denuncias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `encontros`
--
ALTER TABLE `encontros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `leituras`
--
ALTER TABLE `leituras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `opcoes_votacao`
--
ALTER TABLE `opcoes_votacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `participacoes`
--
ALTER TABLE `participacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `participantes_encontro`
--
ALTER TABLE `participantes_encontro`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `sugestoes`
--
ALTER TABLE `sugestoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `votacoes`
--
ALTER TABLE `votacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `votos`
--
ALTER TABLE `votos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `atualizacoes`
--
ALTER TABLE `atualizacoes`
  ADD CONSTRAINT `atualizacoes_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `atualizacoes_ibfk_2` FOREIGN KEY (`id_leitura`) REFERENCES `leituras` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `atualizacoes_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `clubes`
--
ALTER TABLE `clubes`
  ADD CONSTRAINT `clubes_ibfk_1` FOREIGN KEY (`id_criador`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `clube_categorias`
--
ALTER TABLE `clube_categorias`
  ADD CONSTRAINT `clube_categorias_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `clube_categorias_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`id_atualizacao`) REFERENCES `atualizacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `curtidas`
--
ALTER TABLE `curtidas`
  ADD CONSTRAINT `curtidas_ibfk_1` FOREIGN KEY (`id_atualizacao`) REFERENCES `atualizacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `curtidas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `denuncias`
--
ALTER TABLE `denuncias`
  ADD CONSTRAINT `denuncias_ibfk_1` FOREIGN KEY (`id_denunciante`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `denuncias_ibfk_2` FOREIGN KEY (`id_denunciado`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `denuncias_ibfk_3` FOREIGN KEY (`id_atualizacao`) REFERENCES `atualizacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `denuncias_ibfk_4` FOREIGN KEY (`id_admin_analise`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `encontros`
--
ALTER TABLE `encontros`
  ADD CONSTRAINT `encontros_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `leituras`
--
ALTER TABLE `leituras`
  ADD CONSTRAINT `leituras_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `opcoes_votacao`
--
ALTER TABLE `opcoes_votacao`
  ADD CONSTRAINT `opcoes_votacao_ibfk_1` FOREIGN KEY (`id_votacao`) REFERENCES `votacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `opcoes_votacao_ibfk_2` FOREIGN KEY (`id_sugestao`) REFERENCES `sugestoes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `participacoes`
--
ALTER TABLE `participacoes`
  ADD CONSTRAINT `participacoes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `participacoes_ibfk_2` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `participantes_encontro`
--
ALTER TABLE `participantes_encontro`
  ADD CONSTRAINT `participantes_encontro_ibfk_1` FOREIGN KEY (`id_encontro`) REFERENCES `encontros` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `participantes_encontro_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `sugestoes`
--
ALTER TABLE `sugestoes`
  ADD CONSTRAINT `sugestoes_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sugestoes_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `votacoes`
--
ALTER TABLE `votacoes`
  ADD CONSTRAINT `votacoes_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `votos`
--
ALTER TABLE `votos`
  ADD CONSTRAINT `votos_ibfk_1` FOREIGN KEY (`id_votacao`) REFERENCES `votacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `votos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `votos_ibfk_3` FOREIGN KEY (`id_opcao`) REFERENCES `opcoes_votacao` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
