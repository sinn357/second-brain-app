import BentoGrid from '@/components/BentoGrid'

export default function Home() {
  return (
    <div className="page-shell">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Nexus Dashboard
            </h1>
            <p className="page-subtitle">Your knowledge hub at a glance</p>
          </div>
        </div>
        <BentoGrid />
      </div>
    </div>
  )
}
