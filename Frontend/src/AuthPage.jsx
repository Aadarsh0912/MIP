import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOLD = "#A8A9AD";
const GOLD_LIGHT = "#C8C9CC";
const BG_DEEP = "#0A0A0F";
const BG_CARD = "#111118";
const BG_PANEL = "#0E0E16";
const BORDER = "rgba(168,169,173,0.18)";
const TEXT_MUTED = "rgba(255,255,255,0.45)";

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(168,169,173,0.2)",
  borderRadius: "10px",
  padding: "13px 16px",
  color: "#fff",
  fontSize: "14px",
  fontFamily: "'Cormorant Garamond', serif",
  letterSpacing: "0.03em",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.3s, background 0.3s",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: GOLD,
  marginBottom: "8px",
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 600,
};

function InputField({ label, type = "text", placeholder, value, onChange, delay = 0 }) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ marginBottom: "20px" }}
    >
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          borderColor: focused ? GOLD : "rgba(168,169,173,0.2)",
          background: focused ? "rgba(168,169,173,0.05)" : "rgba(255,255,255,0.04)",
        }}
      />
    </motion.div>
  );
}

const GoldDivider = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
    <div style={{ flex: 1, height: "1px", background: "rgba(168,169,173,0.18)" }} />
    <span style={{ color: TEXT_MUTED, fontSize: "11px", letterSpacing: "0.12em", fontFamily: "'Cormorant Garamond', serif" }}>OR</span>
    <div style={{ flex: 1, height: "1px", background: "rgba(168,169,173,0.18)" }} />
  </div>
);

const DecorativeGlyph = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: "24px" }}>
    <circle cx="24" cy="24" r="23" stroke={GOLD} strokeWidth="0.8" strokeDasharray="4 3" />
    <circle cx="24" cy="24" r="16" stroke={GOLD} strokeWidth="0.5" opacity="0.5" />
    <line x1="24" y1="8" x2="24" y2="40" stroke={GOLD} strokeWidth="0.6" opacity="0.6" />
    <line x1="8" y1="24" x2="40" y2="24" stroke={GOLD} strokeWidth="0.6" opacity="0.6" />
    <circle cx="24" cy="24" r="3" fill={GOLD} opacity="0.9" />
    <polygon points="24,17 26,21 30,21 27,24 28,28 24,25 20,28 21,24 18,21 22,21" fill={GOLD} opacity="0.7" />
  </svg>
);

const FloatingOrbs = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {[
      { w: 320, h: 320, top: "-80px", left: "-60px", delay: 0 },
      { w: 240, h: 240, bottom: "60px", right: "-40px", delay: 1.5 },
      { w: 180, h: 180, top: "40%", left: "20%", delay: 3 },
    ].map((o, i) => (
      <motion.div
        key={i}
        animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 6 + i * 2, repeat: Infinity, delay: o.delay, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: o.w,
          height: o.h,
          top: o.top,
          bottom: o.bottom,
          left: o.left,
          right: o.right,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
        }}
      />
    ))}
  </div>
);

const BrandingPanel = () => (
  <div style={{
    flex: "0 0 420px",
    background: BG_PANEL,
    borderRight: `1px solid ${BORDER}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px 48px",
    position: "relative",
    overflow: "hidden",
  }}>
    <FloatingOrbs />
    <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
      <DecorativeGlyph />
      <div style={{ marginBottom: "6px" }}>
        <span style={{
          fontSize: "11px",
          letterSpacing: "0.3em",
          color: GOLD,
          textTransform: "uppercase",
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 600,
        }}>The Art Of</span>
      </div>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "52px",
        fontWeight: 700,
        color: "#fff",
        margin: "0 0 6px",
        lineHeight: 1.05,
        letterSpacing: "-0.01em",
      }}>Prompting</h1>
      <div style={{
        width: "60px",
        height: "2px",
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        margin: "20px auto 28px",
      }} />
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "16px",
        color: "rgba(255,255,255,0.5)",
        lineHeight: 1.75,
        maxWidth: "280px",
        margin: "0 auto 40px",
        fontStyle: "italic",
      }}>
        Master the language of intelligence. Shape thoughts into precision.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {[
          { icon: "◈", text: "Craft powerful prompts" },
          { icon: "◇", text: "Explore prompt patterns" },
          { icon: "◆", text: "Learn advanced techniques" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "12px 16px",
              background: "rgba(168,169,173,0.06)",
              borderRadius: "10px",
              border: `1px solid rgba(168,169,173,0.12)`,
            }}>
            <span style={{ color: GOLD, fontSize: "16px" }}>{item.icon}</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", color: "rgba(255,255,255,0.65)", letterSpacing: "0.04em" }}>{item.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const formVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function LoginForm({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.25em", color: GOLD, textTransform: "uppercase", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, marginBottom: "8px" }}>Welcome back</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "34px", color: "#fff", margin: "0 0 8px", fontWeight: 700 }}>Sign In</h2>
        <p style={{ color: TEXT_MUTED, fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", marginBottom: "32px" }}>Access your prompting workspace</p>
      </motion.div>
      <InputField label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} delay={0.1} />
      <InputField label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} delay={0.2} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} style={{ textAlign: "right", marginTop: "-12px", marginBottom: "24px" }}>
        <span style={{ fontSize: "12px", color: GOLD, cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.05em" }}>Forgot password?</span>
      </motion.div>
      <motion.button
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02, boxShadow: `0 8px 32px rgba(168,169,173,0.25)` }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: "100%", padding: "14px", borderRadius: "10px",
          background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 50%, ${GOLD} 100%)`,
          backgroundSize: "200% 100%",
          border: "none", color: "#0A0A0F", fontSize: "13px",
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase",
          cursor: "pointer", marginBottom: "20px",
        }}>
        Enter the Studio
      </motion.button>
      <GoldDivider />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ textAlign: "center" }}>
        <span style={{ color: TEXT_MUTED, fontSize: "13px", fontFamily: "'Cormorant Garamond', serif" }}>New to the art? </span>
        <span
          onClick={onSwitch}
          style={{ color: GOLD, fontSize: "13px", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, textDecoration: "underline", textDecorationColor: "rgba(168,169,173,0.4)" }}>
          Create an account →
        </span>
      </motion.div>
    </div>
  );
}

function SignupForm({ onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.25em", color: GOLD, textTransform: "uppercase", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, marginBottom: "8px" }}>Begin your journey</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "34px", color: "#fff", margin: "0 0 8px", fontWeight: 700 }}>Create Account</h2>
        <p style={{ color: TEXT_MUTED, fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", marginBottom: "28px" }}>Join the art of intelligent conversation</p>
      </motion.div>
      <InputField label="Full Name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} delay={0.1} />
      <InputField label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} delay={0.18} />
      <InputField label="Password" type="password" placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} delay={0.26} />
      <InputField label="Confirm Password" type="password" placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} delay={0.34} />
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
        onClick={() => setAgreed(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "12px",
          marginBottom: "20px", cursor: "pointer", userSelect: "none",
        }}>
        <div style={{
          width: "17px", height: "17px", borderRadius: "4px", flexShrink: 0,
          border: `1.5px solid ${agreed ? GOLD : "rgba(168,169,173,0.35)"}`,
          background: agreed ? GOLD : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease",
          boxShadow: agreed ? `0 0 8px rgba(168,169,173,0.3)` : "none",
        }}>
          {agreed && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 3.5L3.8 6.5L9 1" stroke="#0A0A0F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "13px",
          color: agreed ? "rgba(255,255,255,0.7)" : TEXT_MUTED,
          letterSpacing: "0.03em", lineHeight: 1.4,
          transition: "color 0.2s ease",
        }}>
          I agree to share my details for account creation
        </span>
      </motion.div>
      <motion.button
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        whileHover={agreed ? { scale: 1.02, boxShadow: `0 8px 32px rgba(168,169,173,0.25)` } : {}}
        whileTap={agreed ? { scale: 0.98 } : {}}
        style={{
          width: "100%", padding: "14px", borderRadius: "10px",
          background: agreed
            ? `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 50%, ${GOLD} 100%)`
            : "rgba(168,169,173,0.08)",
          border: agreed ? "none" : "1px solid rgba(168,169,173,0.15)",
          color: agreed ? "#0A0A0F" : "rgba(255,255,255,0.2)", fontSize: "13px",
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase",
          cursor: agreed ? "pointer" : "not-allowed", marginBottom: "20px",
          transition: "all 0.3s ease",
        }}>
        Begin the Journey
      </motion.button>
      <GoldDivider />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ textAlign: "center" }}>
        <span style={{ color: TEXT_MUTED, fontSize: "13px", fontFamily: "'Cormorant Garamond', serif" }}>Already a member? </span>
        <span
          onClick={onSwitch}
          style={{ color: GOLD, fontSize: "13px", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, textDecoration: "underline", textDecorationColor: "rgba(168,169,173,0.4)" }}>
          ← Sign in
        </span>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [direction, setDirection] = useState(1);

  const switchTo = (next) => {
    setDirection(next === "signup" ? 1 : -1);
    setMode(next);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG_DEEP}; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168,169,173,0.3); border-radius: 2px; }
      `}</style>
      <div style={{
        minHeight: "100vh",
        background: BG_DEEP,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Cormorant Garamond', serif",
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            display: "flex",
            width: "900px",
            maxWidth: "100%",
            minHeight: "600px",
            background: BG_CARD,
            borderRadius: "20px",
            border: `1px solid ${BORDER}`,
            overflow: "hidden",
            boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,169,173,0.08)",
          }}>
          <BrandingPanel />
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "56px 52px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              display: "flex",
              gap: "4px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "10px",
              padding: "4px",
              border: `1px solid ${BORDER}`,
            }}>
              {["login", "signup"].map(m => (
                <motion.button
                  key={m}
                  onClick={() => switchTo(m)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: "7px",
                    border: "none",
                    background: mode === m ? GOLD : "transparent",
                    color: mode === m ? "#0A0A0F" : TEXT_MUTED,
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.25s",
                  }}
                  whileHover={mode !== m ? { color: "rgba(255,255,255,0.7)" } : {}}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={mode}
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {mode === "login"
                  ? <LoginForm onSwitch={() => switchTo("signup")} />
                  : <SignupForm onSwitch={() => switchTo("login")} />
                }
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
