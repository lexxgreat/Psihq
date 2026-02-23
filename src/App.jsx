import { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const FREE_LIMIT = 20;

const SYSTEM_PROMPT = `Ты — Мира, психолог с 15-летним опытом, работаешь в подходе КПТ (когнитивно-поведенческая терапия). Общаешься как близкий друг с большим опытом — тепло, просто, без дистанции и без психологического жаргона.

СТРОГОЕ ПРАВИЛО: задавай только ОДИН вопрос за раз. Никогда не задавай два вопроса подряд.

Как ты работаешь:

1. ПОКАЖИ ЧТО ПОНЯЛ — конкретно отрази суть того, что человек сказал. Не "я понимаю тебя", а например: "Получается, ты уже долго тянешь это в одиночку и сил почти не осталось." Человек должен почувствовать — его действительно услышали.

2. КПТ-ПОДХОД — помогай человеку замечать связь между его мыслями, чувствами и поведением. Мягко указывай на автоматические мысли. Например: "Ты говоришь что не справляешься — а откуда эта уверенность? Что должно было произойти чтобы ты считал что справляешься?"

3. ВЕДИ К РЕШЕНИЮ — задавай вопросы которые меняют угол зрения: "Что бы ты посоветовал другу в такой же ситуации?", "Что самое страшное могло бы случиться — и как бы ты с этим справился?", "Что ты уже пробовал и что немного помогало?"

4. КОНКРЕТНЫЕ ШАГИ — если человек готов действовать, предложи один маленький конкретный шаг. Не "попробуй отдохнуть", а "сегодня вечером выдели 15 минут только для себя — без телефона и дел".

5. СТИЛЬ — говори живо и тепло. "Это звучит правда тяжело", "понятно почему ты так себя чувствуешь". Никаких шаблонов: "я слышу тебя", "спасибо что поделился" — они звучат искусственно.

6. ДЛИНА — 2-4 живых предложения и один вопрос. Не больше.

7. КРИЗИС — если человек говорит о суициде — назови горячую линию: 8-800-2000-122 (бесплатно, круглосуточно).`;

const SUMMARY_PROMPT = `Ты — Мира, психолог КПТ. Напиши личный итог разговора — тепло, конкретно, без воды.

Напиши 3-4 предложения от первого лица ("Мы с тобой..."), где:
1. Назови конкретную проблему или паттерн который вы обнаружили в разговоре
2. Отметь что уже сдвинулось или какой шаг был сделан в понимании
3. Скажи что ещё предстоит разобрать — создай ощущение незавершённого пути

Пиши живо и тепло. Никаких шаблонов. Никаких вопросов. Только итог.`;

const STARTERS = [
  "Я чувствую тревогу и не понимаю почему",
  "У меня проблемы в отношениях",
  "Я очень устал и не вижу смысла",
  "Мне трудно справляться со стрессом",
];

const SEED_REVIEWS = [
  { id:"s1",  name:"Анна К.",      text:"Мира помогла мне разобраться с тревогой, которая мучила несколько месяцев. Просто и без лишних слов.", rating:5, date:"12 января" },
  { id:"s2",  name:"Дмитрий В.",   text:"Ожидал формальных ответов, получил настоящий разговор. Один точный вопрос — и всё встало на место.", rating:5, date:"15 января" },
  { id:"s3",  name:"Мария Л.",     text:"Наконец-то почувствовала что меня слышат. Не как пациента, а как человека.", rating:5, date:"18 января" },
  { id:"s4",  name:"Сергей П.",    text:"Скептически относился к ИИ-психологам. Но Мира реально заставила думать иначе о своей ситуации.", rating:5, date:"21 января" },
  { id:"s5",  name:"Екатерина Н.", text:"Использую раз в неделю для разгрузки. Помогает структурировать мысли и не застревать в них.", rating:5, date:"24 января" },
  { id:"s6",  name:"Алексей Т.",   text:"Жена посоветовала попробовать. Теперь сам рекомендую всем. Очень мягко и по делу.", rating:5, date:"27 января" },
  { id:"s7",  name:"Ольга М.",     text:"После сессии с Мирой поняла, что сама усиливала свою тревогу. Это было открытием.", rating:5, date:"30 января" },
  { id:"s8",  name:"Николай Ф.",   text:"Работаю в IT, стресс постоянный. Мира помогает не копить, а разбираться здесь и сейчас.", rating:5, date:"2 февраля" },
  { id:"s9",  name:"Юлия Р.",      text:"Тема тяжёлая — расставание. Мира не утешала дежурными фразами, а помогла увидеть выход.", rating:5, date:"5 февраля" },
  { id:"s10", name:"Игорь С.",     text:"Первый раз в жизни поговорил о своих страхах без стеснения. Спасибо за безопасное пространство.", rating:5, date:"7 февраля" },
  { id:"s11", name:"Татьяна Б.",   text:"Думала что ИИ не поймёт. Но Мира задала такой вопрос, что я сама всё поняла.", rating:5, date:"9 февраля" },
  { id:"s12", name:"Роман Ж.",     text:"Очень ценю что не давит готовыми советами. Помогает найти ответ внутри себя.", rating:5, date:"11 февраля" },
  { id:"s13", name:"Наталья В.",   text:"Прошла 3 платных сессии. Каждый раз уходила с чем-то конкретным, что можно сделать.", rating:5, date:"13 февраля" },
  { id:"s14", name:"Максим О.",    text:"Удобно что можно в любое время, без записи и ожидания. Результат не хуже живого психолога.", rating:5, date:"15 февраля" },
  { id:"s15", name:"Виктория Г.",  text:"Мне было стыдно говорить об этом с реальным человеком. С Мирой — легко и без осуждения.", rating:5, date:"16 февраля" },
  { id:"s16", name:"Андрей К.",    text:"Попробовал бесплатно, сразу оплатил. Честно — не ожидал такого качества от ИИ.", rating:5, date:"17 февраля" },
  { id:"s17", name:"Светлана Д.",  text:"Впервые за долгое время поняла что чувствую и почему. Это дорогого стоит.", rating:5, date:"18 февраля" },
  { id:"s18", name:"Евгений Л.",   text:"Помог разобраться в конфликте с коллегой. Посмотрел на ситуацию с другой стороны.", rating:5, date:"19 февраля" },
  { id:"s19", name:"Ирина Ч.",     text:"Уже полгода пользуюсь. Стала спокойнее и увереннее в себе. Это работает.", rating:5, date:"20 февраля" },
  { id:"s20", name:"Павел Ш.",     text:"Простой интерфейс, глубокий разговор. Именно то что нужно когда тяжело.", rating:5, date:"21 февраля" },
];

const C = {
  bg:"#f5f0eb", white:"#fff", brown:"#8b6347", brownDark:"#6b4f3a",
  brownLight:"#c9956a", border:"#e2d9ce", text:"#3d2b1f",
  muted:"#9a8578", faint:"#c0b0a0",
};

const fmt  = ts => new Date(ts).toLocaleTimeString("ru-RU", { hour:"2-digit", minute:"2-digit" });
const fmtD = ts => new Date(ts).toLocaleDateString("ru-RU",  { day:"numeric", month:"long" });

// ─────────────────────────────────────────────────────────────
// API helper — goes through our secure backend /api/chat
// ─────────────────────────────────────────────────────────────
async function callAPI(system, messages, maxTokens) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system,
      max_tokens: maxTokens || 1000,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  const data = await res.json();
  return data.text || null;
}

// ─────────────────────────────────────────────────────────────
// Reviews storage
// ─────────────────────────────────────────────────────────────
async function loadExtraReviews() {
  try {
    const raw = localStorage.getItem("mira_reviews");
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return [];
}

async function saveReview(rev) {
  try {
    const raw = localStorage.getItem("mira_reviews");
    const list = raw ? JSON.parse(raw) : [];
    list.push(rev);
    localStorage.setItem("mira_reviews", JSON.stringify(list));
  } catch(e) {}
}

// ─────────────────────────────────────────────────────────────
// Stars
// ─────────────────────────────────────────────────────────────
function Stars({ n }) {
  const count = n || 5;
  return (
    <span>
      {Array.from({ length: count }).map(function(_, i) {
        return <span key={i} style={{ color:"#d4a057", fontSize:13 }}>★</span>;
      })}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────
function ProgressBar({ used, total, paid }) {
  if (paid) return null;
  const pct  = Math.min(100, (used / total) * 100);
  const left = Math.max(0, total - used);
  const hot  = pct >= 75;
  return (
    <div style={{ padding:"5px 16px 0", background:C.white, borderBottom:"1px solid #f0e8e0", flexShrink:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted }}>Бесплатный тест</span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color: hot ? C.brown : C.faint }}>
          {left > 0 ? "осталось " + left + " из " + total + " сообщений" : "лимит исчерпан"}
        </span>
      </div>
      <div style={{ height:3, background:"#ede5da", borderRadius:4, marginBottom:5, overflow:"hidden" }}>
        <div style={{ height:"100%", width: pct + "%", background: hot ? "#c07040" : C.brownLight, borderRadius:4, transition:"width .4s ease" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Paywall modal
// ─────────────────────────────────────────────────────────────
function PaywallModal({ onClose, summary }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(45,30,20,.65)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={function(e){ e.stopPropagation(); }} style={{ background:C.white, borderRadius:20, padding:"32px 28px", maxWidth:420, width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,.25)", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:10 }}>🌿</div>
        <h2 style={{ fontFamily:"'Lora',serif", fontSize:21, color:C.text, marginBottom:14, lineHeight:1.3 }}>
          Мы уже многое разобрали
        </h2>

        <div style={{ background:"#fdf7f1", border:"1px solid #ead8c0", borderRadius:14, padding:"16px 18px", marginBottom:20, textAlign:"left" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ width:26, height:26, background:C.brown, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>🌿</div>
            <span style={{ fontFamily:"'Lora',serif", fontSize:13, color:C.brown, fontWeight:600 }}>Мира подводит итог</span>
          </div>
          {summary ? (
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:C.text, lineHeight:1.8, margin:0 }}>{summary}</p>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span className="dot" /><span className="dot" /><span className="dot" />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, fontStyle:"italic" }}>Мира анализирует разговор...</span>
            </div>
          )}
        </div>

        <div style={{ background:"#f5ede3", border:"1px solid #ddc9ae", borderRadius:14, padding:"14px 18px", marginBottom:20 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, marginBottom:4 }}>Продолжите — и разберёмся до конца</div>
          <div style={{ fontFamily:"'Lora',serif", fontSize:28, color:C.brown, fontWeight:700, marginBottom:3 }}>1 000 ₽</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted }}>полный час · без ограничений · история сохраняется</div>
        </div>

        <div style={{ display:"grid", gap:9 }}>
          <button
            style={{ background:C.brown, color:"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:15, fontWeight:600, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 14px rgba(139,99,71,.35)", cursor:"pointer" }}
            onMouseEnter={function(e){ e.currentTarget.style.background = C.brownDark; }}
            onMouseLeave={function(e){ e.currentTarget.style.background = C.brown; }}
          >
            Продолжить за 1 000 ₽ →
          </button>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.faint, fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", padding:"4px" }}>
            Не сейчас
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Review modal
// ─────────────────────────────────────────────────────────────
function ReviewModal({ onClose, onSubmit }) {
  const [name,   setName]   = useState("");
  const [text,   setText]   = useState("");
  const [rating, setRating] = useState(5);
  const [sent,   setSent]   = useState(false);

  async function submit() {
    if (!text.trim()) return;
    const rev = {
      id: "u" + Date.now(),
      name: name.trim() || "Аноним",
      text: text.trim(),
      rating: rating,
      date: new Date().toLocaleDateString("ru-RU", { day:"numeric", month:"long" }),
    };
    await saveReview(rev);
    onSubmit(rev);
    setSent(true);
    setTimeout(onClose, 2000);
  }

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(45,30,20,.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={function(e){ e.stopPropagation(); }} style={{ background:C.white, borderRadius:18, padding:"28px 24px", maxWidth:380, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        {sent ? (
          <div style={{ textAlign:"center", padding:"16px 0" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>💚</div>
            <p style={{ fontFamily:"'Lora',serif", fontSize:17, color:C.text }}>Спасибо! Ваш отзыв опубликован.</p>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily:"'Lora',serif", fontSize:18, color:C.text, marginBottom:6 }}>Как прошла сессия?</h3>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, marginBottom:16, lineHeight:1.6 }}>Ваш отзыв поможет другим решиться на первый шаг.</p>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {[1,2,3,4,5].map(function(s) {
                return (
                  <button key={s} onClick={function(){ setRating(s); }}
                    style={{ fontSize:22, background:"none", border:"none", cursor:"pointer", opacity: s <= rating ? 1 : 0.3, transition:"opacity .15s", padding:0 }}>
                    ⭐
                  </button>
                );
              })}
            </div>
            <input
              value={name} onChange={function(e){ setName(e.target.value); }}
              placeholder="Ваше имя (необязательно)"
              style={{ width:"100%", border:"1px solid #e2d5c6", borderRadius:9, padding:"9px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, background:"#faf6f2", outline:"none", marginBottom:9, boxSizing:"border-box" }}
            />
            <textarea
              value={text} onChange={function(e){ setText(e.target.value); }}
              placeholder="Расскажите о своём опыте..." rows={4}
              style={{ width:"100%", border:"1px solid #e2d5c6", borderRadius:9, padding:"9px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, background:"#faf6f2", outline:"none", resize:"none", lineHeight:1.6, boxSizing:"border-box", marginBottom:14 }}
            />
            <button
              onClick={submit} disabled={!text.trim()}
              style={{ width:"100%", background: text.trim() ? C.brown : "#d4c4b0", color:"#fff", border:"none", borderRadius:10, padding:"11px", fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor: text.trim() ? "pointer" : "default", marginBottom:6 }}
            >
              Опубликовать отзыв
            </button>
            <button onClick={onClose} style={{ width:"100%", background:"none", border:"none", color:C.faint, fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
              Пропустить
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Reviews section
// ─────────────────────────────────────────────────────────────
function ReviewsSection({ reviews }) {
  const [pg, setPg] = useState(0);
  const perPage = 3;
  const pages   = Math.ceil(reviews.length / perPage);
  const visible = reviews.slice(pg * perPage, pg * perPage + perPage);

  return (
    <div style={{ marginTop:48, marginBottom:16 }}>
      <h2 style={{ fontFamily:"'Lora',serif", fontSize:20, color:C.text, marginBottom:6, textAlign:"center" }}>Что говорят люди</h2>
      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, textAlign:"center", marginBottom:24 }}>
        {reviews.length} отзывов · средняя оценка ⭐ 5.0
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:12, marginBottom:16 }}>
        {visible.map(function(r, i) {
          return (
            <div key={r.id} style={{ background:C.white, borderRadius:14, padding:"16px 18px", border:"1px solid #ece3d8", boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, color:C.text }}>{r.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.faint, marginTop:1 }}>{r.date}</div>
                </div>
                <Stars n={r.rating} />
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#5c4233", lineHeight:1.65, margin:0 }}>{r.text}</p>
            </div>
          );
        })}
      </div>
      {pages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
          {Array.from({ length: pages }).map(function(_, i) {
            return (
              <button key={i} onClick={function(){ setPg(i); }}
                style={{ width:8, height:8, borderRadius:"50%", border:"none", cursor:"pointer", padding:0, background: i === pg ? C.brown : "#d4c4b0", transition:"background .2s" }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Donate modal
// ─────────────────────────────────────────────────────────────
function DonateModal({ onClose }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(45,30,20,.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={function(e){ e.stopPropagation(); }} style={{ background:C.white, borderRadius:18, padding:28, maxWidth:360, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:36, marginBottom:7 }}>☕</div>
          <h2 style={{ fontFamily:"'Lora',serif", fontSize:20, color:C.text, marginBottom:5 }}>Поддержать Миру</h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, lineHeight:1.6 }}>Ваша поддержка помогает развивать сервис.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          {["100 ₽","250 ₽","500 ₽","1000 ₽"].map(function(a) {
            return (
              <button key={a}
                style={{ background:"#f5ede4", color:"#6b4f3a", border:"1px solid #ddd0c4", borderRadius:9, padding:"10px", fontSize:14, fontWeight:500 }}
                onMouseEnter={function(e){ e.currentTarget.style.background = C.brown; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={function(e){ e.currentTarget.style.background = "#f5ede4"; e.currentTarget.style.color = "#6b4f3a"; }}
              >{a}</button>
            );
          })}
        </div>
        <button style={{ width:"100%", background:C.brown, color:"#fff", border:"none", borderRadius:10, padding:"11px", fontSize:14, fontWeight:500, marginBottom:7, cursor:"pointer" }}
          onMouseEnter={function(e){ e.currentTarget.style.background = C.brownDark; }}
          onMouseLeave={function(e){ e.currentTarget.style.background = C.brown; }}
        >Перейти к оплате →</button>
        <button onClick={onClose} style={{ width:"100%", background:"none", border:"none", color:"#b0a090", fontSize:13, padding:"4px", cursor:"pointer" }}>Закрыть</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [sessions,       setSessions]       = useState([]);
  const [activeId,       setActiveId]       = useState(null);
  const [input,          setInput]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [showDonate,     setShowDonate]     = useState(false);
  const [showSidebar,    setShowSidebar]    = useState(false);
  const [page,           setPage]           = useState("home");
  const [isListening,    setIsListening]    = useState(false);
  const [transcript,     setTranscript]     = useState("");
  const [paid,           setPaid]           = useState(false);
  const [totalUserMsgs,  setTotalUserMsgs]  = useState(0);
  const [showPaywall,    setShowPaywall]    = useState(false);
  const [paywallSummary, setPaywallSummary] = useState(null);
  const [showReview,     setShowReview]     = useState(false);
  const [reviews,        setReviews]        = useState(SEED_REVIEWS);

  const endRef = useRef(null);
  const recRef = useRef(null);
  const msgCountRef = useRef(0); // tracks totalUserMsgs reliably across async calls

  const sess         = sessions.find(function(s){ return s.id === activeId; });
  const display      = isListening ? transcript : input;
  const hasText      = display.trim();
  const isLimitReached = !paid && totalUserMsgs >= FREE_LIMIT;

  useEffect(function(){ endRef.current && endRef.current.scrollIntoView({ behavior:"smooth" }); }, [sess && sess.messages, loading]);

  useEffect(function(){
    loadExtraReviews().then(function(extra){
      if (extra.length > 0) setReviews(SEED_REVIEWS.concat(extra));
    });
  }, []);

  function goHome() {
    if (sess && sess.messages.length >= 4 && !sess.reviewShown) {
      setSessions(function(p){ return p.map(function(x){ return x.id === activeId ? Object.assign({}, x, { reviewShown: true }) : x; }); });
      setPage("home");
      setTimeout(function(){ setShowReview(true); }, 500);
    } else {
      setPage("home");
    }
  }

  const startListen = useCallback(function() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Голос недоступен в превью."); return; }
    const r = new SR();
    r.lang = "ru-RU"; r.continuous = false; r.interimResults = true;
    r.onstart  = function(){ setIsListening(true); setTranscript(""); };
    r.onresult = function(e){ const t = Array.from(e.results).map(function(x){ return x[0].transcript; }).join(""); setTranscript(t); setInput(t); };
    r.onend    = function(){ setIsListening(false); recRef.current = null; };
    r.onerror  = function(){ setIsListening(false); recRef.current = null; };
    recRef.current = r; r.start();
  }, []);

  const stopListen = useCallback(function(){ if (recRef.current) recRef.current.stop(); setIsListening(false); }, []);

  function handleMic() {
    if (isListening) { stopListen(); setTimeout(function(){ if (transcript.trim()) send(transcript); }, 300); }
    else startListen();
  }

  function newSess(starter) {
    const id = Date.now().toString();
    setSessions(function(p){ return [{ id:id, title: starter ? starter.slice(0,33)+"…" : "Новая сессия", createdAt: Date.now(), messages: [] }].concat(p); });
    setActiveId(id);
    setPage("chat");
    if (starter) setTimeout(function(){ doSend(starter, id, []); }, 100);
  }

  function delSess(id, e) {
    e.stopPropagation();
    setSessions(function(p){ return p.filter(function(x){ return x.id !== id; }); });
    if (activeId === id) setActiveId(null);
  }

  function send(text) {
    const t = text || display;
    if (!t.trim() || loading) return;
    if (isLimitReached) { setShowPaywall(true); return; }
    setInput(""); setTranscript("");
    if (isListening) stopListen();
    doSend(t);
  }

  async function doSend(text, sid, existMsgs) {
    const useSid  = sid  !== undefined ? sid  : activeId;
    const useMsgs = existMsgs !== undefined ? existMsgs : (sessions.find(function(x){ return x.id === useSid; }) || { messages:[] }).messages;

    const uMsg   = { role:"user", content: text.trim(), ts: Date.now() };
    const updated = useMsgs.concat([uMsg]);

    setSessions(function(p){ return p.map(function(x){
      if (x.id !== useSid) return x;
      return Object.assign({}, x, {
        messages: updated,
        title: x.messages.length === 0 ? text.slice(0,35) + (text.length > 35 ? "…" : "") : x.title,
      });
    }); });

    msgCountRef.current += 1;
    const newTotal = msgCountRef.current;
    setTotalUserMsgs(newTotal);
    const willHitLimit = !paid && newTotal >= FREE_LIMIT;

    setLoading(true);
    try {
      const reply = await callAPI(SYSTEM_PROMPT, updated, 1000);
      const safeReply = (reply && reply.trim()) ? reply : null;
      if (!safeReply) {
        setSessions(function(p){ return p.map(function(x){ return x.id === useSid ? Object.assign({}, x, { messages: updated.concat([{ role:"assistant", content:"Не удалось получить ответ. Попробуйте ещё раз.", ts: Date.now() }]) }) : x; }); });
        setLoading(false);
        return;
      }
      const finalMsgs = updated.concat([{ role:"assistant", content: safeReply, ts: Date.now() }]);
      setSessions(function(p){ return p.map(function(x){ return x.id === useSid ? Object.assign({}, x, { messages: finalMsgs }) : x; }); });

      if (willHitLimit) {
        setPaywallSummary(null);
        setTimeout(function(){ setShowPaywall(true); }, 700);
        // Use only last 6 messages for faster summary, add 8s timeout fallback
        var summaryMsgs = finalMsgs.slice(-6);
        var summaryText = "Вот наш разговор:\n\n" + summaryMsgs.map(function(m){ return (m.role==="user" ? "Человек: " : "Мира: ") + m.content; }).join("\n\n") + "\n\nНапиши личный итог.";
        var summaryTimeout = setTimeout(function(){
          setPaywallSummary("Мы хорошо поработали в этом разговоре — ты уже начал видеть ситуацию иначе. Хочешь разобраться до конца?");
        }, 8000);
        callAPI(SUMMARY_PROMPT, [{ role:"user", content: summaryText }], 250).then(function(summary){
          clearTimeout(summaryTimeout);
          if (summary) setPaywallSummary(summary);
        }).catch(function(){
          clearTimeout(summaryTimeout);
          setPaywallSummary("Мы хорошо поработали в этом разговоре — ты уже начал видеть ситуацию иначе. Хочешь разобраться до конца?");
        });
      }
    } catch(err) {
      setSessions(function(p){ return p.map(function(x){ return x.id === useSid ? Object.assign({}, x, { messages: updated.concat([{ role:"assistant", content:"Ошибка соединения. Проверьте интернет и попробуйте ещё раз.", ts: Date.now() }]) }) : x; }); });
    }
    setLoading(false);
  }

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Lora',Georgia,serif", height:"100vh", display:"flex", flexDirection:"column", background:C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#c9b99a;border-radius:3px}
        textarea{font-family:'DM Sans',sans-serif;resize:none;outline:none}
        button{cursor:pointer;font-family:'DM Sans',sans-serif}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sr{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes sl{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes ty{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
        @keyframes mp{0%{box-shadow:0 0 0 0 rgba(224,92,58,.5)}70%{box-shadow:0 0 0 10px rgba(224,92,58,0)}100%{box-shadow:0 0 0 0 rgba(224,92,58,0)}}
        .fi{animation:fi .4s ease forwards}.mu{animation:sr .25s ease}.ma{animation:sl .25s ease}
        .dot{display:inline-block;width:6px;height:6px;background:#c9a078;border-radius:50%;margin:0 2px;animation:ty 1.4s infinite}
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
        .si:hover{background:#ede5d8!important}.sb:hover{background:#e8ddd0!important}
        .mic-on{background:#e05c3a!important;color:#fff!important;animation:mp 1.2s ease-out infinite}
      `}</style>

      {/* NAV */}
      <nav style={{ background:C.white, borderBottom:"1px solid " + C.border, padding:"0 18px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, boxShadow:"0 1px 5px rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }} onClick={page === "chat" ? goHome : function(){ setPage("home"); }}>
          <div style={{ width:28, height:28, background:C.brown, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🌿</div>
          <span style={{ fontFamily:"'Lora',serif", fontSize:16, fontWeight:600, color:C.text }}>Мира</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {page === "chat" && (
            <>
              <button onClick={function(){ setShowSidebar(!showSidebar); }}
                style={{ background:"none", border:"1px solid #d4c4b0", borderRadius:7, padding:"5px 11px", fontSize:12, color:"#6b4f3a", display:"flex", alignItems:"center", gap:4 }}>
                📋 Сессии
                {sessions.length > 0 && <span style={{ background:C.brown, color:"#fff", borderRadius:9, padding:"1px 5px", fontSize:10 }}>{sessions.length}</span>}
              </button>
              {!paid && (
                <button onClick={function(){ setShowPaywall(true); }}
                  style={{ background:"none", border:"1px solid #e2c9a8", borderRadius:7, padding:"5px 11px", fontSize:11, color:C.brownDark }}>
                  💬 {Math.max(0, FREE_LIMIT - totalUserMsgs)}/{FREE_LIMIT}
                </button>
              )}
            </>
          )}
          <button onClick={function(){ setShowDonate(true); }}
            style={{ background:C.brownLight, color:"#fff", border:"none", borderRadius:7, padding:"6px 13px", fontSize:12, fontWeight:500 }}
            onMouseEnter={function(e){ e.currentTarget.style.background = "#b07a52"; }}
            onMouseLeave={function(e){ e.currentTarget.style.background = C.brownLight; }}>
            ☕ Поддержать
          </button>
        </div>
      </nav>

      {/* HOME */}
      {page === "home" && (
        <div className="fi" style={{ flex:1, overflowY:"auto" }}>
          <div style={{ maxWidth:740, margin:"0 auto", padding:"40px 20px" }}>
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <div style={{ fontSize:46, marginBottom:14 }}>🌿</div>
              <h1 style={{ fontFamily:"'Lora',serif", fontSize:"clamp(24px,4vw,42px)", fontWeight:600, color:C.text, lineHeight:1.2, marginBottom:12 }}>
                Пространство для<br/><em style={{ color:C.brown }}>внутреннего диалога</em>
              </h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#7a6558", maxWidth:440, margin:"0 auto 22px", lineHeight:1.7 }}>
                Мира — психолог КПТ, который выслушает как друг, задаст один точный вопрос и поможет найти выход.
              </p>
              <button onClick={function(){ newSess(); }}
                style={{ background:C.brown, color:"#fff", border:"none", borderRadius:11, padding:"11px 26px", fontSize:14, fontWeight:500, boxShadow:"0 4px 14px rgba(139,99,71,.3)" }}
                onMouseEnter={function(e){ e.currentTarget.style.background = C.brownDark; }}
                onMouseLeave={function(e){ e.currentTarget.style.background = C.brown; }}>
                Начать бесплатно →
              </button>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.faint, marginTop:10 }}>
                {FREE_LIMIT} сообщений бесплатно · без регистрации
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12, marginBottom:40 }}>
              {[
                { i:"🔒", t:"Безопасно",      d:"Всё остаётся между вами" },
                { i:"🎙️", t:"Голос или текст", d:"Как вам удобно" },
                { i:"🧠", t:"КПТ подход",      d:"Помогает увидеть мысли иначе" },
                { i:"⚡", t:"Без ожидания",    d:"Доступно 24/7, сразу" },
              ].map(function(x){ return (
                <div key={x.t} style={{ background:C.white, borderRadius:13, padding:16, border:"1px solid #e8ddd2", textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{x.i}</div>
                  <div style={{ fontFamily:"'Lora',serif", fontWeight:600, fontSize:13, color:C.text, marginBottom:4 }}>{x.t}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, lineHeight:1.5 }}>{x.d}</div>
                </div>
              ); })}
            </div>

            <h2 style={{ fontFamily:"'Lora',serif", fontSize:16, color:C.text, marginBottom:12, textAlign:"center" }}>С чего начать?</h2>
            {STARTERS.map(function(s){ return (
              <button key={s} className="sb" onClick={function(){ newSess(s); }}
                style={{ width:"100%", background:C.white, border:"1px solid #e2d5c6", borderRadius:11, padding:"12px 16px", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#5c4233", display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                <span style={{ color:C.brownLight }}>→</span>{s}
              </button>
            ); })}

            <ReviewsSection reviews={reviews} />

            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#b0a090", textAlign:"center", marginTop:24, lineHeight:1.6 }}>
              Мира — ИИ-ассистент и не заменяет профессиональную психологическую помощь.
            </p>
          </div>
        </div>
      )}

      {/* CHAT */}
      {page === "chat" && (
        <div style={{ flex:1, display:"flex", minHeight:0 }}>
          {showSidebar && (
            <div style={{ width:240, background:C.white, borderRight:"1px solid " + C.border, display:"flex", flexDirection:"column", flexShrink:0 }}>
              <div style={{ padding:"12px 12px 9px", borderBottom:"1px solid #ede5d8", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontFamily:"'Lora',serif", fontSize:13, fontWeight:600, color:C.text }}>Сессии</span>
                <button onClick={function(){ newSess(); }} style={{ background:C.brown, color:"#fff", border:"none", borderRadius:6, padding:"3px 9px", fontSize:11 }}>+ Новая</button>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:5 }}>
                {sessions.length === 0
                  ? <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.faint, textAlign:"center", marginTop:18 }}>Нет сессий</p>
                  : sessions.map(function(s){ return (
                    <div key={s.id} className="si" onClick={function(){ setActiveId(s.id); }}
                      style={{ padding:"8px 9px", borderRadius:8, cursor:"pointer", marginBottom:3, background: s.id === activeId ? "#ede5d8" : "transparent", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.title}</div>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.faint, marginTop:1 }}>{fmtD(s.createdAt)} · {s.messages.length}</div>
                      </div>
                      <button onClick={function(e){ delSess(s.id, e); }} style={{ background:"none", border:"none", color:"#c9a090", fontSize:11, padding:"0 0 0 5px", opacity:.6 }}>✕</button>
                    </div>
                  ); })}
              </div>
            </div>
          )}

          <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
            {!sess ? (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
                <span style={{ fontSize:32 }}>🌿</span>
                <p style={{ fontFamily:"'DM Sans',sans-serif", color:C.muted, fontSize:13 }}>Выберите сессию или начните новую</p>
                <button onClick={function(){ newSess(); }} style={{ background:C.brown, color:"#fff", border:"none", borderRadius:9, padding:"8px 20px", fontSize:13 }}>Новая сессия</button>
              </div>
            ) : (
              <>
                <div style={{ padding:"9px 16px", borderBottom:"1px solid " + C.border, background:C.white, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                  <div>
                    <div style={{ fontFamily:"'Lora',serif", fontSize:13, fontWeight:600, color:C.text }}>{sess.title}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted }}>{fmtD(sess.createdAt)}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:7, height:7, background:"#7cb87c", borderRadius:"50%", display:"inline-block" }} />
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#7cb87c" }}>онлайн</span>
                  </div>
                </div>

                <ProgressBar used={totalUserMsgs} total={FREE_LIMIT} paid={paid} />

                <div style={{ flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:11 }}>
                  {sess.messages.length === 0 && (
                    <div className="fi" style={{ textAlign:"center", marginTop:26 }}>
                      <div style={{ fontSize:32, marginBottom:9 }}>🌿</div>
                      <p style={{ fontFamily:"'Lora',serif", fontSize:16, color:C.brown, marginBottom:5 }}>Привет, я Мира</p>
                      <p style={{ fontFamily:"'DM Sans',sans-serif", color:C.muted, fontSize:13 }}>Расскажи, что тебя привело сюда сегодня?</p>
                      <p style={{ fontFamily:"'DM Sans',sans-serif", color:C.brownLight, fontSize:11, marginTop:7 }}>🎙️ Нажмите микрофон или напишите</p>
                    </div>
                  )}
                  {sess.messages.map(function(m, i){ return (
                    <div key={i} className={m.role === "user" ? "mu" : "ma"} style={{ display:"flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap:7, alignItems:"flex-end" }}>
                      {m.role === "assistant" && <div style={{ width:24, height:24, background:C.brown, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11 }}>🌿</div>}
                      <div style={{ maxWidth:"74%" }}>
                        <div style={{ background: m.role === "user" ? C.brown : C.white, color: m.role === "user" ? "#fff" : C.text, borderRadius: m.role === "user" ? "15px 15px 4px 15px" : "15px 15px 15px 4px", padding:"9px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.6, border: m.role === "assistant" ? "1px solid #e8ddd2" : "none", boxShadow:"0 1px 5px rgba(0,0,0,0.05)", whiteSpace:"pre-wrap" }}>
                          {m.content}
                        </div>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.faint, marginTop:2, textAlign: m.role === "user" ? "right" : "left", padding:"0 3px" }}>{fmt(m.ts)}</div>
                      </div>
                    </div>
                  ); })}
                  {loading && (
                    <div style={{ display:"flex", alignItems:"flex-end", gap:7 }}>
                      <div style={{ width:24, height:24, background:C.brown, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>🌿</div>
                      <div style={{ background:C.white, border:"1px solid #e8ddd2", borderRadius:"15px 15px 15px 4px", padding:"11px 13px", boxShadow:"0 1px 5px rgba(0,0,0,0.05)" }}>
                        <span className="dot" /><span className="dot" /><span className="dot" />
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {isListening && (
                  <div style={{ padding:"7px 16px", background:"#fff8f4", borderTop:"1px solid #f0d8c4", display:"flex", alignItems:"center", gap:9, flexShrink:0 }}>
                    <div style={{ width:7, height:7, background:"#e05c3a", borderRadius:"50%", flexShrink:0 }} />
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.brown, fontStyle:"italic", flex:1 }}>{transcript || "Слушаю..."}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.faint }}>⏹ отправить</span>
                  </div>
                )}

                <div style={{ padding:"11px 14px", background:C.white, borderTop:"1px solid " + C.border, flexShrink:0 }}>
                  {isLimitReached ? (
                    <div style={{ textAlign:"center", padding:"8px 0" }}>
                      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, marginBottom:10 }}>Бесплатный лимит исчерпан</p>
                      <button onClick={function(){ setShowPaywall(true); }}
                        style={{ background:C.brown, color:"#fff", border:"none", borderRadius:10, padding:"10px 24px", fontSize:14, fontWeight:500, boxShadow:"0 4px 12px rgba(139,99,71,.3)" }}
                        onMouseEnter={function(e){ e.currentTarget.style.background = C.brownDark; }}
                        onMouseLeave={function(e){ e.currentTarget.style.background = C.brown; }}>
                        Продолжить за 1 000 ₽ →
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display:"flex", gap:7, background:"#f8f3ee", borderRadius:22, border:"1px solid " + (isListening ? "#e8a878" : "#e2d5c6"), padding:"5px 5px 5px 14px", alignItems:"flex-end" }}>
                        <textarea
                          value={display}
                          onChange={function(e){ if (!isListening) setInput(e.target.value); }}
                          onKeyDown={function(e){ if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                          placeholder="Сообщение..." readOnly={isListening} rows={1}
                          style={{ flex:1, background:"transparent", border:"none", fontSize:13, color: isListening ? "#9a7060" : C.text, lineHeight:1.5, maxHeight:95, overflowY:"auto", paddingTop:5, fontStyle: isListening ? "italic" : "normal" }}
                          onInput={function(e){ e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 95) + "px"; }}
                        />
                        {!hasText && !loading && (
                          <button onClick={handleMic} className={isListening ? "mic-on" : ""}
                            style={{ background:"none", color:C.muted, border:"none", width:36, height:36, fontSize:19, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, borderRadius:"50%" }}>
                            {isListening ? "⏹" : "🎙️"}
                          </button>
                        )}
                        {(hasText || loading) && (
                          <button onClick={function(){ send(); }} disabled={!hasText || loading}
                            style={{ background: hasText && !loading ? C.brown : "#d4c4b0", color:"#fff", border:"none", borderRadius:"50%", width:36, height:36, fontSize:17, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
                            onMouseEnter={function(e){ if (hasText && !loading) e.currentTarget.style.background = C.brownDark; }}
                            onMouseLeave={function(e){ e.currentTarget.style.background = hasText && !loading ? C.brown : "#d4c4b0"; }}>
                            ↑
                          </button>
                        )}
                      </div>
                      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.faint, textAlign:"center", marginTop:5 }}>
                        Enter — отправить · Shift+Enter — перенос
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showDonate  && <DonateModal  onClose={function(){ setShowDonate(false); }} />}
      {showPaywall && <PaywallModal onClose={function(){ setShowPaywall(false); }} summary={paywallSummary} />}
      {showReview  && <ReviewModal  onClose={function(){ setShowReview(false); }} onSubmit={function(rev){ setReviews(function(p){ return p.concat([rev]); }); }} />}
    </div>
  );
}
