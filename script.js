document.addEventListener("DOMContentLoaded", function () {
    const alumnosKey = "alumnos";
    const asistenciasKey = "asistencias";

    const alumnos = JSON.parse(localStorage.getItem(alumnosKey)) || [];
    const asistencias = JSON.parse(localStorage.getItem(asistenciasKey)) || {};

    const formAgregar = document.getElementById("form-agregar-alumno");
    const formAsistencia = document.getElementById("form-asistencia");
    const resumen = document.getElementById("resumen");
    const fechaInput = document.getElementById("fecha");

    fechaInput.valueAsDate = new Date();

    let alumnosOmitidos = [];

    function guardarDatos() {
        localStorage.setItem(alumnosKey, JSON.stringify(alumnos));
        localStorage.setItem(asistenciasKey, JSON.stringify(asistencias));
    }

    function obtenerFechaActual() {
        return fechaInput.value;
    }

    function renderFormularioAsistencia() {
        formAsistencia.innerHTML = "";

        if (alumnos.length === 0) {
            formAsistencia.innerHTML = "<p>No hay alumnos registrados.</p>";
            return;
        }

        alumnos.sort((a, b) => {
            const apellidoA = `${a.paterno} ${a.materno} ${a.nombres}`;
            const apellidoB = `${b.paterno} ${b.materno} ${b.nombres}`;
            return apellidoA.localeCompare(apellidoB);
        });

        const fecha = obtenerFechaActual();
        const registro = asistencias[fecha] || {};
        alumnosOmitidos = [];

        alumnos.forEach((alumno, i) => {
            if (alumnosOmitidos.includes(alumno.id)) return;

            const div = document.createElement("div");
            div.id = `fila-${alumno.id}`;

            const label = document.createElement("label");
            label.textContent = `${alumno.paterno} ${alumno.materno}, ${alumno.nombres}`;

            const select = document.createElement("select");
            select.name = i;

            ["Asistió", "Tardanza", "Falta"].forEach(opcion => {
                const opt = document.createElement("option");
                opt.value = opcion;
                opt.textContent = opcion;
                select.appendChild(opt);
            });

            if (registro[alumno.id]) {
                select.value = registro[alumno.id];
            }

            const btnOmitir = document.createElement("button");
            btnOmitir.textContent = "Omitir";
            btnOmitir.type = "button";
            btnOmitir.style.marginLeft = "10px";
            btnOmitir.onclick = () => {
                document.getElementById(`fila-${alumno.id}`).remove();
                alumnosOmitidos.push(alumno.id);
                asistencias[fecha] = asistencias[fecha] || {};
                asistencias[fecha][alumno.id] = "Falta";
            };

            div.appendChild(label);
            div.appendChild(select);
            div.appendChild(btnOmitir);
            formAsistencia.appendChild(div);
        });

        const botonGuardar = document.createElement("button");
        botonGuardar.textContent = "Guardar Asistencia";
        botonGuardar.onclick = function () {
            const fecha = obtenerFechaActual();
            if (!asistencias[fecha]) asistencias[fecha] = {};

            alumnos.forEach((alumno, i) => {
                if (alumnosOmitidos.includes(alumno.id)) return;

                const select = formAsistencia.querySelector(`select[name="${i}"]`);
                if (select) {
                    const valor = select.value;
                    asistencias[fecha][alumno.id] = valor;
                }
            });

            guardarDatos();
            formAsistencia.innerHTML = "<p>✅ Asistencia guardada correctamente.</p>";
            renderTablaResumen();
        };

        formAsistencia.appendChild(botonGuardar);
    }

    function renderTablaResumen() {
        resumen.innerHTML = "";
        const fechas = Object.keys(asistencias).sort();

        const tabla = document.createElement("table");
        const thead = document.createElement("thead");
        let header = "<tr><th>Alumno</th>";

        fechas.forEach(fecha => {
            header += `
                <th>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                        <span>${fecha}</span>
                        <div>
                            <button onclick="modificarFecha('${fecha}')">✏️</button>
                            <button onclick="renombrarFecha('${fecha}')">🕓</button>
                            <button onclick="borrarFecha('${fecha}')">🗑️</button>
                        </div>
                    </div>
                </th>`;
        });        

        header += "<th>Eliminar Alumno</th></tr>";
        thead.innerHTML = header;
        tabla.appendChild(thead);

        const tbody = document.createElement("tbody");

        alumnos.forEach((alumno, index) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `<td>${alumno.paterno} ${alumno.materno}, ${alumno.nombres}</td>`;

            fechas.forEach(fecha => {
                const estado = asistencias[fecha]?.[alumno.id] || "";
                const simbolo = estado === "Asistió" ? "A" : estado === "Tardanza" ? "T" : estado === "Falta" ? "F" : "";

                const celda = document.createElement("td");
                celda.textContent = simbolo;
                celda.style.cursor = "pointer";
                celda.onclick = () => editarAsistenciaIndividual(fecha, alumno.id);
                fila.appendChild(celda);
            });

            const botonEliminar = document.createElement("button");
            botonEliminar.textContent = "🗑️";
            botonEliminar.onclick = () => eliminarAlumno(alumno.id);

            const tdEliminar = document.createElement("td");
            tdEliminar.appendChild(botonEliminar);

            fila.appendChild(tdEliminar);
            tbody.appendChild(fila);
        });

        tabla.appendChild(tbody);
        resumen.appendChild(tabla);

        renderResumenGeneral();
    }

    function renderResumenGeneral() {
        const resumenGeneral = document.createElement("div");
        resumenGeneral.style.marginTop = "20px";
        resumenGeneral.innerHTML = "<h3>Resumen General</h3>";

        const resumenTabla = document.createElement("table");
        const header = `<tr>
            <th>Alumno</th>
            <th>Asistencias</th>
            <th>Tardanzas</th>
            <th>Faltas</th>
        </tr>`;

        resumenTabla.innerHTML = header;

        alumnos.forEach((alumno) => {
            let asistenciasCount = 0;
            let tardanzasCount = 0;
            let faltasCount = 0;

            for (const fecha in asistencias) {
                const asistencia = asistencias[fecha][alumno.id];
                if (asistencia === "Asistió") asistenciasCount++;
                if (asistencia === "Tardanza") tardanzasCount++;
                if (asistencia === "Falta") faltasCount++;
            }

            const row = `<tr>
                <td>${alumno.paterno} ${alumno.materno}, ${alumno.nombres}</td>
                <td>${asistenciasCount}</td>
                <td>${tardanzasCount}</td>
                <td>${faltasCount}</td>
            </tr>`;

            resumenTabla.innerHTML += row;
        });

        resumenGeneral.appendChild(resumenTabla);
        resumen.appendChild(resumenGeneral);
    }

    function editarAsistenciaIndividual(fecha, alumnoId) {
        const nuevoValor = prompt("Cambiar asistencia (A, T, F):", obtenerSimbolo(asistencias[fecha][alumnoId]));
        if (nuevoValor) {
            const valorTexto = nuevoValor.toUpperCase() === "A" ? "Asistió"
                              : nuevoValor.toUpperCase() === "T" ? "Tardanza"
                              : nuevoValor.toUpperCase() === "F" ? "Falta"
                              : null;
            if (valorTexto) {
                asistencias[fecha][alumnoId] = valorTexto;
                guardarDatos();
                renderTablaResumen();
            } else {
                alert("Valor no válido. Usa A, T o F.");
            }
        }
    }

    function obtenerSimbolo(valorTexto) {
        return valorTexto === "Asistió" ? "A" : valorTexto === "Tardanza" ? "T" : valorTexto === "Falta" ? "F" : "";
    }

    function eliminarAlumno(id) {
        const alumno = alumnos.find(a => a.id === id);
        if (confirm(`¿Eliminar al alumno ${alumno.paterno} ${alumno.materno}, ${alumno.nombres}?`)) {
            const index = alumnos.findIndex(a => a.id === id);
            if (index > -1) {
                alumnos.splice(index, 1);
                for (const fecha in asistencias) {
                    delete asistencias[fecha][id];
                }
                guardarDatos();
                renderTodo();
            }
        }
    }

    window.modificarFecha = function (fecha) {
        fechaInput.value = fecha;
        renderFormularioAsistencia();
        window.scrollTo(0, 0);
    };

    window.borrarFecha = function (fecha) {
        if (confirm(`¿Borrar todos los registros de la fecha ${fecha}?`)) {
            delete asistencias[fecha];
            guardarDatos();
            renderTodo();
        }
    };

    window.renombrarFecha = function (fechaOriginal) {
        const nuevaFecha = prompt("Nueva fecha (AAAA-MM-DD):", fechaOriginal);
        if (nuevaFecha && nuevaFecha !== fechaOriginal) {
            if (asistencias[nuevaFecha]) {
                alert("⚠️ Ya existe una asistencia con esa fecha.");
                return;
            }
            asistencias[nuevaFecha] = asistencias[fechaOriginal];
            delete asistencias[fechaOriginal];
            guardarDatos();
            renderTodo();
        }
    };

    formAgregar.addEventListener("submit", function (e) {
        e.preventDefault();
        const paterno = document.getElementById("apellido-paterno").value.trim();
        const materno = document.getElementById("apellido-materno").value.trim();
        const nombres = document.getElementById("nombres").value.trim();

        if (!paterno || !materno || !nombres) {
            alert("Por favor, llena todos los campos.");
            return;
        }

        const id = `${paterno}-${materno}-${nombres}`.toLowerCase().replace(/\s+/g, "_");

        if (alumnos.find(a => a.id === id)) {
            alert("Alumno ya existe.");
            return;
        }

        alumnos.push({ id, paterno, materno, nombres });
        guardarDatos();
        document.getElementById("apellido-paterno").value = "";
        document.getElementById("apellido-materno").value = "";
        document.getElementById("nombres").value = "";
        renderTodo();
    });

    fechaInput.addEventListener("change", renderFormularioAsistencia);

    function renderTodo() {
        renderFormularioAsistencia();
        renderTablaResumen();
    }

    renderTodo();
});
