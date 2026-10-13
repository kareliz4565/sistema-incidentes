// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = "https://czaasfgyblmswnjxxbrn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFzZmd5Ymxtc3duanh4YnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODE0NjcsImV4cCI6MjEwNzM1NzQ2N30.oJiflCwgpODN760TcyNCHDg6mjJwzNNQpCmn4375y1g";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 1. VERIFICAR SESIÓN Y MOSTRAR DATOS DEL USUARIO
// ==========================================
const usuarioGuardado = localStorage.getItem('usuarioLogueado');

if (!usuarioGuardado) {
    alert('⚠️ Debes iniciar sesión primero.');
    window.location.href = 'index.html';
} else {
    const usuario = JSON.parse(usuarioGuardado);
    document.getElementById('nombre-usuario').textContent = usuario.nombre;
    document.getElementById('rol-usuario').textContent = usuario.rol || 'Empleado';
    
    // Mostrar la inicial del nombre en el avatar
    const inicial = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('user-avatar').textContent = inicial;
}

// ==========================================
// 2. FUNCIÓN PARA CERRAR SESIÓN
// ==========================================
function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    alert('👋 Has cerrado sesión exitosamente.');
    window.location.href = 'index.html';
}

// ==========================================
// 3. CARGAR INDICADORES (Se conectará a Supabase)
// ==========================================
// Esta función se activará cuando creemos la tabla incidente
// Por ahora mostrará 0 porque aún no hay datos
async function cargarIndicadores() {
    try {
        // Total de incidentes
        const { count: total } = await supabaseClient
            .from('incidente')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('total-incidentes').textContent = total || 0;

    } catch (error) {
        console.log('Los indicadores se activarán cuando registres incidentes.');
    }
}

// Ejecutar al cargar la página
cargarIndicadores();