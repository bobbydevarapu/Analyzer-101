import os
import logging

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


# ==========================================
# LOGGER SETUP
# ==========================================
LOG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "logs"
)

os.makedirs(LOG_DIR, exist_ok=True)

LOG_FILE = os.path.join(
    LOG_DIR,
    "email.log"
)

logger = logging.getLogger("email_utils")

logger.setLevel(logging.INFO)

if not logger.handlers:

    # File logger
    file_handler = logging.FileHandler(
        LOG_FILE,
        encoding="utf-8"
    )

    # Console logger
    stream_handler = logging.StreamHandler()

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(message)s"
    )

    file_handler.setFormatter(formatter)

    stream_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

    logger.addHandler(stream_handler)


# ==========================================
# SEND EMAIL FUNCTION
# ==========================================
def send_email(
    to_email,
    subject,
    body
):

    # ==========================================
    # ENV VARIABLES
    # ==========================================
    api_key = os.getenv(
        "SENDGRID_API_KEY"
    )

    from_email = os.getenv(
        "FROM_EMAIL",
        "no-reply@example.com"
    )

    logger.info(
        f"📧 Attempting to send email to: {to_email}"
    )

    logger.info(
        f"🔑 API Key present: {bool(api_key)}"
    )

    logger.info(
        f"📨 From email: {from_email}"
    )

    # ==========================================
    # VALIDATIONS
    # ==========================================
    if not api_key:

        logger.error(
            "❌ SENDGRID_API_KEY is missing"
        )

        return False

    if (
        not from_email
        or from_email == "no-reply@example.com"
    ):

        logger.error(
            f"❌ FROM_EMAIL invalid: {from_email}"
        )

        return False

    # ==========================================
    # INITIALIZE SENDGRID CLIENT
    # ==========================================
    try:

        sg = SendGridAPIClient(api_key)

    except Exception as e:

        logger.error(
            f"❌ Failed to initialize SendGrid client: {e}"
        )

        return False

    # ==========================================
    # EMAIL CONTENT
    # ==========================================
    plain_text = (
        "Assignment Integrity Analyzer Notification.\n\n"
        "Please open this email in an HTML-supported "
        "email client to view the complete report."
    )

    # ==========================================
    # CREATE EMAIL MESSAGE
    # ==========================================
    try:

        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            plain_text_content=plain_text,
            html_content=body
        )

    except Exception as e:

        logger.error(
            f"❌ Failed to create email message: {e}"
        )

        return False

    # ==========================================
    # SEND EMAIL
    # ==========================================
    try:

        response = sg.send(message)

        status = getattr(
            response,
            "status_code",
            None
        )

        body_text = getattr(
            response,
            "body",
            b""
        )

        # Convert bytes → string
        if isinstance(body_text, bytes):

            body_text = body_text.decode(
                errors="ignore"
            )

        # ==========================================
        # SUCCESS
        # ==========================================
        if status == 202:

            logger.info(
                f"✅ Email sent successfully | "
                f"to={to_email} | "
                f"subject={subject} | "
                f"status={status} | "
                f"response={body_text}"
            )

            return True

        # ==========================================
        # FAILED STATUS
        # ==========================================
        logger.error(
            f"❌ SendGrid returned unexpected status | "
            f"to={to_email} | "
            f"status={status} | "
            f"response={body_text}"
        )

        return False

    # ==========================================
    # SENDGRID EXCEPTION
    # ==========================================
    except Exception as e:

        logger.error(
            f"❌ SendGrid exception while sending email | "
            f"to={to_email} | "
            f"subject={subject} | "
            f"error={e}"
        )

        return False