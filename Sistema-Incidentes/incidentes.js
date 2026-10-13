// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = "https://czaasfgyblmswnjxxbrn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFzZmd5Ymxtc3duanh4YnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODE0NjcsImV4cCI6MjEwNzM1NzQ2N30.oJiflCwgpODN760TcyNCHDg6mjJwzNNQpCmn4375y1g";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let usuarioActual = null;

// ==========================================
// 1. VERIFICAR SESIÓN
// ==========================================
const usuarioGuardado = localStorage.getItem('usuarioLogueado');

if (!usuarioGuardado) {
    alert('⚠️ Debes iniciar sesión primero.');
    window.location.href = 'index.html';
} else {
    usuarioActual = JSON.parse(usuarioGuardado);
    document.getElementById('nombre-usuario').textContent = usuarioActual.nombre;
    document.getElementById('user-avatar').textContent = usuarioActual.nombre.charAt(0).toUpperCase();
}

// ==========================================
// 2. CERRAR SESIÓN
// ==========================================
function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    alert('👋 Has cerrado sesión exitosamente.');
    window.location.href = 'index.html';
}

// ==========================================
// 3. CARGAR DROPDOWNS DINÁMICAMENTE
// ==========================================
async function cargarDropdowns() {
    // --- Categorías ---
    const { data: categorias } = await supabaseClient
        .from('categoria').select('*').order('nombre');
    
    const selectCat = document.getElementById('id_categoria');
    if (categorias) {
        categorias.forEach(c => {
            selectCat.innerHTML += `<option value="${c.id_categoria}">${c.nombre}</option>`;
        });
    }

    // --- Prioridades ---
    const { data: prioridades } = await supabaseClient
        .from('prioridad').select('*').order('id_prioridad');
    
    const selectPri = document.getElementById('id_prioridad');
    const filtroPri = document.getElementById('filtro-prioridad');
    if (prioridades) {
        prioridades.forEach(p => {
            selectPri.innerHTML += `<option value="${p.id_prioridad}">${p.nombre}</option>`;
            filtroPri.innerHTML += `<option value="${p.id_prioridad}">${p.nombre}</option>`;
        });
    }

    // --- Estados ---
    const { data: estados } = await supabaseClient
        .from('estado').select('*').order('id_estado');
    
    const selectEst = document.getElementById('id_estado');
    const filtroEst = document.getElementById('filtro-estado');
    if (estados) {
        estados.forEach(e => {
            selectEst.innerHTML += `<option value="${e.id_estado}">${e.nombre}</option>`;
            filtroEst.innerHTML += `<option value="${e.id_estado}">${e.nombre}</option>`;
        });
    }

    // --- Activos ---
    const { data: activos } = await supabaseClient
        .from('activo').select('*').order('nombre');
    
    const selectAct = document.getElementById('id_activo');
    if (activos) {
        activos.forEach(a => {
            selectAct.innerHTML += `<option value="${a.id_activo}">${a.nombre} (${a.tipo})</option>`;
        });
    }
}

// ==========================================
// 4. CARGAR INCIDENTES CON SUS RELACIONES
// ==========================================
async function cargarIncidentes(filtroPrioridad = '', filtroEstado = '') {
    const tbody = document.getElementById('tabla-incidentes');
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Cargando...</td></tr>`;

    let query = supabaseClient
        .from('incidente')
        .select(`
            *,
            categoria:id_categoria (nombre),
            prioridad:id_prioridad (nombre, nivel),
            estado:id_estado (nombre),
            activo:id_activo (nombre),
            usuario:id_usuario (nombre)
        `)
        .order('id_incidente', { ascending: false });

    if (filtroPrioridad) query = query.eq('id_prioridad', filtroPrioridad);
    if (filtroEstado) query = query.eq('id_estado', filtroEstado);

    const { data, error } = await query;

    if (error) {
        console.error('Error:', error);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#ef4444;">Error al cargar incidentes</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No hay incidentes registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(inc => {
        const fecha = new Date(inc.fecha_reporte).toLocaleString('es-CO', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const nivelPrioridad = (inc.prioridad?.nivel || '').toLowerCase();
        const badgePrioridad = `<span class="badge badge-${nivelPrioridad}">${inc.prioridad?.nombre || '-'}</span>`;

        return `
        <tr>
            <td>#${inc.id_incidente}</td>
            <td>${inc.titulo}</td>
            <td>${inc.categoria?.nombre || '-'}</td>
            <td>${badgePrioridad}</td>
            <td>${inc.estado?.nombre || '-'}</td>
            <td>${inc.activo?.nombre || '-'}</td>
            <td>${inc.usuario?.nombre || 'Sin asignar'}</td>
            <td>${fecha}</td>
            <td>
                <button class="btn-action" onclick="cambiarEstado(${inc.id_incidente})" title="Cambiar estado">🔁</button>
                <button class="btn-delete" onclick="eliminarIncidente(${inc.id_incidente})" title="Eliminar">🗑️</button>
            </td>
        </tr>
        `;
    }).join('');
}

// ==========================================
// 5. REGISTRAR NUEVO INCIDENTE
// ==========================================
document.getElementById('form-incidente').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoIncidente = {
        titulo: document.getElementById('titulo').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        id_categoria: parseInt(document.getElementById('id_categoria').value),
        id_prioridad: parseInt(document.getElementById('id_prioridad').value),
        id_estado: parseInt(document.getElementById('id_estado').value),
        id_activo: parseInt(document.getElementById('id_activo').value),
        id_usuario: usuarioActual.id_usuario,
        fecha_reporte: new Date().toISOString(),
        activo: true
    };

    const { error } = await supabaseClient
        .from('incidente')
        .insert([nuevoIncidente]);

    if (error) {
        alert('❌ Error al registrar: ' + error.message);
        console.error(error);
    } else {
        alert('✅ Incidente registrado exitosamente.');
        document.getElementById('form-incidente').reset();
        cargarIncidentes();
    }
});

// ==========================================
// 6. CAMBIAR ESTADO DEL INCIDENTE
// ==========================================
async function cambiarEstado(id) {
    const { data: estados } = await supabaseClient
        .from('estado').select('*').order('id_estado');

    let opciones = "Selecciona el nuevo estado:\n\n";
    estados.forEach((e, i) => {
        opciones += `${i + 1}. ${e.nombre}\n`;
    });

    const seleccion = prompt(opciones + "\nEscribe el número:");

    if (!seleccion) return;

    const indice = parseInt(seleccion) - 1;
    if (isNaN(indice) || indice < 0 || indice >= estados.length) {
        alert('⚠️ Opción no válida.');
        return;
    }

    const nuevoEstado = estados[indice];

    const { error } = await supabaseClient
        .from('incidente')
        .update({ 
            id_estado: nuevoEstado.id_estado,
            fecha_ultima_actualizacion: new Date().toISOString()
        })
        .eq('id_incidente', id);

    if (error) {
        alert('❌ Error al actualizar: ' + error.message);
    } else {
        alert(`✅ Estado actualizado a: ${nuevoEstado.nombre}`);
        cargarIncidentes();
    }
}

// ==========================================
// 7. ELIMINAR INCIDENTE
// ==========================================
async function eliminarIncidente(id) {
    const confirmar = confirm('¿Estás segura de eliminar este incidente?');
    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('incidente')
        .delete()
        .eq('id_incidente', id);

    if (error) {
        alert('❌ Error al eliminar: ' + error.message);
    } else {
        alert('✅ Incidente eliminado.');
        cargarIncidentes();
    }
}

// ==========================================
// 8. FILTROS
// ==========================================
document.getElementById('filtro-prioridad').addEventListener('change', () => {
    const pri = document.getElementById('filtro-prioridad').value;
    const est = document.getElementById('filtro-estado').value;
    cargarIncidentes(pri, est);
});

document.getElementById('filtro-estado').addEventListener('change', () => {
    const pri = document.getElementById('filtro-prioridad').value;
    const est = document.getElementById('filtro-estado').value;
    cargarIncidentes(pri, est);
});

function limpiarFiltros() {
    document.getElementById('filtro-prioridad').value = '';
    document.getElementById('filtro-estado').value = '';
    cargarIncidentes();
}

// ==========================================
// 9. EJECUTAR AL CARGAR
// ==========================================
async function init() {
    await cargarDropdowns();
    await cargarIncidentes();
}

init();
