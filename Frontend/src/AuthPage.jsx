  import { useState, useEffect, useRef } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { login, register, forgotPassword } from "./api";

  /* ─── Palette — Sterling Silver × Icy Blue ─── */
  const C = {
    bg:        "#0b0c10",
    card:      "#0f1014",
    panel:     "#0d0e12",
    silver:    "#c8cdd6",
    silverLt:  "#e2e6ed",
    silverDim: "#8a8f9a",
    ice:       "#7ec8e8",
    iceBright: "#aaddff",
    iceDeep:   "#4aa8d0",
    frost:     "#cce8f8",
    border:    "rgba(200,205,214,0.16)",
    muted:     "rgba(255,255,255,0.38)",
    text:      "rgba(255,255,255,0.82)",
    error:     "#ff6b6b",
    success:   "#6bffb8",
  };

  /* ─── Film grain overlay ─── */
  const GrainOverlay = () => (
    <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:9999, opacity:0.045 }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)"/>
    </svg>
  );

  /* ─── Letterbox bars ─── */
  const Letterbox = () => (
    <>
      <div style={{ position:"fixed", top:0, left:0, right:0, height:"48px", background:"#000", zIndex:9998 }}/>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:"48px", background:"#000", zIndex:9998 }}/>
    </>
  );

  /* ─── Rain canvas ─── */
  function RainCanvas() {
    const ref = useRef(null);
    useEffect(() => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      let W = canvas.offsetWidth, H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
      const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
      window.addEventListener("resize", resize);
      const drops = Array.from({ length: 220 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        len: 8 + Math.random() * 22, speed: 6 + Math.random() * 12,
        opacity: 0.08 + Math.random() * 0.28, width: 0.4 + Math.random() * 0.8,
      }));
      let raf;
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        drops.forEach(d => {
          const grad = ctx.createLinearGradient(d.x, d.y, d.x - d.len * 0.15, d.y + d.len);
          grad.addColorStop(0, `rgba(200,210,220,0)`);
          grad.addColorStop(0.5, `rgba(180,210,235,${d.opacity})`);
          grad.addColorStop(1, `rgba(126,200,232,${d.opacity * 0.55})`);
          ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len * 0.15, d.y + d.len);
          ctx.strokeStyle = grad; ctx.lineWidth = d.width; ctx.stroke();
          d.y += d.speed;
          if (d.y > H + 30) { d.y = -30; d.x = Math.random() * W; }
        });
        raf = requestAnimationFrame(draw);
      };
      draw();
      return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }, []);
    return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}/>;
  }

  /* ─── Neon sign ─── */
  const NeonSign = () => {
    const [flicker, setFlicker] = useState(1);
    useEffect(() => {
      const t = setInterval(() => {
        if (Math.random() < 0.08) { setFlicker(0.3); setTimeout(() => setFlicker(1), 80 + Math.random() * 120); }
      }, 800);
      return () => clearInterval(t);
    }, []);
    return (
      <div style={{ position:"absolute", top:"28px", left:"28px", fontFamily:"'Special Elite', monospace", fontSize:"13px", letterSpacing:"0.28em", color: C.silver, textShadow:`0 0 6px ${C.silverLt}, 0 0 18px rgba(200,205,214,0.45)`, opacity: flicker, transition:"opacity 0.06s", userSelect:"none" }}>
        ✦ STUDIO
      </div>
    );
  };

  /* ─── Spotlight panel ─── */
  function SpotlightPanel({ children }) {
    const ref = useRef(null);
    const [pos, setPos] = useState({ x: 50, y: 60 });
    const onMove = (e) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    };
    return (
      <div ref={ref} onMouseMove={onMove} style={{ position:"relative", flex:"0 0 400px", overflow:"hidden", background: C.panel }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`repeating-linear-gradient(0deg, rgba(200,205,214,0.04) 0px, rgba(200,205,214,0.04) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(126,200,232,0.03) 0px, rgba(126,200,232,0.03) 1px, transparent 1px, transparent 40px)` }}/>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse 260px 320px at ${pos.x}% ${pos.y}%, rgba(190,215,235,0.10) 0%, rgba(126,200,232,0.05) 35%, transparent 65%)`, transition:"background 0.08s" }}/>
        <RainCanvas/>
        {children}
      </div>
    );
  }

  /* ─── Typewriter ─── */
  function Typewriter({ text, delay = 0 }) {
    const [displayed, setDisplayed] = useState("");
    const [started, setStarted] = useState(false);
    useEffect(() => { const t = setTimeout(() => setStarted(true), delay); return () => clearTimeout(t); }, [delay]);
    useEffect(() => {
      if (!started) return;
      let i = 0;
      const iv = setInterval(() => { setDisplayed(text.slice(0, i + 1)); i++; if (i >= text.length) clearInterval(iv); }, 38);
      return () => clearInterval(iv);
    }, [started, text]);
    return (
      <span style={{ fontStyle:"italic" }}>
        {displayed}
        <span style={{ display:"inline-block", width:"1px", height:"1em", background: C.silver, marginLeft:"2px", verticalAlign:"text-bottom", animation:"blink 1s step-end infinite" }}/>
      </span>
    );
  }

  /* ─── Input field ─── */
  function Field({ label, type = "text", placeholder, value, onChange, delay = 0, error }) {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay }} style={{ marginBottom:"18px" }}>
        <label style={{ display:"block", fontSize:"10px", letterSpacing:"0.22em", textTransform:"uppercase", color: error ? C.error : C.silverDim, marginBottom:"7px", fontFamily:"'Special Elite', monospace", textShadow: focused ? `0 0 8px ${C.ice}60` : "none", transition:"text-shadow 0.3s" }}>{label}</label>
        <div style={{ position: "relative" }}>
          <input
            type={inputType} placeholder={placeholder} value={value} onChange={onChange}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{ width:"100%", padding:"12px 15px", paddingRight: isPassword ? "40px" : "15px", background: focused ? "rgba(126,200,232,0.05)" : "rgba(255,255,255,0.03)", border: `1px solid ${error ? C.error : focused ? "rgba(126,200,232,0.45)" : "rgba(200,205,214,0.15)"}`, borderRadius:"6px", color:"#fff", fontSize:"14px", fontFamily:"'Cormorant Garamond', serif", outline:"none", boxSizing:"border-box", boxShadow: focused ? `0 0 14px rgba(126,200,232,0.12), inset 0 0 8px rgba(126,200,232,0.04)` : "none", transition:"all 0.3s", letterSpacing:"0.04em" }}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color: focused ? C.ice : C.silverDim, cursor:"pointer", padding:"5px", display:"flex", alignItems:"center", justifyContent:"center", transition:"color 0.3s" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          )}
        </div>
        {error && <p style={{ color: C.error, fontSize:"11px", marginTop:"4px", fontFamily:"'Cormorant Garamond', serif" }}>{error}</p>}
      </motion.div>
    );
  }

  /* ─── Divider ─── */
  const Divider = () => (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", margin:"18px 0" }}>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(90deg, transparent, rgba(200,205,214,0.25))` }}/>
      <span style={{ fontSize:"10px", color: C.muted, fontFamily:"'Special Elite', monospace", letterSpacing:"0.15em" }}>OR</span>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(90deg, rgba(200,205,214,0.25), transparent)` }}/>
    </div>
  );

  /* ─── Alert banner ─── */
  function Alert({ type, message }) {
    if (!message) return null;
    const isError = type === "error";
    return (
      <motion.div
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        style={{ padding:"10px 14px", borderRadius:"6px", marginBottom:"16px", fontSize:"12px", fontFamily:"'Cormorant Garamond', serif", letterSpacing:"0.03em", background: isError ? "rgba(255,107,107,0.08)" : "rgba(107,255,184,0.08)", border: `1px solid ${isError ? "rgba(255,107,107,0.3)" : "rgba(107,255,184,0.3)"}`, color: isError ? C.error : C.success }}
      >
        {isError ? "⚠ " : "✓ "}{message}
      </motion.div>
    );
  }

  /* ─── Primary button ─── */
  function NeonButton({ children, onClick, disabled, loading }) {
    const [hovered, setHovered] = useState(false);
    return (
      <button
        onClick={onClick} disabled={disabled || loading}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ width:"100%", padding:"13px", border: `1px solid ${(disabled || loading) ? "rgba(200,205,214,0.12)" : hovered ? "rgba(200,205,214,0.7)" : "rgba(200,205,214,0.35)"}`, borderRadius:"6px", cursor: (disabled || loading) ? "not-allowed" : "pointer", background: (disabled || loading) ? "rgba(200,205,214,0.04)" : hovered ? "rgba(200,205,214,0.12)" : "rgba(200,205,214,0.06)", color: (disabled || loading) ? "rgba(255,255,255,0.2)" : hovered ? C.silverLt : C.silver, fontSize:"11px", letterSpacing:"0.24em", textTransform:"uppercase", fontFamily:"'Special Elite', monospace", boxShadow: (!disabled && !loading && hovered) ? `0 0 20px rgba(126,200,232,0.2), 0 0 40px rgba(200,205,214,0.08), inset 0 0 16px rgba(200,205,214,0.04)` : "none", transition:"all 0.25s", marginBottom:"18px" }}
      >
        {loading ? "Please wait..." : children}
      </button>
    );
  }

  /* ─── Login form ─── */
  function LoginForm({ onSwitch, onLogin }) {
    const [email, setEmail]     = useState("");
    const [pw, setPw]           = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [forgotMode, setForgotMode]   = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState("");

    const validate = () => {
      const errs = {};
      if (!email) errs.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email format";
      if (!pw) errs.pw = "Password is required";
      return errs;
    };

    const handleLogin = async () => {
      setError("");
      const errs = validate();
      if (Object.keys(errs).length) { setFieldErrors(errs); return; }
      setFieldErrors({});
      setLoading(true);
      try {
        const data = await login({ email, password: pw });
        onLogin?.(data.user || { email, name: email.split("@")[0] });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const handleForgot = async () => {
      if (!email) { setFieldErrors({ email: "Enter your email first" }); return; }
      setLoading(true);
      setError("");
      try {
        await forgotPassword(email);
        setForgotSuccess("Reset link sent! Check your inbox.");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
          <p style={{ fontSize:"10px", letterSpacing:"0.3em", color: C.ice, fontFamily:"'Special Elite', monospace", textTransform:"uppercase", marginBottom:"6px", textShadow:`0 0 10px ${C.ice}80` }}>✦ Welcome Back</p>
          <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"32px", color:"#fff", margin:"0 0 6px", fontWeight:700, lineHeight:1.1 }}>Sign In</h2>
          <p style={{ color: C.muted, fontSize:"13px", fontFamily:"'Cormorant Garamond', serif", marginBottom:"28px", fontStyle:"italic" }}>
            <Typewriter text="The city never sleeps. Neither do we." delay={300}/>
          </p>
        </motion.div>

        <Alert type="error" message={error}/>
        <Alert type="success" message={forgotSuccess}/>

        <Field label="Email ID" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} delay={0.1} error={fieldErrors.email}/>
        <Field label="Password" type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} delay={0.18} error={fieldErrors.pw}/>

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.22 }} style={{ textAlign:"right", marginBottom:"20px", marginTop:"-10px" }}>
          <span onClick={() => { setForgotMode(true); handleForgot(); }} style={{ fontSize:"11px", color: C.silverDim, cursor:"pointer", fontFamily:"'Special Elite', monospace", letterSpacing:"0.08em", textShadow:`0 0 8px ${C.ice}40` }}>
            Forgot password?
          </span>
        </motion.div>

        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}>
          <NeonButton onClick={handleLogin} loading={loading}>Enter the Studio</NeonButton>
        </motion.div>
        <Divider/>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }} style={{ textAlign:"center" }}>
          <span style={{ color: C.muted, fontSize:"12px", fontFamily:"'Cormorant Garamond', serif" }}>New here? </span>
          <span onClick={onSwitch} style={{ color: C.silver, fontSize:"12px", cursor:"pointer", fontFamily:"'Special Elite', monospace", letterSpacing:"0.06em", textShadow:`0 0 8px ${C.ice}60` }}>
            Create an Account →
          </span>
        </motion.div>
      </div>
    );
  }

  /* ─── Signup form ─── */
  function SignupForm({ onSwitch, onLogin }) {
    const [name, setName]       = useState("");
    const [email, setEmail]     = useState("");
    const [pw, setPw]           = useState("");
    const [confirm, setConfirm] = useState("");
    const [agreed, setAgreed]   = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const validate = () => {
      const errs = {};
      if (!name.trim()) errs.name = "Name is required";
      if (!email) errs.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email format";
      if (!pw) errs.pw = "Password is required";
      else if (pw.length < 8) errs.pw = "Password must be at least 8 characters";
      if (pw !== confirm) errs.confirm = "Passwords do not match";
      if (!agreed) errs.agreed = "You must agree to continue";
      return errs;
    };

    const handleSubmit = async () => {
      setError("");
      const errs = validate();
      if (Object.keys(errs).length) { setFieldErrors(errs); return; }
      setFieldErrors({});
      setLoading(true);
      try {
        const data = await register({ name, email, password: pw });
        onLogin?.(data.user || { email, name });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
          <p style={{ fontSize:"10px", letterSpacing:"0.3em", color: C.ice, fontFamily:"'Special Elite', monospace", textTransform:"uppercase", marginBottom:"6px", textShadow:`0 0 10px ${C.ice}80` }}>New Recruit</p>
          <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"32px", color:"#fff", margin:"0 0 6px", fontWeight:700, lineHeight:1.1 }}>Create Account</h2>
          <p style={{ color: C.muted, fontSize:"13px", fontFamily:"'Cormorant Garamond', serif", marginBottom:"24px", fontStyle:"italic" }}>
            <Typewriter text="Leave a trace. Join the art of prompting." delay={300}/>
          </p>
        </motion.div>

        <Alert type="error" message={error}/>

        <Field label="Alias" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} delay={0.08} error={fieldErrors.name}/>
        <Field label="Contact" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} delay={0.14} error={fieldErrors.email}/>
        <Field label="Password" type="password" placeholder="Create a strong password (min 8 chars)" value={pw} onChange={e => setPw(e.target.value)} delay={0.2} error={fieldErrors.pw}/>
        <Field label="Confirm Password" type="password" placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} delay={0.26} error={fieldErrors.confirm}/>

        <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} onClick={() => setAgreed(v => !v)} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px", cursor:"pointer", userSelect:"none" }}>
          <div style={{ width:"16px", height:"16px", borderRadius:"3px", flexShrink:0, border:`1.5px solid ${agreed ? C.silver : fieldErrors.agreed ? C.error : "rgba(200,205,214,0.25)"}`, background: agreed ? "rgba(200,205,214,0.15)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", boxShadow: agreed ? `0 0 10px rgba(126,200,232,0.35)` : "none", transition:"all 0.2s" }}>
            {agreed && <svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 3L3.5 5.5L8 1" stroke={C.silverLt} strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>}
          </div>
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"12px", color: agreed ? C.text : C.muted, letterSpacing:"0.03em", transition:"color 0.2s" }}>
            I agree to share my details for enlistment
          </span>
        </motion.div>
        {fieldErrors.agreed && <p style={{ color: C.error, fontSize:"11px", marginBottom:"12px", fontFamily:"'Cormorant Garamond', serif" }}>{fieldErrors.agreed}</p>}

        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.34 }}>
          <NeonButton disabled={!agreed} loading={loading} onClick={handleSubmit}>Begin the Journey</NeonButton>
        </motion.div>
        <Divider/>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }} style={{ textAlign:"center" }}>
          <span style={{ color: C.muted, fontSize:"12px", fontFamily:"'Cormorant Garamond', serif" }}>Already enlisted? </span>
          <span onClick={onSwitch} style={{ color: C.silver, fontSize:"12px", cursor:"pointer", fontFamily:"'Special Elite', monospace", letterSpacing:"0.06em", textShadow:`0 0 8px ${C.ice}60` }}>
            ← Sign in
          </span>
        </motion.div>
      </div>
    );
  }

  /* ─── Branding features ─── */
  const BrandFeature = ({ icon, text, delay }) => (
    <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay, duration:0.45 }} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", background:"rgba(200,205,214,0.04)", borderRadius:"8px", border:`1px solid rgba(200,205,214,0.10)` }}>
      <span style={{ color: C.ice, fontSize:"14px", textShadow:`0 0 8px ${C.ice}70` }}>{icon}</span>
      <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"13px", color:"rgba(255,255,255,0.6)", letterSpacing:"0.05em" }}>{text}</span>
    </motion.div>
  );

  /* ─── Tab switcher ─── */
  function TabBar({ mode, onSwitch }) {
    return (
      <div style={{ position:"absolute", top:"22px", right:"22px", display:"flex", gap:"3px", background:"rgba(15,16,20,0.8)", borderRadius:"8px", padding:"3px", border:`1px solid rgba(200,205,214,0.16)`, backdropFilter:"blur(8px)" }}>
        {["login", "signup"].map(m => (
          <button key={m} onClick={() => onSwitch(m)} style={{ padding:"6px 16px", borderRadius:"6px", border:"none", background: mode === m ? "rgba(200,205,214,0.14)" : "transparent", color: mode === m ? C.silverLt : C.muted, boxShadow: mode === m ? `0 0 12px rgba(126,200,232,0.2)` : "none", fontSize:"10px", letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"'Special Elite', monospace", cursor:"pointer", transition:"all 0.22s" }}>{m === "login" ? "Sign In" : "Sign Up"}</button>
        ))}
      </div>
    );
  }

  /* ─── Root ─── */
  export default function NeoNoirAuth({ onLogin }) {
    const [mode, setMode] = useState("login");
    const [dir, setDir]   = useState(1);

    const switchTo = (next) => { setDir(next === "signup" ? 1 : -1); setMode(next); };

    const formVariants = {
      enter:  (d) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit:   (d) => ({ x: d > 0 ? -50 : 50, opacity: 0 }),
    };

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Special+Elite&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; }
          body { background:#0b0c10; }
          input::placeholder { color:rgba(255,255,255,0.18); }
          input:focus { outline:none; }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
          ::-webkit-scrollbar { width:3px; }
          ::-webkit-scrollbar-thumb { background:rgba(200,205,214,0.25); border-radius:2px; }
        `}</style>

        <GrainOverlay/>
        <Letterbox/>

        <div style={{ minHeight:"100vh", background: C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"72px 24px", fontFamily:"'Cormorant Garamond', serif" }}>
          <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.65, ease:[0.22,1,0.36,1] }} style={{ display:"flex", width:"880px", maxWidth:"100%", minHeight:"580px", background: C.card, borderRadius:"16px", border:`1px solid rgba(200,205,214,0.14)`, overflow:"hidden", boxShadow:`0 0 0 1px rgba(200,205,214,0.06), 0 40px 100px rgba(0,0,0,0.75), 0 0 60px rgba(126,200,232,0.05)` }}>

            {/* ─── Left: Branding panel ─── */}
            <SpotlightPanel>
              <NeonSign/>
              <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(11,12,16,0.6) 100%)", pointerEvents:"none" }}/>
              <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", height:"100%", padding:"60px 40px", textAlign:"center" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat:Infinity, ease:"linear" }} style={{ marginBottom:"22px" }}>
                  <svg width="52" height="52" viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="24" stroke={C.silver} strokeWidth="0.6" strokeDasharray="6 4" opacity="0.55"/>
                    <circle cx="26" cy="26" r="16" stroke={C.ice} strokeWidth="0.4" opacity="0.4"/>
                    <line x1="26" y1="10" x2="26" y2="42" stroke={C.silver} strokeWidth="0.5" opacity="0.4"/>
                    <line x1="10" y1="26" x2="42" y2="26" stroke={C.silver} strokeWidth="0.5" opacity="0.4"/>
                    <path d="M26 20 L27.4 24.6 L32 26 L27.4 27.4 L26 32 L24.6 27.4 L20 26 L24.6 24.6 Z" fill={C.silverLt} opacity="0.95" filter="url(#starGlow)"/>
                    <defs><filter id="starGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                  </svg>
                </motion.div>
                <span style={{ fontSize:"13px", letterSpacing:"0.3em", color: C.ice, textTransform:"uppercase", fontFamily:"'Special Elite', monospace", textShadow:`0 0 8px ${C.ice}70`, marginBottom:"6px", display:"block" }}>The Art Of</span>
                <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:"50px", fontWeight:700, color:"#fff", lineHeight:1.05, margin:"0 0 4px", textShadow:`0 0 30px rgba(180,210,235,0.25)` }}>Prompting</h1>
                <div style={{ width:"50px", height:"1px", background:`linear-gradient(90deg, transparent, ${C.silver}, transparent)`, margin:"18px auto 22px", boxShadow:`0 0 8px rgba(200,205,214,0.4)` }}/>
                <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"15px", color:"rgba(255,255,255,0.42)", lineHeight:1.8, maxWidth:"240px", margin:"0 auto 32px", fontStyle:"italic" }}>
                  In the rain-soaked streets of intelligence, precision is your only weapon.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:"12px", width:"100%" }}>
                  <BrandFeature icon="◈" text="Craft powerful prompts" delay={0.5}/>
                  <BrandFeature icon="◇" text="Explore prompt patterns" delay={0.65}/>
                  <BrandFeature icon="◆" text="Learn advanced techniques" delay={0.8}/>
                </div>
              </div>
            </SpotlightPanel>

            {/* ─── Right: Form panel ─── */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"52px 48px", position:"relative", overflow:"hidden", background: C.card }}>
              <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.025, backgroundImage:"repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)" }}/>
              <TabBar mode={mode} onSwitch={switchTo}/>
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={mode} custom={dir} variants={formVariants} initial="enter" animate="center" exit="exit" transition={{ duration:0.38, ease:[0.25,0.46,0.45,0.94] }}>
                  {mode === "login"
                    ? <LoginForm onSwitch={() => switchTo("signup")} onLogin={onLogin}/>
                    : <SignupForm onSwitch={() => switchTo("login")} onLogin={onLogin}/>
                  }
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>
        </div>
      </>
    );
  }