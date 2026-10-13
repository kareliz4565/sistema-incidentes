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
// 3. CARGAR CATEGORÍAS (LISTAR)
// ==========================================
async function cargarCategorias() {
    const { data, error } = await supabaseClient
        .from('categoria')
        .select('*')
        .order('id_categoria', { ascending: true });

    const tbody = document.getElementById('tabla-categorias');

    if (error) {
        console.error('Error al cargar:', error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ef4444;">Error al cargar categorías</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay categorías registradas aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(cat => `
        <tr>
            <td>${cat.id_categoria}</td>
            <td>${cat.nombre}</td>
            <td>${cat.descripcion || '-'}</td>
            <td>
                <button class="btn-delete" onclick="eliminarCategoria(${cat.id_categoria})">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// 4. CREAR CATEGORÍA (INSERTAR)
// ==========================================
document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();

    // Verificar que no exista una categoría con el mismo nombre
    const { data: existente } = await supabaseClient
        .from('categoria')
        .select('nombre')
        .eq('nombre', nombre)
        .single();

    if (existente) {
        alert('⚠️ Ya existe una categoría con ese nombre.');
        return;
    }

    // Insertar en Supabase
    const { error } = await supabaseClient
        .from('categoria')
        .insert([{ nombre: nombre, descripcion: descripcion }]);

    if (error) {
        alert('❌ Error al agregar: ' + error.message);
    } else {
        alert('✅ Categoría agregada exitosamente.');
        document.getElementById('form-categoria').reset();
        cargarCategorias(); // Recargar la tabla
    }
});

// ==========================================
// 5. ELIMINAR CATEGORÍA
// ==========================================
async function eliminarCategoria(id) {
    const confirmar = confirm('¿Estás segura de eliminar esta categoría?');
    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('categoria')
        .delete()
        .eq('id_categoria', id);

    if (error) {
        alert('❌ Error al eliminar: ' + error.message);
    } else {
        alert('✅ Categoría eliminada.');
        cargarCategorias();
    }
}

// ==========================================
// 6. EJECUTAR AL CARGAR LA PÁGINA
// ==========================================
cargarCategorias();