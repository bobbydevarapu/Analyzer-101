import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Setup logger
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "email.log")
logger = logging.getLogger("email_utils")
logger.setLevel(logging.INFO)
if not logger.handlers:
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(fh)


def send_email(to_email, subject, body):
    """Send an email via SendGrid.

    Raises RuntimeError on configuration or send failure. Returns the
    SendGrid HTTP status code on success.
    """
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("FROM_EMAIL", "no-reply@example.com")

    if not api_key:
        raise RuntimeError("SendGrid API key missing (SENDGRID_API_KEY)")

    sg = SendGridAPIClient(api_key)

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=subject,
        html_content=body,
    )

    try:
        response = sg.send(message)
        status = getattr(response, "status_code", None)
        logger.info(f"SendGrid send to={to_email} subject={subject} status={status}")
        return status
    except Exception as e:
        logger.error(f"SendGrid error sending to={to_email} subject={subject} error={e}")

        # Attempt SMTP fallback if configured
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", "0") or 0)
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")

        if smtp_host and smtp_port and smtp_user and smtp_pass:
            try:
                import smtplib
                from email.message import EmailMessage

                msg = EmailMessage()
                msg["From"] = from_email
                msg["To"] = to_email
                msg["Subject"] = subject
                msg.set_content("This email requires an HTML-capable client.")
                msg.add_header("Content-Type", "text/html")
                msg.set_payload(body)

                with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as s:
                    s.starttls()
                    s.login(smtp_user, smtp_pass)
                    s.send_message(msg)

                logger.info(f"SMTP fallback send to={to_email} subject={subject} host={smtp_host}")
                return 250
            except Exception as se:
                logger.error(f"SMTP fallback error to={to_email} error={se}")
                raise RuntimeError(f"SendGrid failed: {e}; SMTP fallback failed: {se}") from se

        # No SMTP fallback configured — re-raise original error
        raise RuntimeError(f"SendGrid send error: {e}") from e