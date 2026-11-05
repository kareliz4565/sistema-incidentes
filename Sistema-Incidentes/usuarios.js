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
// 2. MOTOR DE RECOMENDACIONES (Guía de resolución)
// ==========================================
function obtenerRecomendacion(categoriaNombre, prioridadNivel) {
    const cat = (categoriaNombre || '').toLowerCase();
    
    // Guía según la categoría
    if (cat.includes('phishing')) {
        return "1. Aislar el correo. 2. No abrir enlaces. 3. Cambiar contraseñas. 4. Reportar al remitente.";
    } 
    if (cat.includes('malware') || cat.includes('ransomware')) {
        return "1. Desconectar el equipo de la red. 2. Escanear con antivirus. 3. Restaurar desde copia de seguridad si es necesario.";
    }
    if (cat.includes('acceso') || cat.includes('intrusión')) {
        return "1. Bloquear la cuenta comprometida. 2. Revisar logs de acceso. 3. Forzar cambio de contraseña y aplicar doble factor.";
    }
    if (cat.includes('ddos')) {
        return "1. Activar mitigación en el firewall. 2. Contactar al proveedor de internet. 3. Monitorear el tráfico.";
    }

    // Si no coincide con ninguna, se usa la prioridad
    if (prioridadNivel === 'Critica' || prioridadNivel === 'Alta') {
        return "🔴 Aislar el activo afectado y escalar inmediatamente al equipo de seguridad.";
    }
    return "🟡 Documentar el incidente, investigar la causa raíz y aplicar parches de seguridad.";
}

// ==========================================
// 3. CARGAR Y MOSTRAR INCIDENTES ASIGNADOS
// ==========================================
async function cargarUsuarios() {
    const tbody = document.getElementById('tabla-usuarios');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>`;

    // Traer usuarios
    const { data: usuarios, error: errU } = await supabaseClient
        .from('usuario').select('*');

    // Traer incidentes con todas sus relaciones (incluyendo al asignado)
    const { data: incidentes, error: errI } = await supabaseClient
        .from('incidente')
        .select(`
            id_incidente, 
            titulo, 
            id_asignado, 
            estado:id_estado(nombre),
            categoria:id_categoria(nombre),
            prioridad:id_prioridad(nombre, nivel),
            asignado:id_asignado(nombre)
        `)
        .order('id_incidente', { ascending: false });

    if (errU || errI) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444;">Error al cargar datos</td></tr>`;
        return;
    }

    todosUsuarios = usuarios || [];
    todosIncidentes = incidentes || [];

    // Renderizar la tabla de incidentes
    if (todosIncidentes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay incidentes registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = todosIncidentes.map(inc => {
        const nivelPrio = (inc.prioridad?.nivel || 'baja').toLowerCase();
        const badgePrio = `<span class="badge badge-${nivelPrio}">${inc.prioridad?.nombre || '-'}</span>`;
        
        // Obtener la recomendación inteligente
        const recomendacion = obtenerRecomendacion(inc.categoria?.nombre, inc.prioridad?.nivel);

        return `
        <tr>
            <td>#${inc.id_incidente}</td>
            <td>${inc.titulo}</td>
            <td>${inc.categoria?.nombre || '-'}</td>
            <td>${badgePrio}</td>
            <td>${inc.asignado?.nombre || '<em style="color:#94a3b8;">Sin asignar</em>'}</td>
            <td>${inc.estado?.nombre || '-'}</td>
            <td><small style="color:#cbd5e1; line-height: 1.4; display:block; max-width: 300px;">${recomendacion}</small></td>
        </tr>
        `;
    }).join('');

    // Actualizar resumen de tarjetas y dropdowns
    renderizarResumen();
    llenarDropdownUsuarios();
    llenarDropdownIncidentes();
}

// ==========================================
// 4. RESUMEN TIPO TARJETAS
// ==========================================
function renderizarResumen() {
    const contenedor = document.getElementById('resumen-usuarios');
    
    const totalAsignados = todosIncidentes.filter(i => i.id_asignado).length;
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
// 5. LLENAR DROPDOWNS
// ==========================================
function llenarDropdownUsuarios() {
    const select = document.getElementById('select-usuario');
    select.innerHTML = '<option value="">Seleccione un usuario...</option>';
    todosUsuarios.forEach(u => {
        select.innerHTML += `<option value="${u.id_usuario}">${u.nombre} (${u.rol || 'Empleado'})</option>`;
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
// 6. ASIGNAR INCIDENTE
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
        await cargarUsuarios(); // Recargar la tabla
    }
});
// ==========================================
// 6.5 MOTOR DE AUTO-ASIGNACIÓN
// ==========================================
async function autoAsignarIncidentes() {
    // 1. Filtrar solo Analistas (o Administradores) que estén activos
    const analistas = todosUsuarios.filter(u => 
        (u.rol === 'Analista de Ciberseguridad' || u.rol === 'Administrador') && u.activo === true
    );

    if (analistas.length === 0) {
        alert('⚠️ No hay analistas o administradores activos para asignar.');
        return;
    }

    // 2. Filtrar los incidentes que no tienen asignado y no están cerrados
    const pendientes = todosIncidentes.filter(inc => 
        !inc.id_asignado && (inc.estado?.nombre || '').toLowerCase() !== 'cerrado'
    );

    if (pendientes.length === 0) {
        alert('✅ No hay incidentes pendientes por asignar.');
        return;
    }

    const confirmar = confirm(`Se van a asignar ${pendientes.length} incidentes automáticamente a los analistas disponibles. ¿Deseas continuar?`);
    if (!confirmar) return;

    // 3. Contar cuántos incidentes tiene actualmente cada analista
    const cargaAnalistas = analistas.map(a => {
        const asignados = todosIncidentes.filter(inc => 
            inc.id_asignado === a.id_usuario && 
            (inc.estado?.nombre || '').toLowerCase() !== 'cerrado'
        ).length;
        return { ...a, cargaActual: asignados };
    });

    let asignacionesExitosas = 0;

    // 4. Asignar uno por uno al que tenga menos carga (Balanceo de carga)
    for (const incidente of pendientes) {
        // Ordenar analistas por carga (menor primero)
        cargaAnalistas.sort((a, b) => a.cargaActual - b.cargaActual);
        
        // Elegir al analista con menos carga
        const elegido = cargaAnalistas[0];

        // Actualizar en Supabase
        const { error } = await supabaseClient
            .from('incidente')
            .update({ id_asignado: elegido.id_usuario })
            .eq('id_incidente', incidente.id_incidente);

        if (!error) {
            // Actualizar los datos locales para el siguiente ciclo
            incidente.id_asignado = elegido.id_usuario;
            elegido.cargaActual++;
            asignacionesExitosas++;
        }
    }

   
// ==========================================
// 7. INICIALIZAR
// ==========================================
window.scrollTo(0, 0);
cargarUsuarios();
