import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shield, Home, Settings, Cog, LogOut, User } from 'lucide-react'
import { signOut } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/system-config', icon: Cog, label: 'System Config' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Legal Metrology Compliance Checker
              </h1>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-700">
                  <User className="h-4 w-4 mr-2" />
                  {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {user && (
          <nav className="w-64 bg-white shadow-sm min-h-screen">
            <div className="p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${user ? 'p-8' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}