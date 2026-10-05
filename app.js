const $ = (id) => document.getElementById(id);
const state = {
  overrides: {},
  progIndex: 0,
  audio: null
};

const EJEMPLO = `[Estrofa]
La luz se queda en la ventana
y yo recojo lo que queda
un vaso tibio, una mañana
que no pregunta si me espera

[Estribillo]
Quédate, aunque sea un momento
quédate donde el silencio
aprende el nombre de mi pecho

[Puente]
Si el río vuelve, que me encuentre
con la misma sed de siempre`;

const RIMAS = {
  es: {
    ada: ["nada", "almohada", "mirada", "entrada"],
    ido: ["olvido", "ruido", "sentido", "vencido"],
    ar: ["mar", "lugar", "andar", "hogar"],
    or: ["dolor", "amor", "temor", "color"],
    ia: ["día", "vacía", "mía", "llovía"],
    ente: ["gente", "mente", "fuente", "ausente"],
    ado: ["lado", "pasado", "cerrado", "cuidado"]
  },
  fr: {
    eur: ["coeur", "peur", "heure", "douceur"],
    er: ["mer", "hiver", "aimer", "clair"],
    age: ["orage", "voyage", "rivage", "silence d'âge"]
  },
  en: {
    ight: ["night", "light", "fight", "sight"],
    ay: ["stay", "away", "day", "gray"],
    ore: ["more", "before", "shore", "door"]
  }
};

const CLICHES = [
  [/en el fondo de mi alma/gi, "en el cajón donde guardo las llaves"],
  [/mi corazón late/gi, "el pecho me cuenta mal la hora"],
  [/eres mi todo/gi, "te cabe la cocina y aun así sobras"],
  [/lágrimas de dolor/gi, "sal en la comisura"],
  [/amor eterno/gi, "el abrigo que no devuelvo"],
  [/noche oscura/gi, "la calle sin farol de la esquina"]
];

const TONOS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const PROGS = {
  pop: [ ["I", "V", "vi", "IV"], ["I", "vi", "IV", "V"], ["vi", "IV", "I", "V"] ],
  balada: [ ["I", "vi", "IV", "V"], ["vi", "IV", "I", "V"], ["I", "IV", "vi", "V"] ],
  rock: [ ["I", "IV", "V", "IV"], ["I", "bVII", "IV", "I"], ["i", "bVII", "bVI", "bVII"] ],
  folk: [ ["I", "IV", "I", "V"], ["I", "V", "vi", "IV"], ["I", "ii", "V", "I"] ],
  electrónica: [ ["vi", "IV", "I", "V"], ["i", "bVI", "bIII", "bVII"], ["I", "V", "vi", "IV"] ],
  otro: [ ["I", "IV", "V", "I"], ["i", "iv", "V", "i"], ["I", "vi", "ii", "V"] ]
};

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.style.display = "none"; }, 1800);
}

function vocales(ch) {
  return "aeiouáéíóúàèìòùäëïöüâêîôûãõæœ".includes(ch);
}
function esAcento(ch) {
  return "áéíóúàèìòùâêîôû".includes(ch);
}
function sinAcento(ch) {
  return { á:"a", é:"e", í:"i", ó:"o", ú:"u", à:"a", è:"e", ì:"i", ò:"o", ù:"u", â:"a", ê:"e", î:"i", ô:"o", û:"u", ä:"a", ë:"e", ï:"i", ö:"o", ü:"u", ã:"a", õ:"o" }[ch] || ch;
}

function esVocalBase(ch) {
  return "aeiouü".includes(sinAcento(ch));
}

function silabearPalabra(pal, idioma, dieresis) {
  const limpia = pal.toLowerCase().replace(/[^a-záéíóúüñ']/g, "");
  if (!limpia) return [];
  if (idioma === "en") return silabeoIngles(limpia);
  if (idioma === "fr") return silabeoFrances(limpia);
  return silabeoEspanol(limpia, dieresis);
}

function silabeoEspanol(pal, dieresis) {
  if (pal === "y") return ["y"];
  const chars = [...pal];
  const vocal = (c) => "aeiouáéíóúü".includes(c);
  const nucleos = [];
  const huecos = [];
  let cons = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const yVocal = c === "y" && i > 0 && (i === chars.length - 1 || !vocal(chars[i + 1] || ""));
    if (!vocal(c) && !yVocal) { cons += c; continue; }
    let nucleo = c;
    i++;
    while (i < chars.length) {
      if (chars[i] === "h" && vocal(chars[i + 1] || "")) { nucleo += chars[i]; i++; continue; }
      const sigue = chars[i];
      const ySigue = sigue === "y" && i === chars.length - 1;
      if (!(vocal(sigue) || ySigue)) break;
      const prev = [...nucleo].reverse().find((x) => x !== "h");
      const a = sinAcento(prev);
      const b = sinAcento(sigue);
      const debil = (x) => x === "i" || x === "u" || x === "ü";
      const hiato = (esAcento(prev) && debil(a)) || (esAcento(sigue) && debil(b)) || ("aeo".includes(a) && "aeo".includes(b));
      if (hiato) break;
      nucleo += sigue;
      i++;
    }
    i--;
    huecos.push(cons);
    cons = "";
    nucleos.push(nucleo);
  }
  if (!nucleos.length) return [pal];
  huecos.push(cons);
  const sil = nucleos.map((n, i) => n);
  sil[0] = huecos[0] + sil[0];
  for (let i = 0; i < nucleos.length - 1; i++) {
    const cola = huecos[i + 1];
    const grupo = /^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|tr|tl|ch|ll)/;
    let izq = "";
    let der = cola;
    if (cola.length <= 1) der = cola;
    else if (cola.length === 2) {
      if (grupo.test(cola)) der = cola;
      else { izq = cola[0]; der = cola[1]; }
    } else if (grupo.test(cola.slice(-2))) {
      izq = cola.slice(0, -2);
      der = cola.slice(-2);
    } else {
      izq = cola.slice(0, -1);
      der = cola.slice(-1);
    }
    sil[i] += izq;
    sil[i + 1] = der + sil[i + 1];
  }
  sil[sil.length - 1] += huecos[huecos.length - 1];
  return sil.filter(Boolean);
}

function partirNucleo(texto, dieresis) {
  const letras = [...texto];
  const partes = [];
  let buf = "";
  const vocalDe = (s) => [...s].filter((c) => c !== "h").pop();
  for (const c of letras) {
    if (c === "h") { buf += c; continue; }
    if (!vocalDe(buf)) { buf += c; continue; }
    const prev = vocalDe(buf);
    const a = sinAcento(prev);
    const b = sinAcento(c);
    const debil = (x) => x === "i" || x === "u" || x === "ü";
    const hiatoAcento = esAcento(prev) && debil(a) || esAcento(c) && debil(b);
    const hiatoFuerte = "aeo".includes(a) && "aeo".includes(b);
    const separar = dieresis ? hiatoAcento || hiatoFuerte || (!debil(a) && !debil(b)) : hiatoAcento || hiatoFuerte;
    if (separar) { partes.push(buf); buf = c; }
    else buf += c;
  }
  if (buf) partes.push(buf);
  return partes;
}

function repartirConsonantes(silabas) {
  const grupo = /^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|tr|tl|ch|ll)/;
  const out = silabas.map((s) => s);
  for (let i = 0; i < out.length - 1; i++) {
    const m = out[i].match(/^(.*?)([bcdfghjklmnñpqrstvxyz]+)$/i);
    if (!m) continue;
    const cuerpo = m[1];
    const cola = m[2];
    if (!cuerpo) continue;
    let seQueda = "";
    let pasa = cola;
    if (cola.length === 1) pasa = cola;
    else if (cola.length === 2) {
      if (grupo.test(cola)) pasa = cola;
      else { seQueda = cola[0]; pasa = cola.slice(1); }
    } else if (grupo.test(cola.slice(-2))) {
      seQueda = cola.slice(0, -2);
      pasa = cola.slice(-2);
    } else {
      seQueda = cola.slice(0, -1);
      pasa = cola.slice(-1);
    }
    out[i] = cuerpo + seQueda;
    out[i + 1] = pasa + out[i + 1];
  }
  return out.filter(Boolean);
}

function silabeoFrances(pal) {
  const w = pal.replace(/[^a-zàâäéèêëïîôùûüœæ']/g, "");
  if (!w) return [];
  const partes = w.split(/[^aeiouyàâäéèêëïîôùûüœæ]+/).filter(Boolean);
  const n = Math.max(1, partes.length);
  const sil = [];
  const size = Math.ceil(w.length / n);
  for (let i = 0; i < n; i++) sil.push(w.slice(i * size, (i + 1) * size) || w[0]);
  return sil;
}

function gruposDeVerso(linea, idioma) {
  const sinalefa = $("sinalefa").checked && ["es", "it", "pt"].includes(idioma);
  const dieresis = $("dieresis").checked;
  const frClasico = $("frClasico").checked;
  const trozos = linea.toLowerCase().split(/([,;:.!?…—–])/);
  const silabas = [];
  let corte = false;
  trozos.forEach((trozo) => {
    if (/^[,;:.!?…—–]$/.test(trozo)) { corte = true; return; }
    const palabras = trozo.replace(/[«»“”"()¿¡\-]/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    palabras.forEach((pal) => {
      const propias = silabearPalabra(pal, idioma, dieresis);
      if (!propias.length) return;
      if (sinalefa && silabas.length && !corte) {
        const prev = silabas[silabas.length - 1];
        const last = [...prev].reverse().find((c) => esVocalBase(c) || c === "y");
        const iniciaVocal = esVocalBase(propias[0][0]) || propias[0].startsWith("h") && esVocalBase(propias[0][1] || "");
        const acabaVocal = last && (esVocalBase(prev[prev.length - 1]) || prev.endsWith("y"));
        if (acabaVocal && iniciaVocal) {
          silabas[silabas.length - 1] = prev + propias[0];
          propias.shift();
        }
      }
      propias.forEach((s) => silabas.push(s));
      corte = false;
    });
  });
  if (idioma === "fr" && frClasico && silabas.length) {
    const ultima = silabas[silabas.length - 1];
    if (/e$/.test(ultima) && !/[éè]/.test(ultima) && silabas.length > 1) silabas.pop();
  }
  return silabas.filter(Boolean);
}

function silabeoIngles(word) {
  const w = word.replace(/[^a-z']/g, "");
  if (!w) return [];
  const parts = w.split(/[^aeiouy]+/).filter(Boolean);
  const n = Math.max(1, parts.length - (w.endsWith("e") && parts.length > 1 ? 1 : 0));
  const sil = [];
  const size = Math.ceil(w.length / n);
  for (let i = 0; i < n; i++) sil.push(w.slice(i * size, (i + 1) * size) || w[i] || "a");
  return sil;
}

function tipoVerso(n) {
  const mapa = { 2:"bisílabo", 3:"trisílabo", 4:"tetrasílabo", 5:"pentasílabo", 6:"hexasílabo", 7:"heptasílabo", 8:"octosílabo", 9:"eneasílabo", 10:"decasílabo", 11:"endecasílabo", 12:"dodecasílabo", 14:"alejandrino" };
  return mapa[n] || (n ? "irregular" : "vacío");
}

function rimaClave(linea, idioma) {
  const palabras = linea.toLowerCase().replace(/[.,;:!?¿¡"()]/g, "").trim().split(/\s+/);
  const ult = palabras.filter(Boolean).pop() || "";
  const limpia = ult.replace(/[^a-záéíóúàèìòùüâêîôû]/g, "");
  if (!limpia) return { consonante: "", asonante: "" };
  if (idioma === "fr") {
    const rica = limpia.slice(-3);
    return { consonante: rica, asonante: limpia.replace(/[^aeiouáéíóúàèùyœ]/g, "").slice(-2) };
  }
  const cons = limpia.slice(-3);
  const aso = [...limpia].filter((c) => vocales(sinAcento(c))).map(sinAcento).slice(-2).join("");
  return { consonante: cons, asonante: aso };
}

function esquema(claves, forzado) {
  if (forzado) return forzado;
  const letras = [];
  const map = {};
  let next = 65;
  claves.forEach((k) => {
    if (!k) { letras.push("·"); return; }
    if (!map[k]) map[k] = String.fromCharCode(next++);
    letras.push(map[k]);
  });
  return letras.join("") || "libre";
}

function acento(silabas) {
  if (!silabas.length) return -1;
  for (let i = 0; i < silabas.length; i++) {
    if ([...silabas[i]].some(esAcento)) return i;
  }
  return Math.max(0, silabas.length - 2);
}

function analizar(texto, idioma) {
  const lineas = texto.replace(/\r/g, "").split("\n");
  const bloques = [];
  let actual = { tipo: "estrofa", versos: [] };
  const push = () => { if (actual.versos.length) bloques.push(actual); actual = { tipo: "estrofa", versos: [] }; };
  lineas.forEach((raw, i) => {
    const tag = raw.trim().match(/^\[(estribillo|puente|pre|outro|estrofa)\]$/i);
    if (tag) { push(); actual.tipo = tag[1].toLowerCase(); return; }
    if (!raw.trim()) { push(); return; }
    const sil = gruposDeVerso(raw, idioma);
    const key = `${i}:${raw}`;
    const n = state.overrides[key] != null ? Number(state.overrides[key]) : sil.length;
    actual.versos.push({ i, raw, sil, n, rima: rimaClave(raw, idioma), acento: acento(sil), key });
  });
  push();
  return bloques;
}

function nombreBloque(b) {
  const n = b.versos.length;
  if (b.tipo === "estribillo") return "estribillo";
  if (b.tipo === "puente") return "puente";
  if (b.tipo === "pre") return "pre-estribillo";
  if (b.tipo === "outro") return "outro";
  if (n === 2) return "pareado";
  if (n === 3) return "terceto";
  if (n === 4) return "cuarteto";
  return "estrofa libre";
}

function encabalgado(a, b) {
  if (!a || !b) return false;
  if (/[,;:.!?…—–]$/.test(a.raw.trim())) return false;
  return /^(y|e|o|u|que|de|del|en|a|al|con|sin|por|para)\b/i.test(b.raw.trim());
}

function renderAnalisis() {
  const idioma = $("idioma").value;
  const bloques = analizar($("letra").value, idioma);
  const versos = bloques.flatMap((b) => b.versos);
  const palabras = versos.reduce((s, v) => s + v.raw.trim().split(/\s+/).filter(Boolean).length, 0);
  const media = versos.length ? (versos.reduce((s, v) => s + v.n, 0) / versos.length) : 0;
  const bpm = { lento: 72, medio: 96, rápido: 120 }[$("tempo").value];
  const pulsos = versos.reduce((s, v) => s + Math.max(v.n, 1), 0);
  const segundos = Math.round((pulsos / bpm) * 60);
  const estribillos = bloques.filter((b) => b.tipo === "estribillo");
  $("resumen").innerHTML = [
    ["Versos", versos.length],
    ["Palabras", palabras],
    ["Sílabas medias", media.toFixed(1)],
    ["Duración estimada", `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")} a ${bpm} bpm`],
    ["Idioma", $("idioma").selectedOptions[0].text]
  ].map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join("");

  const forz = $("esquemaForzado").value;
  $("versos").innerHTML = bloques.map((b) => {
    const esquemaTxt = esquema(b.versos.map((v) => v.rima.asonante), forz);
    const prom = b.versos.length ? (b.versos.reduce((s, v) => s + v.n, 0) / b.versos.length).toFixed(1) : "0";
    const cuerpo = b.versos.map((v, idx) => {
      const next = b.versos[idx + 1];
      const enc = encabalgado(v, next) ? `<span class="tag">encabalgamiento</span>` : "";
      return `<div class="verso">
        <span>${v.i + 1}</span>
        <div><div>${escapeHtml(v.raw)}</div><span class="tag">${tipoVerso(v.n)} · ${v.sil.join(" · ")}</span><br><span class="tag">rima ${v.rima.asonante || "—"} · acento en sílaba ${v.acento + 1} ${enc}</span></div>
        <input type="number" min="0" max="30" value="${v.n}" data-key="${escapeHtml(v.key)}" title="Corregir conteo" />
      </div>`;
    }).join("");
    return `<div class="card"><b>${nombreBloque(b)}</b> · ${esquemaTxt} · media ${prom}<div>${cuerpo}</div></div>`;
  }).join("") || `<p class="hint">Pega una estrofa para ver sílabas, tipo de verso y rima. La sinalefa une vocales entre palabras; en francés clásico no cuenta la e muda final.</p>`;

  const alertas = [];
  versos.forEach((v) => {
    if (media && v.n > media + 3) alertas.push(`Verso ${v.i + 1} mucho más largo que la media (${v.n}).`);
  });
  if ($("letra").value.includes("[Estribillo]") && estribillos.length < 2) alertas.push("El estribillo no se repite. En canción suele volver.");
  const concretas = /ventana|vaso|río|calle|llave|abrigo|cocina|sal|farol|mar|puerta/i;
  bloques.forEach((b, i) => {
    const txt = b.versos.map((v) => v.raw).join(" ");
    if (b.versos.length && !concretas.test(txt) && /amor|corazón|alma|dolor|vida/i.test(txt)) alertas.push(`Estrofa ${i + 1} se apoya en abstracciones. Una imagen concreta suele cantar mejor.`);
  });
  const reps = repeticiones($("letra").value);
  if (reps.length) alertas.push("Se repite: " + reps.slice(0, 4).join(", ") + ".");
  const coloquial = /pa'|toy|ná|osea|tío|bro/i.test($("letra").value);
  if (coloquial && $("genero").value === "balada") alertas.push("Registro coloquial con género balada: puede chocar, o puede ser el gancho.");
  $("alertas").innerHTML = alertas.map((a) => `<p class="alerta">${a}</p>`).join("") || `<p class="ok">Sin alertas fuertes.</p>`;
  $("versos").querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("change", () => {
      state.overrides[inp.dataset.key] = inp.value;
      renderAnalisis();
    });
  });
  drawNums();
  return bloques;
}

function repeticiones(texto) {
  const stop = new Set("el la los las un una de del al y o que en por con su sus mi me te se a lo ya no si como más mas".split(" "));
  const freq = {};
  texto.toLowerCase().replace(/[^a-záéíóúüñ\s]/g, " ").split(/\s+/).forEach((w) => {
    if (w.length < 4 || stop.has(w)) return;
    freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq).filter(([, n]) => n > 2).map(([w, n]) => `${w} (${n})`);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

function drawNums() {
  const n = $("letra").value.split("\n").length;
  $("nums").textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n");
}

function insertar(tipo) {
  const ta = $("letra");
  const etiqueta = { estrofa: "\n\n", estribillo: "\n\n[Estribillo]\n", pre: "\n\n[Pre]\n", puente: "\n\n[Puente]\n", outro: "\n\n[Outro]\n" }[tipo];
  const pos = ta.selectionStart;
  ta.value = ta.value.slice(0, pos) + etiqueta + ta.value.slice(pos);
  ta.focus();
  renderAnalisis();
}

function banco(idioma) {
  return RIMAS[idioma] || RIMAS.es;
}

function sugerir(accion) {
  const idioma = $("idioma").value;
  const lineas = $("letra").value.split("\n").filter((l) => l.trim() && !l.trim().startsWith("["));
  const box = $("sugerencias");
  if (!lineas.length) { box.innerHTML = `<p class="hint">Escribe algo en el editor antes de pedir una mejora.</p>`; return; }
  let items = [];
  if (accion === "rima") {
    const ult = lineas[lineas.length - 1];
    const clave = rimaClave(ult, idioma).asonante;
    const lista = Object.entries(banco(idioma)).flatMap(([, arr]) => arr).slice(0, 6);
    items = lista.slice(0, 3).map((fin) => ({
      orig: ult,
      prop: ult.replace(/\S+$/, fin),
      nota: `Final para rimar cerca de “${clave || "libre"}”. Regla: misma vocal final, sentido del tono ${$("emocion").value}.`
    }));
  } else if (accion === "medida") {
    items = lineas.slice(0, 6).map((l) => {
      const n = gruposDeVerso(l, idioma).length;
      let prop = l;
      if (n > 8) prop = l.split(/\s+/).slice(0, 7).join(" ");
      if (n < 8) prop = l + (idioma === "fr" ? " encore" : " otra vez");
      return { orig: l, prop, nota: `De ${n} a cerca de 8. Recorta o alarga sin cambiar la imagen principal.` };
    });
  } else if (accion === "cliche") {
    lineas.forEach((l) => {
      CLICHES.forEach(([re, img]) => {
        if (re.test(l)) items.push({ orig: l, prop: l.replace(re, img), nota: "Sustituye el cliché por un objeto que se pueda filmar." });
      });
    });
    if (!items.length) items.push({ orig: lineas[0], prop: lineas[0] + (idioma === "fr" ? ", sur la table" : ", sobre la mesa"), nota: "No vi un cliché del banco. Añadí un objeto concreto." });
  } else if (accion === "estribillo") {
    const coro = lineas.slice(0, 2);
    items = coro.map((l) => ({ orig: l, prop: l.split(/\s+/).slice(0, 5).join(" "), nota: "Más corto y repetible: menos de seis palabras suele enganchar." }));
  } else if (accion === "tono") {
    const g = $("genero").value;
    const cola = { rock: " y no pido permiso", balada: ", en voz baja", pop: ", otra vez", folk: " camino a casa", electrónica: " en bucle", otro: "" }[g];
    items = lineas.slice(0, 4).map((l) => ({ orig: l, prop: l.replace(/[.]$/, "") + cola, nota: `Giro de registro hacia ${g}, sin borrar el verso.` }));
  } else if (accion === "adaptar") {
    const hacia = $("hacia").value;
    const mapa = {
      fr: [["quédate", "reste"], ["noche", "nuit"], ["corazón", "coeur"], ["mar", "mer"], ["ventana", "fenêtre"]],
      en: [["quédate", "stay"], ["noche", "night"], ["corazón", "heart"], ["mar", "sea"], ["ventana", "window"]],
      es: [["reste", "quédate"], ["nuit", "noche"], ["coeur", "corazón"], ["stay", "quédate"], ["night", "noche"]],
      it: [["noche", "notte"], ["mar", "mare"], ["corazón", "cuore"]],
      pt: [["noche", "noite"], ["mar", "mar"], ["corazón", "coração"]]
    };
    items = lineas.slice(0, 5).map((l) => {
      let prop = l;
      (mapa[hacia] || []).forEach(([a, b]) => { prop = prop.replace(new RegExp(a, "ig"), b); });
      return { orig: l, prop, nota: `Adaptación léxica hacia ${hacia}, no traducción literal. Revisa sílabas en el editor.` };
    });
  }
  box.innerHTML = items.map((it, i) => `<article class="card">
    <p><span class="tag">original</span><br>${escapeHtml(it.orig)}</p>
    <p><span class="tag">propuesta</span><br>${escapeHtml(it.prop)}</p>
    <p class="hint">${it.nota}</p>
    <button type="button" data-aceptar="${i}">Aceptar este verso</button>
    <button type="button" data-descartar="${i}">Descartar</button>
  </article>`).join("");
  box.querySelectorAll("[data-aceptar]").forEach((btn) => btn.onclick = () => {
    const it = items[Number(btn.dataset.aceptar)];
    $("letra").value = $("letra").value.replace(it.orig, it.prop);
    renderAnalisis();
    toast("Verso aceptado");
    sugerir(accion);
  });
  box.querySelectorAll("[data-descartar]").forEach((btn) => btn.onclick = () => {
    btn.closest("article").remove();
  });
}

function gradoAcorde(grado, tonica, menor) {
  const idx = TONOS.indexOf(tonica);
  const mapa = { I:0, ii:2, iii:4, IV:5, V:7, vi:9, bIII:3, bVI:8, bVII:10, i:0, iv:5 };
  const semi = mapa[grado] ?? 0;
  const nombre = TONOS[(idx + semi) % 12];
  const esMenor = ["ii", "iii", "vi", "i", "iv"].includes(grado) || (menor && grado === "i");
  const cifrado = grado === "V" ? nombre : nombre + (esMenor || grado === "vi" || grado === "ii" || grado === "iii" || grado === "i" || grado === "iv" ? "m" : "");
  return { grado, cifrado: grado === "V" && menor ? nombre : cifrado };
}

function pintarAcordes() {
  const sel = $("tonalidad").value;
  const noSe = sel === "nose";
  const tonica = noSe ? "A" : sel.replace("m", "");
  const menor = sel.endsWith("m");
  const genero = $("genero").value;
  const lista = PROGS[genero] || PROGS.otro;
  let pack = lista[state.progIndex % lista.length];
  if ($("tension").value === "simple") pack = ["I", "IV", "V", "I"];
  if ($("tension").value === "tensa") pack = genero === "rock" ? ["i", "bVII", "bVI", "V"] : ["vi", "IV", "I", "V"];
  const acordes = pack.map((g) => gradoAcorde(g === "I" && menor ? "i" : g, tonica, menor));
  $("progresion").innerHTML = `<div class="chords">${acordes.map((a) => `<button type="button" class="chord" data-nota="${a.cifrado.replace("m", "")}"><b>${a.cifrado}</b><span>${a.grado}</span></button>`).join("")}</div>
    <p class="hint">${noSe ? "Sin tonalidad elegida: propongo La como punto de partida, cámbiala si la voz cae en otro sitio." : "Clic en un acorde para oír la fundamental."} ${$("tension").value === "tensa" ? "Más tensa: el relativo menor abre antes." : ""}</p>`;
  $("progresion").querySelectorAll(".chord").forEach((b) => b.onclick = () => sonar(b.dataset.nota));
  const bloques = analizar($("letra").value, $("idioma").value);
  const versos = bloques.flatMap((b) => b.versos);
  $("contorno").innerHTML = versos.slice(0, 12).map((v, i) => {
    const ac = acordes[i % acordes.length];
    const steps = Math.max(4, Math.min(16, v.n || 4));
    const pulso = Math.min(steps - 1, Math.max(0, v.acento));
    const alturas = Array.from({ length: steps }, (_, k) => 8 + ((k * 3 + i) % 5) * 4);
    return `<div class="card"><b>${ac.cifrado}</b> sobre verso ${v.i + 1} · pulso en sílaba ${pulso + 1}
      <div class="bar">${alturas.map((h) => `<i style="height:${h}px"></i>`).join("")}</div>
      <span class="tag">${alturas.map((h, k) => k === pulso ? "pulso" : h > 16 ? "sube" : "queda").slice(0, 8).join(" · ")}</span>
    </div>`;
  }).join("") || `<p class="hint">La letra vacía no tiene contorno. Escribe versos y vuelve.</p>`;
}

function sonar(nota) {
  const map = { C:261.6, "C#":277.2, D:293.7, Eb:311.1, E:329.6, F:349.2, "F#":370, G:392, Ab:415.3, A:440, Bb:466.2, B:493.9 };
  const ctx = state.audio || (state.audio = new (window.AudioContext || window.webkitAudioContext)());
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.value = map[nota] || 440;
  g.gain.setValueAtTime(0.001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + 0.62);
}

function leadSheet() {
  const bloques = analizar($("letra").value, $("idioma").value);
  const ton = $("tonalidad").value === "nose" ? "A (propuesta)" : $("tonalidad").value;
  let out = `${$("titulo").value || "Sin título"}\n${$("genero").value} · ${ton} · ${$("tempo").value}\n\n`;
  bloques.forEach((b) => {
    out += `[${nombreBloque(b)}]\n`;
    b.versos.forEach((v, i) => { out += `${v.raw}\n`; void i; });
    out += "\n";
  });
  navigator.clipboard.writeText(out).then(() => toast("Lead sheet copiado")).catch(() => toast("No se pudo copiar"));
}

function pieza() {
  return {
    titulo: $("titulo").value,
    genero: $("genero").value,
    tempo: $("tempo").value,
    emocion: $("emocion").value,
    idioma: $("idioma").value,
    tonalidad: $("tonalidad").value,
    letra: $("letra").value,
    fecha: new Date().toISOString()
  };
}

function cargar(p) {
  $("titulo").value = p.titulo || "";
  $("genero").value = p.genero || "balada";
  $("tempo").value = p.tempo || "medio";
  $("emocion").value = p.emocion || "nostalgia";
  $("idioma").value = p.idioma || "es";
  $("tonalidad").value = p.tonalidad || "Am";
  $("letra").value = p.letra || "";
  state.overrides = {};
  renderAnalisis();
  pintarAcordes();
}

function biblioteca() {
  const items = JSON.parse(localStorage.getItem("taller-canciones") || "[]");
  $("lista").innerHTML = items.length ? items.map((p, i) => `<article class="card"><b>${escapeHtml(p.titulo || "Sin título")}</b>
    <p class="hint">${p.genero} · ${p.idioma} · ${p.fecha.slice(0, 10)}</p>
    <button type="button" data-abrir="${i}">Abrir</button>
    <button type="button" data-borrar="${i}">Borrar</button></article>`).join("") : `<p class="hint">Todavía no hay piezas. Guarda desde el editor.</p>`;
  $("lista").querySelectorAll("[data-abrir]").forEach((b) => b.onclick = () => { cargar(items[b.dataset.abrir]); document.querySelector('[data-tab="editor"]').click(); });
  $("lista").querySelectorAll("[data-borrar]").forEach((b) => b.onclick = () => {
    items.splice(Number(b.dataset.borrar), 1);
    localStorage.setItem("taller-canciones", JSON.stringify(items));
    biblioteca();
  });
}

function init() {
  const ton = $("tonalidad");
  ton.innerHTML = `<option value="nose">no sé</option>` + TONOS.flatMap((t) => [`<option>${t}</option>`, `<option>${t}m</option>`]).join("");
  ton.value = "Am";
  document.querySelectorAll(".tab").forEach((tab) => tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("on"));
    tab.classList.add("on");
    $(tab.dataset.tab).classList.add("on");
    if (tab.dataset.tab === "acordes") pintarAcordes();
    if (tab.dataset.tab === "biblioteca") biblioteca();
  });
  document.querySelectorAll("[data-block]").forEach((b) => b.onclick = () => insertar(b.dataset.block));
  $("ejemplo").onclick = () => { $("letra").value = EJEMPLO; $("titulo").value = "La luz se queda"; renderAnalisis(); };
  $("letra").addEventListener("input", renderAnalisis);
  ["idioma", "genero", "tempo", "emocion", "sinalefa", "dieresis", "frClasico", "esquemaForzado"].forEach((id) => $(id).addEventListener("change", renderAnalisis));
  $("file").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    $("letra").value = await f.text();
    renderAnalisis();
  };
  document.querySelectorAll("[data-accion]").forEach((b) => b.onclick = () => sugerir(b.dataset.accion));
  $("otra").onclick = () => { state.progIndex++; pintarAcordes(); };
  $("tension").onchange = pintarAcordes;
  $("tonalidad").onchange = pintarAcordes;
  $("lead").onclick = leadSheet;
  $("guardar").onclick = () => {
    const items = JSON.parse(localStorage.getItem("taller-canciones") || "[]");
    items.unshift(pieza());
    localStorage.setItem("taller-canciones", JSON.stringify(items.slice(0, 40)));
    biblioteca();
    toast("Guardada en este navegador");
  };
  $("exportar").onclick = () => {
    const blob = new Blob([JSON.stringify(pieza(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${($("titulo").value || "cancion").replace(/\s+/g, "-")}.json`;
    a.click();
  };
  $("importar").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    cargar(JSON.parse(await f.text()));
    toast("Importada");
  };
  $("letra").value = EJEMPLO;
  $("titulo").value = "La luz se queda";
  renderAnalisis();
}

init();
