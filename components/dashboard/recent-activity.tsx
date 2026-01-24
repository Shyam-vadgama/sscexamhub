'use client'

import { formatDateTime } from '@/lib/utils'
import { UserPlus, FileText, DollarSign, Upload } from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'user',
    message: 'New user registered: Rahul Kumar',
    time: new Date(Date.now() - 1000 * 60 * 5),
    icon: UserPlus,
    color: 'bg-green-50 text-green-600',
  },
  {
    id: 2,
    type: 'test',
    message: 'New test created: SSC CGL Mock Test 25',
    time: new Date(Date.now() - 1000 * 60 * 15),
    icon: FileText,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 3,
    type: 'payment',
    message: 'Payment received: ₹999 from Priya Sharma',
    time: new Date(Date.now() - 1000 * 60 * 30),
    icon: DollarSign,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 4,
    type: 'content',
    message: 'PDF uploaded: Mathematics Formula Sheet',
    time: new Date(Date.now() - 1000 * 60 * 45),
    icon: Upload,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    id: 5,
    type: 'user',
    message: 'New user registered: Amit Verma',
    time: new Date(Date.now() - 1000 * 60 * 60),
    icon: UserPlus,
    color: 'bg-green-50 text-green-600',
  },
]

export function RecentActivity() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${activity.color}`}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(activity.time)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
        View all activity →
      </button>
    </div>
  )
}
