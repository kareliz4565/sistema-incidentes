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
// 3. CARGAR ACTIVOS (LISTAR)
// ==========================================
async function cargarActivos() {
    const { data, error } = await supabaseClient
        .from('activo')
        .select('*')
        .order('id_activo', { ascending: true });

    const tbody = document.getElementById('tabla-activos');

    if (error) {
        console.error('Error al cargar:', error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444;">Error al cargar activos</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay activos registrados aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(a => `
        <tr>
            <td>${a.id_activo}</td>
            <td>${a.nombre}</td>
            <td>${a.tipo || '-'}</td>
            <td><span class="badge badge-${(a.criticidad || '').toLowerCase()}">${a.criticidad || '-'}</span></td>
            <td>
                <button class="btn-delete" onclick="eliminarActivo(${a.id_activo})">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// 4. CREAR ACTIVO (INSERTAR)
// ==========================================
document.getElementById('form-activo').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const tipo = document.getElementById('tipo').value;
    const criticidad = document.getElementById('criticidad').value;

    // Verificar duplicados
    const { data: existente } = await supabaseClient
        .from('activo')
        .select('nombre')
        .eq('nombre', nombre)
        .single();

    if (existente) {
        alert('⚠️ Ya existe un activo con ese nombre.');
        return;
    }

    // Insertar en Supabase
    const { error } = await supabaseClient
        .from('activo')
        .insert([{ nombre: nombre, tipo: tipo, criticidad: criticidad }]);

    if (error) {
        alert('❌ Error al agregar: ' + error.message);
    } else {
        alert('✅ Activo agregado exitosamente.');
        document.getElementById('form-activo').reset();
        cargarActivos();
    }
});

// ==========================================
// 5. ELIMINAR ACTIVO
// ==========================================
async function eliminarActivo(id) {
    const confirmar = confirm('¿Estás segura de eliminar este activo?');
    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('activo')
        .delete()
        .eq('id_activo', id);

    if (error) {
        alert('❌ Error al eliminar: ' + error.message);
    } else {
        alert('✅ Activo eliminado.');
        cargarActivos();
    }
}

// ==========================================
// 6. EJECUTAR AL CARGAR LA PÁGINA
// ==========================================
cargarActivos();