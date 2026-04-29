import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';
import './Login.css';

const CosmicCancerLogo = ({ size = 60, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M40 35C40 20 75 20 75 35C75 50 40 50 40 35" stroke="#39FF14" strokeWidth="1.5" />
    <path d="M60 65C60 80 25 80 25 65C25 50 60 50 60 65" stroke="#39FF14" strokeWidth="1.5" />
    <line x1="40" y1="35" x2="60" y2="65" stroke="#39FF14" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4" />
    <circle cx="40" cy="35" r="3" fill="#FF003C" />
    <circle cx="75" cy="35" r="2" fill="#FF003C" />
    <circle cx="60" cy="65" r="3" fill="#FF003C" />
    <circle cx="25" cy="65" r="2" fill="#FF003C" />
  </svg>
);

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('ERROR: Las contraseñas no coinciden.');
    }

    setLoading(true);
    try {
      await api.post('/register', {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.message || 'Error de conexión';
      setError(`FALLO DE SISTEMA: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cyber-container">
      <div className="scanline" aria-hidden="true"></div>
      <div className="cyber-card" role="region" aria-labelledby="register-title">
        <header className="cyber-header">
          <CosmicCancerLogo className="cyber-logo" />
          <h1 id="register-title">REGISTRO</h1>
          <p className="status-text">ALTA DE NUEVO AGENTE OPERATIVO</p>
        </header>

        {success ? (
          <div className="cyber-success" role="alert" aria-live="polite">
            <CheckCircle size={32} color="#39FF14" aria-hidden="true" />
            <p>REGISTRO COMPLETADO. REDIRECCIONANDO AL NODO DE ACCESO...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="cyber-form">
            <div className="cyber-input-group">
              <label htmlFor="reg-name">NOMBRE COMPLETO</label>
              <div className="cyber-input-wrapper">
                <User className="cyber-icon" size={18} aria-hidden="true" />
                <input
                  id="reg-name"
                  name="nombre"
                  type="text"
                  placeholder="NOMBRE DEL AGENTE"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  aria-label="Nombre completo del nuevo agente"
                />
              </div>
            </div>

            <div className="cyber-input-group">
              <label htmlFor="reg-email">CORREO ELECTRÓNICO</label>
              <div className="cyber-input-wrapper">
                <Mail className="cyber-icon" size={18} aria-hidden="true" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="ID@RED.NET"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  aria-label="Correo electrónico para el registro"
                />
              </div>
            </div>

            <div className="cyber-input-group">
              <label htmlFor="reg-pass">CONTRASEÑA</label>
              <div className="cyber-input-wrapper">
                <Lock className="cyber-icon" size={18} aria-hidden="true" />
                <input
                  id="reg-pass"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  aria-label="Contraseña de acceso"
                />
              </div>
            </div>

            <div className="cyber-input-group">
              <label htmlFor="reg-conf">CONFIRMAR CONTRASEÑA</label>
              <div className="cyber-input-wrapper">
                <Lock className="cyber-icon" size={18} aria-hidden="true" />
                <input
                  id="reg-conf"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  aria-label="Repite la contraseña para confirmar"
                />
              </div>
            </div>

            {error && (
              <div className="cyber-error" role="alert" aria-live="assertive">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="cyber-button" 
              disabled={loading}
              aria-label={loading ? 'Procesando registro' : 'Confirmar registro de agente'}
            >
              {loading ? 'PROCESANDO...' : 'SOLICITAR ACCESO'}
            </button>
          </form>
        )}

        <footer className="cyber-footer">
          <p>¿YA TIENES CREDENCIALES? <Link to="/login" className="neon-link" aria-label="Volver al acceso">VOLVER AL ACCESO</Link></p>
        </footer>
      </div>
    </main>
  );
};

export default Register;
