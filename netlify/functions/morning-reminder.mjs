const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });

export const config = { schedule: '30 23 * * *' }; // 06:30 Asia/Ho_Chi_Minh

export default async () => {
  const to = String(process.env.REMINDER_TO || '').trim();
  if (!to || !process.env.RESEND_API_KEY) return json(200, { skipped: true, reason: 'Missing REMINDER_TO or RESEND_API_KEY' });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'CharterPrep <onboarding@resend.dev>',
      to: [to],
      subject: 'CharterPrep · Kế hoạch học buổi sáng',
      html: '<h2>Chào buổi sáng!</h2><p>Đã đến giờ bắt đầu kế hoạch học CFA của bạn.</p><p>Mở CharterPrep để học module hôm nay và đánh dấu tiến độ sau khi hoàn thành.</p>'
    })
  });
  const result = await response.json().catch(() => ({}));
  return json(response.ok ? 200 : response.status, response.ok ? { ok: true, id: result.id } : { error: result?.message || 'Resend chưa gửi được email.' });
};
