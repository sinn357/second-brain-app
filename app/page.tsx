import BentoGrid from '@/components/BentoGrid'

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8 px-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Nexus Dashboard
          </h1>
          <p className="text-white/60 mt-2">Your knowledge hub at a glance</p>
        </div>
        <BentoGrid />
      </div>
    </div>
  )
}
