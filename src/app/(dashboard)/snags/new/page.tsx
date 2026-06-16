import { Suspense } from 'react'
import AddJobClient from './AddJobClient'

export default function AddJobPage() {
  return (
    <Suspense>
      <AddJobClient />
    </Suspense>
  )
}
