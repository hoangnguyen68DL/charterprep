const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });

export const config = { schedule: '0 14 * * *' }; // 21:00 Asia/Ho_Chi_Minh

export default async () => {
  const to = String(process.env.REMINDER_TO || '').trim();
  if (!to || !process.env.RESEND_API_KEY) return json(200, { skipped: true, reason: 'Missing REMINDER_TO or RESEND_API_KEY' });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'CharterPrep <onboarding@resend.dev>',
      to: [to],
      subject: 'CharterPrep · Nhắc học buổi tối',
      html: '<h2>Nhắc học buổi tối</h2><p>Hãy kiểm tra tiến độ hôm nay và hoàn thành phần còn thiếu nếu bạn còn thời gian.</p><p>Chúc bạn học hiệu quả!</p>'
    })
  });
  const result = await response.json().catch(() => ({}));
  return json(response.ok ? 200 : response.status, response.ok ? { ok: true, id: result.id } : { error: result?.message || 'Resend chưa gửi được email.' });
};
