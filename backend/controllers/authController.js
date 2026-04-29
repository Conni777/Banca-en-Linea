const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.register = async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Faltan campos requeridos: email, password, nombre' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar en Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        { email, password: hashedPassword, nombre }
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Usuario registrado exitosamente', usuario: data[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos: email, password' });
    }

    // Buscar usuario en Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const payload = {
      usuario: {
        id: data.id,
        email: data.email
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ message: 'Login exitoso', token });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, saldo')
      .eq('id', req.usuario.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
