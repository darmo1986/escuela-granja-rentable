# Cuaderno de granja web — esquema de mejora
Fecha: 14 de noviembre de 2026
Proyecto: Granja Rentable
Estado: propuesta detallada para revisión; este documento no implementa ni publica la aplicación.

## 1. Punto de partida comprobado
La página app.html del repositorio presenta Registro de pollos 1.0.10 para Android: lotes, pesos, tareas, hoja diaria, vacunas, tratamientos, plazos de espera y cierre económico. Describe almacenamiento en el móvil sin cuenta y funcionamiento sin conexión.
Se ha revisado esa página, no el código fuente Android ni una versión web funcional del cuaderno. No se puede asegurar que exista intercambio de datos entre ambas.
La conexión de Google Drive sigue pendiente de comprobar. La entrada con Google que aparece en registro.html usa el acceso de la web; no prueba que exista permiso para hacer copias del cuaderno en Drive.
Objetivo: usar un cuaderno desde móvil y ordenador dentro de la web, con registro local y copias opcionales en Drive.

## 2. Acceso y diseño
Propuesta de entrada: botón «Abrir cuaderno web» en app.html, junto a la descarga Android. Ruta propuesta: cuaderno/, pendiente de comprobar que no choque con trabajo en otras ramas.
Diseño: verde de Granja Rentable, tarjetas claras, textos grandes y modo oscuro. En móvil, navegación inferior: Inicio, Lotes, Anotar y Más; en ordenador, barra lateral.
El registro básico no exigirá conectar Google. Al entrar se explicará: «Tus datos se guardan en este navegador. Descarga una copia o conecta Drive para protegerlos».
No afirmar que una copia local es una copia en la nube.

## 3. Pantallas y acciones
| Pantalla | Contenido | Acciones |
| --- | --- | --- |
| Inicio | Lotes activos, tareas de hoy, último registro y estado de la copia | Crear lote, anotar hoy, abrir lote |
| Crear lote | Nombre, línea o raza, nacimiento o edad estimada, fecha de entrada, aves iniciales, moneda y unidades | Guardar, cancelar |
| Resumen del lote | Edad, aves actuales, última pesada, pienso y agua registrados | Abrir cada sección |
| Hoja diaria | Fecha, pienso, agua, bajas, descartes, incorporaciones, temperatura y notas | Guardar y editar |
| Pesadas | Fecha, muestra individual o peso total del grupo, número de aves pesadas | Calcular promedio y ver gráfica |
| Salud | Vacunas y tratamientos anotados por el usuario | Registrar producto, fechas y plazo de espera indicado |
| Tareas | Calendario y lista de tareas configuradas por el usuario | Marcar hecha, aplazar y añadir |
| Notas y fotos | Observaciones por lote y fecha | Añadir, editar, eliminar |
| Cuentas | Gastos, ingresos y criterios de valoración | Registrar movimiento y consultar resultados |
| Cierre | Inventario final, resultados y registros pendientes | Exportar y archivar |
| Copias | Última copia local exportada y última copia confirmada en Drive | Descargar, importar, conectar y restaurar |
| Ajustes | Moneda, unidades, tema y gestión de datos | Cambiar preferencias y borrar con confirmación |

Primer alcance: pollos de engorde. Ponedoras y codornices quedan como ampliación, con indicadores propios.

## 4. Qué se guarda
- Lote: identificador estable, nombre, especie, línea, fechas, aves iniciales, moneda, estado y fechas de creación/modificación.
- Movimiento de aves: fecha, tipo, cantidad y causa opcional. Las compras, ventas y traslados se distinguen de las bajas.
- Registro diario: lote, fecha, pienso consumido, agua consumida, temperatura, humedad, amoníaco opcional, observaciones y datos desconocidos.
- Pesada: lote, fecha, método, cantidad de aves y pesos, con unidad explícita.
- Salud: producto anotado, motivo, inicio, fin y plazo de espera con su procedencia. No generar una prescripción ni inventar el plazo.
- Tarea: lote, título, fecha, estado y origen manual o guía identificada.
- Movimiento económico: fecha, concepto, importe, moneda, tipo y lote.
- Nota y foto: identificador, lote, fecha, texto y archivo asociado.
- Copia: versión de formato, fecha, identificador del dispositivo y contenido que incluye.
Usar identificadores y fechas de modificación para detectar duplicados y conflictos. Un campo vacío significa «sin dato», nunca cero.

## 5. Cálculos y controles
- Aves actuales = iniciales + entradas − bajas − descartes − ventas − otras salidas. Rechazar operaciones que dejen saldo negativo.
- Peso medio individual = suma de pesos / aves pesadas. En pesada de grupo: descontar la tara y dividir el peso neto por el número de aves.
- El CV solo se calcula con pesos individuales y muestra suficiente; indicar tamaño de muestra y convención estadística.
- Mortalidad: definir el denominador según el tipo de lote. En la primera versión, porcentaje del lote cerrado sin incorporaciones; si hay movimientos, mostrar recuentos hasta definir una métrica válida.
- Conversión: pienso consumido / ganancia de peso vivo para un periodo comparable, solo si existen datos suficientes y se contabilizan los movimientos. No confundir compra de pienso con consumo ni peso final con ganancia.
- Resultado económico registrado = ingresos − gastos registrados. Mostrar «resultado parcial» si faltan partidas y distinguirlo de beneficio definitivo.
- Coste por ave o kg: indicar el denominador exacto y no dividir por cero. No mezclar monedas sin una conversión explícita.
- Curva de raza: incorporar únicamente referencias identificadas por línea, sexo cuando corresponda, edición y unidad. No reutilizar automáticamente la franja ±10 % como diagnóstico.
Los avisos explicarán qué dato los provoca; no diagnosticarán enfermedades.

## 6. Guardado local y funcionamiento sin conexión
Propuesta técnica: almacenamiento estructurado en IndexedDB y exportación en un formato versionado; validar su compatibilidad al implementar.
Guardar automáticamente cada operación y confirmar «Guardado en este dispositivo» solo después de completarla. Conservar datos tras recargar y cerrar la pestaña.
Para el uso sin conexión, preparar los archivos esenciales y mostrar cuándo la aplicación está lista. La primera visita necesita conexión.
Advertir de forma breve que borrar datos del navegador o usar navegación privada puede perder el registro local. Si el almacenamiento falla o se llena, comunicarlo y ofrecer exportación.
Las fotos se redimensionarán con límites visibles y vista previa; comprobar capacidad antes de añadirlas.

## 7. Copias en Google Drive
Botón «Conectar Google Drive» en Copias. El propósito es copia y restauración; no prometer sincronización instantánea entre dispositivos.
Flujo: explicar qué se guardará → autorización de Google → crear copia → confirmar fecha y contenido → permitir restauración.
Solicitar el permiso mínimo adecuado para archivos de la aplicación. Verificar documentación y configuración vigente antes de implementar; no colocar secretos en JavaScript público ni en Git.
Pendientes concretos: localizar el proyecto Google existente si lo hay, confirmar el identificador OAuth de esta aplicación, orígenes autorizados, configuración de consentimiento y disponibilidad de Drive. No solicitar al usuario que pegue contraseñas.
Distinguir «Conectado» de «Copia completada». Si expira el acceso, conservar el cuaderno local y explicar que la copia necesita reconexión.
Primera entrega: copia manual completa. Copias automáticas y sincronización se valoran después de demostrar restauración fiable.
Restaurar: validar formato y versión, mostrar lotes y fechas incluidos, hacer una copia previa del estado local y pedir confirmación antes de reemplazar. No sobrescribir en silencio datos más recientes.
Cerrar la conexión no debe borrar registros locales ni copias remotas sin una acción explícita.
Definir y mostrar si las fotos están incluidas; nunca llamar «completa» a una copia que las omite.

## 8. Exportación e intercambio con Android
Ofrecer copia completa descargable y CSV por lote para registros tabulares. El CSV no sustituye la copia porque no conserva todas las relaciones y fotos.
No asumir que la APK importa este formato. Para compartir datos con Android, hace falta obtener y revisar su formato real; añadir un adaptador solo después de probarlo.
La web y Android se presentarán como versiones con capacidades propias hasta verificar compatibilidad.

## 9. Implementación por entregas
1. Revisar ramas y cambios existentes, localizar cualquier cuaderno ya iniciado y recuperar su estado; evitar duplicar una implementación.
2. Crear panel, lotes y registros diarios con guardado local y exportación. Verificar recarga, fechas y cantidades.
3. Añadir pesadas, tareas, salud, cuentas y fotos con los controles descritos.
4. Probar copia local y restauración integral antes de conectar Drive.
5. Configurar Google, probar copia/restauración y errores de permisos.
6. Integrar acceso desde app.html, revisar móvil y ordenador, accesibilidad y uso sin conexión.
7. Presentar una versión revisable a Pablo. Publicación y fusión requieren su OK específico para esa entrega.

## 10. Criterios de aceptación
- Crear dos lotes y mantener sus registros separados tras cerrar y volver a abrir.
- Editar una anotación sin duplicar consumos ni movimientos.
- Detectar valores negativos, fechas incoherentes y salidas superiores a las aves disponibles.
- No convertir datos ausentes en consumos cero ni en resultados definitivos.
- Exportar y restaurar lotes, salud, cuentas, notas y fotos sin pérdida.
- Cancelar una restauración sin modificar el cuaderno.
- Conservar el trabajo si Drive falla o se desconecta.
- Mostrar la fecha real de la última copia confirmada.
- Usar las funciones principales en móvil y ordenador, con teclado y etiquetas comprensibles.
- Confirmar que los datos de cada navegador/usuario no se exponen públicamente.
- No mostrar «sincronizado», «guardado» o «publicado» antes de verificarlo.

## 11. Entrega de este encargo
Este archivo es el esquema solicitado. Subirlo a una rama de revisión de GitHub no implementa el panel ni activa Google Drive. El siguiente cambio de código debe basarse en este esquema y en el estado real recuperado del proyecto.
