import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Theme (mirrors your LandingPage S object) ───────────────────────────────
const S = {
  bg: "#08080F",
  silver: "#A8A9AD",
  silverLt: "#C8C9CC",
  muted: "rgba(255,255,255,0.38)",
  mutedMd: "rgba(255,255,255,0.62)",
  white: "#FFFFFF",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PROMPT_TEXT   = "Create a world-class prompt engineering course.";
const TYPE_SPEED_MS = 42;   // ms per character — fast but readable
const PRE_DELAY_MS  = 600;  // pause before typing starts
const POST_DELAY_MS = 900;  // pause after typing finishes before reveal
const CURSOR_BLINK  = 530;  // cursor blink interval ms

// Particle pool for the sparks — pre-calculated, zero GC pressure during animation
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  angle: (i / 18) * 360,
  dist: 32 + Math.random() * 28,
  size: 1.5 + Math.random() * 2,
  delay: Math.random() * 0.12,
}));

export default function IntroAnimation({ onComplete }) {
  const [phase, setPhase]         = useState("pre");     // pre | typing | pause | reveal | done
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [showResponse, setShowResponse] = useState(false);
  const [showSparks, setShowSparks] = useState(false);

  const charIdx   = useRef(0);
  const typeTimer = useRef(null);
  const blinkTimer = useRef(null);

  // ── Cursor blink ──────────────────────────────────────────────────────────
  useEffect(() => {
    blinkTimer.current = setInterval(() => {
      setShowCursor(v => !v);
    }, CURSOR_BLINK);
    return () => clearInterval(blinkTimer.current);
  }, []);

  // ── Typing engine ─────────────────────────────────────────────────────────
  const startTyping = useCallback(() => {
    setPhase("typing");
    charIdx.current = 0;

    const tick = () => {
      charIdx.current += 1;
      setDisplayed(PROMPT_TEXT.slice(0, charIdx.current));

      if (charIdx.current < PROMPT_TEXT.length) {
        // Slightly variable speed — human feel without jank
        const jitter = Math.random() < 0.08 ? TYPE_SPEED_MS * 3.5 : TYPE_SPEED_MS;
        typeTimer.current = setTimeout(tick, jitter);
      } else {
        // Typing done
        setPhase("pause");
        setShowSparks(true);
        setTimeout(() => {
          setShowSparks(false);
          setPhase("reveal");
          setShowResponse(true);
          // Give the reveal animation time to play, then unmount intro
          setTimeout(() => {
            setPhase("done");
            onComplete?.();
          }, 1100);
        }, POST_DELAY_MS);
      }
    };

    typeTimer.current = setTimeout(tick, 0);
  }, [onComplete]);

  useEffect(() => {
    const pre = setTimeout(startTyping, PRE_DELAY_MS);
    return () => {
      clearTimeout(pre);
      clearTimeout(typeTimer.current);
    };
  }, [startTyping]);

  if (phase === "done") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: S.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* ── Ambient orb glow — pure CSS, zero JS cost ── */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 55% 40% at 18% 72%, rgba(168,169,173,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 35% at 82% 28%, rgba(139,158,212,0.06) 0%, transparent 70%)
          `,
        }} />

        {/* ── Scanline texture — CSS only ── */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
          backgroundSize: "100% 4px",
        }} />

        {/* ── Terminal box ── */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{
            position: "relative",
            width: "min(680px, 92vw)",
            padding: "0",
          }}
        >
          {/* Top chrome bar */}
          <div style={{
            background: "rgba(168,169,173,0.06)",
            border: "1px solid rgba(168,169,173,0.14)",
            borderBottom: "none",
            borderRadius: "12px 12px 0 0",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(168,169,173,0.22)", display: "block" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(168,169,173,0.22)", display: "block" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(168,169,173,0.22)", display: "block" }} />
            <span style={{
              marginLeft: "auto",
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "rgba(168,169,173,0.38)",
              fontFamily: "monospace",
              textTransform: "uppercase",
            }}>prompt_terminal</span>
          </div>

          {/* Main terminal body */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(168,169,173,0.14)",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            padding: "28px 28px 32px",
            backdropFilter: "blur(2px)",
            minHeight: 110,
          }}>
            {/* Label */}
            <div style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "rgba(168,169,173,0.42)",
              marginBottom: 18,
              fontFamily: "monospace",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <motion.span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#A8A9AD",
                }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              user prompt
            </div>

            {/* Typed text */}
            <div style={{
              fontFamily: "'Cormorant Garamond', 'Georgia', serif",
              fontSize: "clamp(19px, 3.2vw, 26px)",
              color: S.silverLt,
              lineHeight: 1.55,
              letterSpacing: "0.01em",
              minHeight: "1.6em",
              display: "flex",
              alignItems: "flex-start",
              flexWrap: "wrap",
              wordBreak: "break-word",
            }}>
              <span>{displayed}</span>
              {/* Cursor */}
              <motion.span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "1.1em",
                  background: S.silver,
                  marginLeft: 3,
                  verticalAlign: "middle",
                  flexShrink: 0,
                  alignSelf: "center",
                  borderRadius: 1,
                }}
                animate={{ opacity: showCursor ? 1 : 0 }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </div>

          {/* ── Spark burst when typing completes ── */}
          <AnimatePresence>
            {showSparks && (
              <div style={{
                position: "absolute",
                bottom: -6,
                right: 32,
                width: 0,
                height: 0,
                pointerEvents: "none",
              }}>
                {SPARKS.map(s => (
                  <motion.span
                    key={s.id}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 0.9, 0],
                      x: Math.cos((s.angle * Math.PI) / 180) * s.dist,
                      y: Math.sin((s.angle * Math.PI) / 180) * s.dist,
                      scale: [0, 1, 0],
                    }}
                    transition={{ duration: 0.55, delay: s.delay, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      width: s.size,
                      height: s.size,
                      borderRadius: "50%",
                      background: s.id % 3 === 0 ? S.silverLt : s.id % 3 === 1 ? "#8B9ED4" : S.silver,
                      display: "block",
                    }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* ── Response box — appears after typing ── */}
          <AnimatePresence>
            {showResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,  scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                style={{
                  marginTop: 14,
                  background: "rgba(168,169,173,0.055)",
                  border: "1px solid rgba(168,169,173,0.18)",
                  borderLeft: "2.5px solid rgba(168,169,173,0.55)",
                  borderRadius: "0 10px 10px 0",
                  padding: "18px 22px",
                }}
              >
                <div style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "rgba(168,169,173,0.42)",
                  marginBottom: 10,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span style={{
                    display: "inline-block",
                    fontFamily: "monospace",
                    fontSize: 13,
                    color: "rgba(168,169,173,0.55)",
                    marginRight: 2,
                  }}>◈</span>
                  generating response
                </div>

                {/* Shimmer lines */}
                {[1, 0.75, 0.5].map((w, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.08 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      height: 2,
                      width: `${w * 100}%`,
                      background: "linear-gradient(90deg, rgba(168,169,173,0.28) 0%, rgba(168,169,173,0.08) 100%)",
                      borderRadius: 2,
                      marginBottom: i < 2 ? 10 : 0,
                      transformOrigin: "left",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── App name watermark fading in during pre phase ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.6 }}
          style={{
            position: "absolute",
            bottom: "8vh",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(11px, 1.4vw, 13px)",
            letterSpacing: "0.32em",
            color: "#FFFFFF",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          Prompt Engineering · Mastery
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
