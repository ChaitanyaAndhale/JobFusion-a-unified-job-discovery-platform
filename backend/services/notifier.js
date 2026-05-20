/**
 * JobFusion — Notification Service
 * Sends email (& optionally SMS) when jobs match user's resume
 */

import nodemailer from 'nodemailer'

// ─── Email Transport ────────────────────────────────────────

let transporter = null

export function initEmailTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    console.log('⚠️  Email notifications disabled (no SMTP credentials in .env)')
    return false
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  console.log(`📧 Email notifications enabled via ${host}`)
  return true
}

// ─── Send Job Match Email ───────────────────────────────────

export async function sendJobMatchEmail(userEmail, userName, matchedJobs) {
  if (!transporter) {
    console.log('📧 Email skipped (transport not configured)')
    return false
  }

  if (!matchedJobs || matchedJobs.length === 0) return false

  const topJobs = matchedJobs.slice(0, 5) // Send top 5 matches

  const jobCards = topJobs.map(job => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                ${job.title}
              </div>
              <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
                ${job.company} &bull; ${job.location || 'Remote'} &bull; ${job.mode || ''}
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
                ${(job.skills || []).slice(0, 4).map(s => `
                  <span style="display: inline-block; padding: 2px 10px; background: #e0e7ff; color: #4f46e5; border-radius: 100px; font-size: 11px; font-weight: 600;">${s}</span>
                `).join('')}
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; border-radius: 100px; font-size: 12px; font-weight: 700;">
                  ${job.matchScore}% Match
                </span>
                ${job.salaryText ? `<span style="font-size: 13px; color: #10b981; font-weight: 600;">${job.salaryText}</span>` : ''}
              </div>
            </td>
            <td style="text-align: right; vertical-align: middle; width: 100px;">
              <a href="${job.applyUrl || job.sourceUrl || '#'}" 
                 style="display: inline-block; padding: 8px 18px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
                Apply →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 32px 40px;">
                  <div style="font-size: 24px; font-weight: 800; color: white; margin-bottom: 4px;">
                    🚀 JobFusion
                  </div>
                  <div style="font-size: 14px; color: rgba(255,255,255,0.8);">
                    New job matches found for your profile!
                  </div>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px 40px;">
                  <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                    Hi ${userName || 'there'} 👋
                  </div>
                  <div style="font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.6;">
                    We found <strong style="color: #6366f1;">${matchedJobs.length} new job${matchedJobs.length > 1 ? 's' : ''}</strong> that match your resume skills. Here are the top picks:
                  </div>
                  
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${jobCards}
                  </table>

                  ${matchedJobs.length > 5 ? `
                    <div style="text-align: center; margin-top: 20px;">
                      <span style="font-size: 13px; color: #64748b;">
                        + ${matchedJobs.length - 5} more matches on your dashboard
                      </span>
                    </div>
                  ` : ''}

                  <div style="text-align: center; margin-top: 28px;">
                    <a href="http://localhost:5173/dashboard" 
                       style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; border-radius: 12px; text-decoration: none; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">
                      View All Matches on Dashboard
                    </a>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px; border-top: 1px solid #e2e8f0; background: #f8fafc;">
                  <div style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.6;">
                    You're receiving this because you enabled job match notifications on JobFusion.<br>
                    <a href="http://localhost:5173/profile" style="color: #6366f1; text-decoration: none;">Manage preferences</a> &bull; 
                    <a href="http://localhost:5173/profile" style="color: #6366f1; text-decoration: none;">Unsubscribe</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"JobFusion" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `🚀 ${matchedJobs.length} New Job Match${matchedJobs.length > 1 ? 'es' : ''} Found for Your Profile!`,
      html,
    })
    console.log(`📧 Job match email sent to ${userEmail} (${matchedJobs.length} matches)`)
    return true
  } catch (err) {
    console.error('❌ Email send failed:', err.message)
    return false
  }
}

// ─── Send Welcome Email ─────────────────────────────────────

export async function sendWelcomeEmail(userEmail, userName) {
  if (!transporter) return false

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
                  <div style="font-size: 28px; font-weight: 800; color: white; margin-bottom: 8px;">Welcome to JobFusion!</div>
                  <div style="font-size: 15px; color: rgba(255,255,255,0.85);">Your smart job discovery journey starts now</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 40px;">
                  <div style="font-size: 17px; color: #0f172a; font-weight: 600; margin-bottom: 16px;">
                    Hi ${userName} 👋
                  </div>
                  <div style="font-size: 14px; color: #64748b; line-height: 1.8; margin-bottom: 24px;">
                    Thanks for joining JobFusion! Here's how to get the most out of your account:
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${['Upload your resume to auto-match with jobs', 'Set notification preferences for email & SMS alerts', 'Save interesting jobs and track applications'].map((step, i) => `
                      <tr>
                        <td style="padding: 12px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 36px; vertical-align: top;">
                                <div style="width: 28px; height: 28px; background: #e0e7ff; color: #4f46e5; border-radius: 8px; text-align: center; line-height: 28px; font-size: 13px; font-weight: 700;">${i + 1}</div>
                              </td>
                              <td style="font-size: 14px; color: #334155; font-weight: 500;">${step}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    `).join('')}
                  </table>
                  <div style="text-align: center; margin-top: 28px;">
                    <a href="http://localhost:5173/profile" 
                       style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; border-radius: 12px; text-decoration: none; font-weight: 700;">
                      Complete Your Profile →
                    </a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"JobFusion" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: '✨ Welcome to JobFusion — Let\'s Find Your Dream Job!',
      html,
    })
    return true
  } catch (err) {
    console.error('❌ Welcome email failed:', err.message)
    return false
  }
}

// ─── SMS Notification (Pluggable) ───────────────────────────

export async function sendSMSNotification(phone, message) {
  const twilioSid = process.env.TWILIO_SID
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER

  if (!twilioSid || !twilioAuth || !twilioPhone) {
    console.log('📱 SMS skipped (Twilio not configured)')
    return false
  }

  // Twilio REST API (no SDK needed)
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
    const body = new URLSearchParams({
      To: phone,
      From: twilioPhone,
      Body: message,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (res.ok) {
      console.log(`📱 SMS sent to ${phone}`)
      return true
    } else {
      const err = await res.text()
      console.error('❌ SMS failed:', err)
      return false
    }
  } catch (err) {
    console.error('❌ SMS error:', err.message)
    return false
  }
}
