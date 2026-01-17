const Joi = require('joi');

/**
 * Schemas de validação para entrada de dados
 * Use em rotas para validar req.body
 */

// Senha forte: mín 8 chars, maiúscula, minúscula, número, caractere especial
const schemaSenha = Joi.string()
  .min(8)
  .max(50)
  .pattern(/[A-Z]/, 'deve conter letra maiúscula')
  .pattern(/[a-z]/, 'deve conter letra minúscula')
  .pattern(/[0-9]/, 'deve conter número')
  .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'deve conter caractere especial')
  .required()
  .messages({
    'string.pattern.base': 'Senha fraca: {#label}',
    'string.min': 'Senha deve ter pelo menos 8 caracteres',
    'any.required': 'Senha é obrigatória'
  });

/**
 * Schema para login
 */
const schemaLogin = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório'
    }),
  senha: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha é obrigatória'
    })
});

/**
 * Schema para criação de usuário
 */
const schemaCriarUsuario = Joi.object({
  nome: Joi.string()
    .min(3)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Nome deve ter pelo menos 3 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório'
    }),
  senha: schemaSenha,
  confirmarSenha: Joi.string()
    .valid(Joi.ref('senha'))
    .required()
    .messages({
      'any.only': 'Senhas não correspondem',
      'any.required': 'Confirmação de senha é obrigatória'
    }),
  telefone: Joi.string()
    .pattern(/^\d{10,11}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Telefone deve ter 10 ou 11 dígitos'
    }),
  cpf: Joi.string()
    .pattern(/^\d{11}$/)
    .optional()
    .messages({
      'string.pattern.base': 'CPF deve ter 11 dígitos'
    }),
  descricao: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Descrição deve ter no máximo 500 caracteres'
    })
});

/**
 * Schema para atualizar usuário
 */
const schemaAtualizarUsuario = Joi.object({
  nome: Joi.string()
    .min(3)
    .max(100)
    .trim()
    .optional(),
  telefone: Joi.string()
    .pattern(/^\d{10,11}$/)
    .optional(),
  descricao: Joi.string()
    .max(500)
    .optional(),
  novaSenha: Joi.when('senhaAtual', {
    is: Joi.exist(),
    then: schemaSenha.required(),
    otherwise: schemaSenha.optional()
  }),
  senhaAtual: Joi.string()
    .optional(),
  confirmarSenha: Joi.when('novaSenha', {
    is: Joi.exist(),
    then: Joi.string()
      .valid(Joi.ref('novaSenha'))
      .required()
      .messages({
        'any.only': 'Senhas não correspondem'
      }),
    otherwise: Joi.string().optional()
  })
});

/**
 * Schema para reset de senha
 */
const schemaResetSenha = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório'
    })
});

/**
 * Schema para confirmar novo password (após reset)
 */
const schemaConfirmarSenha = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token é obrigatório'
    }),
  novaSenha: schemaSenha,
  confirmarSenha: Joi.string()
    .valid(Joi.ref('novaSenha'))
    .required()
    .messages({
      'any.only': 'Senhas não correspondem',
      'any.required': 'Confirmação de senha é obrigatória'
    })
});

/**
 * Schema para clube
 */
const schemaCriaClubes = Joi.object({
  nome: Joi.string()
    .min(3)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Nome deve ter pelo menos 3 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
  descricao: Joi.string()
    .max(1000)
    .optional(),
  genero: Joi.string()
    .valid('Ficção', 'Romance', 'Mistério', 'Fantasia', 'Tecnologia', 'Histórico', 'Poesia', 'Outro')
    .required()
    .messages({
      'any.required': 'Gênero é obrigatório',
      'any.only': 'Gênero inválido'
    }),
  privado: Joi.boolean()
    .default(false),
  imagem: Joi.string()
    .uri()
    .optional()
});

/**
 * Schema para atualização/post
 */
const schemaCriaAtualizacao = Joi.object({
  conteudo: Joi.string()
    .min(1)
    .max(5000)
    .trim()
    .required()
    .messages({
      'string.min': 'Conteúdo não pode estar vazio',
      'string.max': 'Conteúdo muito longo (máx 5000 caracteres)',
      'any.required': 'Conteúdo é obrigatório'
    }),
  imagem: Joi.string()
    .uri()
    .optional(),
  gifUrl: Joi.string()
    .uri()
    .optional()
});

/**
 * Schema para comentário
 */
const schemaCriaComentario = Joi.object({
  idAtualizacao: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'ID da atualização é obrigatório'
    }),
  conteudo: Joi.string()
    .min(1)
    .max(1000)
    .trim()
    .required()
    .messages({
      'string.min': 'Comentário não pode estar vazio',
      'string.max': 'Comentário muito longo',
      'any.required': 'Comentário é obrigatório'
    }),
  gifUrl: Joi.string()
    .uri()
    .optional()
});

/**
 * Schema para denúncia
 */
const schemaCriaDenuncia = Joi.object({
  idAtualizacao: Joi.number()
    .integer()
    .positive()
    .required(),
  motivo: Joi.string()
    .valid(
      'Conteúdo ofensivo',
      'Spam',
      'Conteúdo sexual',
      'Violência',
      'Incitação ao ódio',
      'Fraude',
      'Outro'
    )
    .required()
    .messages({
      'any.required': 'Motivo é obrigatório',
      'any.only': 'Motivo inválido'
    }),
  descricao: Joi.string()
    .max(1000)
    .optional()
});

/**
 * Schema para mensagem de chat
 */
const schemaCriaChat = Joi.object({
  clubeId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'ID do clube é obrigatório'
    }),
  mensagem: Joi.string()
    .min(1)
    .max(1000)
    .trim()
    .required()
    .messages({
      'string.min': 'Mensagem não pode estar vazia',
      'string.max': 'Mensagem muito longa',
      'any.required': 'Mensagem é obrigatória'
    })
});

/**
 * Middleware de validação
 * @param {Joi.ObjectSchema} schema - Schema Joi para validar
 * @returns {Function} Middleware Express
 */
function validar(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const erros = error.details.map(detail => ({
        campo: detail.path.join('.'),
        mensagem: detail.message
      }));

      return res.status(400).json({
        erro: 'Dados inválidos',
        detalhes: erros
      });
    }

    // Substituir req.body por valores validados
    req.body = value;
    next();
  };
}

/**
 * Middleware de validação para query params
 */
function validarQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const erros = error.details.map(detail => ({
        campo: detail.path.join('.'),
        mensagem: detail.message
      }));

      return res.status(400).json({
        erro: 'Parâmetros inválidos',
        detalhes: erros
      });
    }

    req.query = value;
    next();
  };
}

/**
 * Middleware de validação para params
 */
function validarParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const erros = error.details.map(detail => ({
        campo: detail.path.join('.'),
        mensagem: detail.message
      }));

      return res.status(400).json({
        erro: 'Parâmetros inválidos',
        detalhes: erros
      });
    }

    req.params = value;
    next();
  };
}

module.exports = {
  // Schemas
  schemaLogin,
  schemaCriarUsuario,
  schemaAtualizarUsuario,
  schemaResetSenha,
  schemaConfirmarSenha,
  schemaCriaClubes,
  schemaCriaAtualizacao,
  schemaCriaComentario,
  schemaCriaDenuncia,
  schemaCriaChat,
  schemaSenha,

  // Middlewares
  validar,
  validarQuery,
  validarParams
};
