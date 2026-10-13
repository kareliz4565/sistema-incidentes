// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = "https://czaasfgyblmswnjxxbrn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFzZmd5Ymxtc3duanh4YnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODE0NjcsImV4cCI6MjEwNzM1NzQ2N30.oJiflCwgpODN760TcyNCHDg6mjJwzNNQpCmn4375y1g";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 2. LÓGICA DE LOGIN (Solo se ejecuta en index.html)
// ==========================================
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const correo = document.getElementById('correo').value;
        const contrasena = document.getElementById('contrasena').value;

        // CORREGIDO: 'usuario' en minúscula
        const { data, error } = await supabaseClient
            .from('usuario') 
            .select('*')
            .eq('correo', correo)
            .eq('contrasena', contrasena)
            .single();

        if (error || !data) {
            alert('❌ Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else {
            alert('✅ Bienvenido ' + data.nombre);
            localStorage.setItem('usuarioLogueado', JSON.stringify(data));
            window.location.href = 'dashboard.html'; 
        }
    });
}

// ==========================================
// 3. LÓGICA DE REGISTRO (Solo se ejecuta en registro.html)
// ==========================================
const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('reg-nombre').value;
        const correo = document.getElementById('reg-correo').value;
        const contrasena = document.getElementById('reg-contrasena').value;

        // CORREGIDO: 'usuario' en minúscula
        // Verificar si el correo ya existe
        const { data: existente } = await supabaseClient
            .from('usuario')
            .select('correo')
            .eq('correo', correo)
            .single();

        if (existente) {
            alert('⚠️ Este correo ya está registrado. Intenta iniciar sesión.');
            return;
        }

        // CORREGIDO: 'usuario' en minúscula
        // Insertar el nuevo usuario
        const { error } = await supabaseClient
            .from('usuario')
            .insert([{ 
                nombre: nombre, 
                correo: correo, 
                contrasena: contrasena, 
                activo: true 
            }]);

        if (error) {
            alert('❌ Error al registrar: ' + error.message);
        } else {
            alert('✅ Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
            window.location.href = 'index.html'; 
        }
    });
}