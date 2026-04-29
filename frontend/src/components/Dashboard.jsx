import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, ArrowUpRight, ArrowDownLeft, User, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../api';
import './Dashboard.css';

const CosmicCancerLogo = ({ size = 200, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M40 35C40 20 75 20 75 35C75 50 40 50 40 35" stroke="#39FF14" strokeWidth="1" />
    <path d="M60 65C60 80 25 80 25 65C25 50 60 50 60 65" stroke="#39FF14" strokeWidth="1" />
    <line x1="40" y1="35" x2="60" y2="65" stroke="#39FF14" strokeWidth="0.3" strokeDasharray="5 5" opacity="0.3" />
    <circle cx="40" cy="35" r="2.5" fill="#FF003C" opacity="0.8" />
    <circle cx="75" cy="35" r="1.5" fill="#FF003C" opacity="0.6" />
    <circle cx="60" cy="65" r="2.5" fill="#FF003C" opacity="0.8" />
    <circle cx="25" cy="65" r="1.5" fill="#FF003C" opacity="0.6" />
  </svg>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [userData, setUserData] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de transferencia
  const [destino, setDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [transferMessage, setTransferMessage] = useState({ text: '', type: '' });
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      const [userRes, txRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/transacciones')
      ]);
      setUserData(userRes.data);
      setTransacciones(txRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferMessage({ text: '', type: '' });
    setIsTransferring(true);

    try {
      const response = await api.post('/transacciones/transferir', {
        usuario_id_origen: userData.id,
        usuario_id_destino: destino,
        monto: Number(monto)
      });

      setTransferMessage({ 
        text: 'TRANSFERENCIA EXITOSA: Fondos desplazados correctamente.', 
        type: 'success' 
      });
      setDestino('');
      setMonto('');
      // Recargar datos para ver el nuevo saldo y transacción
      fetchData();
    } catch (err) {
      setTransferMessage({ 
        text: `ERROR EN TRANSFERENCIA: ${err.response?.data?.error || 'Fallo de conexión.'}`, 
        type: 'error' 
      });
    } finally {
      setIsTransferring(false);
    }
  };

  if (!token || loading) return (
    <div className="loading-container">
      <div className="scanner-line"></div>
      <p>ACCEDIENDO AL NODO...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      <CosmicCancerLogo size={400} className="watermark" aria-hidden="true" />
      
      <nav className="dashboard-nav" role="navigation" aria-label="Navegación principal">
        <div className="nav-logo">
          <LayoutDashboard className="neon-icon" size={24} aria-hidden="true" />
          <span>CYBER-BANCA</span>
        </div>
        <button onClick={handleLogout} className="logout-btn" aria-label="Cerrar sesión de forma segura">
          <LogOut size={20} aria-hidden="true" />
          <span>Desconectar</span>
        </button>
      </nav>

      <main className="dashboard-content">
        <header className="welcome-header">
          <section className="user-profile">
            <div className="avatar" aria-hidden="true">
              <User size={32} />
            </div>
            <div>
              <h1>Bienvenido, {userData?.nombre || 'Agente'}</h1>
              <p>Estado de la cuenta: <span className="neon-green">ACTIVO</span></p>
            </div>
          </section>
          <section className="balance-card" role="region" aria-label="Información de saldo">
            <span className="label">SALDO DISPONIBLE</span>
            <h2 className="amount">
              {userData?.saldo?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
            </h2>
          </section>
        </header>

        <div className="dashboard-grid">
          {/* Módulo de Transferencias */}
          <section className="transfer-section">
            <header className="section-header">
              <h3>Transferencias de Fondos</h3>
            </header>
            <form onSubmit={handleTransfer} className="transfer-form">
              <div className="input-group">
                <label>CUENTA DESTINO (ID)</label>
                <input 
                  type="text" 
                  placeholder="ID DE USUARIO DESTINO" 
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>MONTO A TRANSFERIR</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                />
              </div>
              
              {transferMessage.text && (
                <div className={`transfer-msg ${transferMessage.type}`}>
                  {transferMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <span>{transferMessage.text}</span>
                </div>
              )}

              <button type="submit" className="transfer-btn" disabled={isTransferring}>
                {isTransferring ? 'PROCESANDO...' : 'CONFIRMAR TRANSFERENCIA'}
                {!isTransferring && <Send size={18} />}
              </button>
            </form>
          </section>

          {/* Últimos Movimientos */}
          <section className="transactions-section">
            <header className="section-header">
              <h3>Últimos Movimientos</h3>
            </header>
            <div className="transactions-list" role="list">
              {transacciones.length > 0 ? transacciones.map((tx) => (
                <article key={tx.id} className="transaction-item" role="listitem">
                  <div className={`tx-icon ${tx.monto > 0 && tx.tipo === 'Abono' ? 'bg-green' : 'bg-red'}`} aria-hidden="true">
                    {(tx.monto > 0 && tx.tipo === 'Abono') ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div className="tx-info">
                    <p className="tx-desc">{tx.tipo} {tx.cuenta_destino ? `a ID: ${tx.cuenta_destino}` : ''}</p>
                    <time className="tx-date" dateTime={tx.fecha}>{new Date(tx.fecha).toLocaleDateString()}</time>
                  </div>
                  <div className={`tx-amount ${tx.monto > 0 && tx.tipo === 'Abono' ? 'neon-green' : 'neon-red'}`}>
                    {(tx.monto > 0 && tx.tipo === 'Abono') ? '+' : '-'}{Math.abs(tx.monto).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                  </div>
                </article>
              )) : (
                <div className="empty-tx">No hay movimientos registrados.</div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
