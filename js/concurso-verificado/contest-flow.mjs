const TOTAL = 100;

export function createVerifiedContest({rpc, now = () => performance.now(), publish}) {
  let state = {phase: "idle", attempt: null};
  let running = false;
  const emit = next => { state = next; publish(snapshot()); };
  function snapshot() {
    const view = {...state};
    if (view.phase === "question") view.seconds = Math.max(0, Math.ceil((view.localDeadline - now()) / 1000));
    return view;
  }
  const priorAttempt = () => state.attempt || null;
  async function call(name, args) {
    const {data, error} = await rpc(name, args);
    if (error) {
      const known = new Set(["contest_login_required","contest_closed","contest_bank_unavailable"]);
      const kind = known.has(error.message) ? error.message : error.code === "42501" ? "contest_login_required" : "transport";
      throw Object.assign(new Error("No se pudo confirmar el estado de la partida."), {kind});
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("No se pudo confirmar el estado de la partida.");
    return data;
  }
  function show(data, attempt) {
    if (data.status === "finished") {
      const valid = Number.isInteger(data.score) && data.score >= 0 && data.score <= TOTAL;
      emit({phase: "finished", attempt, score: valid ? data.score : null, meanMs: Number.isFinite(data.mean_ms) ? data.mean_ms : null});
      return;
    }
    if (data.status === "ready") {
      emit({phase: "ready", attempt});
      return;
    }
    const remaining = Date.parse(data.deadline) - Date.parse(data.server_now);
    if (data.status !== "question" || data.total !== TOTAL || !Number.isInteger(data.position) || data.position < 1 || data.position > TOTAL || typeof data.prompt !== "string" || typeof data.category !== "string" || !Array.isArray(data.choices) || data.choices.length !== 4 || data.choices.some(q => typeof q !== "string" || !q.trim()) || !Number.isFinite(remaining) || remaining > 30_100) throw Error("El concurso no devolvió una pregunta válida.");
    emit({phase: "question", attempt, position: data.position, category: data.category, prompt: data.prompt, choices: [...data.choices], localDeadline: now() + Math.max(0,remaining)});
  }
  async function question(attempt) {
    show(await call("concurso_verificado_pregunta", {p_attempt: attempt}), attempt);
  }
  async function exclusively(work) {
    if (running) return;
    running = true;
    try { await work(); }
    catch(e) {
      const kind = e?.kind || "transport";
      const errors={
        contest_login_required:"Inicia sesión para jugar por el premio o recuperar tu partida.",
        contest_closed:"Ahora no hay un concurso abierto. Tu partida no se ha invalidado desde esta página.",
        contest_bank_unavailable:"Aún no hay preguntas disponibles para abrir una partida."
      };
      emit({phase: "error", attempt: priorAttempt(), kind, message:errors[kind] || "No se pudo confirmar la partida. Pulsa «Recuperar partida» para comprobar dónde quedó."});
    }
    finally { running = false; }
  }
  function start() {
    return exclusively(async () => {
      emit({phase: "loading", attempt: priorAttempt()});
      const res = await call("concurso_verificado_empezar");
      if (!res.attempt_id || typeof res.attempt_id !== "string") throw Error("No se recibió una partida.");
      emit({phase: "loading", attempt: res.attempt_id});
      if (res.status === "finished") show(res, res.attempt_id);
      else await question(res.attempt_id);
    });
  }
  function recover() {
    if (!priorAttempt()) return start();
    return exclusively(async () => {
      const attempt = priorAttempt();
      emit({phase: "loading", attempt});
      await question(attempt);
    });
  }
  function answer(choice) {
    if (state.phase !== "question") return;
    if (choice !== null && (!Number.isInteger(choice) || choice < 1 || choice > 4 || snapshot().seconds === 0)) return;
    if (choice === null && snapshot().seconds > 0) return;
    return exclusively(async () => {
      const {attempt,position} = state;
      emit({phase: "loading", attempt});
      const result = await call("concurso_verificado_responder", {p_attempt:attempt,p_position:position,p_choice:choice});
      show(result, attempt);
    });
  }
  return {start,recover,answer,snapshot};
}
