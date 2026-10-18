/* Una cuenta para todo el sitio. El correo y la contraseña van a Supabase.
   Si el servidor no responde, se avisa y no se guarda la contraseña.
   Google solo redirige cuando el proyecto lo tiene activo.
   La biblioteca se sirve desde este sitio y solo se carga al entrar,
   en Mi cuenta, o si ya había una sesión. */
(function () {
  var SESION = "gr_sesion";
  var DATOS = "gr_cuenta_datos";
  var root = (document.body && document.body.dataset.root) || "";
  var oyentes = [];
  var cliente = null;
  var listoNube = null;
  var usuarioActual = null;
  var cursoTimer = 0;
  var googleApagado = true;
  var ultimoError = "";
  try { localStorage.removeItem("gr_cuentas"); } catch (eCu) {}

  function nube() {
    var c = (window.GR && GR.comunidad) || {};
    var url = String(c.supabaseUrl || "").replace(/\/$/, "");
    var key = String(c.supabaseAnonKey || "").trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) return null;
    if (!key || key === "TU_CLAVE_ANON_PUBLICA" || /tu_clave|placeholder/i.test(key)) return null;
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return null;
    return { url: url, key: key };
  }

  function modoDemo() { return false; }

  function falloDeRed(e) {
    var m = String(e && (e.message || e) || "");
    return /failed to fetch|network|load failed|no se pudo cargar|timeout|authretryable/i.test(m);
  }

  function mensajeGoogle() {
    mensaje("Google todavía no está activado. Entra con correo y contraseña.", true);
  }

  function apodoValido(s) {
    s = String(s || "").trim();
    if (s.length < 2 || s.length > 40) return "";
    if (s.indexOf("@") !== -1) return "";
    if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(s)) return "";
    return s;
  }

  function apodoPublico(meta, id) {
    meta = meta || {};
    var s = apodoValido(meta.nombre);
    if (s) return s;
    var digits = String(id || "").replace(/[^0-9a-f]/gi, "").slice(-4) || "0000";
    return ("Vecino " + digits).slice(0, 40);
  }

  function leerJson(clave, vacio) {
    try {
      var raw = localStorage.getItem(clave);
      return raw ? JSON.parse(raw) : vacio;
    } catch (e) { return vacio; }
  }

  function leerLocal() {
    var s = leerJson(SESION, null);
    if (!s || !s.id || !s.correo) return null;
    return s;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m];
    });
  }

  function correoValido(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
  }

  function nombreDe(s) {
    return apodoValido(s);
  }

  function iniciales(nombre) {
    var partes = String(nombre || "").trim().split(/\s+/).slice(0, 2);
    return partes.map(function (p) { return p.charAt(0).toUpperCase(); }).join("") || "?";
  }

  function urlDe(pagina) {
    return new URL(root + pagina, location.href).href;
  }

  function avisar() {
    oyentes.forEach(function (fn) {
      try { fn(usuarioActual); } catch (e) {}
    });
    try { window.dispatchEvent(new CustomEvent("gr-auth", { detail: usuarioActual })); } catch (e) {}
    pintarCabeza();
    pintarCuenta();
    pintarFicha();
    pintarAviso();
    quizasPedirApodo();
  }

  function poner(usuario) {
    usuarioActual = usuario;
    try {
      if (usuario && usuario.demo) localStorage.setItem(SESION, JSON.stringify(usuario));
      else localStorage.removeItem(SESION);
    } catch (e) {}
    avisar();
  }

  function datosDe(id) {
    var todo = leerJson(DATOS, {});
    return todo[id] || { curso: {}, calculos: [], favoritos: [] };
  }

  function guardarDatos(id, bloque) {
    var todo = leerJson(DATOS, {});
    todo[id] = bloque;
    try { localStorage.setItem(DATOS, JSON.stringify(todo)); } catch (e) {}
  }

  function usuarioDesdeSupabase(user) {
    if (!user) return null;
    var meta = user.user_metadata || {};
    var escrito = apodoValido(meta.nombre);
    return {
      id: user.id,
      nombre: escrito || apodoPublico(meta, user.id),
      correo: user.email || "",
      avatar: meta.avatar_url || meta.picture || "",
      demo: false,
      pideApodo: !escrito,
      confirmado: !!user.email_confirmed_at || !!user.confirmed_at
    };
  }

  function cargarSdk() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = root + "js/vendor/supabase.js";
      s.onload = function () {
        if (window.supabase && window.supabase.createClient) resolve(window.supabase);
        else reject(new Error("No se pudo preparar el acceso."));
      };
      s.onerror = function () { reject(new Error("No se pudo cargar el acceso. Revisa la conexión.")); };
      document.head.appendChild(s);
    });
  }

  function prepararNube() {
    var cfg = nube();
    if (!cfg) return Promise.resolve(null);
    if (listoNube) return listoNube;
    listoNube = cargarSdk().then(function (lib) {
      cliente = lib.createClient(cfg.url, cfg.key, {
        auth: {
          persistSession: true,
          storageKey: "gr-auth",
          detectSessionInUrl: true,
          flowType: "pkce"
        }
      });
      cliente.auth.onAuthStateChange(function (_evento, session) {
        var u = session && session.user ? usuarioDesdeSupabase(session.user) : null;
        poner(u);
        if (u) traerNube(u.id);
      });
      return fetch(cfg.url + "/auth/v1/settings", {
        headers: { apikey: cfg.key, Authorization: "Bearer " + cfg.key }
      }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (ajustes) {
        var ext = ajustes && ajustes.external;
        googleApagado = !(ext && ext.google);
        notaDemo();
        return cliente.auth.getSession();
      }).then(function (res) {
        var session = res.data && res.data.session;
        var u = session && session.user ? usuarioDesdeSupabase(session.user) : null;
        if (u) {
          usuarioActual = u;
          traerNube(u.id);
        }
        return cliente;
      });
    }).catch(function (e) {
      listoNube = null;
      throw e;
    });
    return listoNube;
  }

  function traerNube(id) {
    if (!cliente) return;
    Promise.all([
      cliente.from("curso_progreso").select("datos").eq("usuario", id).maybeSingle(),
      cliente.from("calculos").select("id,nombre,datos,creado").eq("usuario", id).order("creado", { ascending: false }),
      cliente.from("favoritos").select("ficha,titulo,creado").eq("usuario", id)
    ]).then(function (res) {
      var bloque = datosDe(id);
      var curso = res[0].data && res[0].data.datos;
      if (curso && typeof curso === "object") bloque.curso = mezclarCurso(bloque.curso, curso);
      if (res[1].data) bloque.calculos = res[1].data.map(function (c) {
        return { id: c.id, nombre: c.nombre, datos: c.datos, cuando: c.creado };
      });
      if (res[2].data) bloque.favoritos = res[2].data.map(function (f) {
        return { id: f.ficha, titulo: f.titulo, href: "enfermedades/" + f.ficha + ".html" };
      });
      guardarDatos(id, bloque);
      var local = leerJson("gr_progreso", {});
      var junto = mezclarCurso(local, bloque.curso);
      try { localStorage.setItem("gr_progreso", JSON.stringify(junto)); } catch (e) {}
      bloque.curso = junto;
      guardarDatos(id, bloque);
      pintarCuenta();
      pintarFicha();
    }).catch(function () {});
  }

  function mezclarCurso(a, b) {
    var out = {};
    var keys = {};
    Object.keys(a || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(b || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      var x = (a && a[k]) || {};
      var y = (b && b[k]) || {};
      if (typeof x !== "object" && typeof y !== "object") return;
      out[k] = {
        mejor: Math.max(Number(x.mejor) || 0, Number(y.mejor) || 0),
        aprobado: !!(x.aprobado || y.aprobado),
        fecha: x.fecha || y.fecha || ""
      };
    });
    return out;
  }

  function mensaje(texto, error) {
    var n = document.getElementById("auth-msg");
    if (!n) return;
    n.textContent = texto || "";
    n.classList.toggle("auth-error", !!error);
  }

  function modoCaja(modo) {
    var caja = document.getElementById("auth-caja");
    if (!caja) return;
    caja.setAttribute("data-modo", modo);
    var titulo = document.getElementById("auth-titulo");
    var titulos = {
      entrar: "Entrar",
      registro: "Crear cuenta",
      reset: "Nueva contraseña",
      magico: "Enlace al correo",
      apodo: "Elige tu apodo"
    };
    if (titulo) titulo.textContent = titulos[modo] || "Entrar";
    var nombre = caja.querySelector("[name=nombre]");
    var pass = caja.querySelector("[name=clave]");
    if (nombre) nombre.required = modo === "registro" || modo === "apodo";
    if (pass) {
      pass.required = modo === "entrar" || modo === "registro";
      pass.minLength = pass.required ? 8 : 0;
    }
    var submit = document.getElementById("auth-submit");
    var etiquetas = { entrar: "Entrar", registro: "Crear cuenta", reset: "Enviar enlace", magico: "Enviar enlace", apodo: "Guardar apodo" };
    if (submit) submit.textContent = etiquetas[modo] || "Entrar";
    mensaje("");
  }

  function abrir(modo) {
    var fondo = document.getElementById("auth-fondo");
    if (!fondo) return;
    fondo.hidden = false;
    modoCaja(modo || "entrar");
    prepararNube().catch(function () {
      mensaje("No se pudo conectar. Inténtalo más tarde.", true);
    });
    var foco = fondo.querySelector(modo === "registro" || modo === "apodo" ? "[name=nombre]" : "[name=correo]");
    if (foco) foco.focus();
  }

  function cerrar() {
    var fondo = document.getElementById("auth-fondo");
    if (fondo) fondo.hidden = true;
    var boton = document.querySelector(".auth-entrar, .auth-yo");
    if (boton) boton.focus();
  }

  function exigir() {
    if (usuarioActual) return usuarioActual;
    abrir("entrar");
    return null;
  }

  function textoGuardado(res) {
    if (!res || !res.error) return "";
    var m = String(res.error.message || "");
    var c = String(res.error.code || "");
    if (c === "PGRST205" || c === "42P01" || /schema cache|does not exist|relation/i.test(m)) {
      return "No se pudo guardar en la cuenta. Inténtalo más tarde.";
    }
    return "No se pudo guardar. " + (m || "Inténtalo más tarde.");
  }

  function guardarApodo(apodo) {
    if (!cliente || !usuarioActual) return Promise.reject(new Error("No se pudo conectar. Inténtalo más tarde."));
    return cliente.auth.updateUser({ data: { nombre: apodo } }).then(function (resUser) {
      if (resUser.error) throw new Error(resUser.error.message);
      return cliente.from("perfiles").update({ nombre: apodo }).eq("id", usuarioActual.id);
    }).then(function (resPerfil) {
      var fallo = textoGuardado(resPerfil);
      if (fallo) throw new Error(fallo);
      usuarioActual.nombre = apodo;
      usuarioActual.pideApodo = false;
      ultimoError = "";
      avisar();
    });
  }

  var apodoOfrecido = false;
  function quizasPedirApodo() {
    if (!usuarioActual || !usuarioActual.pideApodo || apodoOfrecido) return;
    apodoOfrecido = true;
    abrir("apodo");
    mensaje("Elige un apodo para el ranking. No uses el nombre de Google ni un correo.", false);
  }

  function enviar(ev) {
    ev.preventDefault();
    var form = ev.target;
    var modo = document.getElementById("auth-caja").getAttribute("data-modo");
    if (modo === "apodo") {
      var elegido = apodoValido(form.nombre.value);
      var botonApodo = form.querySelector("[type=submit]");
      if (!elegido) {
        mensaje("El apodo necesita de 2 a 40 letras, sin @ y sin correo.", true);
        return;
      }
      botonApodo.disabled = true;
      guardarApodo(elegido).then(function () {
        botonApodo.disabled = false;
        cerrar();
      }).catch(function (e) {
        botonApodo.disabled = false;
        mensaje(falloDeRed(e) ? "No se pudo conectar. Inténtalo más tarde." : textoError(e), true);
      });
      return;
    }
    var correo = form.correo.value;
    var clave = form.clave.value;
    var nombre = form.nombre.value;
    var boton = form.querySelector("[type=submit]");
    boton.disabled = true;
    if (!nube()) {
      boton.disabled = false;
      mensaje("El acceso no está disponible. Inténtalo más tarde.", true);
      return;
    }
    var trabajo = prepararNube().then(function () {
      var vuelta = urlDe("cuenta.html");
      if (modo === "registro") {
        if (!correoValido(correo)) throw new Error("Escribe un correo válido.");
        var apodo = apodoValido(nombre);
        if (!apodo) throw new Error("Escribe un apodo de 2 a 40 letras, sin @ y sin correo. Ese nombre es el que sale en el ranking.");
        if (String(clave).length < 8) throw new Error("La contraseña necesita 8 caracteres o más.");
        return cliente.auth.signUp({
          email: String(correo).trim(),
          password: clave,
          options: { emailRedirectTo: vuelta, data: { nombre: apodo } }
        }).then(function (res) {
          if (res.error) throw new Error(res.error.message);
          if (!res.data.session) return "Revisa el correo para confirmar la cuenta. Hasta entonces no queda la sesión.";
          return "Cuenta creada.";
        });
      }
      if (modo === "reset") {
        return cliente.auth.resetPasswordForEmail(String(correo).trim(), { redirectTo: vuelta }).then(function (res) {
          if (res.error) throw new Error(res.error.message);
          return "Si el correo existe, llegará un enlace para elegir otra contraseña.";
        });
      }
      if (modo === "magico") {
        return cliente.auth.signInWithOtp({
          email: String(correo).trim(),
          options: { emailRedirectTo: vuelta, shouldCreateUser: true }
        }).then(function (res) {
          if (res.error) throw new Error(res.error.message);
          return "Te enviamos un enlace. Ábrelo en este mismo navegador.";
        });
      }
      return cliente.auth.signInWithPassword({
        email: String(correo).trim(),
        password: clave
      }).then(function (res) {
        if (res.error) throw new Error(res.error.message);
        return "";
      });
    });
    trabajo.then(function (texto) {
      boton.disabled = false;
      if (texto) mensaje(texto, false);
      else cerrar();
    }).catch(function (e) {
      boton.disabled = false;
      if (falloDeRed(e)) {
        mensaje("No se pudo conectar. Inténtalo más tarde.", true);
        return;
      }
      mensaje(textoError(e), true);
    });
  }

  function textoError(e) {
    var m = String(e && e.message || "");
    if (/invalid login credentials/i.test(m)) return "Ese correo o esa contraseña no coinciden.";
    if (/email not confirmed/i.test(m)) return "Revisa el correo: falta confirmar la cuenta.";
    if (/already registered|already been registered/i.test(m)) return "Ese correo ya tiene cuenta. Entra o pide otra contraseña.";
    if (/provider.*not enabled|unsupported provider|validation_failed/i.test(m)) return "Google todavía no está activado. Entra con correo y contraseña.";
    return m || "No se pudo entrar.";
  }

  function google() {
    if (!nube() || googleApagado) {
      mensajeGoogle();
      return;
    }
    prepararNube().then(function () {
      if (googleApagado) {
        mensajeGoogle();
        return null;
      }
      return cliente.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: urlDe("cuenta.html"), skipBrowserRedirect: false }
      });
    }).then(function (res) {
      if (res && res.error) {
        if (/provider|not enabled|unsupported/i.test(res.error.message || "")) googleApagado = true;
        mensaje(textoError(res.error), true);
      }
    }).catch(function (e) {
      mensaje(falloDeRed(e) ? "No se pudo conectar. Inténtalo más tarde." : textoError(e), true);
    });
  }

  function salir() {
    if (cliente) {
      cliente.auth.signOut().catch(function () {});
    }
    poner(null);
    cerrarMenu();
  }

  function guardarCurso(progreso) {
    if (!usuarioActual) return;
    clearTimeout(cursoTimer);
    cursoTimer = setTimeout(function () {
      var bloque = datosDe(usuarioActual.id);
      bloque.curso = progreso || {};
      guardarDatos(usuarioActual.id, bloque);
      if (!cliente || usuarioActual.demo) return;
      cliente.from("curso_progreso").upsert({
        usuario: usuarioActual.id,
        datos: bloque.curso,
        actualizado: new Date().toISOString()
      }).then(function (res) {
        ultimoError = textoGuardado(res);
        if (!ultimoError) guardarDatos(usuarioActual.id, bloque);
        pintarCuenta();
      }).catch(function () {
        ultimoError = "No se pudo conectar. Inténtalo más tarde.";
        pintarCuenta();
      });
    }, 400);
  }

  function guardarCalculo(nombre, datos) {
    var u = exigir();
    if (!u) return Promise.resolve({ ok: false, error: "" });
    if (!cliente) return Promise.resolve({ ok: false, error: "No se pudo conectar. Inténtalo más tarde." });
    var item = {
      nombre: String(nombre || "Cálculo").slice(0, 80),
      datos: datos
    };
    return cliente.from("calculos").insert({
      usuario: u.id,
      nombre: item.nombre,
      datos: datos
    }).then(function (res) {
      var fallo = textoGuardado(res);
      if (fallo) {
        ultimoError = fallo;
        pintarCuenta();
        return { ok: false, error: fallo };
      }
      ultimoError = "";
      traerNube(u.id);
      return { ok: true, error: "" };
    }).catch(function () {
      ultimoError = "No se pudo conectar. Inténtalo más tarde.";
      pintarCuenta();
      return { ok: false, error: ultimoError };
    });
  }

  function fichaActual() {
    var ruta = location.pathname || "";
    var m = ruta.match(/\/enfermedades\/([a-z0-9-]+)\.html$/);
    if (!m) return null;
    if (m[1] === "index") return null;
    var h1 = document.querySelector("h1");
    return { id: m[1], titulo: h1 ? h1.textContent.trim() : m[1], href: m[1] + ".html" };
  }

  function esFavorita(id) {
    if (!usuarioActual) return false;
    return (datosDe(usuarioActual.id).favoritos || []).some(function (f) { return f.id === id; });
  }

  function alternarFavorito(ficha) {
    var u = exigir();
    if (!u || !ficha) return;
    var bloque = datosDe(u.id);
    var lista = bloque.favoritos || [];
    var ya = lista.some(function (f) { return f.id === ficha.id; });
    function aplicar(listaNueva, peticion) {
      if (!cliente) {
        ultimoError = "No se pudo conectar. Inténtalo más tarde.";
        pintarFicha();
        return;
      }
      peticion.then(function (res) {
        var fallo = textoGuardado(res);
        if (fallo) {
          ultimoError = fallo;
          pintarFicha();
          pintarCuenta();
          return;
        }
        ultimoError = "";
        bloque.favoritos = listaNueva;
        guardarDatos(u.id, bloque);
        pintarFicha();
        pintarCuenta();
      }).catch(function () {
        ultimoError = "No se pudo conectar. Inténtalo más tarde.";
        pintarFicha();
      });
    }
    if (ya) {
      aplicar(lista.filter(function (f) { return f.id !== ficha.id; }), cliente.from("favoritos").delete().eq("usuario", u.id).eq("ficha", ficha.id));
    } else {
      aplicar(
        [{ id: ficha.id, titulo: ficha.titulo, href: ficha.href }].concat(lista).slice(0, 40),
        cliente.from("favoritos").upsert({ usuario: u.id, ficha: ficha.id, titulo: ficha.titulo })
      );
    }
  }

  function cerrarMenu() {
    var panel = document.getElementById("auth-panel");
    var boton = document.querySelector(".auth-yo");
    if (panel) panel.hidden = true;
    if (boton) boton.setAttribute("aria-expanded", "false");
  }

  function pintarCabeza() {
    var actions = document.querySelector(".top-actions");
    if (!actions) return;
    var previo = document.getElementById("auth-cabeza");
    if (previo) previo.remove();
    var caja = document.createElement("div");
    caja.id = "auth-cabeza";
    caja.className = "auth-cabeza";
    if (!usuarioActual) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "auth-entrar";
      b.setAttribute("aria-label", "Entrar o registrarse");
      b.innerHTML = '<span class="auth-ico" aria-hidden="true"><svg viewBox="0 0 32 32" width="22" height="22"><path fill="currentColor" d="M16 15.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4zM7.2 25.4c.6-4.2 4-6.6 8.8-6.6s8.2 2.4 8.8 6.6H7.2z"/></svg></span><span class="auth-corto">Entrar</span><span class="auth-largo">Entrar / Registrarse</span>';
      b.addEventListener("click", function () { abrir("entrar"); });
      caja.appendChild(b);
    } else {
      var yo = document.createElement("button");
      yo.type = "button";
      yo.className = "auth-yo";
      yo.setAttribute("aria-expanded", "false");
      yo.setAttribute("aria-controls", "auth-panel");
      yo.setAttribute("aria-label", "Menú de " + usuarioActual.nombre);
      var avatar = usuarioActual.avatar
        ? '<img class="auth-avatar" src="' + esc(usuarioActual.avatar) + '" alt="">'
        : '<span class="auth-avatar" aria-hidden="true">' + esc(iniciales(usuarioActual.nombre)) + "</span>";
      yo.innerHTML = avatar + '<span class="auth-nombre">' + esc(usuarioActual.nombre.split(" ")[0]) + "</span>";
      var panel = document.createElement("div");
      panel.id = "auth-panel";
      panel.className = "auth-panel";
      panel.hidden = true;
      panel.innerHTML = '<p class="auth-panel-nom">' + esc(usuarioActual.nombre) + "</p>" +
        '<p class="fine">' + esc(usuarioActual.correo) + "</p>" +
        '<a href="' + esc(urlDe("cuenta.html")) + '">Mi cuenta</a>' +
        '<button type="button" data-auth="salir">Salir</button>';
      yo.addEventListener("click", function () {
        var abierto = panel.hidden;
        panel.hidden = !abierto;
        yo.setAttribute("aria-expanded", abierto ? "true" : "false");
      });
      panel.querySelector("[data-auth=salir]").addEventListener("click", salir);
      caja.appendChild(yo);
      caja.appendChild(panel);
    }
    var toggle = actions.querySelector(".nav-toggle");
    if (toggle) actions.insertBefore(caja, toggle);
    else actions.appendChild(caja);
  }

  function pintarFicha() {
    var ficha = fichaActual();
    if (!ficha) return;
    var ancla = document.querySelector(".enf-zona-main h1") || document.querySelector("h1");
    if (!ancla) return;
    var btn = document.getElementById("auth-fav");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "auth-fav";
      btn.className = "btn sec auth-fav";
      ancla.insertAdjacentElement("afterend", btn);
      btn.addEventListener("click", function () { alternarFavorito(fichaActual()); });
    }
    var on = esFavorita(ficha.id);
    btn.textContent = on ? "Guardada en mi cuenta" : "Guardar ficha";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    var notaFav = document.getElementById("auth-fav-nota");
    if (!notaFav) {
      notaFav = document.createElement("p");
      notaFav.id = "auth-fav-nota";
      notaFav.className = "fine";
      btn.insertAdjacentElement("afterend", notaFav);
    }
    notaFav.textContent = ultimoError || "";
  }

  function leccionesAprobadas(curso) {
    return Object.keys(curso || {}).filter(function (k) { return curso[k] && curso[k].aprobado; }).length;
  }

  function pintarCuenta() {
    var caja = document.getElementById("cuenta-cuerpo");
    if (!caja) return;
    if (!usuarioActual) {
      caja.innerHTML = '<p>No has entrado. El curso, las fichas y la calculadora se usan igual. La cuenta sirve para guardar el avance, los cálculos y las fichas.</p>' +
        '<p><button type="button" class="btn gold" id="cuenta-entrar">Entrar / Registrarse</button></p>' +
        '<h2>El curso</h2><p>El curso es gratis. Si entras, tu avance se guarda en tu cuenta.</p>' +
        (ultimoError ? '<p class="auth-error">' + esc(ultimoError) + "</p>" : "");
      document.getElementById("cuenta-entrar").addEventListener("click", function () { abrir("entrar"); });
      return;
    }
    var bloque = datosDe(usuarioActual.id);
    var favs = (bloque.favoritos || []).map(function (f) {
      return '<li><a href="' + esc(root + "enfermedades/" + f.id + ".html") + '">' + esc(f.titulo) + "</a></li>";
    }).join("");
    var calcs = (bloque.calculos || []).map(function (c) {
      return "<li>" + esc(c.nombre) + "</li>";
    }).join("");
    caja.innerHTML = '<p class="auth-yo-linea">' +
      (usuarioActual.avatar ? '<img class="auth-avatar" src="' + esc(usuarioActual.avatar) + '" alt="">' : '<span class="auth-avatar">' + esc(iniciales(usuarioActual.nombre)) + "</span>") +
      "<span><strong>" + esc(usuarioActual.nombre) + "</strong><br><span class=\"fine\">" + esc(usuarioActual.correo) + "</span></span></p>" +
      (ultimoError ? '<p class="auth-error">' + esc(ultimoError) + "</p>" : "") +
      '<form id="cuenta-apodo"><label>Apodo del ranking<input name="apodo" maxlength="40" value="' + esc(usuarioActual.nombre) + '" autocomplete="nickname"></label><button class="btn sec" type="submit">Guardar apodo</button></form>' +
      '<p><button type="button" class="btn sec" id="cuenta-salir">Salir</button></p>' +
      "<h2>Curso</h2><p>El curso es gratis. Si entras, tu avance se guarda en tu cuenta. Llevas " + leccionesAprobadas(bloque.curso) + " lecciones aprobadas.</p>" +
      "<h2>Cálculos</h2>" + (calcs ? "<ul>" + calcs + "</ul>" : "<p>Todavía no guardaste ninguno. En la calculadora, el botón «Guardar en mi cuenta».</p>") +
      "<h2>Fichas guardadas</h2>" + (favs ? "<ul>" + favs + "</ul>" : "<p>En una ficha de enfermedades, «Guardar ficha».</p>");
    document.getElementById("cuenta-salir").addEventListener("click", salir);
    document.getElementById("cuenta-apodo").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var apodo = apodoValido(ev.target.apodo.value);
      if (!apodo) {
        ultimoError = "El apodo necesita de 2 a 40 letras, sin @ y sin correo.";
        pintarCuenta();
        return;
      }
      if (!cliente) {
        ultimoError = "No se pudo conectar. Inténtalo más tarde.";
        pintarCuenta();
        return;
      }
      guardarApodo(apodo).catch(function (e) {
        ultimoError = falloDeRed(e) ? "No se pudo conectar. Inténtalo más tarde." : textoError(e);
        pintarCuenta();
      });
    });
  }

  function pintarAviso() {
    var viejo = document.getElementById("auth-aviso");
    if (viejo) viejo.remove();
  }

  function montarCaja() {
    if (document.getElementById("auth-fondo")) return;
    var fondo = document.createElement("div");
    fondo.id = "auth-fondo";
    fondo.className = "auth-fondo";
    fondo.hidden = true;
    fondo.innerHTML = '<div id="auth-caja" class="auth-caja" role="dialog" aria-modal="true" aria-labelledby="auth-titulo" data-modo="entrar">' +
      '<button type="button" class="auth-cerrar" aria-label="Cerrar">×</button>' +
      '<h2 id="auth-titulo">Entrar</h2>' +
      '<p id="auth-msg" class="auth-msg" role="status"></p>' +
      '<p class="fine" id="auth-demo-nota"></p>' +
      '<button type="button" class="btn sec auth-google" id="auth-google">Continuar con Google</button>' +
      '<form id="auth-form">' +
      '<label class="auth-campo auth-solo-registro">Apodo del ranking<input name="nombre" maxlength="40" autocomplete="nickname"></label>' +
      '<label class="auth-campo">Correo<input name="correo" type="email" maxlength="80" autocomplete="email" required></label>' +
      '<label class="auth-campo auth-con-clave">Contraseña<input name="clave" type="password" minlength="8" autocomplete="current-password"></label>' +
      '<button class="btn gold" type="submit" id="auth-submit">Entrar</button>' +
      "</form>" +
      '<p class="auth-links">' +
      '<button type="button" data-modo="registro">Crear cuenta</button>' +
      '<button type="button" data-modo="entrar">Ya tengo cuenta</button>' +
      '<button type="button" data-modo="reset">Olvidé la contraseña</button>' +
      '<button type="button" data-modo="magico">Enlace mágico</button>' +
      "</p></div>";
    document.body.appendChild(fondo);
    fondo.addEventListener("click", function (ev) { if (ev.target === fondo) cerrar(); });
    fondo.querySelector(".auth-cerrar").addEventListener("click", cerrar);
    fondo.querySelector("#auth-form").addEventListener("submit", enviar);
    fondo.querySelector("#auth-google").addEventListener("click", google);
    fondo.querySelectorAll(".auth-links button").forEach(function (b) {
      b.addEventListener("click", function () { modoCaja(b.getAttribute("data-modo")); });
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !fondo.hidden) cerrar();
    });
    notaDemo();
  }

  function notaDemo() {
    var n = document.getElementById("auth-demo-nota");
    if (!n) return;
    if (!nube()) n.textContent = "El acceso no está disponible. Inténtalo más tarde.";
    else if (googleApagado) n.textContent = "Entra con correo y contraseña. Google se activará cuando esté configurado. El apodo es el nombre del ranking, nunca el correo.";
    else n.textContent = "Puedes entrar con Google o con correo. El apodo es el nombre del ranking, nunca el correo.";
  }

  function haceFaltaNube() {
    if (/\/cuenta(?:\.html)?\/?$/.test(location.pathname || "")) return true;
    try { return !!localStorage.getItem("gr-auth"); } catch (e) { return false; }
  }

  montarCaja();
  pintarCabeza();
  pintarCuenta();
  pintarFicha();
  if (haceFaltaNube()) {
    prepararNube().then(function () { avisar(); }).catch(function () { avisar(); });
  }

  window.GRAuth = {
    demo: modoDemo,
    usuario: function () { return usuarioActual; },
    abrir: abrir,
    cerrar: cerrar,
    exigir: exigir,
    salir: salir,
    onChange: function (fn) { oyentes.push(fn); },
    guardarCurso: guardarCurso,
    guardarCalculo: guardarCalculo,
    favoritos: function () { return usuarioActual ? (datosDe(usuarioActual.id).favoritos || []) : []; },
    calculos: function () { return usuarioActual ? (datosDe(usuarioActual.id).calculos || []) : []; }
  };
  avisar();
})();
