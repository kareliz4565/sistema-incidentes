// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = "https://czaasfgyblmswnjxxbrn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFzZmd5Ymxtc3duanh4YnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODE0NjcsImV4cCI6MjEwNzM1NzQ2N30.oJiflCwgpODN760TcyNCHDg6mjJwzNNQpCmn4375y1g";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let usuarioActual = null;
let activosCache = [];
let prioridadesCache = [];
let categoriasCache = [];
let estadosCache = [];

// ==========================================
// 0. FIX: FORZAR SCROLL AL INICIO AL CARGAR
// ==========================================
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
});

// ==========================================
// 1. VERIFICAR SESIÓN
// ==========================================
const usuarioGuardado = localStorage.getItem('usuarioLogueado');

if (!usuarioGuardado) {
    alert('⚠️ Debes iniciar sesión primero.');
    window.location.href = 'index.html';
} else {
    usuarioActual = JSON.parse(usuarioGuardado);
    document.getElementById('nombre-usuario').textContent = usuarioActual.nombre;
    document.getElementById('user-avatar').textContent = usuarioActual.nombre.charAt(0).toUpperCase();
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
// 3. CARGAR DROPDOWNS Y CACHÉS
// ==========================================
async function cargarDropdowns() {
    // Llenar filtros visuales
    const { data: prioridades } = await supabaseClient.from('prioridad').select('*');
    prioridadesCache = prioridades || [];
    const filtroPri = document.getElementById('filtro-prioridad');
    if (prioridades) {
        prioridades.forEach(p => {
            filtroPri.innerHTML += `<option value="${p.id_prioridad}">${p.nombre}</option>`;
        });
    }

    const { data: estados } = await supabaseClient.from('estado').select('*');
    estadosCache = estados || [];
    const filtroEst = document.getElementById('filtro-estado');
    if (estados) {
        estados.forEach(e => {
            filtroEst.innerHTML += `<option value="${e.id_estado}">${e.nombre}</option>`;
        });
    }

    // Cachés para el análisis NLP
    const { data: categorias } = await supabaseClient.from('categoria').select('*');
    categoriasCache = categorias || [];

    const { data: activos } = await supabaseClient.from('activo').select('*');
    activosCache = activos || [];
}

// ==========================================
// 4. MOTOR NLP: LEER TEXTO Y DETECTAR
// ==========================================
function analizarTexto() {
    const texto = (document.getElementById('titulo').value + " " + document.getElementById('descripcion').value).toLowerCase();
    
    const dispCat = document.getElementById('categoria-detectada');
    const dispAct = document.getElementById('activo-detectado');
    const dispPri = document.getElementById('prioridad-calculada');

    if (texto.trim().length < 10) {
        dispCat.textContent = 'Esperando descripción...';
        dispCat.style.color = '#94a3b8';
        dispAct.textContent = 'Esperando descripción...';
        dispAct.style.color = '#94a3b8';
        dispPri.textContent = 'Esperando descripción...';
        dispPri.style.color = '#94a3b8';
        return null;
    }

    // --- LÓGICA DE CATEGORÍA ---
    let catDetectada = "Acceso no autorizado"; // Por defecto
    if (texto.includes('correo') || texto.includes('enlace') || texto.includes('phishing') || texto.includes('banco')) {
        catDetectada = "Phishing";
    } else if (texto.includes('virus') || texto.includes('malware') || texto.includes('ransomware') || texto.includes('cifrado')) {
        catDetectada = "Malware";
    } else if (texto.includes('contraseña') || texto.includes('login') || texto.includes('acceso') || texto.includes('intruso')) {
        catDetectada = "Acceso no autorizado";
    }
    dispCat.textContent = `📁 ${catDetectada}`;
    dispCat.style.color = '#38bdf8';
    dispCat.style.fontWeight = 'bold';

    // --- LÓGICA DE ACTIVO ---
    let actDetectado = "Equipo empleado 01";
    if (texto.includes('servidor') || texto.includes('base de datos')) {
        actDetectado = "Servidor Principal";
    } else if (texto.includes('correo')) {
        actDetectado = "Correo Corporativo";
    } else if (texto.includes('router') || texto.includes('red') || texto.includes('wifi')) {
        actDetectado = "Red / Router";
    } else if (texto.includes('pc') || texto.includes('computador')) {
        actDetectado = "PC de Recepción";
    }
    dispAct.textContent = `💻 ${actDetectado}`;
    dispAct.style.color = '#38bdf8';
    dispAct.style.fontWeight = 'bold';

    // --- LÓGICA DE PRIORIDAD ---
    let impacto = 'Medio';
    let probabilidad = 'Media';
    let riesgo = 'Medio';
    let prioridad = 'Media';

    if (texto.includes('servidor') || texto.includes('base de datos') || texto.includes('robo') || texto.includes('cifrado') || texto.includes('ransomware')) {
        impacto = 'Alto'; probabilidad = 'Alta'; riesgo = 'Critico'; prioridad = 'Critica';
    } else if (texto.includes('correo') || texto.includes('pc') || texto.includes('contraseña')) {
        impacto = 'Medio'; probabilidad = 'Media'; riesgo = 'Alto'; prioridad = 'Alta';
    }

    const iconos = { 'Baja': '🟢', 'Media': '🟡', 'Alta': '🟠', 'Critica': '🔴' };
    const colores = { 'Baja': '#22c55e', 'Media': '#eab308', 'Alta': '#f97316', 'Critica': '#ef4444' };
    
    dispPri.textContent = `${iconos[prioridad]} ${prioridad}`;
    dispPri.style.color = colores[prioridad];
    dispPri.style.fontWeight = 'bold';

    return { catDetectada, actDetectado, impacto, probabilidad, riesgo, prioridad };
}

// Escuchar lo que el usuario escribe para analizarlo en tiempo real
document.getElementById('titulo').addEventListener('input', analizarTexto);
document.getElementById('descripcion').addEventListener('input', analizarTexto);


// ==========================================
// 5. CARGAR INCIDENTES CON SUS RELACIONES
// ==========================================
async function cargarIncidentes(filtroPrioridad = '', filtroEstado = '') {
    const tbody = document.getElementById('tabla-incidentes');
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Cargando...</td></tr>`;

    let query = supabaseClient
        .from('incidente')
        .select(`
            *,
            categoria:id_categoria (nombre),
            prioridad:id_prioridad (nombre, nivel),
            estado:id_estado (nombre),
            activo:id_activo (nombre),
            usuario:id_usuario (nombre),
            asignado:id_asignado (nombre)
        `)
        .order('id_incidente', { ascending: false });

    if (filtroPrioridad) query = query.eq('id_prioridad', filtroPrioridad);
    if (filtroEstado) query = query.eq('id_estado', filtroEstado);

    const { data, error } = await query;

    if (error) {
        console.error('Error:', error);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#ef4444;">Error al cargar incidentes</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No hay incidentes registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(inc => {
        const fecha = new Date(inc.fecha_reporte).toLocaleString('es-CO', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const nivelPrioridad = (inc.prioridad?.nivel || '').toLowerCase();
        const badgePrioridad = `<span class="badge badge-${nivelPrioridad}">${inc.prioridad?.nombre || '-'}</span>`;
        
        const riesgoInfo = inc.nivel_riesgo 
            ? `<br><small style="color:#94a3b8; font-size:0.75rem;">Riesgo: ${inc.nivel_riesgo}</small>` 
            : '';

        const reportadoPor = inc.usuario?.nombre || 'Desconocido';
        const asignadoA = inc.asignado?.nombre ? `<br><small style="color:#38bdf8;">👤 ${inc.asignado.nombre}</small>` : '<br><small style="color:#94a3b8;">Sin asignar</small>';

        return `
        <tr>
            <td>#${inc.id_incidente}</td>
            <td>${inc.titulo}</td>
            <td>${inc.categoria?.nombre || '-'}</td>
            <td>${badgePrioridad}${riesgoInfo}</td>
            <td>${inc.estado?.nombre || '-'}</td>
            <td>${inc.activo?.nombre || '-'}</td>
            <td>${reportadoPor} ${asignadoA}</td>
            <td>${fecha}</td>
            <td>
                <button class="btn-action" onclick="cambiarEstado(${inc.id_incidente})" title="Cambiar estado">🔁</button>
                <button class="btn-delete" onclick="eliminarIncidente(${inc.id_incidente})" title="Eliminar">🗑️</button>
            </td>
        </tr>
        `;
    }).join('');
}

// ==========================================
// 6. REGISTRAR INCIDENTE (Con NLP y Auto-asignación)
// ==========================================
document.getElementById('form-incidente').addEventListener('submit', async (e) => {
    e.preventDefault();

    const analisis = analizarTexto();
    if (!analisis) {
        alert('⚠️ La descripción es muy corta. Escribe un poco más para que el sistema pueda analizarla.');
        return;
    }

    const catEncontrada = categoriasCache.find(c => c.nombre === analisis.catDetectada) || categoriasCache[0];
    const actEncontrado = activosCache.find(a => a.nombre === analisis.actDetectado) || activosCache[0];
    const estEncontrado = estadosCache.find(e => e.nombre === 'Abierto') || estadosCache[0];
    const priEncontrada = prioridadesCache.find(p => p.nombre.toLowerCase().includes(analisis.prioridad.toLowerCase())) || prioridadesCache[0];

    // Auto-asignación al analista con menos carga
    const { data: analistas } = await supabaseClient.from('usuario').select('id_usuario').eq('rol', 'Analista de Ciberseguridad').eq('activo', true);
    let idAsignadoAuto = null;
    if (analistas && analistas.length > 0) {
        const conteo = await Promise.all(analistas.map(async (ana) => {
            const { count } = await supabaseClient.from('incidente').select('*', { count: 'exact', head: true }).eq('id_asignado', ana.id_usuario).neq('id_estado', 3);
            return { id_usuario: ana.id_usuario, carga: count || 0 };
        }));
        conteo.sort((a, b) => a.carga - b.carga);
        idAsignadoAuto = conteo[0].id_usuario;
    }

    const nuevoIncidente = {
        titulo: document.getElementById('titulo').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        id_categoria: catEncontrada?.id_categoria || 1,
        id_estado: estEncontrado?.id_estado || 1,
        id_activo: actEncontrado?.id_activo || 1,
        id_usuario: usuarioActual.id_usuario, 
        id_asignado: idAsignadoAuto,
        id_prioridad: priEncontrada?.id_prioridad || 1,
        impacto: analisis.impacto,
        probabilidad: analisis.probabilidad,
        nivel_riesgo: analisis.riesgo,
        fecha_reporte: new Date().toISOString(),
        activo: true
    };

    const { error } = await supabaseClient.from('incidente').insert([nuevoIncidente]);

    if (error) {
        alert('❌ Error al registrar: ' + error.message);
    } else {
        alert(`✅ Incidente registrado exitosamente.\n\n🧠 ANÁLISIS DEL SISTEMA:\n• Categoría: ${analisis.catDetectada}\n• Activo: ${analisis.actDetectado}\n• Prioridad: ${analisis.prioridad}\n• Asignado a un analista automáticamente.`);
        
        document.getElementById('form-incidente').reset();
        
        document.getElementById('categoria-detectada').textContent = 'Esperando descripción...';
        document.getElementById('categoria-detectada').style.color = '#94a3b8';
        document.getElementById('activo-detectado').textContent = 'Esperando descripción...';
        document.getElementById('activo-detectado').style.color = '#94a3b8';
        document.getElementById('prioridad-calculada').textContent = 'Esperando descripción...';
        document.getElementById('prioridad-calculada').style.color = '#94a3b8';
        
        cargarIncidentes();
    }
});

// ==========================================
// 7. CAMBIAR ESTADO DEL INCIDENTE
// ==========================================
async function cambiarEstado(id) {
    const { data: estados } = await supabaseClient
        .from('estado').select('*').order('id_estado');

    let opciones = "Selecciona el nuevo estado:\n\n";
    estados.forEach((e, i) => {
        opciones += `${i + 1}. ${e.nombre}\n`;
    });

    const seleccion = prompt(opciones + "\nEscribe el número:");

    if (!seleccion) return;

    const indice = parseInt(seleccion) - 1;
    if (isNaN(indice) || indice < 0 || indice >= estados.length) {
        alert('⚠️ Opción no válida.');
        return;
    }

    const nuevoEstado = estados[indice];

    const { error } = await supabaseClient
        .from('incidente')
        .update({ 
            id_estado: nuevoEstado.id_estado,
            fecha_ultima_actualizacion: new Date().toISOString()
        })
        .eq('id_incidente', id);

    if (error) {
        alert('❌ Error al actualizar: ' + error.message);
    } else {
        alert(`✅ Estado actualizado a: ${nuevoEstado.nombre}`);
        cargarIncidentes();
    }
}

// ==========================================
// 8. ELIMINAR INCIDENTE
// ==========================================
async function eliminarIncidente(id) {
    const confirmar = confirm('¿Estás segura de eliminar este incidente?');
    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('incidente')
        .delete()
        .eq('id_incidente', id);

    if (error) {
        alert('❌ Error al eliminar: ' + error.message);
    } else {
        alert('✅ Incidente eliminado.');
        cargarIncidentes();
    }
}

// ==========================================
// 9. FILTROS
// ==========================================
document.getElementById('filtro-prioridad').addEventListener('change', () => {
    const pri = document.getElementById('filtro-prioridad').value;
    const est = document.getElementById('filtro-estado').value;
    cargarIncidentes(pri, est);
});

document.getElementById('filtro-estado').addEventListener('change', () => {
    const pri = document.getElementById('filtro-prioridad').value;
    const est = document.getElementById('filtro-estado').value;
    cargarIncidentes(pri, est);
});

function limpiarFiltros() {
    document.getElementById('filtro-prioridad').value = '';
    document.getElementById('filtro-estado').value = '';
    cargarIncidentes();
}

// ==========================================
// 10. INICIALIZAR
// ==========================================
async function init() {
    window.scrollTo(0, 0);
    
    await cargarDropdowns();
    await cargarIncidentes();
    
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, 150);
}

init();
