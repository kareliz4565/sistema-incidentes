// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = "https://czaasfgyblmswnjxxbrn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFzZmd5Ymxtc3duanh4YnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODE0NjcsImV4cCI6MjEwNzM1NzQ2N30.oJiflCwgpODN760TcyNCHDg6mjJwzNNQpCmn4375y1g";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todosIncidentes = [];

// ==========================================
// 1. SESIÓN
// ==========================================
const usuarioGuardado = localStorage.getItem('usuarioLogueado');
if (!usuarioGuardado) {
    alert('⚠️ Debes iniciar sesión primero.');
    window.location.href = 'index.html';
} else {
    const u = JSON.parse(usuarioGuardado);
    document.getElementById('nombre-usuario').textContent = u.nombre;
    document.getElementById('user-avatar').textContent = u.nombre.charAt(0).toUpperCase();
}

function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    window.location.href = 'index.html';
}

// ==========================================
// 2. CARGAR INCIDENTES POR ESTADO
// ==========================================
async function cargarIncidentes() {
    const tbody = document.getElementById('tabla-estados-incidentes');
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Cargando...</td></tr>`;

    const { data, error } = await supabaseClient
        .from('incidente')
        .select(`
            *,
            categoria:id_categoria (nombre),
            prioridad:id_prioridad (nombre, nivel),
            estado:id_estado (nombre),
            activo:id_activo (nombre),
            asignado:id_asignado (nombre)
        `)
        .order('id_estado', { ascending: true });

    if (error) {
        console.error('Error:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#ef4444;">Error al cargar</td></tr>`;
        return;
    }

    todosIncidentes = data || [];
    actualizarContadores();
    renderizarTabla(todosIncidentes);
}

// ==========================================
// 3. CONTADORES POR ESTADO
// ==========================================
function actualizarContadores() {
    const contadores = { 'Abierto': 0, 'En proceso': 0, 'Cerrado': 0 };

    todosIncidentes.forEach(inc => {
        const estado = inc.estado?.nombre || 'Abierto';
        if (contadores[estado] !== undefined) contadores[estado]++;
    });

    document.getElementById('count-abierto').textContent = contadores['Abierto'];
    document.getElementById('count-proceso').textContent = contadores['En proceso'];
    document.getElementById('count-cerrado').textContent = contadores['Cerrado'];
}

// ==========================================
// 4. RENDERIZAR TABLA
// ==========================================
function renderizarTabla(incidentes) {
    const tbody = document.getElementById('tabla-estados-incidentes');

    if (!incidentes || incidentes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No hay incidentes con este filtro.</td></tr>`;
        return;
    }

    const iconosEstado = { 'abierto': '🔓', 'en proceso': '🔄', 'cerrado': '✅' };
    const coloresEstado = { 'abierto': '#ef4444', 'en proceso': '#eab308', 'cerrado': '#22c55e' };

    tbody.innerHTML = incidentes.map(inc => {
        const estado = inc.estado?.nombre || 'Abierto';
        const estadoLower = estado.toLowerCase();
        const icono = iconosEstado[estadoLower] || '❓';
        const color = coloresEstado[estadoLower] || '#94a3b8';
        
        const nivelPrio = (inc.prioridad?.nivel || 'baja').toLowerCase();
        const badgePrio = `<span class="badge badge-${nivelPrio}">${inc.prioridad?.nombre || '-'}</span>`;
        
        const fecha = new Date(inc.fecha_reporte).toLocaleDateString('es-CO');

        return `
        <tr>
            <td>
                <span style="background:${color}; color:white; padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:bold;">
                    ${icono} ${estado}
                </span>
            </td>
            <td>#${inc.id_incidente}</td>
            <td>${inc.titulo}</td>
            <td>${inc.categoria?.nombre || '-'}</td>
            <td>${badgePrio}</td>
            <td>${inc.asignado?.nombre || '<em style="color:#94a3b8;">Sin asignar</em>'}</td>
            <td>${fecha}</td>
            <td>
                <button class="btn-action" onclick="cambiarEstado(${inc.id_incidente})" title="Cambiar estado">🔁</button>
            </td>
        </tr>
        `;
    }).join('');
}

// ==========================================
// 5. CAMBIAR ESTADO
// ==========================================
async function cambiarEstado(id) {
    const { data: estados } = await supabaseClient
        .from('estado').select('*').order('id_estado');

    let opciones = "Selecciona el nuevo estado:\n\n";
    estados.forEach((e, i) => opciones += `${i + 1}. ${e.nombre}\n`);
    
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
        alert('❌ Error: ' + error.message);
    } else {
        alert(`✅ Estado actualizado a: ${nuevoEstado.nombre}`);
        cargarIncidentes();
    }
}

// ==========================================
// 6. FILTROS
// ==========================================
function filtrarPorEstado(estado) {
    document.getElementById('filtro-estado-incidente').value = estado;
    aplicarFiltro();
}

function aplicarFiltro() {
    const filtro = document.getElementById('filtro-estado-incidente').value;
    if (!filtro) {
        renderizarTabla(todosIncidentes);
        return;
    }
    const filtrados = todosIncidentes.filter(inc => (inc.estado?.nombre || '') === filtro);
    renderizarTabla(filtrados);
}

function limpiarFiltro() {
    document.getElementById('filtro-estado-incidente').value = '';
    renderizarTabla(todosIncidentes);
}

document.getElementById('filtro-estado-incidente').addEventListener('change', aplicarFiltro);

// ==========================================
// 7. INICIALIZAR
// ==========================================
window.scrollTo(0, 0);
cargarIncidentes();
