import os
import aiosmtplib
from email.message import EmailMessage
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Gmail Config (Nodemailer equivalent)
EMAIL_USER = os.getenv("EMAIL_FROM_ADDRESS") # Your Gmail
EMAIL_PASS = os.getenv("EMAIL_APP_PASSWORD") # Your 16-char App Password
APP_URL = os.getenv("APP_URL", "http://localhost:5173")

# Twilio Config (WhatsApp)
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_NUMBER", "+14155238886")

async def send_reporter_credentials_email(to_email: str, full_name: str, ngo_name: str, temp_password: str):
    if not EMAIL_USER or not EMAIL_PASS:
        print(f"DEBUG: Gmail credentials missing in .env. Skipping email to {to_email}")
        return

    message = EmailMessage()
    message["From"] = EMAIL_USER
    message["To"] = to_email
    message["Subject"] = f"Welcome to CommunityPulse - Account Created by {ngo_name}"
    
    html_content = f"""
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #2563eb;">Welcome, {full_name}!</h2>
        <p><strong>{ngo_name}</strong> has added you as a Field Reporter on CommunityPulse.</p>
        <p>Use the credentials below to log in and set your permanent password:</p>
        <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> {to_email}</p>
            <p style="margin: 5px 0;"><strong>Temp Password:</strong> <code style="background: #e2e8f0; padding: 2px 5px;">{temp_password}</code></p>
        </div>
        <p><a href="{APP_URL}/login" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Log in to Secure Your Account</a></p>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Note: This temporary password will expire in 24 hours.</p>
    </div>
    """
    message.add_alternative(html_content, subtype="html")

    try:
        print(f"DEBUG: Attempting to send Gmail to {to_email} via smtp.gmail.com...")
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=EMAIL_USER,
            password=EMAIL_PASS,
        )
        print(f"✅ SUCCESS: Gmail sent to {to_email}")
    except Exception as e:
        print(f"❌ GMAIL ERROR: Failed to send to {to_email}. Error: {str(e)}")
        print("TIP: Make sure you use a 16-character App Password, not your regular Gmail password.")

async def send_reporter_credentials_whatsapp(to_phone: str, full_name: str, ngo_name: str, temp_password: str):
    if not TWILIO_SID or not TWILIO_AUTH_TOKEN:
        print(f"DEBUG: Twilio credentials missing. Skipping WhatsApp to {to_phone}")
        return

    try:
        client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)
        formatted_phone = f"whatsapp:{to_phone}"
        
        message = client.messages.create(
            from_=f"whatsapp:{TWILIO_WHATSAPP_FROM}",
            body=(
                f"Hi {full_name}! 👋\n\n"
                f"You've been added as a Field Reporter for *{ngo_name}* on CommunityPulse.\n\n"
                f"📧 Email: {to_phone}\n"
                f"🔑 Temp Password: {temp_password}\n\n"
                f"🔗 Login: {APP_URL}/login\n\n"
                f"⚠️ Please reset your password on first login."
            ),
            to=formatted_phone
        )
        print(f"WhatsApp sent to {to_phone} (SID: {message.sid})")
    except Exception as e:
        print(f"ERROR sending WhatsApp: {str(e)}")

async def send_report_accepted_notification(to_email: str, full_name: str, task_title: str):
    if not EMAIL_USER or not EMAIL_PASS:
        return

    message = EmailMessage()
    message["From"] = EMAIL_USER
    message["To"] = to_email
    message["Subject"] = f"Action Taken: Your Report '{task_title}' has been Accepted"
    
    html_content = f"""
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #0891b2;">Good News, {full_name}!</h2>
        <p>Your ground report has been reviewed and officially <strong>Accepted</strong> by HQ.</p>
        <p>A relief task titled <strong>"{task_title}"</strong> has been created and is now being matched with nearby volunteers.</p>
        <p>Thank you for your critical contribution to the crisis response team.</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            Sent by CommunityPulse AI System
        </div>
    </div>
    """
    message.add_alternative(html_content, subtype="html")

    try:
        await aiosmtplib.send(message, hostname="smtp.gmail.com", port=587, start_tls=True, username=EMAIL_USER, password=EMAIL_PASS)
        print(f"✅ ACCEPTANCE EMAIL SENT to {to_email}")
    except Exception as e:
        print(f"❌ FAILED to send acceptance email: {e}")
