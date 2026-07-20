type DetailRow = {
  label: string
  value: string
}

type KeyValueRow = {
  label: string
  value: string
}

export const greeting = (firstName: string): string =>
  `<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#122B33;">Hi ${firstName || 'there'},</p>`

export const text = (content: string): string =>
  `<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4E6872;">${content}</p>`

export const textLast = (content: string): string =>
  `<p style="margin:0;font-size:15px;line-height:1.7;color:#4E6872;">${content}</p>`

export const heading = (content: string): string =>
  `<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#122B33;">${content}</p>`

export const detailCard = (rows: DetailRow[]): string => {
  const rowsHtml = rows
    .map((row, index) => {
      const divider =
        index < rows.length - 1
          ? 'padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid #E8EFF1;'
          : ''
      return `<tr>
        <td style="${divider}">
          <p style="margin:0;font-size:11px;font-weight:600;color:#7B9198;text-transform:uppercase;letter-spacing:0.6px;">${row.label}</p>
          <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#122B33;line-height:1.3;">${row.value}</p>
        </td>
      </tr>`
    })
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#F8FAFB;border:1px solid #E8EFF1;border-radius:12px;">
    <tr>
      <td style="padding:22px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
      </td>
    </tr>
  </table>`
}

export const keyValueCard = (rows: KeyValueRow[]): string => {
  const rowsHtml = rows
    .map(
      (row) => `<tr>
        <td style="padding:10px 0;font-size:13px;color:#7B9198;width:110px;vertical-align:top;">${row.label}</td>
        <td style="padding:10px 0;font-size:15px;color:#122B33;font-weight:600;vertical-align:top;">${row.value}</td>
      </tr>`
    )
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#F8FAFB;border:1px solid #E8EFF1;border-radius:12px;">
    <tr>
      <td style="padding:20px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
      </td>
    </tr>
  </table>`
}

export const messageCard = (label: string, content: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#F8FAFB;border:1px solid #E8EFF1;border-radius:12px;">
    <tr>
      <td style="padding:20px 24px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:600;color:#7B9198;text-transform:uppercase;letter-spacing:0.6px;">${label}</p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#122B33;white-space:pre-wrap;">${content}</p>
      </td>
    </tr>
  </table>`

export const otpBox = (code: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
      <td align="center" style="padding:28px 24px;background:#F8FAFB;border:2px dashed #0A8F7D;border-radius:12px;">
        <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#122B33;font-family:'Courier New',Courier,monospace;">${code}</span>
      </td>
    </tr>
  </table>`

export const ctaButton = (href: string, label: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:inline-block;padding:14px 36px;background:#0A8F7D;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">${label}</a>
      </td>
    </tr>
  </table>`

export const fallbackLink = (url: string): string =>
  `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#7B9198;">If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="margin:0 0 24px;word-break:break-all;font-size:13px;line-height:1.6;"><a href="${url}" style="color:#0A8F7D;text-decoration:underline;">${url}</a></p>`

export const note = (content: string): string =>
  `<p style="margin:0;font-size:13px;line-height:1.6;color:#7B9198;">${content}</p>`

export const stepsList = (items: string[]): string => {
  const itemsHtml = items
    .map(
      (item, index) => `<tr>
        <td style="padding:0 12px 0 0;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:24px;height:24px;background:#E5F9F4;color:#0A8F7D;font-size:12px;font-weight:700;line-height:24px;text-align:center;border-radius:50%;">${index + 1}</span>
        </td>
        <td style="padding:0 0 14px;font-size:14px;line-height:1.6;color:#4E6872;">${item}</td>
      </tr>`
    )
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">${itemsHtml}</table>`
}

export const alertBox = (
  title: string,
  items: string[],
  variant: 'warning' | 'danger' | 'info' = 'warning'
): string => {
  const styles = {
    warning: {
      bg: '#FFFBF0',
      border: '#F5DFA0',
      title: '#8A6500',
      text: '#664D00',
    },
    danger: {
      bg: '#FFF5F7',
      border: '#F5C6D0',
      title: '#B3194B',
      text: '#8A1038',
    },
    info: {
      bg: '#F0FAF9',
      border: '#B8E8E2',
      title: '#0A7A62',
      text: '#1F3A43',
    },
  }[variant]

  const itemsHtml = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${styles.text};">${item}</li>`
    )
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
      <td style="padding:18px 20px;background:${styles.bg};border:1px solid ${styles.border};border-radius:12px;">
        <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:${styles.title};">${title}</p>
        <ul style="margin:0;padding-left:18px;">${itemsHtml}</ul>
      </td>
    </tr>
  </table>`
}

export const codeBlock = (content: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
      <td style="padding:16px 20px;background:#FFF5F7;border:1px solid #F5C6D0;border-radius:12px;">
        <pre style="margin:0;white-space:pre-wrap;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:1.6;color:#B3194B;">${content}</pre>
      </td>
    </tr>
  </table>`
