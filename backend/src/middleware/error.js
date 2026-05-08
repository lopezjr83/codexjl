export const notFound = (req, res) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  console.error('[ErrorHandler]', err?.name, '|', err?.message);
  console.error(err?.stack || err);
  if (res.headersSent) return next(err);

  // Mongoose validation error
  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({ message: 'Error de validación', details });
  }

  // Mongoose cast error (e.g. invalid ObjectId)
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: `Valor inválido para campo: ${err.path}` });
  }

  // MongoDB duplicate key
  if (err?.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({ message: 'Registro duplicado' });
  }

  if (err?.name === 'MongoServerError' && /not allowed to do action/i.test(err.message)) {
    return res.status(500).json({
      message: 'Error de permisos en MongoDB. Verifica rol readWrite del usuario en Atlas.'
    });
  }

  // Return actual error message to help diagnose issues
  res.status(500).json({ message: err?.message || 'Error interno del servidor' });
};
