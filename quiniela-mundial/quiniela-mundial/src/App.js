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
  {id:"ro32",label:"Dieciseisavos"},{id:"ro16",label:"Octavos"},{id:"qf",label:"Cuartos"},
  {id:"sf",label:"Semifinales"},{id:"3rd",label:"3er Puesto"},{id:"final",label:"Final"},
];
const KO_MATCHES = [
  {id:"ro32_1",round:"ro32",label:"Partido 1"},{id:"ro32_2",round:"ro32",label:"Partido 2"},
  {id:"ro32_3",round:"ro32",label:"Partido 3"},{id:"ro32_4",round:"ro32",label:"Partido 4"},
  {id:"ro32_5",round:"ro32",label:"Partido 5"},{id:"ro32_6",round:"ro32",label:"Partido 6"},
  {id:"ro32_7",round:"ro32",label:"Partido 7"},{id:"ro32_8",round:"ro32",label:"Partido 8"},
  {id:"ro32_9",round:"ro32",label:"Partido 9"},{id:"ro32_10",round:"ro32",label:"Partido 10"},
  {id:"ro32_11",round:"ro32",label:"Partido 11"},{id:"ro32_12",round:"ro32",label:"Partido 12"},
  {id:"ro32_13",round:"ro32",label:"Partido 13"},{id:"ro32_14",round:"ro32",label:"Partido 14"},
  {id:"ro32_15",round:"ro32",label:"Partido 15"},{id:"ro32_16",round:"ro32",label:"Partido 16"},
  {id:"ro16_1",round:"ro16",label:"Octavo 1"},{id:"ro16_2",round:"ro16",label:"Octavo 2"},
  {id:"ro16_3",round:"ro16",label:"Octavo 3"},{id:"ro16_4",round:"ro16",label:"Octavo 4"},
  {id:"ro16_5",round:"ro16",label:"Octavo 5"},{id:"ro16_6",round:"ro16",label:"Octavo 6"},
  {id:"ro16_7",round:"ro16",label:"Octavo 7"},{id:"ro16_8",round:"ro16",label:"Octavo 8"},
  {id:"qf_1",round:"qf",label:"Cuarto 1"},{id:"qf_2",round:"qf",label:"Cuarto 2"},
  {id:"qf_3",round:"qf",label:"Cuarto 3"},{id:"qf_4",round:"qf",label:"Cuarto 4"},
  {id:"sf_1",round:"sf",label:"Semi 1"},{id:"sf_2",round:"sf",label:"Semi 2"},
  {id:"3rd_1",round:"3rd",label:"3er Puesto"},{id:"final_1",round:"final",label:"Final"},
];

const PTS = {groupResult:1,groupExact:3,knockoutWinner:2,champion:10,topScorer:8,goldenBall:6,bestGk:5,revelation:6,disappointment:5};
const TOTAL_POT = 1500;
const PRIZE_PER_PLAYER = 300;
const DEADLINE = new Date("2026-06-11T00:00:00");

const STAR_PLAYERS = ["Kylian Mbappé","Vinicius Jr.","Lamine Yamal","Erling Haaland","Harry Kane","Lionel Messi","Cristiano Ronaldo","Neymar Jr.","Pedri","Rodri","Jude Bellingham","Phil Foden","Bukayo Saka","Marcus Rashford","Gavi","Federico Valverde","Darwin Núñez","Romelu Lukaku","Robert Lewandowski","Cody Gakpo"];
const STAR_GKS = ["Alisson Becker","Ederson","Manuel Neuer","Thibaut Courtois","Gianluigi Donnarumma","David Raya","Unai Simón","Mike Maignan","André Onana","Yann Sommer","Jordan Pickford","Diogo Costa"];

const FLAGS = {"México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","República Checa":"🇨🇿","Canadá":"🇨🇦","Bosnia y Herzegovina":"🇧🇦","Qatar":"🇶🇦","Suiza":"🇨🇭","Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Estados Unidos":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷","Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨","Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳","Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿","España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudí":"🇸🇦","Uruguay":"🇺🇾","Francia":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Noruega":"🇳🇴","Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴","Portugal":"🇵🇹","R.D. del Congo":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴","Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦"};
const flag = t => FLAGS[t]||"🏳️";

const PLAYERS = ["Sergio","Juan Carlos","Gustavo","David","Julio"];
const PLAYER_PINS = ["1111","2222","3333","4444","5555"];
const ADMIN_PIN = "Mundial2026";
const EMOJIS = ["🏆","⚽","💫","🔥","🌟"];

function emptyPred() {
  const p={champion:"",topScorer:"",goldenBall:"",bestGk:"",revelation:"",disappointment:"",groupMatches:{},knockoutMatches:{}};
  MATCHES.forEach(m=>{p.groupMatches[m.id]={home:"",away:""};});
  KO_MATCHES.forEach(m=>{p.knockoutMatches[m.id]={winner:""};});
  return p;
}
const emptyResults=()=>({groupMatches:{},knockoutMatches:{},champion:"",topScorer:"",goldenBall:"",bestGk:"",revelation:"",disappointment:""});

const isLocked = () => new Date() >= DEADLINE;

function PickSelector({label,pts,value,onChange,options,freeText=false,teamPick=false,locked=false}){
  const [custom,setCustom]=useState("");
  return(
    <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:14,marginBottom:12,border:"1px solid rgba(255,255,255,0.08)",opacity:locked?0.6:1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:14,fontWeight:700,color:"#e8f4e8"}}>{label}</span>
        <span style={{fontSize:11,color:"#f0d060",fontWeight:700,background:"rgba(200,168,0,0.15)",padding:"2px 8px",borderRadius:10}}>+{pts} pts</span>
      </div>
      {value&&<div style={{marginBottom:8,padding:"6px 10px",background:"rgba(200,168,0,0.15)",borderRadius:8,fontSize:13,color:"#f0d060",fontWeight:700}}>✅ {teamPick?flag(value):"⚽"} {value}{!locked&&<button onClick={()=>onChange("")} style={{marginLeft:8,background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:11}}>✕</button>}</div>}
      {!locked&&<>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:freeText?8:0}}>
          {options.map(o=><button key={o} onClick={()=>onChange(o)} style={{background:value===o?"linear-gradient(135deg,#c8a800,#f0d060)":"rgba(255,255,255,0.05)",color:value===o?"#0a1628":"#c8d8e8",border:value===o?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:value===o?700:400}}>{teamPick?flag(o):""} {o}</button>)}
        </div>
        {freeText&&<div style={{display:"flex",gap:6,marginTop:4}}><input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Otro..." style={{flex:1,background:"#071828",border:"1px solid #1a4a6a",borderRadius:7,color:"#e8f4e8",fontSize:12,padding:"6px 10px",outline:"none"}}/><button onClick={()=>{if(custom.trim()){onChange(custom.trim());setCustom("");}}} style={{background:"rgba(200,168,0,0.3)",border:"none",borderRadius:7,color:"#f0d060",padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:700}}>OK</button></div>}
      </>}
    </div>
  );
}

function LockScreen({onLogin}){
  const [selected,setSelected]=useState(null);
  const [pin,setPin]=useState("");
  const [error,setError]=useState("");
  const tryLogin=()=>{
    if(selected==="admin"){if(pin===ADMIN_PIN){onLogin("admin",-1);return;}}
    else if(selected!==null&&selected!==undefined&&selected!==""){
      if(pin===PLAYER_PINS[selected]){onLogin("player",selected);return;}
    }
    setError("PIN incorrecto ❌");setPin("");setTimeout(()=>setError(""),2000);
  };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a1628 0%,#0d2137 40%,#0f2d1f 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Trebuchet MS','Segoe UI',sans-serif",color:"#e8f4e8",padding:24}}>
      <div style={{fontSize:40,marginBottom:8}}>⚽</div>
      <div style={{fontSize:22,fontWeight:900,color:"#f0d060",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Quiniela Mundial 2026</div>
      <div style={{fontSize:11,color:"#5a8aaa",letterSpacing:3,marginBottom:32}}>CANADA · MEXICO · USA</div>
      {selected===null?(
        <>
          <div style={{fontSize:13,color:"#aac8cc",marginBottom:14}}>¿Quién eres?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,width:"100%",maxWidth:280}}>
            {PLAYERS.map((p,i)=><button key={i} onClick={()=>setSelected(i)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"12px 16px",color:"#e8f4e8",fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}><span>{EMOJIS[i]}</span>{p}</button>)}
            <button onClick={()=>setSelected("admin")} style={{background:"rgba(200,168,0,0.1)",border:"1px solid rgba(200,168,0,0.3)",borderRadius:10,padding:"12px 16px",color:"#f0d060",fontSize:14,fontWeight:700,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10,marginTop:4}}><span>⚙️</span>Admin</button>
          </div>
        </>
      ):(
        <div style={{width:"100%",maxWidth:280,textAlign:"center"}}>
          <div style={{fontSize:14,color:"#aac8cc",marginBottom:6}}>{selected==="admin"?"PIN de Admin":`PIN de ${PLAYERS[selected]}`}</div>
          <div style={{fontSize:11,color:"#5a7a9a",marginBottom:16}}>{selected==="admin"?"Solo el organizador conoce este PIN":"Introduce tu PIN personal"}</div>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="Introduce tu PIN" autoFocus style={{width:"100%",boxSizing:"border-box",padding:"12px 14px",background:"#071828",border:"1px solid #1a4a6a",borderRadius:10,color:"#f0d060",fontSize:18,textAlign:"center",letterSpacing:4,outline:"none",marginBottom:10}}/>
          {error&&<div style={{color:"#ff6060",fontSize:13,marginBottom:8}}>{error}</div>}
          <button onClick={tryLogin} style={{width:"100%",padding:12,background:"linear-gradient(180deg,#c8a800,#a07800)",border:"none",borderRadius:10,color:"#0a1628",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:10}}>Entrar →</button>
          <button onClick={()=>{setSelected(null);setPin("");setError("");}} style={{background:"transparent",border:"none",color:"#5a7a9a",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>← Volver</button>
        </div>
      )}
    </div>
  );
}

export default function App(){
  const [session,setSession]=useState(null);
  const [tab,setTab]=useState("group");
  const [myPred,setMyPred]=useState(null);
  const [allPreds,setAllPreds]=useState([]);
  const [results,setResults]=useState(emptyResults());
  const [saving,setSaving]=useState(false);
  const [saveMsg,setSaveMsg]=useState("");
  const [loading,setLoading]=useState(false);
  const [selGroup,setSelGroup]=useState("A");
  const [selRound,setSelRound]=useState("ro16");
  const locked = isLocked();

  const isAdmin=session?.role==="admin";
  const myIdx=session?.playerIdx;

  useEffect(()=>{
    if(!session)return;
    setLoading(true);
    const init=async()=>{
      const res=await loadData("results");
      if(res)setResults(res);
      const preds=await Promise.all(PLAYERS.map((_,i)=>loadData(`pred_${i}`)));
      setAllPreds(preds.map(p=>p||emptyPred()));
      if(!isAdmin&&myIdx>=0)setMyPred(preds[myIdx]||emptyPred());
      setLoading(false);
    };
    init();
  },[session]);

  useEffect(()=>{
    if(!session)return;
    const iv=setInterval(async()=>{
      const res=await loadData("results");
      if(res)setResults(res);
      const preds=await Promise.all(PLAYERS.map((_,i)=>loadData(`pred_${i}`)));
      setAllPreds(preds.map(p=>p||emptyPred()));
      if(!isAdmin&&myIdx>=0&&preds[myIdx])setMyPred(preds[myIdx]);
    },30000);
    return()=>clearInterval(iv);
  },[session]);

  const flash=msg=>{setSaveMsg(msg);setTimeout(()=>setSaveMsg(""),2500);};

  const updateMyPred=useCallback((updater)=>{
    if(locked)return;
    setMyPred(prev=>{
      const next=updater(prev);
      setSaving(true);
      saveData(`pred_${myIdx}`,next).then(()=>{setSaving(false);flash("✅ Guardado");});
      return next;
    });
  },[myIdx,locked]);

  const setPred=(type,matchId,field,value)=>updateMyPred(prev=>({...prev,[type]:{...prev[type],[matchId]:{...prev[type][matchId],[field]:value}}}));
  const setSpecial=(key,value)=>updateMyPred(prev=>({...prev,[key]:value}));

  const updateResults=async(updater)=>{
    setResults(prev=>{
      const next=updater(prev);
      setSaving(true);
      saveData("results",next).then(()=>{setSaving(false);flash("✅ Resultado guardado");});
      return next;
    });
  };
  const setResult=(type,matchId,field,value)=>updateResults(prev=>({...prev,[type]:{...prev[type],[matchId]:{...prev[type][matchId],[field]:value}}}));
  const setSpecialResult=(key,value)=>updateResults(prev=>({...prev,[key]:value}));

  const calcScoreDetail=(pred)=>{
    if(!pred)return{total:0,group:0,knockout:0,specials:0,details:{}};
    let group=0,knockout=0,specials=0;
    const details={};
    MATCHES.forEach(m=>{
      const r=results.groupMatches[m.id];const p=pred.groupMatches[m.id];
      if(!r||r.home===""||r.away===""||!p||p.home===""||p.away==="")return;
      const rh=parseInt(r.home),ra=parseInt(r.away),ph=parseInt(p.home),pa=parseInt(p.away);
      if(isNaN(rh)||isNaN(ra)||isNaN(ph)||isNaN(pa))return;
      const res=(h,a)=>h>a?"H":a>h?"A":"D";
      if(ph===rh&&pa===ra){group+=PTS.groupExact;details[m.id]={pts:PTS.groupExact,type:"exact"};}
      else if(res(ph,pa)===res(rh,ra)){group+=PTS.groupResult;details[m.id]={pts:PTS.groupResult,type:"result"};}
    });
    KO_MATCHES.forEach(m=>{
      const r=results.knockoutMatches[m.id];const p=pred.knockoutMatches[m.id];
      if(!r?.winner||!p?.winner)return;
      if(p.winner===r.winner){knockout+=PTS.knockoutWinner;details[m.id]={pts:PTS.knockoutWinner,type:"winner"};}
    });
    const specialKeys=["champion","topScorer","goldenBall","bestGk","revelation","disappointment"];
    specialKeys.forEach(k=>{if(pred[k]&&results[k]&&pred[k]===results[k]){specials+=PTS[k];details[k]={pts:PTS[k],type:"special"};}});
    return{total:group+knockout+specials,group,knockout,specials,details};
  };

  const calcScore=pred=>calcScoreDetail(pred).total;
  const predsForScore=PLAYERS.map((_,i)=>i===myIdx&&!isAdmin?myPred:allPreds[i]);
  const ranked=PLAYERS.map((n,i)=>({name:n,score:calcScore(predsForScore[i]),idx:i,...calcScoreDetail(predsForScore[i])})).sort((a,b)=>b.score-a.score);

  if(!session)return<LockScreen onLogin={(role,playerIdx)=>{setSession({role,playerIdx});setTab(role==="admin"?"admin":"scores");}}/>;
  if(loading||(!isAdmin&&!myPred))return<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a1628,#0d2137)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Trebuchet MS',sans-serif",color:"#f0d060",fontSize:16}}>⚽ Cargando quiniela...</div>;

  const TABS=isAdmin
    ?[{id:"scores",label:"📊 Tabla"},{id:"admin",label:"⚙️ Admin"}]
    :[{id:"scores",label:"📊 Tabla"},{id:"group",label:"📋 Grupos"},{id:"knockout",label:"🏆 Eliminatorias"},{id:"special",label:"⭐ Especiales"}];

  const chip=(active)=>({background:active?"rgba(255,255,255,0.1)":"transparent",color:active?"#f0d060":"#c8d8e8",border:active?"1px solid rgba(200,168,0,0.4)":"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:active?700:400,cursor:"pointer"});

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a1628 0%,#0d2137 40%,#0f2d1f 100%)",fontFamily:"'Trebuchet MS','Segoe UI',sans-serif",color:"#e8f4e8",paddingBottom:60}}>

      {/* Header */}
      <div style={{background:"linear-gradient(90deg,#c8a800 0%,#f0d060 40%,#c8a800 100%)",padding:"14px 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:"#0a1628",letterSpacing:1,textTransform:"uppercase"}}>⚽ Quiniela Mundial 2026</div>
          <div style={{fontSize:10,color:"#0a1628",opacity:0.6,letterSpacing:2}}>CANADA · MEXICO · USA</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"#0a1628",fontWeight:700}}>{isAdmin?"⚙️ Admin":`${EMOJIS[myIdx]} ${PLAYERS[myIdx]}`}</div>
          <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:3,alignItems:"center"}}>
            {saveMsg&&<span style={{fontSize:10,color:"#0a5020",fontWeight:700}}>{saveMsg}</span>}
            {saving&&<span style={{fontSize:10,color:"#0a5020"}}>💾...</span>}
            <button onClick={()=>setSession(null)} style={{fontSize:10,background:"rgba(0,0,0,0.15)",border:"none",borderRadius:4,padding:"2px 7px",color:"#0a1628",cursor:"pointer"}}>Salir</button>
          </div>
        </div>
      </div>

      {/* Lock banner */}
      {locked&&!isAdmin&&<div style={{background:"rgba(255,80,80,0.15)",border:"1px solid rgba(255,80,80,0.3)",padding:"8px 16px",textAlign:"center",fontSize:12,color:"#ff8888"}}>🔒 Los pronósticos están cerrados — el torneo ya comenzó</div>}

      {/* Tabs */}
      <div style={{display:"flex",overflowX:"auto",background:"#071020",borderBottom:"2px solid #1a3a5c"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?"linear-gradient(180deg,#c8a800,#a07800)":"transparent",color:tab===t.id?"#0a1628":"#7aaccc",border:"none",padding:"12px 16px",fontSize:12,fontWeight:tab===t.id?800:500,cursor:"pointer",whiteSpace:"nowrap",borderBottom:tab===t.id?"2px solid #f0d060":"2px solid transparent"}}>{t.label}</button>)}
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px"}}>

        {/* ── SCORES ── */}
        {tab==="scores"&&(()=>{
          const topScore=ranked[0]?.score||0;
          const winners=ranked.filter(p=>p.score===topScore&&topScore>0);
          const prizeEach=winners.length>1?Math.floor(TOTAL_POT/winners.length):TOTAL_POT;
          return(
            <div>
              <div style={{background:"linear-gradient(135deg,rgba(200,168,0,0.2),rgba(200,168,0,0.05))",border:"1px solid rgba(200,168,0,0.4)",borderRadius:12,padding:"14px 16px",marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:11,color:"#aac8cc",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>💰 Bote total</div>
                <div style={{fontSize:32,fontWeight:900,color:"#f0d060"}}>${TOTAL_POT.toLocaleString()} <span style={{fontSize:16}}>MXN</span></div>
                <div style={{fontSize:11,color:"#7a9a7a",marginTop:2}}>${PRIZE_PER_PLAYER} por jugador · 5 participantes</div>
              </div>

              <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>📊 Tabla de Posiciones</h2>
              {ranked.map((p,rank)=>{
                const isWinning=p.score===topScore&&topScore>0;
                const isMe=p.idx===myIdx&&!isAdmin;
                return(
                  <div key={p.idx} style={{background:isMe?"linear-gradient(90deg,rgba(200,168,0,0.18),rgba(200,168,0,0.04))":isWinning?"linear-gradient(90deg,rgba(200,168,0,0.10),rgba(0,0,0,0))":"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 16px",marginBottom:8,border:isMe?"1px solid rgba(200,168,0,0.35)":isWinning?"1px solid rgba(200,168,0,0.2)":"1px solid rgba(255,255,255,0.06)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:20,minWidth:30}}>{rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":`${rank+1}.`}</span>
                      <span style={{flex:1,fontSize:15,fontWeight:600}}>{p.name} {isMe&&<span style={{fontSize:10,color:"#c8a800"}}>← tú</span>}</span>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:22,fontWeight:900,color:rank===0?"#f0d060":"#7aaccc"}}>{p.score} <span style={{fontSize:11,color:"#5a7a9a",fontWeight:400}}>pts</span></div>
                        {isWinning&&topScore>0&&<div style={{fontSize:10,color:"#80cc60",fontWeight:700}}>+${prizeEach.toLocaleString()} MXN</div>}
                      </div>
                    </div>
                    {/* Score breakdown */}
                    {p.score>0&&<div style={{display:"flex",gap:8,marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                      {[{label:"Grupos",val:p.group,icon:"📋"},{label:"Eliminatorias",val:p.knockout,icon:"🏆"},{label:"Especiales",val:p.specials,icon:"⭐"}].map(s=>(
                        <div key={s.label} style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"4px 6px"}}>
                          <div style={{fontSize:10,color:"#6a8aaa"}}>{s.icon} {s.label}</div>
                          <div style={{fontSize:14,fontWeight:700,color:"#c8d8e8"}}>{s.val}</div>
                        </div>
                      ))}
                    </div>}
                  </div>
                );
              })}
              {winners.length>1&&topScore>0&&<div style={{padding:"10px 14px",background:"rgba(200,168,0,0.08)",borderRadius:10,border:"1px solid rgba(200,168,0,0.25)",fontSize:12,color:"#c8a800",marginBottom:10}}>⚖️ Empate entre {winners.map(w=>w.name).join(" y ")} — se reparte: <b>${prizeEach.toLocaleString()} MXN cada uno</b></div>}

              {/* Recent results */}
              {Object.keys(results.groupMatches).filter(k=>results.groupMatches[k]?.home!=="").length>0&&(
                <div style={{marginTop:16}}>
                  <h3 style={{color:"#f0d060",fontSize:13,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🎯 Últimos Resultados</h3>
                  {MATCHES.filter(m=>results.groupMatches[m.id]?.home!=="").slice(-5).reverse().map(m=>{
                    const r=results.groupMatches[m.id];
                    return(
                      <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 12px",marginBottom:6,border:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:12}}>{flag(m.home)} {m.home}</span>
                        <span style={{fontSize:14,fontWeight:900,color:"#f0d060",padding:"0 10px"}}>{r.home} - {r.away}</span>
                        <span style={{fontSize:12}}>{m.away} {flag(m.away)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{marginTop:8,padding:"10px 12px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",fontSize:12,color:"#6a8aaa"}}>🔒 Pronósticos privados · 🔄 Actualización cada 30s</div>
            </div>
          );
        })()}

        {/* ── GROUP STAGE ── */}
        {tab==="group"&&!isAdmin&&(
          <div>
            <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Tus pronósticos — Grupos {locked&&"🔒"}</h2>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {"ABCDEFGHIJKL".split("").map(g=><button key={g} onClick={()=>setSelGroup(g)} style={chip(selGroup===g)}>Grupo {g}</button>)}
            </div>
            {MATCHES.filter(m=>m.group===selGroup).map(m=>{
              const pred=myPred.groupMatches[m.id];
              const r=results.groupMatches[m.id];
              const hasResult=r&&r.home!=="";
              return(
                <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 14px",marginBottom:10,border:`1px solid ${hasResult?"rgba(100,200,100,0.2)":"rgba(255,255,255,0.07)"}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{flex:1,textAlign:"right",fontSize:13,fontWeight:600}}>{flag(m.home)} {m.home}</span>
                    <input type="number" min="0" max="20" value={pred.home} onChange={e=>setPred("groupMatches",m.id,"home",e.target.value)} disabled={locked} style={{width:40,textAlign:"center",background:locked?"#040e18":"#071828",border:"1px solid #1a4a6a",borderRadius:6,color:"#f0d060",fontSize:16,fontWeight:700,padding:4,cursor:locked?"not-allowed":"text"}}/>
                    <span style={{color:"#5a7a9a",fontWeight:700}}>-</span>
                    <input type="number" min="0" max="20" value={pred.away} onChange={e=>setPred("groupMatches",m.id,"away",e.target.value)} disabled={locked} style={{width:40,textAlign:"center",background:locked?"#040e18":"#071828",border:"1px solid #1a4a6a",borderRadius:6,color:"#f0d060",fontSize:16,fontWeight:700,padding:4,cursor:locked?"not-allowed":"text"}}/>
                    <span style={{flex:1,textAlign:"left",fontSize:13,fontWeight:600}}>{m.away} {flag(m.away)}</span>
                  </div>
                  {hasResult&&<div style={{textAlign:"center",marginTop:6,fontSize:11,color:"#80cc60"}}>Resultado: {r.home}-{r.away}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── KNOCKOUT ── */}
        {tab==="knockout"&&!isAdmin&&(
          <div>
            <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Eliminatorias {locked&&"🔒"}</h2>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {KO_ROUNDS.map(r=><button key={r.id} onClick={()=>setSelRound(r.id)} style={chip(selRound===r.id)}>{r.label}</button>)}
            </div>
            {KO_MATCHES.filter(m=>m.round===selRound).map(m=>{
              const pred=myPred.knockoutMatches[m.id];
              const r=results.knockoutMatches[m.id];
              return(
                <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:14,marginBottom:10,border:`1px solid ${r?.winner?"rgba(100,200,100,0.2)":"rgba(255,255,255,0.07)"}`}}>
                  <div style={{fontSize:11,color:"#6a8aaa",marginBottom:6}}>{m.label} — ¿Quién avanza?</div>
                  {r?.winner&&<div style={{marginBottom:8,fontSize:11,color:"#80cc60"}}>✅ Pasó: {flag(r.winner)} {r.winner}</div>}
                  {!locked&&<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {ALL_TEAMS.map(t=><button key={t} onClick={()=>setPred("knockoutMatches",m.id,"winner",t)} style={{background:pred?.winner===t?"linear-gradient(180deg,#c8a800,#a07800)":"rgba(255,255,255,0.05)",color:pred?.winner===t?"#0a1628":"#c8d8e8",border:pred?.winner===t?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:pred?.winner===t?700:400}}>{flag(t)} {t}</button>)}
                  </div>}
                  {locked&&pred?.winner&&<div style={{fontSize:12,color:"#f0d060"}}>Tu pick: {flag(pred.winner)} {pred.winner}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SPECIAL PICKS ── */}
        {tab==="special"&&!isAdmin&&(
          <div>
            <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>⭐ Picks Especiales {locked&&"🔒"}</h2>
            <div style={{color:"#6a8aaa",fontSize:12,marginBottom:16}}>Se resuelven al final del torneo</div>
            <PickSelector label="🥇 Campeón del Mundial" pts={10} value={myPred.champion} onChange={v=>setSpecial("champion",v)} options={ALL_TEAMS} teamPick locked={locked}/>
            <PickSelector label="👟 Bota de Oro" pts={8} value={myPred.topScorer} onChange={v=>setSpecial("topScorer",v)} options={STAR_PLAYERS} freeText locked={locked}/>
            <PickSelector label="🏅 Balón de Oro" pts={6} value={myPred.goldenBall} onChange={v=>setSpecial("goldenBall",v)} options={STAR_PLAYERS} freeText locked={locked}/>
            <PickSelector label="🧤 Guante de Oro" pts={5} value={myPred.bestGk} onChange={v=>setSpecial("bestGk",v)} options={STAR_GKS} freeText locked={locked}/>
            <PickSelector label="🌟 Equipo Revelación" pts={6} value={myPred.revelation} onChange={v=>setSpecial("revelation",v)} options={ALL_TEAMS} teamPick locked={locked}/>
            <PickSelector label="😬 Equipo Decepción" pts={5} value={myPred.disappointment} onChange={v=>setSpecial("disappointment",v)} options={ALL_TEAMS} teamPick locked={locked}/>
          </div>
        )}

        {/* ── ADMIN ── */}
        {tab==="admin"&&isAdmin&&(
          <div>
            <h2 style={{color:"#f0d060",fontSize:15,letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>⚙️ Cargar Resultados</h2>
            <div style={{fontSize:13,color:"#aac8cc",marginBottom:8,fontWeight:700}}>Grupos</div>
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {"ABCDEFGHIJKL".split("").map(g=><button key={g} onClick={()=>setSelGroup(g)} style={chip(selGroup===g)}>Grupo {g}</button>)}
            </div>
            {MATCHES.filter(m=>m.group===selGroup).map(m=>{
              const r=results.groupMatches[m.id]||{};
              return(
                <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 14px",marginBottom:8,border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{flex:1,textAlign:"right",fontSize:12}}>{flag(m.home)} {m.home}</span>
                    <input type="number" min="0" max="20" value={r.home||""} onChange={e=>setResult("groupMatches",m.id,"home",e.target.value)} style={{width:36,textAlign:"center",background:"#071828",border:"1px solid #2a6a3a",borderRadius:6,color:"#80ff80",fontSize:15,fontWeight:700,padding:4}}/>
                    <span style={{color:"#5a7a9a"}}>-</span>
                    <input type="number" min="0" max="20" value={r.away||""} onChange={e=>setResult("groupMatches",m.id,"away",e.target.value)} style={{width:36,textAlign:"center",background:"#071828",border:"1px solid #2a6a3a",borderRadius:6,color:"#80ff80",fontSize:15,fontWeight:700,padding:4}}/>
                    <span style={{flex:1,textAlign:"left",fontSize:12}}>{m.away} {flag(m.away)}</span>
                  </div>
                </div>
              );
            })}
            <div style={{fontSize:13,color:"#aac8cc",margin:"16px 0 8px",fontWeight:700}}>Eliminatorias</div>
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {KO_ROUNDS.map(r=><button key={r.id} onClick={()=>setSelRound(r.id)} style={chip(selRound===r.id)}>{r.label}</button>)}
            </div>
            {KO_MATCHES.filter(m=>m.round===selRound).map(m=>{
              const r=results.knockoutMatches[m.id]||{};
              return(
                <div key={m.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 14px",marginBottom:8,border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{fontSize:11,color:"#6a8aaa",marginBottom:6}}>{m.label} — Ganador real:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {ALL_TEAMS.map(t=><button key={t} onClick={()=>setResult("knockoutMatches",m.id,"winner",t)} style={{background:r.winner===t?"linear-gradient(135deg,#006620,#00aa40)":"rgba(255,255,255,0.05)",color:r.winner===t?"#fff":"#c8d8e8",border:r.winner===t?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer",fontWeight:r.winner===t?700:400}}>{flag(t)} {t}</button>)}
                  </div>
                </div>
              );
            })}
            <div style={{fontSize:13,color:"#aac8cc",margin:"20px 0 12px",fontWeight:700}}>⭐ Resultados Especiales</div>
            {[
              {key:"champion",label:"🥇 Campeón",options:ALL_TEAMS,teamPick:true},
              {key:"topScorer",label:"👟 Bota de Oro",options:STAR_PLAYERS,freeText:true},
              {key:"goldenBall",label:"🏅 Balón de Oro",options:STAR_PLAYERS,freeText:true},
              {key:"bestGk",label:"🧤 Guante de Oro",options:STAR_GKS,freeText:true},
              {key:"revelation",label:"🌟 Equipo Revelación",options:ALL_TEAMS,teamPick:true},
              {key:"disappointment",label:"😬 Equipo Decepción",options:ALL_TEAMS,teamPick:true},
            ].map(({key,label,options,freeText,teamPick})=>{
              const [cv,setCv]=useState("");
              return(
                <div key={key} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 14px",marginBottom:10,border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#aac8cc",marginBottom:8}}>{label}</div>
                  {results[key]&&<div style={{marginBottom:8,padding:"5px 10px",background:"rgba(0,168,0,0.15)",borderRadius:7,fontSize:12,color:"#80ff80",fontWeight:700}}>✅ {teamPick?flag(results[key]):""} {results[key]}<button onClick={()=>setSpecialResult(key,"")} style={{marginLeft:8,background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:11}}>✕</button></div>}
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:freeText?6:0}}>
                    {options.map(o=><button key={o} onClick={()=>setSpecialResult(key,o)} style={{background:results[key]===o?"linear-gradient(135deg,#006620,#00aa40)":"rgba(255,255,255,0.05)",color:results[key]===o?"#fff":"#c8d8e8",border:results[key]===o?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer",fontWeight:results[key]===o?700:400}}>{teamPick?flag(o):""} {o}</button>)}
                  </div>
                  {freeText&&<div style={{display:"flex",gap:6,marginTop:4}}><input value={cv} onChange={e=>setCv(e.target.value)} placeholder="Otro nombre..." style={{flex:1,background:"#071828",border:"1px solid #1a4a6a",borderRadius:7,color:"#e8f4e8",fontSize:12,padding:"5px 8px",outline:"none"}}/><button onClick={()=>{if(cv.trim()){setSpecialResult(key,cv.trim());setCv("");}}} style={{background:"rgba(0,120,0,0.4)",border:"none",borderRadius:7,color:"#80ff80",padding:"5px 10px",fontSize:12,cursor:"pointer",fontWeight:700}}>OK</button></div>}
                </div>
              );
            })}
            <div style={{marginTop:24,padding:14,background:"rgba(200,168,0,0.08)",borderRadius:10,border:"1px solid rgba(200,168,0,0.2)"}}>
              <div style={{fontWeight:700,color:"#f0d060",marginBottom:10,fontSize:13}}>🔑 PINs</div>
              {PLAYERS.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#aac8cc",marginBottom:4}}><span>{EMOJIS[i]} {p}</span><span style={{color:"#f0d060",fontWeight:700,letterSpacing:2}}>{PLAYER_PINS[i]}</span></div>)}
              <div style={{fontSize:11,color:"#5a7a9a",marginTop:8}}>PIN Admin: <b style={{color:"#f0d060"}}>{ADMIN_PIN}</b></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
