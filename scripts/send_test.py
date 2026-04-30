import os
import sys

# Ensure repo root is on path so we can import backend utils
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.utils.email_utils import send_email, logger


def main():
    to_addr = os.environ.get('TEST_TO')
    if not to_addr:
        to_addr = input('Recipient email to send test to: ').strip()
    if not to_addr:
        print('No recipient provided, aborting.')
        return

    subject = 'Test Email — Assignment Integrity Analyzer'
    body = '<p>This is a test message from your Assignment Integrity Analyzer instance.</p>'

    try:
        print(f'Sending test email to {to_addr}...')
        status = send_email(to_addr, subject, body)
        print('Send returned status:', status)
    except Exception as e:
        print('Send failed:', e)


if __name__ == '__main__':
    main()
