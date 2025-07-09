'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserGroupIcon, CogIcon, ShieldCheckIcon, BellIcon } from '@heroicons/react/24/outline'

interface UserRole {
  role: string
  canManageUsers: boolean
}

export default function SettingsPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/accounts/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const userData = await response.json()
        const canManageUsers = ['admin', 'owner', 'ceo', 'national_manager', 'regional_manager'].includes(userData.role)
        setUserRole({
          role: userData.role,
          canManageUsers
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const settingsSections = [
    {
      title: 'Account',
      description: 'Manage your personal account settings',
      icon: CogIcon,
      href: '/profile',
      available: true
    },
    {
      title: 'Team Management',
      description: 'Invite users, manage roles and permissions',
      icon: UserGroupIcon,
      href: '/settings/users',
      available: userRole?.canManageUsers || false,
      badge: 'Manager+'
    },
    {
      title: 'Security',
      description: 'Password, two-factor authentication, and security settings',
      icon: ShieldCheckIcon,
      href: '/settings/security',
      available: true,
      comingSoon: true
    },
    {
      title: 'Notifications',
      description: 'Configure email and in-app notifications',
      icon: BellIcon,
      href: '/settings/notifications',
      available: true,
      comingSoon: true
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and organization preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section) => {
          if (!section.available) return null
          
          const Icon = section.icon
          
          return (
            <div key={section.title}>
              {section.comingSoon ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 opacity-60 cursor-not-allowed">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-500">{section.title}</h3>
                        <span className="ml-2 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{section.description}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href={section.href}
                  className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                        {section.badge && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                    </div>
                    <div className="ml-4">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {userRole && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Your Role</h3>
              <div className="mt-1 text-sm text-blue-700">
                You have <span className="font-semibold">{userRole.role}</span> permissions.
                {userRole.canManageUsers && (
                  <span className="block mt-1">You can manage users and invite team members.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}