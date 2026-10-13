// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = "https://czaasfgyblmswnjxxbrn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFzZmd5Ymxtc3duanh4YnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODE0NjcsImV4cCI6MjEwNzM1NzQ2N30.oJiflCwgpODN760TcyNCHDg6mjJwzNNQpCmn4375y1g";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todosUsuarios = [];
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
// 2. CARGAR USUARIOS CON CONTEO DE INCIDENTES
// ==========================================
async function cargarUsuarios() {
    const tbody = document.getElementById('tabla-usuarios');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>`;

    // Traer usuarios
    const { data: usuarios, error: errU } = await supabaseClient
        .from('usuario').select('*').order('id_usuario');

    // Traer incidentes con asignación
    const { data: incidentes, error: errI } = await supabaseClient
        .from('incidente').select('id_incidente, titulo, id_asignado, estado:id_estado(nombre)');

    if (errU || errI) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ef4444;">Error al cargar</td></tr>`;
        return;
    }

    todosUsuarios = usuarios || [];
    todosIncidentes = incidentes || [];

    // Contar incidentes por usuario asignado (solo abiertos/proceso)
    const conteo = {};
    todosIncidentes.forEach(inc => {
        const estado = (inc.estado?.nombre || '').toLowerCase();
        if (estado === 'cerrado') return; // No contar cerrados
        if (inc.id_asignado) {
            conteo[inc.id_asignado] = (conteo[inc.id_asignado] || 0) + 1;
        }
    });

    // Renderizar tabla
    tbody.innerHTML = todosUsuarios.map(u => {
        const asignados = conteo[u.id_usuario] || 0;
        const colorCarga = asignados >= 5 ? '#ef4444' : asignados >= 3 ? '#eab308' : '#22c55e';
        
        return `
        <tr>
            <td>${u.id_usuario}</td>
            <td>${u.nombre}</td>
            <td>${u.correo}</td>
            <td><span class="badge ${u.activo ? 'badge-baja' : 'badge-critica'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <span style="background:${colorCarga}; color:white; padding:4px 12px; border-radius:20px; font-weight:bold; font-size:0.8rem;">
                    ${asignados} incidente(s)
                </span>
            </td>
            <td>
                <button class="btn-action" onclick="verIncidentesDe(${u.id_usuario})">👁️ Ver</button>
            </td>
        </tr>
        `;
    }).join('');

    // Actualizar resumen de tarjetas
    renderizarResumen(conteo);
    // Llenar dropdown de usuarios
    llenarDropdownUsuarios();
    // Llenar dropdown de incidentes sin asignar
    llenarDropdownIncidentes();
}

// ==========================================
// 3. RESUMEN TIPO TARJETAS
// ==========================================
function renderizarResumen(conteo) {
    const contenedor = document.getElementById('resumen-usuarios');
    
    const totalAsignados = Object.values(conteo).reduce((a, b) => a + b, 0);
    const totalSinAsignar = todosIncidentes.filter(i => !i.id_asignado && (i.estado?.nombre || '').toLowerCase() !== 'cerrado').length;

    contenedor.innerHTML = `
        <div class="priority-cards">
            <div class="priority-card card-media" style="cursor:default;">
                <div class="priority-icon">👥</div>
                <div class="priority-info">
                    <h3>${todosUsuarios.length}</h3>
                    <p>Usuarios</p>
                    <span class="sla">Registrados</span>
                </div>
            </div>
            <div class="priority-card card-alta" style="cursor:default;">
                <div class="priority-icon">📥</div>
                <div class="priority-info">
                    <h3>${totalAsignados}</h3>
                    <p>Asignados</p>
                    <span class="sla">Con responsable</span>
                </div>
            </div>
            <div class="priority-card card-critica" style="cursor:default;">
                <div class="priority-icon">⚠️</div>
                <div class="priority-info">
                    <h3>${totalSinAsignar}</h3>
                    <p>Sin asignar</p>
                    <span class="sla">Requieren atención</span>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 4. LLENAR DROPDOWNS
// ==========================================
function llenarDropdownUsuarios() {
    const select = document.getElementById('select-usuario');
    select.innerHTML = '<option value="">Seleccione un usuario...</option>';
    todosUsuarios.forEach(u => {
        select.innerHTML += `<option value="${u.id_usuario}">${u.nombre} (${u.correo})</option>`;
    });
}

function llenarDropdownIncidentes() {
    const select = document.getElementById('select-incidente');
    select.innerHTML = '<option value="">Seleccione un incidente...</option>';
    
    // Solo incidentes NO cerrados
    const disponibles = todosIncidentes.filter(i => 
        (i.estado?.nombre || '').toLowerCase() !== 'cerrado'
    );
    
    disponibles.forEach(i => {
        const asignado = i.id_asignado ? ' [ya asignado]' : '';
        select.innerHTML += `<option value="${i.id_incidente}">#${i.id_incidente} - ${i.titulo}${asignado}</option>`;
    });
}

// ==========================================
// 5. ASIGNAR INCIDENTE
// ==========================================
document.getElementById('form-asignar').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const idIncidente = parseInt(document.getElementById('select-incidente').value);
    const idUsuario = parseInt(document.getElementById('select-usuario').value);

    const { error } = await supabaseClient
        .from('incidente')
        .update({ id_asignado: idUsuario })
        .eq('id_incidente', idIncidente);

    if (error) {
        alert('❌ Error al asignar: ' + error.message);
    } else {
        const usuario = todosUsuarios.find(u => u.id_usuario === idUsuario);
        alert(`✅ Incidente #${idIncidente} asignado a: ${usuario.nombre}`);
        document.getElementById('form-asignar').reset();
        await cargarUsuarios();
    }
});

// ==========================================
// 6. VER INCIDENTES DE UN USUARIO
// ==========================================
function verIncidentesDe(idUsuario) {
    const usuario = todosUsuarios.find(u => u.id_usuario === idUsuario);
    const incidentes = todosIncidentes.filter(i => i.id_asignado === idUsuario);

    if (incidentes.length === 0) {
        alert(`📋 ${usuario.nombre} no tiene incidentes asignados.`);
        return;
    }

    let mensaje = `📋 Incidentes asignados a ${usuario.nombre}:\n\n`;
    incidentes.forEach(i => {
        const estado = i.estado?.nombre || 'Sin estado';
        mensaje += `• #${i.id_incidente} - ${i.titulo}\n  Estado: ${estado}\n\n`;
    });

    alert(mensaje);
}

// ==========================================
// 7. INICIALIZAR
// ==========================================
window.scrollTo(0, 0);
cargarUsuarios();
