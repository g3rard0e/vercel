async function getAccessToken(env) {
  const url = `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`

  const body = new URLSearchParams({
    client_id:     env.MS_CLIENT_ID,
    client_secret: env.MS_CLIENT_SECRET,
    scope:         'https://graph.microsoft.com/.default',
    grant_type:    'client_credentials',
  })

  const res  = await fetch(url, { method: 'POST', body })
  const data = await res.json()

  if (!res.ok) throw new Error(data.error_description || 'Token request failed')
  return data.access_token
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' })
  }

  if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET || !env.MS_FROM_EMAIL) {
    return json({ error: 'Email service not configured' }, 500)
  }

  let fields
  try {
    fields = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return json({ error: 'Invalid request' }, 400)
  }

  const limits = { name: 200, email: 320, phone: 100, service: 200, message: 10000 }
  for (const [key, limit] of Object.entries(limits)) {
    const value = fields[key]
    if ((key !== 'phone' && (typeof value !== 'string' || !value.trim())) ||
        (value != null && (typeof value !== 'string' || value.length > limit))) {
      return json({ error: 'Invalid form fields' }, 400)
    }
  }
  const email = fields.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400)
  }
  const senderName = fields.name.trim()
  const name = escapeHtml(senderName)
  const phone = escapeHtml(fields.phone || '')
  const service = escapeHtml(fields.service.trim())
  const message = escapeHtml(fields.message.trim())

  try {
    const token = await getAccessToken(env)

    const mailPayload = {
      message: {
        subject: `[Geamy] New inquiry — ${service}`,
        body: {
          contentType: 'HTML',
          content: `
            <div style="font-family: monospace; background: #0a0a0a; color: #e8edf8; padding: 32px; max-width: 600px; border: 1px solid rgba(0,255,255,0.15);">
              <div style="color: #00ffff; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 24px;">
                ◆ GEAMY SERVICES — NEW INQUIRY
              </div>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); width: 140px;">From</td>
                  <td style="color: #fff; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">${name}</td>
                </tr>
                <tr>
                  <td style="color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">Email</td>
                  <td style="color: #00ffff; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">${escapeHtml(email)}</td>
                </tr>
                <tr>
                  <td style="color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">Phone</td>
                  <td style="color: #fff; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">${phone || '—'}</td>
                </tr>
                <tr>
                  <td style="color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; padding: 10px 0;">Service</td>
                  <td style="color: #ff00ff; padding: 10px 0;">${service}</td>
                </tr>
              </table>
              <div style="color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">Message</div>
              <div style="color: #e8edf8; line-height: 1.7; padding: 16px; background: rgba(255,255,255,0.04); border-left: 2px solid #00ffff;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <div style="margin-top: 24px; color: rgba(255,255,255,0.2); font-size: 10px; letter-spacing: 2px;">
                ↩ Reply to this email to respond directly to ${name}
              </div>
            </div>
          `,
        },
        from: {
          emailAddress: {
            name:    'Geamy Contact Form',
            address: env.MS_FROM_EMAIL,
          },
        },
        toRecipients: [
          { emailAddress: { address: env.MS_FROM_EMAIL } },
        ],
        replyTo: [
          { emailAddress: { name: senderName, address: email } },
        ],
      },
      saveToSentItems: false,
    }

    const graphRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.MS_FROM_EMAIL)}/sendMail`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mailPayload),
      }
    )

    if (!graphRes.ok) {
      throw new Error('Graph API failed')
    }

    return json({ ok: true })

  } catch (err) {
    console.error('Contact email delivery failed')
    return json({ error: 'Failed to send email' }, 500)
  }
}
