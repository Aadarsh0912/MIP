import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app


def send_reset_email(to_email: str, name: str, token: str) -> bool:
    """
    Send a password-reset email.
    Returns True on success, False on failure (failure is logged, never raised).
    """
    cfg          = current_app.config
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_url    = f"{frontend_url}/reset-password?token={token}"
    expires_min  = cfg["RESET_TOKEN_EXPIRES_MINUTES"]

    # ── Plain-text body ───────────────────────────────────────────────────────
    plain = f"""
Hi {name},

Someone requested a password reset for your Prompt Mastery account.

Reset your password here:
{reset_url}

This link expires in {expires_min} minutes.

If you didn't request this, you can safely ignore this email —
your password has not been changed.

— The Prompt Mastery Team
""".strip()

    # ── HTML body ─────────────────────────────────────────────────────────────
    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#0b0c10;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#0f1014;border:1px solid rgba(200,205,214,0.14);border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(200,205,214,0.1);">
              <p style="margin:0;font-size:11px;letter-spacing:0.3em;color:#7ec8e8;text-transform:uppercase;">
                ✦ Prompt Mastery
              </p>
              <h1 style="margin:8px 0 0;font-size:28px;color:#fff;font-weight:700;line-height:1.1;">
                Password Reset
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7;">
                Hi {name},
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7;">
                Someone requested a password reset for your account.
                Click the button below to choose a new password.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px;background:rgba(200,205,214,0.1);
                             border:1px solid rgba(200,205,214,0.35);">
                    <a href="{reset_url}"
                       style="display:inline-block;padding:13px 32px;
                              font-size:11px;letter-spacing:0.2em;
                              text-transform:uppercase;color:#c8cdd6;
                              text-decoration:none;font-family:monospace;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;">
                This link expires in <strong style="color:rgba(255,255,255,0.55);">{expires_min} minutes</strong>.
                If you didn't request this, you can safely ignore this email.
              </p>

              <!-- Fallback URL -->
              <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.25);word-break:break-all;">
                Or copy this link: {reset_url}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(200,205,214,0.08);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:0.06em;">
                © Prompt Mastery · You're receiving this because you have an account with us.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""".strip()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your Prompt Mastery password"
    msg["From"]    = cfg["MAIL_SENDER"]
    msg["To"]      = to_email
    
    current_app.logger.info(f"\n{'='*50}\nPassword Reset Link for {to_email}:\n{reset_url}\n{'='*50}\n")
    
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html,  "html"))

    try:
        with smtplib.SMTP(cfg["MAIL_SERVER"], cfg["MAIL_PORT"]) as server:
            server.ehlo()
            server.starttls()
            server.login(cfg["MAIL_USERNAME"], cfg["MAIL_PASSWORD"])
            server.sendmail(cfg["MAIL_SENDER"], to_email, msg.as_string())
        return True
    except Exception as exc:
        current_app.logger.error("Failed to send reset email to %s: %s", to_email, exc)
        return False
