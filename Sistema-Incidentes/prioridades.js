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
    document.getElementById('user-avatar').textContent = usuario.nombre.charAt(0).toUpperCase();
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
// 3. CARGAR PRIORIDADES (LISTAR)
// ==========================================
async function cargarPrioridades() {
    const { data, error } = await supabaseClient
        .from('prioridad')
        .select('*')
        .order('id_prioridad', { ascending: true });

    const tbody = document.getElementById('tabla-prioridades');

    if (error) {
        console.error('Error al cargar:', error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444;">Error al cargar prioridades</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay prioridades registradas aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(p => `
        <tr>
            <td>${p.id_prioridad}</td>
            <td>${p.nombre}</td>
            <td><span class="badge badge-${(p.nivel || '').toLowerCase()}">${p.nivel || '-'}</span></td>
            <td>${p.descripcion || '-'}</td>
            <td>
                <button class="btn-delete" onclick="eliminarPrioridad(${p.id_prioridad})">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// 4. CREAR PRIORIDAD (INSERTAR)
// ==========================================
document.getElementById('form-prioridad').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const nivel = document.getElementById('nivel').value;
    const descripcion = document.getElementById('descripcion').value.trim();

    // Verificar que no exista una prioridad con el mismo nombre
    const { data: existente } = await supabaseClient
        .from('prioridad')
        .select('nombre')
        .eq('nombre', nombre)
        .single();

    if (existente) {
        alert('⚠️ Ya existe una prioridad con ese nombre.');
        return;
    }

    // Insertar en Supabase
    const { error } = await supabaseClient
        .from('prioridad')
        .insert([{ nombre: nombre, nivel: nivel, descripcion: descripcion }]);

    if (error) {
        alert('❌ Error al agregar: ' + error.message);
    } else {
        alert('✅ Prioridad agregada exitosamente.');
        document.getElementById('form-prioridad').reset();
        cargarPrioridades();
    }
});

// ==========================================
// 5. ELIMINAR PRIORIDAD
// ==========================================
async function eliminarPrioridad(id) {
    const confirmar = confirm('¿Estás segura de eliminar esta prioridad?');
    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('prioridad')
        .delete()
        .eq('id_prioridad', id);

    if (error) {
        alert('❌ Error al eliminar: ' + error.message);
    } else {
        alert('✅ Prioridad eliminada.');
        cargarPrioridades();
    }
}

// ==========================================
// 6. EJECUTAR AL CARGAR LA PÁGINA
// ==========================================
cargarPrioridades();