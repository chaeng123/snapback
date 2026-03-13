import { supabase } from "@/lib/supabase"

export default async function TestPage() {

  const { data, error } = await supabase
    .from("sleep_logs")
    .select("*")

  console.log(data, error)

  return (
    <div>
      <h1>Supabase Test</h1>
      <pre>{JSON.stringify(data)}</pre>
      <pre>{JSON.stringify(error)}</pre>
    </div>
  )
}