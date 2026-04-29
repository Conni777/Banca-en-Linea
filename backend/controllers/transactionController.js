const supabase = require('../config/supabaseClient');
const axios = require('axios');


exports.abonar = async (req, res) => {
  const { usuario_id, monto } = req.body;
  
  if (!usuario_id || monto == null || monto <= 0) {
    return res.status(400).json({ error: 'Faltan datos o el monto es inválido' });
  }

  try {
    // Obtener saldo actual
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', usuario_id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nuevoSaldo = Number(userData.saldo) + Number(monto);

    // Actualizar saldo
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ saldo: nuevoSaldo })
      .eq('id', usuario_id);

    if (updateError) {
      return res.status(500).json({ error: 'Error al actualizar el saldo' });
    }

    // Registrar transacción
    const { data: txData, error: txError } = await supabase
      .from('transacciones')
      .insert([
        { 
          usuario_id: usuario_id,
          tipo: 'Abono',
          monto: monto
        }
      ])
      .select();

    if (txError) {
      return res.status(500).json({ error: 'Error al registrar la transacción' });
    }

    res.status(200).json({ message: 'Abono realizado con éxito', saldo: nuevoSaldo, transaccion: txData[0] });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.transferir = async (req, res) => {
  const { usuario_id_origen, usuario_id_destino, monto } = req.body;

  if (!usuario_id_origen || !usuario_id_destino || monto == null || monto <= 0) {
    return res.status(400).json({ error: 'Faltan datos o el monto es inválido' });
  }

  try {
    // Obtener saldo origen
    const { data: origenData, error: origenError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', usuario_id_origen)
      .single();

    if (origenError || !origenData) {
      return res.status(404).json({ error: 'Usuario origen no encontrado' });
    }

    if (Number(origenData.saldo) < Number(monto)) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Obtener saldo destino
    const { data: destinoData, error: destinoError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', usuario_id_destino)
      .single();

    if (destinoError || !destinoData) {
      return res.status(404).json({ error: 'Usuario destino no encontrado' });
    }

    const nuevoSaldoOrigen = Number(origenData.saldo) - Number(monto);
    const nuevoSaldoDestino = Number(destinoData.saldo) + Number(monto);

    // Actualizar origen
    const { error: updateOrigenError } = await supabase
      .from('usuarios')
      .update({ saldo: nuevoSaldoOrigen })
      .eq('id', usuario_id_origen);

    if (updateOrigenError) {
      return res.status(500).json({ error: 'Error al actualizar saldo de origen' });
    }

    // Actualizar destino
    const { error: updateDestinoError } = await supabase
      .from('usuarios')
      .update({ saldo: nuevoSaldoDestino })
      .eq('id', usuario_id_destino);

    if (updateDestinoError) {
      return res.status(500).json({ error: 'Error al actualizar saldo de destino' });
    }

    // Registrar transacción
    const { data: txData, error: txError } = await supabase
      .from('transacciones')
      .insert([
        { 
          usuario_id: usuario_id_origen,
          tipo: 'Transferencia',
          monto: monto,
          cuenta_destino: usuario_id_destino
        }
      ])
      .select();

    if (txError) {
      return res.status(500).json({ error: 'Error al registrar la transacción' });
    }

    res.status(200).json({ message: 'Transferencia realizada con éxito', saldoActual: nuevoSaldoOrigen, transaccion: txData[0] });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.transferirInterbancario = async (req, res) => {
  const { usuario_id, monto, cuenta_destino, banco_destino, descripcion } = req.body;

  if (!usuario_id || !monto || !cuenta_destino || !banco_destino) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para la transferencia interbancaria' });
  }

  try {
    // 1. Verificar saldo en nuestra DB
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', usuario_id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (Number(userData.saldo) < Number(monto)) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // 2. Realizar petición externa al Banco Aerum
    try {
      const response = await axios.post('https://banco-aerum.vercel.app/api/interbank/receive', {
        account_number: cuenta_destino,
        amount: Number(monto),
        from_bank: "CYBER-BANCA", 
        description: descripcion || "Transferencia Interbancaria"
      }, {
        headers: {
          'x-api-key': 'AERUM-BRIDGE-2026',
          'Content-Type': 'application/json'
        }
      });

      // 3. Descontar saldo en nuestra DB
      const nuevoSaldo = Number(userData.saldo) - Number(monto);
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ saldo: nuevoSaldo })
        .eq('id', usuario_id);

      if (updateError) {
        return res.status(500).json({ error: 'Error al actualizar saldo tras transferencia exitosa' });
      }

      // 4. Registrar la transacción en nuestra tabla local
      const { data: txData, error: txError } = await supabase
        .from('transacciones')
        .insert([
          { 
            usuario_id: usuario_id,
            tipo: 'Transferencia Interbancaria',
            monto: monto,
            cuenta_destino: cuenta_destino
          }
        ])
        .select();

      res.status(200).json({ 
        message: 'Transferencia interbancaria exitosa', 
        saldoActual: nuevoSaldo,
        referenciaAerum: response.data 
      });

    } catch (externalError) {
      console.error('Error en Banco Aerum:', externalError.response?.data || externalError.message);
      return res.status(502).json({ 
        error: 'El banco destino rechazó la transacción', 
        detalles: externalError.response?.data || externalError.message 
      });
    }

  } catch (error) {
    res.status(500).json({ error: 'Error interno en el procesamiento interbancario' });
  }
};

