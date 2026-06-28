import { useState, useEffect, useCallback } from "react";
import { loadData, saveData } from "./supabase";

const GROUPS = [
  { name: "A", teams: ["México", "Sudáfrica", "Corea del Sur", "República Checa"] },
  { name: "B", teams: ["Canadá", "Bosnia y Herzegovina", "Qatar", "Suiza"] },
  { name: "C", teams: ["Brasil", "Marruecos", "Haití", "Escocia"] },
  { name: "D", teams: ["Estados Unidos", "Paraguay", "Australia", "Turquía"] },
  { name: "E", teams: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"] },
  { name: "F", teams: ["Países Bajos", "Japón", "Suecia", "Túnez"] },
  { name: "G", teams: ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"] },
  { name: "H", teams: ["España", "Cabo Verde", "Arabia Saudí", "Uruguay"] },
  { name: "I", teams: ["Francia", "Senegal", "Irak", "Noruega"] },
  { name: "J", teams: ["Argentina", "Argelia", "Austria", "Jordania"] },
  { name: "K", teams: ["Portugal", "R.D. del Congo", "Uzbekistán", "Colombia"] },
  { name: "L", teams: ["Inglaterra", "Croacia", "Ghana", "Panamá"] },
];
const ALL_TEAMS = GROUPS.flatMap(g => g.teams);

const MATCHES = GROUPS.flatMap(g => {
  const [t1,t2,t3,t4] = g.teams;
  return [
    {id:`${g.name}1`,group:g.name,home:t1,away:t2},
    {id:`${g.name}2`,group:g.name,home:t3,away:t4},
    {id:`${g.name}3`,group:g.name,home:t1,away:t3},
    {id:`${g.name}4`,group:g.name,home:t2,away:t4},
    {id:`${g.name}5`,group:g.name,home:t1,away:t4},
    {id:`${g.name}6`,group:g.name,home:t2,away:t3},
  ];
});

const KO_ROUNDS = [
  {id:"ro32",label:"Dieciseisavos",matches:16},
  {id:"ro16",label:"Octavos",matches:8},
  {id:"qf",label:"Cuartos",matches:4},
  {id:"sf",label:"Semifinales",matches:2},
  {id:"3rd",label:"3er Puesto",matches:1},
  {id:"final",label:"Final",matches:1},
];

const PTS = {groupResult:1,groupExact:3,knockoutWinner:2,champion:10,topScorer:8,goldenBall:6,bestGk:5,revelation:6,disappointment:6};
const TOTAL_POT = 1500;
const PLAYERS = ["Sergio","Juan Carlos","David","Julio","Miguel"];
const PLAYER_PINS = ["1111","2222","3333","4444","5555"];
const ADMIN_PIN = "Mundial2026";
const EMOJIS = ["🏆","⚽","🔥","🌟","🎯"];
const DEADLINE = new Date("2026-06-11T13:00:00");
const isLocked = () => new Date() >= DEADLINE;

const STAR_PLAYERS = ["Kylian Mbappé","Vinicius Jr.","Lamine Yamal","Erling Haaland","Harry Kane","Lionel Messi","Cristiano Ronaldo","Neymar Jr.","Pedri","Rodri","Jude Bellingham","Phil Foden","Bukayo Saka","Gavi","Federico Valverde","Darwin Núñez","Robert Lewandowski","Cody Gakpo"];
const STAR_GKS = ["Alisson Becker","Ederson","Manuel Neuer","Thibaut Courtois","Gianluigi Donnarumma","David Raya","Unai Simón","Mike Maignan","André Onana","Yann Sommer","Jordan Pickford","Diogo Costa"];

const FLAGS = {"México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","República Checa":"🇨🇿","Canadá":"🇨🇦","Bosnia y Herzegovina":"🇧🇦","Qatar":"🇶🇦","Suiza":"🇨🇭","Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Estados Unidos":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷","Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨","Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳","Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿","España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudí":"🇸🇦","Uruguay":"🇺🇾","Francia":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Noruega":"🇳🇴","Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴","Portugal":"🇵🇹","R.D. del Congo":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴","Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦"};
const flag = t => FLAGS[t] || "🏳️";

function emptyPred() {
  const p = {champion:"",topScorer:"",goldenBall:"",bestGk:"",revelation:"",disappointment:"",groupMatches:{},knockoutMatches:{}};
  MATCHES.forEach(m => { p.groupMatches[m.id] = {home:"",away:""}; });
  return p;
}

function emptyResults() {
  return {groupMatches:{},knockoutMatches:{},champion:"",topScorer:"",goldenBall:"",bestGk:"",revelation:"",disappointment:""};
}

function emptyKoConfig() {
  const cfg = {};
  KO_ROUNDS.forEach(r => {
    cfg[r.id] = {
      enabled: false,
      matches: Array.from({length:r.matches}, (_,i) => ({id:`${r.id}_${i+1}`,home:"",away:""}))
    };
  });
  return cfg;
}

// ── Lock Screen ──────────────────────────────────────────────────────────────
function LockScreen({onLogin}) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [customPins, setCustomPins] = useState({});
  const [loadingPins, setLoadingPins] = useState(true);

  useEffect(() => {
    loadData("custom_pins").then(data => {
      if (data) setCustomPins(data);
      setLoadingPins(false);
    }).catch(() => setLoadingPins(false));
  }, []);

  const getPin = (idx) => customPins[idx] || PLAYER_PINS[idx];

  const tryLogin = () => {
    if (selected === "admin") {
      if (pin === ADMIN_PIN) { onLogin("admin", -1); return; }
    } else if (selected !== null && selected !== undefined) {
      if (pin === getPin(selected)) { onLogin("player", selected, getPin(selected)); return; }
    }
    setError("PIN incorrecto ❌");
    setPin("");
    setTimeout(() => setError(""), 2000);
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a1628 0%,#0d2137 40%,#0f2d1f 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Trebuchet MS','Segoe UI',sans-serif",color:"#e8f4e8",padding:24}}>
      <div style={{fontSize:40,marginBottom:8}}>⚽</div>
      <div style={{fontSize:22,fontWeight:900,color:"#f0d060",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Quiniela Mundial 2026</div>
      <div style={{fontSize:11,color:"#5a8aaa",letterSpacing:3,marginBottom:32}}>CANADA · MEXICO · USA</div>
      {selected === null ? (
        <>
          <div style={{fontSize:13,color:"#aac8cc",marginBottom:14}}>¿Quién eres?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,width:"100%",maxWidth:280}}>
            {PLAYERS.map((p,i) => (
              <button key={i} onClick={() => setSelected(i)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"12px 16px",color:"#e8f4e8",fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                <span>{EMOJIS[i]}</span>{p}
              </button>
            ))}
            <button onClick={() => setSelected("admin")} style={{background:"rgba(200,168,0,0.1)",border:"1px solid rgba(200,168,0,0.3)",borderRadius:10,padding:"12px 16px",color:"#f0d060",fontSize:14,fontWeight:700,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10,marginTop:4}}>
              <span>⚙️</span>Admin
            </button>
          </div>
        </>
      ) : (
        <div style={{width:"100%",maxWidth:280,textAlign:"center"}}>
          <div style={{fontSize:14,color:"#aac8cc",marginBottom:6}}>{selected==="admin"?"PIN de Admin":`PIN de ${PLAYERS[selected]}`}</div>
          <div style={{fontSize:11,color:"#5a7a9a",marginBottom:16}}>Introduce tu PIN personal</div>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="••••" autoFocus
            style={{width:"100%",boxSizing:"border-box",padding:"12px 14px",background:"#071828",border:"1px solid #1a4a6a",borderRadius:10,color:"#f0d060",fontSize:18,textAlign:"center",letterSpacing:4,outline:"none",marginBottom:10}}/>
          {error && <div style={{color:"#ff6060",fontSize:13,marginBottom:8}}>{error}</div>}
          <button onClick={tryLogin} style={{width:"100%",padding:12,background:"linear-gradient(180deg,#c8a800,#a07800)",border:"none",borderRadius:10,color:"#0a1628",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:10}}>Entrar →</button>
          <button onClick={()=>{setSelected(null);setPin("");setError("");}} style={{background:"transparent",border:"none",color:"#5a7a9a",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>← Volver</button>
        </div>
      )}
    </div>
  );
}

// ── Admin Special Row (no useState in map) ───────────────────────────────────
function AdminSpecialRow({keyName, label, options, teamPick, freeText, value, onSet, onClear}) {
  const [cv, setCv] = useState("");
  return (
    <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 14px",marginBottom:10,border:"1px solid rgba(255,255,255,0.07)"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#aac8cc",marginBottom:8}}>{label}</div>
      {value && (
        <div style={{marginBottom:8,padding:"5px 10px",background:"rgba(0,168,0,0.15)",borderRadius:7,fontSize:12,color:"#80ff80",fontWeight:700}}>
          ✅ {teamPick?flag(value):""} {value}
          <button onClick={onClear} style={{marginLeft:8,background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:11}}>✕</button>
        </div>
      )}
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:freeText?6:0}}>
        {options.map(o => (
          <button key={o} onClick={()=>onSet(o)} style={{background:value===o?"linear-gradient(135deg,#006620,#00aa40)":"rgba(255,255,255,0.05)",color:value===o?"#fff":"#c8d8e8",border:value===o?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer",fontWeight:value===o?700:400}}>
            {teamPick?flag(o):""} {o}
          </button>
        ))}
      </div>
      {freeText && (
        <div style={{display:"flex",gap:6,marginTop:4}}>
          <input value={cv} onChange={e=>setCv(e.target.value)} placeholder="Otro nombre..." style={{flex:1,background:"#071828",border:"1px solid #1a4a6a",borderRadius:7,color:"#e8f4e8",fontSize:12,padding:"5px 8px",outline:"none"}}/>
          <button onClick={()=>{if(cv.trim()){onSet(cv.trim());setCv("");}}} style={{background:"rgba(0,120,0,0.4)",border:"none",borderRadius:7,color:"#80ff80",padding:"5px 10px",fontSize:12,cursor:"pointer",fontWeight:700}}>OK</button>
        </div>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("scores");
  const [myPred, setMyPred] = useState(null);
  const [allPreds, setAllPreds] = useState([]);
  const [results, setResults] = useState(emptyResults());
  const [koConfig, setKoConfig] = useState(emptyKoConfig());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [selGroup, setSelGroup] = useState("A");
  const [selRound, setSelRound] = useState("ro32");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const locked = isLocked();

  const isAdmin = session?.role === "admin";
  const myIdx = session?.playerIdx;

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const init = async () => {
      try {
        const res = await loadData("results");
        if (res) setResults(res);
        const ko = await loadData("ko_config");
        if (ko) setKoConfig(ko);
        const preds = await Promise.all(PLAYERS.map((_,i) => loadData(`pred_${i}`)));
        setAllPreds(preds.map(p => p || emptyPred()));
        if (!isAdmin && myIdx >= 0) setMyPred(preds[myIdx] || emptyPred());
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    init();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const iv = setInterval(async () => {
      try {
        const res = await loadData("results");
        if (res) setResults(res);
        const ko = await loadData("ko_config");
        if (ko) setKoConfig(ko);
        const preds = await Promise.all(PLAYERS.map((_,i) => loadData(`pred_${i}`)));
        setAllPreds(preds.map(p => p || emptyPred()));
        if (!isAdmin && myIdx >= 0 && preds[myIdx]) setMyPred(preds[myIdx]);
      } catch(e) {}
    }, 30000);
    return () => clearInterval(iv);
  }, [session]);

  const flash = msg => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 2500); };

  const updateMyPred = useCallback((updater) => {
    if (locked) return;
    setMyPred(prev => {
      const next = updater(prev);
      setSaving(true);
      saveData(`pred_${myIdx}`, next).then(() => { setSaving(false); flash("✅ Guardado"); });
      return next;
    });
  }, [myIdx, locked]);

  const setPred = (type, matchId, field, value) =>
    updateMyPred(prev => ({...prev, [type]: {...prev[type], [matchId]: {...(prev[type]?.[matchId]||{}), [field]: value}}}));

  const setSpecial = (key, value) =>
    updateMyPred(prev => ({...prev, [key]: value}));

  const updateResults = (updater) => {
    setResults(prev => {
      const next = updater(prev);
      setSaving(true);
      saveData("results", next).then(() => { setSaving(false); flash("✅ Resultado guardado"); });
      return next;
    });
  };

  const setResult = (type, matchId, field, value) =>
    updateResults(prev => ({...prev, [type]: {...prev[type], [matchId]: {...(prev[type]?.[matchId]||{}), [field]: value}}}));

  const setSpecialResult = (key, value) =>
    updateResults(prev => ({...prev, [key]: value}));

  const updateKoConfig = (next) => {
    setKoConfig(next);
    saveData("ko_config", next);
  };

  const calcScore = (pred) => {
    if (!pred) return {total:0, group:0, knockout:0, specials:0};
    let group = 0, knockout = 0, specials = 0;
    MATCHES.forEach(m => {
      const r = results.groupMatches?.[m.id];
      const p = pred.groupMatches?.[m.id];
      if (!r || r.home==="" || r.away==="" || !p || p.home==="" || p.away==="") return;
      const rh=parseInt(r.home), ra=parseInt(r.away), ph=parseInt(p.home), pa=parseInt(p.away);
      if (isNaN(rh)||isNaN(ra)||isNaN(ph)||isNaN(pa)) return;
      const res = (h,a) => h>a?"H":a>h?"A":"D";
      if (ph===rh && pa===ra) group += PTS.groupExact;
      else if (res(ph,pa)===res(rh,ra)) group += PTS.groupResult;
    });
    Object.values(koConfig).forEach(roundCfg => {
      if (!roundCfg?.enabled || !roundCfg?.matches) return;
      roundCfg.matches.forEach(m => {
        if (!m.home || !m.away) return;
        const r = results.knockoutMatches?.[m.id];
        const p = pred.knockoutMatches?.[m.id];
        if (!r || r.home==="" || r.home===undefined || r.away==="" || r.away===undefined) return;
        if (!p || p.home==="" || p.home===undefined || p.away==="" || p.away===undefined) return;
        const rh=parseInt(r.home), ra=parseInt(r.away), ph=parseInt(p.home), pa=parseInt(p.away);
        if (isNaN(rh)||isNaN(ra)||isNaN(ph)||isNaN(pa)) return;
        const getRes = (h,a) => h>a?"H":a>h?"A":"D";
        if (ph===rh && pa===ra) knockout += PTS.groupExact;
        else if (getRes(ph,pa)===getRes(rh,ra)) knockout += PTS.groupResult;
      });
    });
    ["champion","topScorer","goldenBall","bestGk","revelation","disappointment"].forEach(k => {
      if (pred[k] && results[k] && pred[k]===results[k]) specials += PTS[k];
    });
    return {total:group+knockout+specials, group, knockout, specials};
  };

  const predsForScore = PLAYERS.map((_,i) => i===myIdx&&!isAdmin ? myPred : allPreds[i]);
  const ranked = PLAYERS.map((n,i) => ({name:n, idx:i, ...calcScore(predsForScore[i])})).sort((a,b) => b.total-a.total);

  if (!session) return <LockScreen onLogin={(role,playerIdx,pin) => { setSession({role,playerIdx,pin}); setTab(role==="admin"?"admin":"scores"); }}/>;
  if (loading || (!isAdmin && !myPred)) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a1628,#0d2137)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Trebuchet MS',sans-serif",color:"#f0d060",fontSize:16}}>
      ⚽ Cargando quiniela...
    </div>
  );

  const TABS = isAdmin
    ? [{id:"admin",label:"⚙️ Admin"},{id:"scores",label:"📊 Tabla"}]
    : [{id:"scores",label:"📊 Tabla"},{id:"group",label:"📋 Grupos"},{id:"knockout",label:"🏆 Eliminatorias"},{id:"special",label:"⭐ Especiales"},{id:"pin",label:"🔑 Mi PIN"}];

  const chip = (active) => ({background:active?"rgba(255,255,255,0.1)":"transparent",color:active?"#f0d060":"#c8d8e8",border:active?"1px solid rgba(200,168,0,0.4)":"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:active?700:400,cursor:"pointer"});

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a1628 0%,#0d2137 40%,#0f2d1f 100%)",fontFamily:"'Trebuchet MS','Segoe UI',sans-serif",color:"#e8f4e8",paddingBottom:60}}>

      {/* Header */}
      <div style={{background:"linear-gradient(90deg,#c8a800,#f0d060,#c8a800)",padding:"14px 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:"#0a1628",textTransform:"uppercase",letterSpacing:1}}>⚽ Quiniela Mundial 2026</div>
          <div style={{fontSize:10,color:"#0a1628",opacity:0.6,letterSpacing:2}}>CANADA · MEXICO · USA</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"#0a1628",fontWeight:700}}>{isAdmin?"⚙️ Admin":`${EMOJIS[myIdx]} ${PLAYERS[myIdx]}`}</div>
          <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:3,alignItems:"center"}}>
            {saveMsg && <span style={{fontSize:10,color:"#0a5020",fontWeight:700}}>{saveMsg}</span>}
            {saving && <span style={{fontSize:10,color:"#0a5020"}}>💾...</span>}
            <button onClick={()=>setSession(null)} style={{fontSize:10,background:"rgba(0,0,0,0.15)",border:"none",borderRadius:4,padding:"2px 7px",color:"#0a1628",cursor:"pointer"}}>Salir</button>
          </div>
        </div>
      </div>

      {locked && !isAdmin && (
        <div style={{background:"rgba(255,80,80,0.15)",borderBottom:"1px solid rgba(255,80,80,0.3)",padding:"8px 16px",textAlign:"center",fontSize:12,color:"#ff8888"}}>
          🔒 Los pronósticos están cerrados — el torneo ya comenzó
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",overflowX:"auto",background:"#071020",borderBottom:"2px solid #1a3a5c"}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?"linear-gradient(180deg,#c8a800,#a07800)":"transparent",color:tab===t.id?"#0a1628":"#7aaccc",border:"none",padding:"12px 16px",fontSize:12,fontWeight:tab===t.id?800:500,cursor:"pointer",whiteSpace:"nowrap",borderBottom:tab===t.id?"2px solid #f0d060":"2px solid transparent"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px"}}>

        {/* ── SCORES ── */}
        {tab==="scores" && (() => {
          const topScore = ranked[0]?.total || 0;
          const winners = ranked.filter(p => p.total===topScore && topScore>0);
          const prizeEach = winners.length>1 ? Math.floor(TOTAL_POT/winners.length) : TOTAL_POT;
          return (
            <div>
              <div style={{background:"linear-gradient(135deg,rgba(200,168,0,0.2),rgba(200,168,0,0.05))",border:"1px solid rgba(200,168,0,0.4)",borderRadius:12,padding:"14px 16px",marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:11,color:"#aac8cc",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>💰 Bote total</div>
                <div style={{fontSize:32,fontWeight:900,color:"#f0d060"}}>${TOTAL_POT.toLocaleString()} <span style={{fontSize:16}}>MXN</span></div>
                <div style={{fontSize:11,color:"#7a9a7a",marginTop:2}}>$300 por jugador · 5 participantes</div>
              </div>
              <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>📊 Tabla de Posiciones</h2>
              {ranked.map((p,rank) => {
                const isWinning = p.total===topScore && topScore>0;
                const isMe = p.idx===myIdx && !isAdmin;
                return (
                  <div key={p.idx} style={{background:isMe?"linear-gradient(90deg,rgba(200,168,0,0.18),rgba(200,168,0,0.04))":isWinning?"linear-gradient(90deg,rgba(200,168,0,0.10),rgba(0,0,0,0))":"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 16px",marginBottom:8,border:isMe?"1px solid rgba(200,168,0,0.35)":isWinning?"1px solid rgba(200,168,0,0.2)":"1px solid rgba(255,255,255,0.06)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:20,minWidth:30}}>{rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":`${rank+1}.`}</span>
                      <span style={{flex:1,fontSize:15,fontWeight:600}}>{p.name} {isMe&&<span style={{fontSize:10,color:"#c8a800"}}>← tú</span>}</span>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:22,fontWeight:900,color:rank===0?"#f0d060":"#7aaccc"}}>{p.total} <span style={{fontSize:11,color:"#5a7a9a",fontWeight:400}}>pts</span></div>
                        {isWinning && topScore>0 && <div style={{fontSize:10,color:"#80cc60",fontWeight:700}}>+${prizeEach.toLocaleString()} MXN</div>}
                      </div>
                    </div>
                    {p.total>0 && (
                      <div style={{display:"flex",gap:8,marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                        {[{l:"📋 Grupos",v:p.group},{l:"🏆 Elim.",v:p.knockout},{l:"⭐ Espec.",v:p.specials}].map(s => (
                          <div key={s.l} style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"4px 6px"}}>
                            <div style={{fontSize:10,color:"#6a8aaa"}}>{s.l}</div>
                            <div style={{fontSize:14,fontWeight:700,color:"#c8d8e8"}}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {winners.length>1 && topScore>0 && (
                <div style={{padding:"10px 14px",background:"rgba(200,168,0,0.08)",borderRadius:10,border:"1px solid rgba(200,168,0,0.25)",fontSize:12,color:"#c8a800",marginBottom:10}}>
                  ⚖️ Empate entre {winners.map(w=>w.name).join(" y ")} — se reparte: <b>${prizeEach.toLocaleString()} MXN cada uno</b>
                </div>
              )}
              {MATCHES.filter(m => results.groupMatches?.[m.id]?.home!=="").length>0 && (
                <div style={{marginTop:16}}>
                  <h3 style={{color:"#f0d060",fontSize:13,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🎯 Últimos Resultados</h3>
                  {MATCHES.filter(m => results.groupMatches?.[m.id]?.home!=="" && results.groupMatches?.[m.id]?.home!==undefined).slice(-5).reverse().map(m => {
                    const r = results.groupMatches[m.id];
                    return (
                      <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 12px",marginBottom:6,border:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:12}}>{flag(m.home)} {m.home}</span>
                        <span style={{fontSize:14,fontWeight:900,color:"#f0d060",padding:"0 10px"}}>{r.home} - {r.away}</span>
                        <span style={{fontSize:12}}>{m.away} {flag(m.away)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{marginTop:8,padding:"10px 12px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",fontSize:12,color:"#6a8aaa"}}>
                🔒 Pronósticos privados · 🔄 Actualización cada 30s
              </div>
            </div>
          );
        })()}

        {/* ── GRUPOS ── */}
        {tab==="group" && !isAdmin && (
          <div>
            <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Tus pronósticos — Grupos {locked&&"🔒"}</h2>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {"ABCDEFGHIJKL".split("").map(g => <button key={g} onClick={()=>setSelGroup(g)} style={chip(selGroup===g)}>Grupo {g}</button>)}
            </div>
            {MATCHES.filter(m=>m.group===selGroup).map(m => {
              const pred = myPred?.groupMatches?.[m.id] || {home:"",away:""};
              const r = results.groupMatches?.[m.id];
              const hasResult = r && r.home!==undefined && r.home!=="";
              return (
                <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 14px",marginBottom:10,border:`1px solid ${hasResult?"rgba(100,200,100,0.2)":"rgba(255,255,255,0.07)"}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{flex:1,textAlign:"right",fontSize:13,fontWeight:600}}>{flag(m.home)} {m.home}</span>
                    <input type="number" min="0" max="20" value={pred.home} onChange={e=>setPred("groupMatches",m.id,"home",e.target.value)} disabled={locked}
                      style={{width:40,textAlign:"center",background:locked?"#040e18":"#071828",border:"1px solid #1a4a6a",borderRadius:6,color:"#f0d060",fontSize:16,fontWeight:700,padding:4}}/>
                    <span style={{color:"#5a7a9a",fontWeight:700}}>-</span>
                    <input type="number" min="0" max="20" value={pred.away} onChange={e=>setPred("groupMatches",m.id,"away",e.target.value)} disabled={locked}
                      style={{width:40,textAlign:"center",background:locked?"#040e18":"#071828",border:"1px solid #1a4a6a",borderRadius:6,color:"#f0d060",fontSize:16,fontWeight:700,padding:4}}/>
                    <span style={{flex:1,textAlign:"left",fontSize:13,fontWeight:600}}>{m.away} {flag(m.away)}</span>
                  </div>
                  {hasResult && <div style={{textAlign:"center",marginTop:6,fontSize:11,color:"#80cc60"}}>Resultado real: {r.home}-{r.away}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ELIMINATORIAS ── */}
        {tab==="knockout" && !isAdmin && (
          <div>
            <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>🏆 Eliminatorias</h2>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {KO_ROUNDS.map(r => {
                const cfg = koConfig[r.id];
                return <button key={r.id} onClick={()=>setSelRound(r.id)} style={{...chip(selRound===r.id),opacity:cfg?.enabled?1:0.4}}>{r.label} {cfg?.enabled?"":"🔒"}</button>;
              })}
            </div>
            {!koConfig[selRound]?.enabled ? (
              <div style={{textAlign:"center",padding:"40px 20px",background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{fontSize:32,marginBottom:12}}>🔒</div>
                <div style={{fontSize:15,fontWeight:700,color:"#f0d060",marginBottom:8}}>Ronda no disponible aún</div>
                <div style={{fontSize:13,color:"#6a8aaa"}}>El Admin la habilitará cuando se conozcan los cruces</div>
              </div>
            ) : (
              koConfig[selRound].matches.map(m => {
                const pred = myPred?.knockoutMatches?.[m.id];
                const r = results.knockoutMatches?.[m.id];
                const teams = [m.home, m.away].filter(Boolean);
                if (!m.home || !m.away) return null;
                const predScore = myPred?.knockoutMatches?.[m.id] || {home:"",away:""};
                const realScore = results.knockoutMatches?.[m.id] || {};
                const hasResult = realScore.home !== undefined && realScore.home !== "";
                const getRes = (h,a) => h>a ? m.home : a>h ? m.away : "empate";
                return (
                  <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:14,marginBottom:10,border:`1px solid ${hasResult?"rgba(100,200,100,0.2)":"rgba(255,255,255,0.07)"}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{flex:1,textAlign:"right",fontSize:13,fontWeight:600}}>{flag(m.home)} {m.home}</span>
                      <input type="number" min="0" max="20" value={predScore.home||""} onChange={e=>updateMyPred(prev=>({...prev,knockoutMatches:{...(prev.knockoutMatches||{}),[m.id]:{...(prev.knockoutMatches?.[m.id]||{}),home:e.target.value}}}))}
                        style={{width:40,textAlign:"center",background:"#071828",border:"1px solid #1a4a6a",borderRadius:6,color:"#f0d060",fontSize:16,fontWeight:700,padding:4}}/>
                      <span style={{color:"#5a7a9a",fontWeight:700}}>-</span>
                      <input type="number" min="0" max="20" value={predScore.away||""} onChange={e=>updateMyPred(prev=>({...prev,knockoutMatches:{...(prev.knockoutMatches||{}),[m.id]:{...(prev.knockoutMatches?.[m.id]||{}),away:e.target.value}}}))}
                        style={{width:40,textAlign:"center",background:"#071828",border:"1px solid #1a4a6a",borderRadius:6,color:"#f0d060",fontSize:16,fontWeight:700,padding:4}}/>
                      <span style={{flex:1,textAlign:"left",fontSize:13,fontWeight:600}}>{m.away} {flag(m.away)}</span>
                    </div>
                    {hasResult && <div style={{textAlign:"center",marginTop:6,fontSize:11,color:"#80cc60"}}>Resultado real: {realScore.home}-{realScore.away}</div>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── ESPECIALES ── */}
        {tab==="special" && !isAdmin && (
          <div>
            <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>⭐ Picks Especiales {locked&&"🔒"}</h2>
            <div style={{color:"#6a8aaa",fontSize:12,marginBottom:16}}>Se resuelven al final del torneo</div>
            {[
              {key:"champion",label:"🥇 Campeón del Mundial",pts:10,options:ALL_TEAMS,teamPick:true},
              {key:"topScorer",label:"👟 Bota de Oro",pts:8,options:STAR_PLAYERS,freeText:true},
              {key:"goldenBall",label:"🏅 Balón de Oro",pts:6,options:STAR_PLAYERS,freeText:true},
              {key:"bestGk",label:"🧤 Guante de Oro",pts:5,options:STAR_GKS,freeText:true},
              {key:"revelation",label:"🌟 Equipo Revelación",pts:6,options:ALL_TEAMS,teamPick:true},
              {key:"disappointment",label:"😬 Equipo Decepción",pts:6,options:ALL_TEAMS,teamPick:true},
            ].map(({key,label,pts,options,teamPick,freeText}) => {
              const value = myPred?.[key] || "";
              return (
                <div key={key} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:14,marginBottom:12,border:"1px solid rgba(255,255,255,0.08)",opacity:locked?0.7:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:14,fontWeight:700,color:"#e8f4e8"}}>{label}</span>
                    <span style={{fontSize:11,color:"#f0d060",fontWeight:700,background:"rgba(200,168,0,0.15)",padding:"2px 8px",borderRadius:10}}>+{pts} pts</span>
                  </div>
                  {value && (
                    <div style={{marginBottom:8,padding:"6px 10px",background:"rgba(200,168,0,0.15)",borderRadius:8,fontSize:13,color:"#f0d060",fontWeight:700}}>
                      ✅ {teamPick?flag(value):"⚽"} {value}
                      {!locked && <button onClick={()=>setSpecial(key,"")} style={{marginLeft:8,background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:11}}>✕</button>}
                    </div>
                  )}
                  {!locked && (
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {options.map(o => (
                        <button key={o} onClick={()=>setSpecial(key,o)}
                          style={{background:value===o?"linear-gradient(135deg,#c8a800,#f0d060)":"rgba(255,255,255,0.05)",color:value===o?"#0a1628":"#c8d8e8",border:value===o?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:value===o?700:400}}>
                          {teamPick?flag(o):""} {o}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CAMBIAR PIN ── */}
        {tab==="pin" && !isAdmin && (
          <div>
            <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>🔑 Cambiar mi PIN</h2>
            <div style={{color:"#6a8aaa",fontSize:12,marginBottom:20}}>Ni el Admin sabrá tu nuevo PIN. Si lo olvidas tendrás que pedirle que te lo resetee.</div>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:16,border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,color:"#aac8cc",marginBottom:6}}>PIN actual</div>
                <input type="password" value={currentPin} onChange={e=>setCurrentPin(e.target.value)} placeholder="••••"
                  style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",background:"#071828",border:"1px solid #1a4a6a",borderRadius:8,color:"#f0d060",fontSize:16,textAlign:"center",letterSpacing:4,outline:"none"}}/>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,color:"#aac8cc",marginBottom:6}}>Nuevo PIN</div>
                <input type="password" value={newPin} onChange={e=>setNewPin(e.target.value)} placeholder="••••"
                  style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",background:"#071828",border:"1px solid #1a4a6a",borderRadius:8,color:"#f0d060",fontSize:16,textAlign:"center",letterSpacing:4,outline:"none"}}/>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"#aac8cc",marginBottom:6}}>Confirmar nuevo PIN</div>
                <input type="password" value={newPin2} onChange={e=>setNewPin2(e.target.value)} placeholder="••••"
                  style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",background:"#071828",border:"1px solid #1a4a6a",borderRadius:8,color:"#f0d060",fontSize:16,textAlign:"center",letterSpacing:4,outline:"none"}}/>
              </div>
              {pinMsg && <div style={{textAlign:"center",marginBottom:12,fontSize:13,color:pinMsg.includes("✅")?"#80ff80":"#ff8888"}}>{pinMsg}</div>}
              <button onClick={async()=>{
                if(!currentPin||!newPin||!newPin2){setPinMsg("❌ Llena todos los campos");return;}
                if(newPin!==newPin2){setPinMsg("❌ Los PINs nuevos no coinciden");return;}
                if(newPin.length<4){setPinMsg("❌ El PIN debe tener al menos 4 caracteres");return;}
                const currentCorrect = session.pin || PLAYER_PINS[myIdx];
                if(currentPin!==currentCorrect){setPinMsg("❌ PIN actual incorrecto");return;}
                try {
                  const existing = await loadData("custom_pins") || {};
                  existing[myIdx] = newPin;
                  await saveData("custom_pins", existing);
                  setSession(prev=>({...prev,pin:newPin}));
                  setPinMsg("✅ PIN cambiado correctamente");
                  setCurrentPin(""); setNewPin(""); setNewPin2("");
                } catch(e){ setPinMsg("❌ Error al guardar, intenta de nuevo"); }
              }} style={{width:"100%",padding:12,background:"linear-gradient(180deg,#c8a800,#a07800)",border:"none",borderRadius:10,color:"#0a1628",fontSize:14,fontWeight:800,cursor:"pointer"}}>
                Cambiar PIN
              </button>
            </div>
            <div style={{marginTop:16,padding:"10px 14px",background:"rgba(255,80,80,0.08)",borderRadius:10,border:"1px solid rgba(255,80,80,0.2)",fontSize:12,color:"#ff8888"}}>
              ⚠️ Si olvidas tu nuevo PIN, pídele a Sergio que te lo resetee.
            </div>
          </div>
        )}

        {/* ── ADMIN ── */}
        {tab==="admin" && isAdmin && (
          <div>
            <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>⚙️ Cargar Resultados</h2>

            {/* Grupos */}
            <div style={{fontSize:13,color:"#aac8cc",marginBottom:8,fontWeight:700}}>Grupos</div>
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {"ABCDEFGHIJKL".split("").map(g => <button key={g} onClick={()=>setSelGroup(g)} style={chip(selGroup===g)}>Grupo {g}</button>)}
            </div>
            {MATCHES.filter(m=>m.group===selGroup).map(m => {
              const r = results.groupMatches?.[m.id] || {};
              return (
                <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 14px",marginBottom:8,border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{flex:1,textAlign:"right",fontSize:12}}>{flag(m.home)} {m.home}</span>
                    <input type="number" min="0" max="20" value={r.home||""} onChange={e=>setResult("groupMatches",m.id,"home",e.target.value)}
                      style={{width:36,textAlign:"center",background:"#071828",border:"1px solid #2a6a3a",borderRadius:6,color:"#80ff80",fontSize:15,fontWeight:700,padding:4}}/>
                    <span style={{color:"#5a7a9a"}}>-</span>
                    <input type="number" min="0" max="20" value={r.away||""} onChange={e=>setResult("groupMatches",m.id,"away",e.target.value)}
                      style={{width:36,textAlign:"center",background:"#071828",border:"1px solid #2a6a3a",borderRadius:6,color:"#80ff80",fontSize:15,fontWeight:700,padding:4}}/>
                    <span style={{flex:1,textAlign:"left",fontSize:12}}>{m.away} {flag(m.away)}</span>
                  </div>
                </div>
              );
            })}

            {/* Eliminatorias */}
            <div style={{fontSize:13,color:"#aac8cc",margin:"16px 0 8px",fontWeight:700}}>🏆 Eliminatorias</div>
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {KO_ROUNDS.map(r => <button key={r.id} onClick={()=>setSelRound(r.id)} style={chip(selRound===r.id)}>{r.label}</button>)}
            </div>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",marginBottom:12,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px"}}>
                <div>
                  <div style={{fontSize:13,color:"#aac8cc",fontWeight:700}}>{koConfig[selRound]?.enabled?"🟢 Votación abierta":"🔴 Votación cerrada"}</div>
                  <div style={{fontSize:11,color:"#5a7a9a",marginTop:2}}>{koConfig[selRound]?.enabled?"Los jugadores pueden votar esta ronda":"Los jugadores no ven esta ronda aún"}</div>
                </div>
                <button onClick={()=>{
                  const next = {...koConfig, [selRound]:{...koConfig[selRound],enabled:!koConfig[selRound]?.enabled}};
                  updateKoConfig(next);
                }} style={{background:koConfig[selRound]?.enabled?"rgba(255,80,80,0.2)":"rgba(80,200,80,0.2)",border:"none",borderRadius:8,padding:"8px 16px",color:koConfig[selRound]?.enabled?"#ff8888":"#80ff80",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  {koConfig[selRound]?.enabled?"🔒 Cerrar":"🔓 Abrir"}
                </button>
              </div>
            </div>
            {koConfig[selRound]?.matches.map((m,idx) => {
              const r = results.knockoutMatches?.[m.id] || {};
              return (
                <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 14px",marginBottom:8,border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{fontSize:11,color:"#6a8aaa",marginBottom:8}}>Partido {idx+1}</div>
                  <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}>
                    <select value={m.home||""} onChange={e=>{
                      const next = {...koConfig};
                      next[selRound] = {...next[selRound], matches:[...next[selRound].matches]};
                      next[selRound].matches[idx] = {...m,home:e.target.value};
                      updateKoConfig(next);
                    }} style={{flex:1,background:"#071828",border:"1px solid #1a4a6a",borderRadius:6,color:"#e8f4e8",fontSize:12,padding:"6px"}}>
                      <option value="">-- Local --</option>
                      {ALL_TEAMS.map(t=><option key={t} value={t}>{flag(t)} {t}</option>)}
                    </select>
                    <span style={{color:"#5a7a9a",fontWeight:700}}>vs</span>
                    <select value={m.away||""} onChange={e=>{
                      const next = {...koConfig};
                      next[selRound] = {...next[selRound], matches:[...next[selRound].matches]};
                      next[selRound].matches[idx] = {...m,away:e.target.value};
                      updateKoConfig(next);
                    }} style={{flex:1,background:"#071828",border:"1px solid #1a4a6a",borderRadius:6,color:"#e8f4e8",fontSize:12,padding:"6px"}}>
                      <option value="">-- Visitante --</option>
                      {ALL_TEAMS.map(t=><option key={t} value={t}>{flag(t)} {t}</option>)}
                    </select>
                  </div>
                  {m.home && m.away && (
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:11,color:"#6a8aaa",marginBottom:6}}>Resultado real:</div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{flex:1,textAlign:"right",fontSize:12}}>{flag(m.home)} {m.home}</span>
                        <input type="number" min="0" max="20" value={r.home||""} onChange={e=>setResult("knockoutMatches",m.id,"home",e.target.value)}
                          style={{width:36,textAlign:"center",background:"#071828",border:"1px solid #2a6a3a",borderRadius:6,color:"#80ff80",fontSize:15,fontWeight:700,padding:4}}/>
                        <span style={{color:"#5a7a9a"}}>-</span>
                        <input type="number" min="0" max="20" value={r.away||""} onChange={e=>setResult("knockoutMatches",m.id,"away",e.target.value)}
                          style={{width:36,textAlign:"center",background:"#071828",border:"1px solid #2a6a3a",borderRadius:6,color:"#80ff80",fontSize:15,fontWeight:700,padding:4}}/>
                        <span style={{flex:1,textAlign:"left",fontSize:12}}>{m.away} {flag(m.away)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Especiales */}
            <div style={{fontSize:13,color:"#aac8cc",margin:"20px 0 12px",fontWeight:700}}>⭐ Resultados Especiales</div>
            <AdminSpecialRow keyName="champion" label="🥇 Campeón" options={ALL_TEAMS} teamPick value={results.champion||""} onSet={v=>setSpecialResult("champion",v)} onClear={()=>setSpecialResult("champion","")}/>
            <AdminSpecialRow keyName="topScorer" label="👟 Bota de Oro" options={STAR_PLAYERS} freeText value={results.topScorer||""} onSet={v=>setSpecialResult("topScorer",v)} onClear={()=>setSpecialResult("topScorer","")}/>
            <AdminSpecialRow keyName="goldenBall" label="🏅 Balón de Oro" options={STAR_PLAYERS} freeText value={results.goldenBall||""} onSet={v=>setSpecialResult("goldenBall",v)} onClear={()=>setSpecialResult("goldenBall","")}/>
            <AdminSpecialRow keyName="bestGk" label="🧤 Guante de Oro" options={STAR_GKS} freeText value={results.bestGk||""} onSet={v=>setSpecialResult("bestGk",v)} onClear={()=>setSpecialResult("bestGk","")}/>
            <AdminSpecialRow keyName="revelation" label="🌟 Equipo Revelación" options={ALL_TEAMS} teamPick value={results.revelation||""} onSet={v=>setSpecialResult("revelation",v)} onClear={()=>setSpecialResult("revelation","")}/>
            <AdminSpecialRow keyName="disappointment" label="😬 Equipo Decepción" options={ALL_TEAMS} teamPick value={results.disappointment||""} onSet={v=>setSpecialResult("disappointment",v)} onClear={()=>setSpecialResult("disappointment","")}/>

            {/* PINs */}
            <div style={{marginTop:24,padding:14,background:"rgba(200,168,0,0.08)",borderRadius:10,border:"1px solid rgba(200,168,0,0.2)"}}>
              <div style={{fontWeight:700,color:"#f0d060",marginBottom:10,fontSize:13}}>🔑 PINs</div>
              {PLAYERS.map((p,i) => (
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#aac8cc",marginBottom:4}}>
                  <span>{EMOJIS[i]} {p}</span>
                  <span style={{color:"#f0d060",fontWeight:700,letterSpacing:2}}>{PLAYER_PINS[i]}</span>
                </div>
              ))}
              <div style={{fontSize:11,color:"#5a7a9a",marginTop:8}}>PIN Admin: <b style={{color:"#f0d060"}}>{ADMIN_PIN}</b></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
