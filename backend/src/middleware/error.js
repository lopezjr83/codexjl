export const notFound = (req, res) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);

  if (err?.name === 'MongoServerError' && /not allowed to do action/i.test(err.message)) {
    return res.status(500).json({
      message: 'Error de permisos en MongoDB. Verifica rol readWrite del usuario en Atlas.'
    });
  }

  res.status(500).json({ message: 'Error interno del servidor' });
};
