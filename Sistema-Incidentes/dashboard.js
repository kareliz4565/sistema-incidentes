// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = "https://czaasfgyblmswnjxxbrn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFzZmd5Ymxtc3duanh4YnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODE0NjcsImV4cCI6MjEwNzM1NzQ2N30.oJiflCwgpODN760TcyNCHDg6mjJwzNNQpCmn4375y1g";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 1. VERIFICAR SESIÓN
// ==========================================
const usuarioGuardado = localStorage.getItem('usuarioLogueado');

if (!usuarioGuardado) {
    alert('⚠️ Debes iniciar sesión primero.');
    window.location.href = 'index.html';
} else {
    const usuario = JSON.parse(usuarioGuardado);
    document.getElementById('nombre-usuario').textContent = usuario.nombre;
    document.getElementById('rol-usuario').textContent = usuario.rol || 'Empleado';
    
    const inicial = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('user-avatar').textContent = inicial;
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
// 3. CARGAR INDICADORES Y TABLA
// ==========================================
async function cargarDashboard() {
    // Traemos todos los incidentes con sus relaciones
    const { data: incidentes, error } = await supabaseClient
        .from('incidente')
        .select(`
            id_incidente, 
            titulo, 
            fecha_reporte,
            categoria:id_categoria (nombre),
            prioridad:id_prioridad (nombre, nivel),
            estado:id_estado (nombre),
            usuario:id_usuario (nombre)
        `)
        .order('id_incidente', { ascending: false });

    if (error) {
        console.error('Error al cargar:', error);
        return;
    }

    // 1. CALCULAR INDICADORES
    const total = incidentes.length;
    let criticos = 0;
    let abiertos = 0;
    let cerrados = 0;

    incidentes.forEach(inc => {
        const nivelPrio = inc.prioridad?.nivel || '';
        const nombreEstado = inc.estado?.nombre || '';

        if (nivelPrio === 'Critica' || nivelPrio === 'Critico') criticos++;
        if (nombreEstado === 'Abierto') abiertos++;
        if (nombreEstado === 'Cerrado') cerrados++;
    });

    // Actualizar las tarjetas de arriba
    document.getElementById('total-incidentes').textContent = total;
    document.getElementById('incidentes-criticos').textContent = criticos;
    document.getElementById('incidentes-abiertos').textContent = abiertos;
    document.getElementById('incidentes-cerrados').textContent = cerrados;

    // 2. RENDERIZAR TABLA DE ÚLTIMOS 5 INCIDENTES
    const tbody = document.getElementById('tabla-ultimos-incidentes');
    const ultimos = incidentes.slice(0, 5); // Solo mostramos los 5 más recientes

    if (ultimos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay incidentes registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = ultimos.map(inc => {
        const nivelPrio = (inc.prioridad?.nivel || 'baja').toLowerCase();
        const badgePrio = `<span class="badge badge-${nivelPrio}">${inc.prioridad?.nombre || '-'}</span>`;

        return `
        <tr>
            <td>#${inc.id_incidente}</td>
            <td>${inc.titulo}</td>
            <td>${inc.categoria?.nombre || '-'}</td>
            <td>${badgePrio}</td>
            <td>${inc.estado?.nombre || '-'}</td>
            <td>${inc.usuario?.nombre || '-'}</td>
        </tr>
        `;
    }).join('');
}

// ==========================================
// 4. INICIALIZAR
// ==========================================
window.scrollTo(0, 0);
cargarDashboard();
