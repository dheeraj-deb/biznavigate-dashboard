import { redirect } from 'next/navigation'

export default function HandoffRedirectPage() {
  redirect('/crm/inbox?tab=needs')
}
