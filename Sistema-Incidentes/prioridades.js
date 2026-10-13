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
// 2. REGLAS DE NEGOCIO (SLA Y RECOMENDACIONES)
// ==========================================
function obtenerSLA(nivel) {
    const sla = {
        'Critica': '⏱️ 1 hora',
        'Alta': '⏱️ 4 horas',
        'Media': '⏱️ 24 horas',
        'Baja': '⏱️ 72 horas'
    };
    return sla[nivel] || 'Sin definir';
}

function obtenerRecomendacion(nivel) {
    const recomendaciones = {
        'Critica': '🔴 Aislar el activo. Escalar al equipo de seguridad INMEDIATAMENTE.',
        'Alta': '🟠 Notificar al responsable de TI y atender en menos de 4 horas.',
        'Media': '🟡 Documentar y atender en menos de 24 horas.',
        'Baja': '🟢 Atender en la próxima ventana de mantenimiento.'
    };
    return recomendaciones[nivel] || 'Sin recomendación.';
}

// ==========================================
// 3. CARGAR INCIDENTES
// ==========================================
async function cargarIncidentes() {
    const tbody = document.getElementById('tabla-prioridades-incidentes');
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Cargando...</td></tr>`;

    const { data, error } = await supabaseClient
        .from('incidente')
        .select(`
            *,
            categoria:id_categoria (nombre),
            prioridad:id_prioridad (nombre, nivel),
            estado:id_estado (nombre),
            activo:id_activo (nombre)
        `)
        .order('id_prioridad', { ascending: false });

    if (error) {
        console.error('Error:', error);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#ef4444;">Error al cargar</td></tr>`;
        return;
    }

    todosIncidentes = data || [];
    actualizarContadores();
    renderizarTabla(todosIncidentes);
}

// ==========================================
// 4. CONTADORES POR PRIORIDAD
// ==========================================
function actualizarContadores() {
    const contadores = { 'Critica': 0, 'Alta': 0, 'Media': 0, 'Baja': 0 };

    todosIncidentes.forEach(inc => {
        // Solo contar los que están abiertos o en proceso
        const estado = inc.estado?.nombre || '';
        if (estado.toLowerCase() === 'cerrado') return;

        const nivel = inc.prioridad?.nivel || 'Baja';
        if (contadores[nivel] !== undefined) contadores[nivel]++;
    });

    document.getElementById('count-critica').textContent = contadores['Critica'];
    document.getElementById('count-alta').textContent = contadores['Alta'];
    document.getElementById('count-media').textContent = contadores['Media'];
    document.getElementById('count-baja').textContent = contadores['Baja'];
}

// ==========================================
// 5. RENDERIZAR TABLA
// ==========================================
function renderizarTabla(incidentes) {
    const tbody = document.getElementById('tabla-prioridades-incidentes');

    if (!incidentes || incidentes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No hay incidentes con este filtro.</td></tr>`;
        return;
    }

    const iconos = { 'critica': '🔴', 'alta': '🟠', 'media': '🟡', 'baja': '🟢' };

    tbody.innerHTML = incidentes.map(inc => {
        const nivel = (inc.prioridad?.nivel || 'Baja').toLowerCase();
        const nivelCap = nivel.charAt(0).toUpperCase() + nivel.slice(1);
        const sla = obtenerSLA(nivelCap);
        const recomendacion = obtenerRecomendacion(nivelCap);

        return `
        <tr>
            <td><span class="badge badge-${nivel}">${iconos[nivel]} ${inc.prioridad?.nombre || '-'}</span></td>
            <td>#${inc.id_incidente}</td>
            <td>${inc.titulo}</td>
            <td>${inc.categoria?.nombre || '-'}</td>
            <td>${inc.activo?.nombre || '-'}</td>
            <td><small style="color:#94a3b8;">${inc.nivel_riesgo || 'No calculado'}</small></td>
            <td>${inc.estado?.nombre || '-'}</td>
            <td><strong style="color:#38bdf8;">${sla}</strong></td>
            <td><small style="color:#cbd5e1;">${recomendacion}</small></td>
        </tr>
        `;
    }).join('');
}

// ==========================================
// 6. FILTROS
// ==========================================
function filtrarPorPrioridad(nivel) {
    document.getElementById('filtro-nivel-prioridad').value = nivel;
    aplicarFiltro();
}

function aplicarFiltro() {
    const filtro = document.getElementById('filtro-nivel-prioridad').value;
    if (!filtro) {
        renderizarTabla(todosIncidentes);
        return;
    }
    const filtrados = todosIncidentes.filter(inc => (inc.prioridad?.nivel || '') === filtro);
    renderizarTabla(filtrados);
}

function limpiarFiltro() {
    document.getElementById('filtro-nivel-prioridad').value = '';
    renderizarTabla(todosIncidentes);
}

document.getElementById('filtro-nivel-prioridad').addEventListener('change', aplicarFiltro);

// ==========================================
// 7. INICIALIZAR
// ==========================================
window.scrollTo(0, 0);
cargarIncidentes();
