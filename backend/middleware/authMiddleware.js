const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'No hay token, autorización denegada' });
  }

  try {
    const tokenParts = token.split(' ');
    const actualToken = tokenParts.length === 2 ? tokenParts[1] : token;

    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    
    req.usuario = decoded.usuario;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token no es válido' });
  }
};
