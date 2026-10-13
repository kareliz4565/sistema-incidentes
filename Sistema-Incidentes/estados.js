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
// 3. CARGAR ESTADOS (LISTAR)
// ==========================================
async function cargarEstados() {
    const { data, error } = await supabaseClient
        .from('estado')
        .select('*')
        .order('id_estado', { ascending: true });

    const tbody = document.getElementById('tabla-estados');

    if (error) {
        console.error('Error al cargar:', error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ef4444;">Error al cargar estados</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay estados registrados aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(e => `
        <tr>
            <td>${e.id_estado}</td>
            <td>${e.nombre}</td>
            <td>${e.descripcion || '-'}</td>
            <td>
                <button class="btn-delete" onclick="eliminarEstado(${e.id_estado})">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// 4. CREAR ESTADO (INSERTAR)
// ==========================================
document.getElementById('form-estado').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();

    // Verificar duplicados
    const { data: existente } = await supabaseClient
        .from('estado')
        .select('nombre')
        .eq('nombre', nombre)
        .single();

    if (existente) {
        alert('⚠️ Ya existe un estado con ese nombre.');
        return;
    }

    // Insertar en Supabase
    const { error } = await supabaseClient
        .from('estado')
        .insert([{ nombre: nombre, descripcion: descripcion }]);

    if (error) {
        alert('❌ Error al agregar: ' + error.message);
    } else {
        alert('✅ Estado agregado exitosamente.');
        document.getElementById('form-estado').reset();
        cargarEstados();
    }
});

// ==========================================
// 5. ELIMINAR ESTADO
// ==========================================
async function eliminarEstado(id) {
    const confirmar = confirm('¿Estás segura de eliminar este estado?');
    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('estado')
        .delete()
        .eq('id_estado', id);

    if (error) {
        alert('❌ Error al eliminar: ' + error.message);
    } else {
        alert('✅ Estado eliminado.');
        cargarEstados();
    }
}

// ==========================================
// 6. EJECUTAR AL CARGAR LA PÁGINA
// ==========================================
cargarEstados();