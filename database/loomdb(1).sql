-- phpMyAdmin SQL Dump
-- version 4.7.7
-- https://www.phpmyadmin.net/
--
-- Host: 186.202.152.94
-- Generation Time: 03-Set-2025 às 23:08
-- Versão do servidor: 5.7.32-35-log
-- PHP Version: 5.6.40-0+deb8u12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `loomdb`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `atualizacoes`
--

CREATE TABLE `atualizacoes` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `id_leitura` int(11) NOT NULL,
  `conteudo` text,
  `data_postagem` datetime DEFAULT CURRENT_TIMESTAMP,
  `porcentagem_leitura` int(11) DEFAULT NULL,
  `id_usuario` int(11) NOT NULL,
  `gif_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Extraindo dados da tabela `atualizacoes`
--

INSERT INTO `atualizacoes` (`id`, `id_clube`, `id_leitura`, `conteudo`, `data_postagem`, `porcentagem_leitura`, `id_usuario`, `gif_url`) VALUES
(35, 28, 27, 'acho ela muito bruta', '2025-08-05 10:48:38', 16, 4, NULL),
(36, 28, 27, 'lalalaal', '2025-08-05 11:24:43', 45, 4, NULL),
(37, 28, 27, 'Deus me ajude', '2025-08-05 11:50:58', 65, 4, 'https://media3.giphy.com/media/v1.Y2lkPTI3MWY2ODNkNG4yeDh5aWxma2NxNGRjNzE5Y2MwbThnOTViMW9zdnRjYnk2a3o2MyZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/IfxYeZAuWv1mpvAapz/200w.webp'),
(38, 28, 27, 'teste horário kkkkk', '2025-08-07 19:24:59', 16, 4, 'https://media2.giphy.com/media/v1.Y2lkPTI3MWY2ODNkNXFsdTdhdXB0d3N1NjluaWdrZ3JtcjEybXVzcW55ejdyZWR2ZHJuMCZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/NsZbrSS0miha0/200w.webp'),
(39, 28, 27, 'teste horário 2', '2025-08-07 21:34:34', 16, 4, 'https://media2.giphy.com/media/v1.Y2lkPTI3MWY2ODNka2xtcmZ4OTlvNTNhczlibnM2MDI2c2hiOHRlMjB6eTd4MWt1bWlnOCZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/citBl9yPwnUOs/200w.webp'),
(40, 28, 27, 'teste horário 2', '2025-08-07 22:33:15', 26, 4, NULL),
(41, 28, 27, 'teste pwa', '2025-08-12 19:00:44', 39, 4, 'https://media1.giphy.com/media/v1.Y2lkPTI3MWY2ODNkeGtiaTY3cXF3OWhkbnljbmNndGRlcnJzY2J0N2I0ajgwbGlsZnBucSZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/D2uKBGqHYGH8sdWvWI/200w.webp'),
(42, 28, 27, 'hghghgfhgfh', '2025-08-21 17:59:30', 18, 4, 'https://media2.giphy.com/media/v1.Y2lkPTI3MWY2ODNkZWVpamE5ZDA1d2ljd3Byb2VqcDZ5N3J2Yzl4YmRsNHZ6NjdycW84YSZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/xKJistFJVl34D4BE7m/200w.webp'),
(43, 28, 27, 'teste emoção', '2025-08-31 16:31:46', 16, 4, 'https://media1.giphy.com/media/v1.Y2lkPTI3MWY2ODNkdmJseWdoaWl1NW84Z2UydXRiMnFwNDdibzh6Z3E1dmcyMW11YmJ3OSZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/QxSSrQxSKaFECD7ywx/200w.webp'),
(44, 28, 27, 'lalala teste formulários', '2025-09-02 22:06:24', 65, 4, 'https://media0.giphy.com/media/v1.Y2lkPTI3MWY2ODNkNnl0cDlwdWh2YjRnN3hvdjRhajhicHh0bWVvajF2OTczazY1ZnJweCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/yovOUEWBV2R46yrQ0B/200w.webp');

-- --------------------------------------------------------

--
-- Estrutura da tabela `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Extraindo dados da tabela `categorias`
--

INSERT INTO `categorias` (`id`, `nome`, `data_criacao`) VALUES
(8, 'Ficção', '2025-06-03 15:45:33'),
(9, 'teste banca', '2025-06-03 17:51:02'),
(10, 'Terror', '2025-06-17 11:16:47'),
(11, 'lalalala', '2025-06-17 13:03:20');

-- --------------------------------------------------------

--
-- Estrutura da tabela `clubes`
--

CREATE TABLE `clubes` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text,
  `id_criador` int(11) NOT NULL,
  `visibilidade` enum('publico','privado') DEFAULT 'publico',
  `senha_acesso` varchar(255) DEFAULT NULL,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `modelo` enum('hibrido','online','presencial') DEFAULT 'online',
  `leitura_atual` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Extraindo dados da tabela `clubes`
--

INSERT INTO `clubes` (`id`, `nome`, `descricao`, `id_criador`, `visibilidade`, `senha_acesso`, `data_criacao`, `modelo`, `leitura_atual`) VALUES
(28, 'teste dev', 'teste desenvolvedor', 4, 'privado', 'dev', '2025-08-05 10:12:11', 'online', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `clube_categorias`
--

CREATE TABLE `clube_categorias` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `id_categoria` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Extraindo dados da tabela `clube_categorias`
--

INSERT INTO `clube_categorias` (`id`, `id_clube`, `id_categoria`) VALUES
(30, 28, 9);

-- --------------------------------------------------------

--
-- Estrutura da tabela `comentarios`
--

CREATE TABLE `comentarios` (
  `id` int(11) NOT NULL,
  `id_atualizacao` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `conteudo` text COLLATE latin1_general_ci NOT NULL,
  `gif_url` varchar(500) COLLATE latin1_general_ci DEFAULT NULL,
  `data_comentario` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Extraindo dados da tabela `comentarios`
--

INSERT INTO `comentarios` (`id`, `id_atualizacao`, `id_usuario`, `conteudo`, `gif_url`, `data_comentario`) VALUES
(6, 36, 4, 'esqueci... a autora é argentina', NULL, '2025-08-05 11:25:09'),
(7, 40, 4, 'testee', NULL, '2025-08-07 23:15:31'),
(8, 40, 4, 'comentário teste', NULL, '2025-08-07 23:15:51'),
(9, 41, 4, 'lalalalala', NULL, '2025-08-12 19:00:54'),
(10, 41, 4, 'hghghghg', NULL, '2025-08-21 17:51:01');

-- --------------------------------------------------------

--
-- Estrutura da tabela `curtidas`
--

CREATE TABLE `curtidas` (
  `id` int(11) NOT NULL,
  `id_atualizacao` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `data_curtida` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Extraindo dados da tabela `curtidas`
--

INSERT INTO `curtidas` (`id`, `id_atualizacao`, `id_usuario`, `data_curtida`) VALUES
(26, 36, 4, '2025-08-05 11:28:50'),
(27, 41, 4, '2025-08-12 19:01:03');

-- --------------------------------------------------------

--
-- Estrutura da tabela `denuncias`
--

CREATE TABLE `denuncias` (
  `id` int(11) NOT NULL,
  `id_denunciante` int(11) NOT NULL,
  `id_denunciado` int(11) NOT NULL,
  `id_atualizacao` int(11) NOT NULL,
  `motivo` enum('spam','conteudo_inadequado','assedio','discurso_odio','outro') COLLATE latin1_general_ci NOT NULL,
  `descricao` text COLLATE latin1_general_ci,
  `status` enum('pendente','analisada','rejeitada') COLLATE latin1_general_ci DEFAULT 'pendente',
  `data_denuncia` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_analise` datetime DEFAULT NULL,
  `id_admin_analise` int(11) DEFAULT NULL,
  `observacoes_admin` text COLLATE latin1_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `encontros`
--

CREATE TABLE `encontros` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `titulo` varchar(255) COLLATE latin1_general_ci NOT NULL,
  `descricao` text COLLATE latin1_general_ci,
  `data_encontro` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time DEFAULT NULL,
  `local` varchar(255) COLLATE latin1_general_ci DEFAULT NULL,
  `link` varchar(255) COLLATE latin1_general_ci DEFAULT NULL,
  `tipo` enum('presencial','online','hibrido') COLLATE latin1_general_ci NOT NULL,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Extraindo dados da tabela `encontros`
--

INSERT INTO `encontros` (`id`, `id_clube`, `titulo`, `descricao`, `data_encontro`, `hora_inicio`, `hora_fim`, `local`, `link`, `tipo`, `data_criacao`) VALUES
(8, 28, 'tfgfgfg', 'tfgfgfghgjhgfjgjfj', '2025-08-22', '18:30:00', '21:52:00', NULL, 'https:// youtu.be', 'online', '2025-08-21 17:53:08');

-- --------------------------------------------------------

--
-- Estrutura da tabela `leituras`
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Extraindo dados da tabela `leituras`
--

INSERT INTO `leituras` (`id`, `id_clube`, `titulo`, `autor`, `status`, `data_inicio`, `data_fim`, `paginas`, `imagemUrl`) VALUES
(27, 28, 'Mandíbula', 'Mónica Ojeda', 'atual', '2025-08-06', NULL, 309, 'http://books.google.com/books/content?id=JIXbDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api');

-- --------------------------------------------------------

--
-- Estrutura da tabela `opcoes_votacao`
--

CREATE TABLE `opcoes_votacao` (
  `id` int(11) NOT NULL,
  `id_votacao` int(11) NOT NULL,
  `id_sugestao` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Extraindo dados da tabela `opcoes_votacao`
--

INSERT INTO `opcoes_votacao` (`id`, `id_votacao`, `id_sugestao`) VALUES
(12, 6, 9),
(13, 6, 8),
(14, 7, 8),
(15, 7, 10),
(16, 7, 9);

-- --------------------------------------------------------

--
-- Estrutura da tabela `participacoes`
--

CREATE TABLE `participacoes` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `data_entrada` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Extraindo dados da tabela `participacoes`
--

INSERT INTO `participacoes` (`id`, `id_usuario`, `id_clube`, `data_entrada`) VALUES
(23, 4, 28, '2025-08-05 10:12:11'),
(24, 17, 28, '2025-08-31 16:26:45');

-- --------------------------------------------------------

--
-- Estrutura da tabela `participantes_encontro`
--

CREATE TABLE `participantes_encontro` (
  `id` int(11) NOT NULL,
  `id_encontro` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `status` enum('confirmado','talvez','recusado') COLLATE latin1_general_ci DEFAULT 'confirmado',
  `data_resposta` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Extraindo dados da tabela `participantes_encontro`
--

INSERT INTO `participantes_encontro` (`id`, `id_encontro`, `id_usuario`, `status`, `data_resposta`) VALUES
(10, 8, 4, 'confirmado', '2025-08-21 17:53:09');

-- --------------------------------------------------------

--
-- Estrutura da tabela `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Extraindo dados da tabela `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('60OCxG9THB4zcTitSXGj2JsPCzkWCMVd', 1756952717, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-09-04T02:25:12.252Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":12,\"userType\":\"usuario\",\"authenticated\":true,\"email\":\"monaetiago@gmail.com\"}');

-- --------------------------------------------------------

--
-- Estrutura da tabela `sugestoes`
--

CREATE TABLE `sugestoes` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(255) COLLATE latin1_general_ci NOT NULL,
  `autor` varchar(255) COLLATE latin1_general_ci DEFAULT NULL,
  `justificativa` text COLLATE latin1_general_ci,
  `imagemUrl` varchar(255) COLLATE latin1_general_ci DEFAULT NULL,
  `paginas` int(11) DEFAULT NULL,
  `data_sugestao` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Extraindo dados da tabela `sugestoes`
--

INSERT INTO `sugestoes` (`id`, `id_clube`, `id_usuario`, `titulo`, `autor`, `justificativa`, `imagemUrl`, `paginas`, `data_sugestao`) VALUES
(8, 28, 4, 'El ABC de los tomates', 'Markus Wolf', 'tem nome de comida', 'https://books.google.com/books/content?id=PK9lEQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 240, '2025-08-05 10:50:40'),
(9, 28, 4, 'What to Do When I\'m Gone', 'Suzy Hopkins', 'um lindo livro', 'https://books.google.com/books/content?id=-_daEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 146, '2025-08-05 11:26:25'),
(10, 28, 4, 'A Bíblia Sagrada - Vol. II', 'Johannes Biermanski', 'yffhgfhfhfh', 'https://books.google.com/books/content?id=DtGtDQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 408, '2025-08-21 17:52:14');

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('usuario','admin') DEFAULT 'usuario',
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('ativo','inativo','suspenso') DEFAULT 'ativo',
  `biografia` text,
  `foto_perfil` varchar(255) DEFAULT 'default-profile.jpg',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expira` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Extraindo dados da tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `tipo`, `data_criacao`, `estado`, `biografia`, `foto_perfil`, `reset_token`, `reset_token_expira`) VALUES
(1, 'Administrador', 'admin@loom.com', '$2b$10$YyImAmnQU8ozALP3p6pyY.1gykg0Dgi3w4w60d7p.e6AH/2jhD6.O', 'admin', '2025-04-11 00:10:06', 'ativo', NULL, 'default-profile.jpg', NULL, NULL),
(4, 'Lívia Faleiro', 'faleirolivia.s@gmail.com', '$2b$10$3N40egm5OWhO4xs3GClAjuGGxhuZ3pcNLKR3J/eov4./q4Idqtu2O', 'usuario', '2025-04-11 00:20:37', 'ativo', 'lalalalala', 'https://res.cloudinary.com/dhz1cbipj/image/upload/v1754276473/loom_perfil/user-4-1754276473570.jpg', 'b17dac165f2d1e87cbc333d574fe1d390b814a2dc21dee3b8b47bd8345c710aa', '2025-09-03 00:38:20'),
(10, 'Carla', 'cbalestro@gmail.com', '123car', 'usuario', '2025-05-20 18:40:46', 'ativo', NULL, 'default-profile.jpg', NULL, NULL),
(11, 'Usuário Teste', 'usuarioteste@gmail.com', 'lilalola@123', 'usuario', '2025-05-26 14:33:02', 'ativo', NULL, 'default-profile.jpg', NULL, NULL),
(12, 'Monalisa de Oliveira Santos ', 'monaetiago@gmail.com', '$2b$10$wot8/r0jFY7ulnXn8EvtWeyaACLHK1gGcOq93O1/RBaykaa28ZJfO', 'usuario', '2025-07-24 15:29:42', 'ativo', NULL, 'default-profile.jpg', NULL, NULL),
(13, 'Giovana Cantú', 'giovanacantu9@gmail.com', 'gi123456', 'usuario', '2025-08-04 14:09:20', 'ativo', NULL, 'https://res.cloudinary.com/dhz1cbipj/image/upload/v1754327457/loom_perfil/user-13-1754327457646.jpg', NULL, NULL),
(14, 'Emilly ', 'emillygomesdasilva567@gmail.com', 'emi1243', 'usuario', '2025-08-13 13:10:40', 'ativo', NULL, 'default-profile.jpg', NULL, NULL),
(15, 'grdrfgfdgfdg', 'teste@gmail.com', 'lilalola123', 'usuario', '2025-08-21 18:00:51', 'ativo', NULL, 'default-profile.jpg', NULL, NULL),
(16, 'TesteDev', 'devv@gmail.com', 'lilalola', 'usuario', '2025-08-25 19:28:49', 'ativo', NULL, 'default-profile.jpg', NULL, NULL),
(17, 'moisiFraise', '02150200@aluno.canoas.ifrs.edu.br', 'lilalola123', 'usuario', '2025-08-31 12:58:53', 'ativo', NULL, 'default-profile.jpg', NULL, NULL),
(18, 'Francisco Assis Nascimento', 'francisco.nascimento@canoas.ifrs.edu.br', 'assis2010', 'usuario', '2025-09-01 10:47:57', 'ativo', NULL, 'default-profile.jpg', NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `votacoes`
--

CREATE TABLE `votacoes` (
  `id` int(11) NOT NULL,
  `id_clube` int(11) NOT NULL,
  `titulo` varchar(255) COLLATE latin1_general_ci NOT NULL,
  `descricao` text COLLATE latin1_general_ci,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime NOT NULL,
  `encerrada` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Extraindo dados da tabela `votacoes`
--

INSERT INTO `votacoes` (`id`, `id_clube`, `titulo`, `descricao`, `data_inicio`, `data_fim`, `encerrada`) VALUES
(6, 28, 'gfhfdhgfhdfh', 'fdhfdhfdhfdh', '2025-08-21 17:54:23', '2025-08-23 00:00:00', 1),
(7, 28, 'gdfgfdgfd', 'fdgfdgfdg', '2025-09-01 10:50:39', '2025-09-03 00:00:00', 0);

-- --------------------------------------------------------

--
-- Estrutura da tabela `votos`
--

CREATE TABLE `votos` (
  `id` int(11) NOT NULL,
  `id_votacao` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_opcao` int(11) NOT NULL,
  `data_voto` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Extraindo dados da tabela `votos`
--

INSERT INTO `votos` (`id`, `id_votacao`, `id_usuario`, `id_opcao`, `data_voto`) VALUES
(10, 6, 4, 13, '2025-08-21 17:54:33'),
(11, 7, 4, 14, '2025-09-01 10:50:51');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `atualizacoes`
--
ALTER TABLE `atualizacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_clube` (`id_clube`),
  ADD KEY `id_leitura` (`id_leitura`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indexes for table `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Indexes for table `clubes`
--
ALTER TABLE `clubes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_criador` (`id_criador`);

--
-- Indexes for table `clube_categorias`
--
ALTER TABLE `clube_categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_clube_categoria` (`id_clube`,`id_categoria`),
  ADD KEY `id_categoria` (`id_categoria`);

--
-- Indexes for table `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_atualizacao` (`id_atualizacao`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indexes for table `curtidas`
--
ALTER TABLE `curtidas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_curtida` (`id_atualizacao`,`id_usuario`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indexes for table `denuncias`
--
ALTER TABLE `denuncias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_denunciante` (`id_denunciante`),
  ADD KEY `id_denunciado` (`id_denunciado`),
  ADD KEY `id_atualizacao` (`id_atualizacao`),
  ADD KEY `id_admin_analise` (`id_admin_analise`);

--
-- Indexes for table `encontros`
--
ALTER TABLE `encontros`
  ADD PRIMARY KEY (`id`),
  ADD KEY `encontros_ibfk_1` (`id_clube`);

--
-- Indexes for table `leituras`
--
ALTER TABLE `leituras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_clube` (`id_clube`);

--
-- Indexes for table `opcoes_votacao`
--
ALTER TABLE `opcoes_votacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `opcoes_votacao_ibfk_1` (`id_votacao`),
  ADD KEY `opcoes_votacao_ibfk_2` (`id_sugestao`);

--
-- Indexes for table `participacoes`
--
ALTER TABLE `participacoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participacao` (`id_usuario`,`id_clube`),
  ADD KEY `participacoes_ibfk_2` (`id_clube`);

--
-- Indexes for table `participantes_encontro`
--
ALTER TABLE `participantes_encontro`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participante_encontro` (`id_encontro`,`id_usuario`),
  ADD KEY `participantes_encontro_ibfk_2` (`id_usuario`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `sugestoes`
--
ALTER TABLE `sugestoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sugestoes_ibfk_1` (`id_clube`),
  ADD KEY `sugestoes_ibfk_2` (`id_usuario`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_reset_token` (`reset_token`);

--
-- Indexes for table `votacoes`
--
ALTER TABLE `votacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `votacoes_ibfk_1` (`id_clube`);

--
-- Indexes for table `votos`
--
ALTER TABLE `votos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_voto_usuario` (`id_votacao`,`id_usuario`),
  ADD KEY `votos_ibfk_2` (`id_usuario`),
  ADD KEY `votos_ibfk_3` (`id_opcao`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `atualizacoes`
--
ALTER TABLE `atualizacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `clubes`
--
ALTER TABLE `clubes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `clube_categorias`
--
ALTER TABLE `clube_categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `curtidas`
--
ALTER TABLE `curtidas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `denuncias`
--
ALTER TABLE `denuncias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `encontros`
--
ALTER TABLE `encontros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `leituras`
--
ALTER TABLE `leituras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `opcoes_votacao`
--
ALTER TABLE `opcoes_votacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `participacoes`
--
ALTER TABLE `participacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `participantes_encontro`
--
ALTER TABLE `participantes_encontro`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `sugestoes`
--
ALTER TABLE `sugestoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `votacoes`
--
ALTER TABLE `votacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `votos`
--
ALTER TABLE `votos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Limitadores para a tabela `atualizacoes`
--
ALTER TABLE `atualizacoes`
  ADD CONSTRAINT `atualizacoes_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `atualizacoes_ibfk_2` FOREIGN KEY (`id_leitura`) REFERENCES `leituras` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `atualizacoes_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `clubes`
--
ALTER TABLE `clubes`
  ADD CONSTRAINT `clubes_ibfk_1` FOREIGN KEY (`id_criador`) REFERENCES `usuarios` (`id`);

--
-- Limitadores para a tabela `clube_categorias`
--
ALTER TABLE `clube_categorias`
  ADD CONSTRAINT `clube_categorias_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `clube_categorias_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`id_atualizacao`) REFERENCES `atualizacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `curtidas`
--
ALTER TABLE `curtidas`
  ADD CONSTRAINT `curtidas_ibfk_1` FOREIGN KEY (`id_atualizacao`) REFERENCES `atualizacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `curtidas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `denuncias`
--
ALTER TABLE `denuncias`
  ADD CONSTRAINT `denuncias_ibfk_1` FOREIGN KEY (`id_denunciante`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `denuncias_ibfk_2` FOREIGN KEY (`id_denunciado`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `denuncias_ibfk_3` FOREIGN KEY (`id_atualizacao`) REFERENCES `atualizacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `denuncias_ibfk_4` FOREIGN KEY (`id_admin_analise`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `encontros`
--
ALTER TABLE `encontros`
  ADD CONSTRAINT `encontros_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `leituras`
--
ALTER TABLE `leituras`
  ADD CONSTRAINT `leituras_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `opcoes_votacao`
--
ALTER TABLE `opcoes_votacao`
  ADD CONSTRAINT `opcoes_votacao_ibfk_1` FOREIGN KEY (`id_votacao`) REFERENCES `votacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `opcoes_votacao_ibfk_2` FOREIGN KEY (`id_sugestao`) REFERENCES `sugestoes` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `participacoes`
--
ALTER TABLE `participacoes`
  ADD CONSTRAINT `participacoes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `participacoes_ibfk_2` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `participantes_encontro`
--
ALTER TABLE `participantes_encontro`
  ADD CONSTRAINT `participantes_encontro_ibfk_1` FOREIGN KEY (`id_encontro`) REFERENCES `encontros` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `participantes_encontro_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `sugestoes`
--
ALTER TABLE `sugestoes`
  ADD CONSTRAINT `sugestoes_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sugestoes_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `votacoes`
--
ALTER TABLE `votacoes`
  ADD CONSTRAINT `votacoes_ibfk_1` FOREIGN KEY (`id_clube`) REFERENCES `clubes` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `votos`
--
ALTER TABLE `votos`
  ADD CONSTRAINT `votos_ibfk_1` FOREIGN KEY (`id_votacao`) REFERENCES `votacoes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `votos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `votos_ibfk_3` FOREIGN KEY (`id_opcao`) REFERENCES `opcoes_votacao` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
