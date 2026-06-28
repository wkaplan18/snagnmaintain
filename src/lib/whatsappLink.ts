// Builds a wa.me link that opens WhatsApp with a pre-filled message.
// Pass phone to open a specific contact, or omit/pass '' to open the contact picker.
export function waLink(phone: string | undefined | null, text: string): string {
  if (phone) {
    let digits = phone.replace(/\D/g, '')
    if (digits.startsWith('0')) digits = '27' + digits.slice(1)
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
  }
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
